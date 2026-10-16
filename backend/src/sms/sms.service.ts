import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus } from '../generated/prisma/client';
import { SmsProvider } from './providers/sms-provider';

const STATUS_MESSAGES: Readonly<Record<OrderStatus, string>> = {
  PENDING: 'سفارش شما ثبت شد.',
  CONFIRMED: 'سفارش شما تأیید شد.',
  PROCESSING: 'سفارش شما در حال آماده‌سازی است.',
  SHIPPED: 'سفارش شما ارسال شد.',
  DELIVERED: 'سفارش شما تحویل داده شد.',
  CANCELLED: 'سفارش شما لغو شد.',
};

@Injectable()
export class SmsService {
  readonly #prisma: PrismaService;
  readonly #logger = new Logger(SmsService.name);
  /** Absent when `SMS_PROVIDER` is unset: notifications are skipped. */
  readonly #provider: SmsProvider | undefined;

  constructor(
    prisma: PrismaService,
    @Optional() @Inject(SmsProvider) provider?: SmsProvider,
  ) {
    this.#prisma = prisma;
    this.#provider = provider;
  }

  /**
   * Tells the order's owner about a status change. Never throws: a failed SMS
   * must not roll back or fail the order change that triggered it.
   */
  async sendOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
    trackingCode?: string | null,
  ): Promise<void> {
    if (!this.#provider) return;
    try {
      const user = await this.#prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      if (!user) return;
      const shortId = orderId.slice(0, 8);
      const tracking =
        status === 'SHIPPED' && trackingCode
          ? ` کد رهگیری: ${trackingCode}`
          : '';
      await this.#provider.send(
        user.phone,
        `${STATUS_MESSAGES[status]} (سفارش ${shortId})${tracking}`,
      );
    } catch (error) {
      this.#logger.error(
        `Could not send status SMS for order ${orderId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
