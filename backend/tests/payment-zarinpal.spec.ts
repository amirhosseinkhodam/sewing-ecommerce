import { ZarinpalPaymentGateway } from '../src/payment/gateways/zarinpal';

function mockFetch(body: unknown, status = 200): jest.SpyInstance {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), { status })),
    );
}

const requestInput = {
  orderId: 'o1',
  amount: 250000,
  description: 'Order o1',
  callbackUrl: 'https://shop.test/api/payment/callback',
};

describe('ZarinpalPaymentGateway', () => {
  beforeEach(() => {
    process.env.ZARINPAL_MERCHANT_ID = 'merchant-1';
    delete process.env.ZARINPAL_SANDBOX;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ZARINPAL_MERCHANT_ID;
    delete process.env.ZARINPAL_SANDBOX;
  });

  it('fails to start without a merchant id', () => {
    delete process.env.ZARINPAL_MERCHANT_ID;
    expect(() => new ZarinpalPaymentGateway()).toThrow(/ZARINPAL_MERCHANT_ID/);
  });

  it('requests in Rial and returns the StartPay url', async () => {
    const spy = mockFetch({ data: { code: 100, authority: 'A0001' } });
    const result = await new ZarinpalPaymentGateway().request(requestInput);

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://payment.zarinpal.com/pg/v4/payment/request.json');
    expect(JSON.parse(init.body as string)).toEqual({
      merchant_id: 'merchant-1',
      amount: 2500000,
      callback_url: requestInput.callbackUrl,
      description: requestInput.description,
    });
    expect(result).toEqual({
      authority: 'A0001',
      redirectUrl: 'https://payment.zarinpal.com/pg/StartPay/A0001',
    });
  });

  it('uses the sandbox host when ZARINPAL_SANDBOX=true', async () => {
    process.env.ZARINPAL_SANDBOX = 'true';
    const spy = mockFetch({ data: { code: 100, authority: 'A0001' } });
    const result = await new ZarinpalPaymentGateway().request(requestInput);
    expect((spy.mock.calls[0] as [string])[0]).toContain(
      'sandbox.zarinpal.com',
    );
    expect(result.redirectUrl).toBe(
      'https://sandbox.zarinpal.com/pg/StartPay/A0001',
    );
  });

  it('throws when the request is rejected', async () => {
    mockFetch({ data: [], errors: { code: -9 } }, 400);
    await expect(
      new ZarinpalPaymentGateway().request(requestInput),
    ).rejects.toThrow(/rejected/);
  });

  it('verifies success with the Rial amount', async () => {
    const spy = mockFetch({ data: { code: 100, ref_id: 12345 } });
    const result = await new ZarinpalPaymentGateway().verify({
      authority: 'A0001',
      amount: 250000,
    });
    expect(result).toEqual({ ok: true, refId: '12345' });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      merchant_id: 'merchant-1',
      amount: 2500000,
      authority: 'A0001',
    });
  });

  it('treats an already-verified payment as success', async () => {
    mockFetch({ data: { code: 101, ref_id: 12345 } });
    const result = await new ZarinpalPaymentGateway().verify({
      authority: 'A0001',
      amount: 250000,
    });
    expect(result).toEqual({ ok: true, refId: '12345' });
  });

  it('fails verification on an amount mismatch or failed payment', async () => {
    mockFetch({ data: [], errors: { code: -50 } }, 400);
    await expect(
      new ZarinpalPaymentGateway().verify({ authority: 'A0001', amount: 1 }),
    ).resolves.toEqual({ ok: false });
  });

  it('fails verification on a non-JSON response', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<html>', { status: 502 }));
    await expect(
      new ZarinpalPaymentGateway().verify({ authority: 'A0001', amount: 1 }),
    ).resolves.toEqual({ ok: false });
  });
});
