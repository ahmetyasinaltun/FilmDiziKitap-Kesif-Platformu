import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { AppError } from '../lib/errors.js';
import { sendEmail } from '../lib/mailer.js';
import { db } from '../test/database.js';
import { lastVerificationLink, sentEmails } from '../test/mail.js';
import { signUp } from '../test/session.js';

const app = createApp();
const EMAIL = 'ahmet@ornek.com';

const verify = (token: string) => request(app).post('/api/auth/verify-email').send({ token });
const resend = (cookie?: string) => {
  const req = request(app).post('/api/auth/verify-email/resend');
  return cookie ? req.set('Cookie', cookie) : req;
};
const me = (cookie: string) => request(app).get('/api/auth/me').set('Cookie', cookie);

const signUpUnverified = () =>
  signUp(app, { username: 'ahmet', email: EMAIL }, { verified: false });

const emailDown = () =>
  vi
    .mocked(sendEmail)
    .mockRejectedValue(new AppError(503, 'EMAIL_UNAVAILABLE', 'E-posta şu an gönderilemedi.'));

beforeEach(async () => {
  await db.reset();
  vi.mocked(sendEmail).mockReset();
});

describe('kayıt', () => {
  it('doğrulama bağlantısını e-postayla gönderir; veritabanında kodun yalnız özeti durur', async () => {
    const { cookie } = await signUpUnverified();

    const { url, code } = lastVerificationLink(EMAIL);
    expect(`${url.origin}${url.pathname}`).toBe('http://localhost:5173/eposta-dogrula');
    expect(code).toMatch(/^[\w-]{43}$/);
    expect(sentEmails()[0]?.html).toContain(url.toString());

    const { rows } = await db.query<{ tokenHash: string }>(`SELECT "tokenHash" FROM "AuthToken"`);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).not.toContain(code);

    expect((await me(cookie)).body.user.emailVerified).toBe(false);
  });

  it('e-posta servisi düşse de hesap açılır', async () => {
    emailDown();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ahmet', email: EMAIL, password: 'gizli-sifre-123' });

    expect(res.status).toBe(201);
    expect(res.body.user.emailVerified).toBe(false);
  });
});

describe('POST /api/auth/verify-email', () => {
  it('bağlantıdaki kodla hesabı doğrular; giriş gerekmez (başka cihazda açılabilir)', async () => {
    const { cookie } = await signUpUnverified();

    const res = await verify(lastVerificationLink(EMAIL).code);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: 'ahmet', emailVerified: true });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await me(cookie)).body.user.emailVerified).toBe(true);
  });

  it('kod tek kullanımlık', async () => {
    await signUpUnverified();
    const { code } = lastVerificationLink(EMAIL);
    await verify(code);

    const res = await verify(code);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('süresi dolmuş ya da uydurma kodu kabul etmez', async () => {
    await signUpUnverified();
    await db.query(`UPDATE "AuthToken" SET "expiresAt" = now() - interval '1 minute'`);

    const expired = await verify(lastVerificationLink(EMAIL).code);
    const forged = await verify('a'.repeat(43));

    for (const res of [expired, forged]) {
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe(
        'Doğrulama bağlantısı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.',
      );
    }
  });
});

describe('POST /api/auth/verify-email/resend', () => {
  it('giriş ister', async () => {
    expect((await resend()).status).toBe(401);
  });

  it('yeni bağlantı gönderir ve öncekini geçersiz kılar', async () => {
    const { cookie } = await signUpUnverified();
    const first = lastVerificationLink(EMAIL).code;

    expect((await resend(cookie)).status).toBe(204);
    const second = lastVerificationLink(EMAIL).code;

    expect(second).not.toBe(first);
    expect((await verify(first)).status).toBe(400);
    expect((await verify(second)).status).toBe(200);
  });

  it('doğrulanmış hesaba e-posta göndermez', async () => {
    const { cookie } = await signUp(app, { username: 'ahmet', email: EMAIL });
    vi.mocked(sendEmail).mockClear();

    expect((await resend(cookie)).status).toBe(204);
    expect(sentEmails()).toHaveLength(0);
  });

  it('e-posta gönderilemezse bunu söyler', async () => {
    const { cookie } = await signUpUnverified();
    emailDown();

    const res = await resend(cookie);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('EMAIL_UNAVAILABLE');
  });

  it('saatte 3 istekten sonra 429 döner', async () => {
    const { cookie } = await signUpUnverified();
    for (let i = 0; i < 3; i++) expect((await resend(cookie)).status).toBe(204);

    const res = await resend(cookie);

    expect(res.status).toBe(429);
    expect(res.body.error.message).toMatch(/^Çok fazla doğrulama e-postası istendi\./);
  });
});
