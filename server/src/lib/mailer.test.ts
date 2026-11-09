import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger.js';
import { sendEmail } from './mailer.js';

const email = {
  to: 'alici@ornek.com',
  subject: 'Konu',
  html: '<p>Merhaba</p>',
  text: 'Merhaba',
};

const stubFetch = (impl: () => Promise<Response>) => {
  const fetch = vi.fn(impl);
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('sendEmail', () => {
  it('Brevo API’sine anahtarı başlıkta, gönderen adı ve adresiyle gönderir', async () => {
    const fetch = stubFetch(async () => new Response('{"messageId":"1"}', { status: 201 }));

    await sendEmail(email);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(new Headers(init.headers).get('api-key')).toBe('test');
    expect(JSON.parse(String(init.body))).toEqual({
      sender: { name: 'Film Dizi Kitap', email: 'gonderen@example.com' },
      to: [{ email: 'alici@ornek.com' }],
      subject: 'Konu',
      htmlContent: '<p>Merhaba</p>',
      textContent: 'Merhaba',
    });
  });

  it('reddedilen gönderimde 503 fırlatır; loga alıcı adresi yazılmaz', async () => {
    stubFetch(
      async () =>
        new Response('{"code":"unauthorized","message":"Key not found"}', { status: 401 }),
    );
    const log = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await expect(sendEmail(email)).rejects.toMatchObject({
      status: 503,
      code: 'EMAIL_UNAVAILABLE',
    });
    expect(log).toHaveBeenCalledWith({ status: 401, code: 'unauthorized' }, expect.any(String));
    expect(JSON.stringify(log.mock.calls)).not.toContain('alici@ornek.com');
  });

  it('anahtar yoksa (yalnız geliştirmede) göndermez, bağlantıyı terminale yazar', async () => {
    vi.stubEnv('BREVO_API_KEY', '');
    vi.stubEnv('MAIL_FROM', '');
    vi.resetModules();
    const fetch = stubFetch(async () => new Response(null, { status: 201 }));
    const print = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const fresh = await import('./mailer.js');

    await fresh.sendEmail({
      ...email,
      text: 'Bağlantı: http://localhost:5173/eposta-dogrula?kod=x',
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(print).toHaveBeenCalledWith(expect.stringContaining('/eposta-dogrula?kod=x'));
  });

  it('servise ulaşılamazsa da 503 fırlatır', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed');
    });
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await expect(sendEmail(email)).rejects.toMatchObject({ code: 'EMAIL_UNAVAILABLE' });
  });
});
