import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CALLBACK_STATUSES } from '../const/callback-statuses';
import type {
  GatewayRequestModel,
  GatewayRequestResultModel,
  GatewayVerifyModel,
  GatewayVerifyResultModel,
} from '../models/gateway';
import { PaymentGateway } from './payment-gateway';

/**
 * Free stand-in for a real gateway: `request` points the browser at a local
 * page (`FakeGatewayController`) with Pay / Fail buttons, which redirect to the
 * same callback a real gateway would. Like a real gateway, `verify` only
 * succeeds for an attempt whose Pay button was actually pressed, so editing
 * the callback URL to `Status=OK` proves nothing. Attempts live in memory, so a
 * backend restart forgets them — fine for development, which is why
 * `PaymentModule` refuses to use this under `NODE_ENV=production`.
 */
@Injectable()
export class FakePaymentGateway extends PaymentGateway {
  readonly #pending = new Map<string, GatewayRequestModel>();
  readonly #paid = new Set<string>();

  request(input: GatewayRequestModel): Promise<GatewayRequestResultModel> {
    const authority = `FAKE-${randomUUID()}`;
    this.#pending.set(authority, input);
    return Promise.resolve({
      authority,
      redirectUrl: `/api/payment/fake/${authority}`,
    });
  }

  verify(input: GatewayVerifyModel): Promise<GatewayVerifyResultModel> {
    const attempt = this.#pending.get(input.authority);
    if (
      !attempt ||
      !this.#paid.has(input.authority) ||
      attempt.amount !== input.amount
    ) {
      return Promise.resolve({ ok: false });
    }
    this.#pending.delete(input.authority);
    this.#paid.delete(input.authority);
    return Promise.resolve({
      ok: true,
      refId: String(Math.floor(Math.random() * 1e10)),
    });
  }

  /** What the fake checkout page shows, or undefined for an unknown attempt. */
  find(authority: string): GatewayRequestModel | undefined {
    return this.#pending.get(authority);
  }

  /**
   * Records the customer's choice on the fake checkout page and returns where
   * to send the browser next.
   */
  complete(authority: string, paid: boolean): string | undefined {
    const attempt = this.#pending.get(authority);
    if (!attempt) return undefined;
    if (paid) this.#paid.add(authority);
    else this.#pending.delete(authority);
    const url = new URL(attempt.callbackUrl);
    url.searchParams.set('Authority', authority);
    url.searchParams.set(
      'Status',
      paid ? CALLBACK_STATUSES.OK : CALLBACK_STATUSES.NOK,
    );
    return url.toString();
  }
}
