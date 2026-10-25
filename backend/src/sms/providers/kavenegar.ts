import { Injectable } from '@nestjs/common';
import { SmsProvider } from './sms-provider';

const API_URL = 'https://api.kavenegar.com/v1';
const TIMEOUT_MS = 10_000;
const OK_STATUS = 200;

interface KavenegarResponse {
  return?: { status?: number; message?: string };
}

/** Sends plain SMS through the Kavenegar `sms/send` HTTP API. */
@Injectable()
export class KavenegarSmsProvider extends SmsProvider {
  readonly #apiKey: string;
  readonly #sender: string;

  constructor() {
    super();
    const apiKey = process.env.KAVENEGAR_API_KEY;
    const sender = process.env.KAVENEGAR_SENDER;
    if (!apiKey || !sender) {
      throw new Error(
        'SMS_PROVIDER=KAVENEGAR requires KAVENEGAR_API_KEY and KAVENEGAR_SENDER',
      );
    }
    this.#apiKey = apiKey;
    this.#sender = sender;
  }

  async send(phone: string, message: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(this.#apiKey)}/sms/send.json`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: phone,
          sender: this.#sender,
          message,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const body = (await response
      .json()
      .catch(() => null)) as KavenegarResponse | null;
    const status = body?.return?.status ?? response.status;
    if (!response.ok || status !== OK_STATUS) {
      throw new Error(
        `Kavenegar rejected the SMS (${status}): ${body?.return?.message ?? response.statusText}`,
      );
    }
  }
}
