import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../generated/prisma/client';
import { restoreStock } from './restore-stock';

/** How long an unpaid online order is held before it is released. */
const UNPAID_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
/** How often the sweep runs. */
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Automatically cancels online orders that were never paid for within 24h and
 * releases the stock they reserved, so an abandoned checkout cannot keep a
 * size sold out. Runs in-process on a plain interval: the project has no job
 * runner, and this must work in the same container as the API.
 */
@Injectable()
export class UnpaidOrderSweeper implements OnModuleInit, OnModuleDestroy {
  readonly #prisma: PrismaService;
  readonly #sms: SmsService;
  readonly #logger = new Logger(UnpaidOrderSweeper.name);
  #timer: NodeJS.Timeout | undefined;
  #startupSweep: Promise<void> = Promise.resolve();

  constructor(prisma: PrismaService, sms: SmsService) {
    this.#prisma = prisma;
    this.#sms = sms;
  }

  onModuleInit(): void {
    this.#startupSweep = this.sweep().then(
      () => undefined,
      (error: unknown) => this.#logger.error('Startup sweep failed', error),
    );
    this.#timer = setInterval(() => {
      void this.sweep();
    }, SWEEP_INTERVAL_MS);
    // Never hold the process open just for this timer.
    this.#timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.#timer) clearInterval(this.#timer);
    // Let an in-flight startup sweep finish before the DB pool is closed.
    await this.#startupSweep;
  }

  /** Cancels every stale unpaid online order and returns how many it released. */
  async sweep(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - UNPAID_ORDER_TTL_MS);
    const stale = await this.#prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.ONLINE,
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      select: { id: true, userId: true, items: true },
    });

    let cancelled = 0;
    for (const order of stale) {
      const released = await this.#prisma.$transaction(async (tx) => {
        // Conditional on the same stale state so a payment that landed while
        // the sweep was running wins the race instead of being swept away.
        const { count } = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
          },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
            paymentAuthority: null,
          },
        });
        if (count === 0) return false;

        await restoreStock(tx, order.items);
        return true;
      });

      if (released) {
        cancelled += 1;
        this.#logger.log(`Cancelled unpaid order ${order.id}`);
        await this.#sms.sendOrderStatus(
          order.userId,
          order.id,
          OrderStatus.CANCELLED,
        );
      }
    }
    return cancelled;
  }
}
