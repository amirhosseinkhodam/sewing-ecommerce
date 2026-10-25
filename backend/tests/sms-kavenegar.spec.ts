import { KavenegarSmsProvider } from '../src/sms/providers/kavenegar';

function mockFetch(response: Response): jest.SpyInstance {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.resolve(response));
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('KavenegarSmsProvider', () => {
  beforeEach(() => {
    process.env.KAVENEGAR_API_KEY = 'key123';
    process.env.KAVENEGAR_SENDER = '10004346';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.KAVENEGAR_API_KEY;
    delete process.env.KAVENEGAR_SENDER;
  });

  it('fails to start without credentials', () => {
    delete process.env.KAVENEGAR_API_KEY;
    expect(() => new KavenegarSmsProvider()).toThrow(/KAVENEGAR_API_KEY/);
  });

  it('posts receptor, sender and message', async () => {
    const spy = mockFetch(
      jsonResponse(200, { return: { status: 200, message: 'ok' } }),
    );
    await new KavenegarSmsProvider().send('09123334455', 'سلام');

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.kavenegar.com/v1/key123/sms/send.json');
    const body = init.body as URLSearchParams;
    expect(body.get('receptor')).toBe('09123334455');
    expect(body.get('sender')).toBe('10004346');
    expect(body.get('message')).toBe('سلام');
  });

  it('throws on an API error', async () => {
    mockFetch(
      jsonResponse(412, { return: { status: 412, message: 'bad sender' } }),
    );
    await expect(
      new KavenegarSmsProvider().send('09123334455', 'x'),
    ).rejects.toThrow(/412.*bad sender/);
  });

  it('propagates a timeout', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('The operation timed out'));
    await expect(
      new KavenegarSmsProvider().send('09123334455', 'x'),
    ).rejects.toThrow(/timed out/);
  });
});
