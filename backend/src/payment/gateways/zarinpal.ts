import { Injectable } from '@nestjs/common';
import type {
  GatewayRequestModel,
  GatewayRequestResultModel,
  GatewayVerifyModel,
  GatewayVerifyResultModel,
} from '../models/gateway';
import { PaymentGateway } from './payment-gateway';

const PRODUCTION_HOST = 'https://payment.zarinpal.com';
const SANDBOX_HOST = 'https://sandbox.zarinpal.com';
const TIMEOUT_MS = 10_000;
const TOMAN_TO_RIAL = 10;
const CODE_SUCCESS = 100;
const CODE_ALREADY_VERIFIED = 101;

interface ZarinpalResponse {
  data?: { code?: number; authority?: string; ref_id?: number | string };
  errors?: unknown;
}

/**
 * Zarinpal v4 API. The shop stores Toman; Zarinpal's default unit is Rial, so
 * amounts are multiplied by 10 on the way out. `ZARINPAL_SANDBOX=true` points
 * at the sandbox host. A repeated verify of an already-verified payment
 * (code 101) counts as success, so a refreshed callback page is harmless.
 */
@Injectable()
export class ZarinpalPaymentGateway extends PaymentGateway {
  readonly #merchantId: string;
  readonly #host: string;

  constructor() {
    super();
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    if (!merchantId) {
      throw new Error(
        'PAYMENT_PROVIDER=ZARINPAL requires ZARINPAL_MERCHANT_ID',
      );
    }
    this.#merchantId = merchantId;
    this.#host =
      process.env.ZARINPAL_SANDBOX?.toLowerCase() === 'true'
        ? SANDBOX_HOST
        : PRODUCTION_HOST;
  }

  async request(
    input: GatewayRequestModel,
  ): Promise<GatewayRequestResultModel> {
    const body = await this.#post('request', {
      amount: input.amount * TOMAN_TO_RIAL,
      callback_url: input.callbackUrl,
      description: input.description,
    });
    const authority = body?.data?.authority;
    if (body?.data?.code !== CODE_SUCCESS || !authority) {
      throw new Error(
        `Zarinpal rejected the payment request (${body?.data?.code ?? 'no code'})`,
      );
    }
    return {
      authority,
      redirectUrl: `${this.#host}/pg/StartPay/${encodeURIComponent(authority)}`,
    };
  }

  async verify(input: GatewayVerifyModel): Promise<GatewayVerifyResultModel> {
    const body = await this.#post('verify', {
      amount: input.amount * TOMAN_TO_RIAL,
      authority: input.authority,
    });
    const code = body?.data?.code;
    const refId = body?.data?.ref_id;
    if (
      (code !== CODE_SUCCESS && code !== CODE_ALREADY_VERIFIED) ||
      refId === undefined
    ) {
      return { ok: false };
    }
    return { ok: true, refId: String(refId) };
  }

  async #post(
    action: 'request' | 'verify',
    payload: Record<string, string | number>,
  ): Promise<ZarinpalResponse | null> {
    const response = await fetch(`${this.#host}/pg/v4/payment/${action}.json`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ merchant_id: this.#merchantId, ...payload }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return (await response.json().catch(() => null)) as ZarinpalResponse | null;
  }
}
