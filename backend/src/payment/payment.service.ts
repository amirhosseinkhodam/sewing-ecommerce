import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_RESULTS } from '../../../shared/const/payment-results';
import type {
  PaymentMethodsModel,
  PaymentStartResponseModel,
} from '../../../shared/models/payment';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../generated/prisma/client';
import { CALLBACK_STATUSES } from './const/callback-statuses';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { PaymentGateway } from './gateways/payment-gateway';

@Injectable()
export class PaymentService {
  readonly #prisma: PrismaService;
  readonly #config: ConfigService;
  /** Absent when `PAYMENT_PROVIDER` is unset: only card-to-card is offered. */
  readonly #gateway: PaymentGateway | undefined;

  constructor(
    prisma: PrismaService,
    config: ConfigService,
    @Optional() @Inject(PaymentGateway) gateway?: PaymentGateway,
  ) {
    this.#prisma = prisma;
    this.#config = config;
    this.#gateway = gateway;
  }

  get onlineEnabled(): boolean {
    return this.#gateway !== undefined;
  }

  methods(): PaymentMethodsModel {
    return {
      methods: this.onlineEnabled
        ? [PaymentMethod.ONLINE, PaymentMethod.CARD_TO_CARD]
        : [PaymentMethod.CARD_TO_CARD],
    };
  }

  /**
   * Opens a payment attempt for the customer's own unpaid online order. Also
   * the retry path after a failed or abandoned attempt: the new authority
   * replaces the old one, so a late callback for the old attempt finds nothing.
   */
  async start(
    userId: string,
    orderId: string,
  ): Promise<PaymentStartResponseModel> {
    if (!this.#gateway) {
      throw new BadRequestException('Online payment is not available');
    }
    const order = await this.#prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentMethod !== PaymentMethod.ONLINE) {
      throw new BadRequestException('Order is not an online-payment order');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is cancelled');
    }

    const { authority, redirectUrl } = await this.#gateway.request({
      orderId: order.id,
      amount: Number(order.totalAmount),
      description: `Order ${order.id}`,
      callbackUrl: `${this.#publicUrl()}/api/payment/callback`,
    });
    await this.#prisma.order.update({
      where: { id: order.id },
      data: {
        paymentAuthority: authority,
        paymentStatus: PaymentStatus.PENDING,
      },
    });
    return { redirectUrl };
  }

  /**
   * Handles the browser coming back from the gateway and returns where to send
   * it next. The gateway's word is never taken from the query string alone:
   * a paid status is only recorded after `verify` confirms it for the amount
   * the order is actually charged.
   */
  async callback(dto: PaymentCallbackDto): Promise<string> {
    const order = this.#gateway
      ? await this.#prisma.order.findUnique({
          where: { paymentAuthority: dto.Authority },
        })
      : null;
    if (!this.#gateway || !order) return '/orders';

    const failed = `/orders/${order.id}?payment=${PAYMENT_RESULTS.FAILED}`;
    const succeeded = `/orders/${order.id}?payment=${PAYMENT_RESULTS.SUCCESS}`;

    // A reload of the callback URL after success must not re-verify.
    if (order.paymentStatus === PaymentStatus.PAID) return succeeded;

    // Cancelled while the customer was on the gateway page. Never verify:
    // Zarinpal reverses an unverified payment by itself, so the customer is
    // refunded without anyone touching it.
    if (
      dto.Status !== CALLBACK_STATUSES.OK ||
      order.status === OrderStatus.CANCELLED
    ) {
      await this.#markFailed(order.id, dto.Authority);
      return failed;
    }

    const result = await this.#gateway.verify({
      authority: dto.Authority,
      amount: Number(order.totalAmount),
    });
    if (!result.ok) {
      await this.#markFailed(order.id, dto.Authority);
      return failed;
    }

    // Conditional on the authority so a concurrent retry that replaced it
    // wins, and on not-yet-paid so two racing callbacks record it once.
    // A paid PENDING order moves to CONFIRMED, as an admin-confirmed
    // card-to-card payment does.
    await this.#prisma.order.updateMany({
      where: {
        id: order.id,
        paymentAuthority: dto.Authority,
        paymentStatus: { not: PaymentStatus.PAID },
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentRefId: result.refId,
        ...(order.status === OrderStatus.PENDING
          ? { status: OrderStatus.CONFIRMED }
          : {}),
      },
    });
    return succeeded;
  }

  async #markFailed(orderId: string, authority: string): Promise<void> {
    await this.#prisma.order.updateMany({
      where: {
        id: orderId,
        paymentAuthority: authority,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: { paymentStatus: PaymentStatus.FAILED },
    });
  }

  /**
   * Origin the gateway sends the browser back to. Taken from config rather
   * than request headers so a caller cannot redirect the callback elsewhere.
   * In development the Angular dev server proxies `/api`, so the callback
   * lands on the same origin the customer is browsing.
   */
  #publicUrl(): string {
    const publicUrl = this.#config.get<string>('PUBLIC_URL');
    if (publicUrl) return publicUrl.replace(/\/+$/, '');
    const domain = this.#config.get<string>('DOMAIN');
    return domain ? `https://${domain}` : 'http://localhost:4200';
  }
}
