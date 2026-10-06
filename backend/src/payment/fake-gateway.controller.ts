import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Redirect,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { FakePaymentGateway } from './gateways/fake';

/**
 * The fake gateway's "bank page". Only registered when
 * `PAYMENT_PROVIDER=FAKE`, which `PaymentModule` refuses in production.
 * Deliberately plain server-rendered HTML: it stands in for a third-party
 * page, so it is not part of the Angular app.
 */
@ApiExcludeController()
@Controller('payment/fake')
export class FakeGatewayController {
  readonly #gateway: FakePaymentGateway;

  constructor(gateway: FakePaymentGateway) {
    this.#gateway = gateway;
  }

  @Get(':authority')
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(@Param('authority') authority: string): string {
    const attempt = this.#gateway.find(authority);
    if (!attempt) throw new NotFoundException('Payment attempt not found');
    const id = encodeURIComponent(authority);
    const amount = attempt.amount.toLocaleString('en-US');
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fake payment gateway</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f1f5f9; color: #0f172a;
    display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 16px; }
  main { background: #fff; border-radius: 12px; padding: 24px; max-width: 360px; width: 100%;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); }
  p { color: #475569; } strong { color: #0f172a; }
  a { display: block; text-align: center; padding: 10px; border-radius: 8px;
    text-decoration: none; font-weight: 600; margin-top: 12px; }
  .pay { background: #16a34a; color: #fff; } .fail { background: #e2e8f0; color: #0f172a; }
</style></head>
<body><main>
  <h1>Fake payment gateway</h1>
  <p>Development stand-in — no money moves.</p>
  <p>Amount: <strong>${amount} Toman</strong></p>
  <a class="pay" href="/api/payment/fake/${id}/pay">Pay</a>
  <a class="fail" href="/api/payment/fake/${id}/fail">Fail / cancel</a>
</main></body></html>`;
  }

  @Get(':authority/pay')
  @Redirect()
  pay(@Param('authority') authority: string) {
    return { url: this.#callback(authority, true) };
  }

  @Get(':authority/fail')
  @Redirect()
  fail(@Param('authority') authority: string) {
    return { url: this.#callback(authority, false) };
  }

  #callback(authority: string, paid: boolean): string {
    const url = this.#gateway.complete(authority, paid);
    if (!url) throw new NotFoundException('Payment attempt not found');
    return url;
  }
}
