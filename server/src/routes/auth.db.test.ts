import express from 'express';
import { SignJWT } from 'jose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { errorHandler } from '../middleware/error-handler.js';
import { requireUser } from '../services/auth.js';
import { db } from '../test/database.js';
import { sessionCookie, signUp } from '../test/session.js';

const app = createApp();
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const post = (path: string, body: object) => request(app).post(`/api/auth${path}`).send(body);
const me = (cookie?: string) => {
  const req = request(app).get('/api/auth/me');
  return cookie ? req.set('Cookie', cookie) : req;
};

const validUser = { username: 'Ahmet_42', email: ' Ahmet@Ornek.com ', password: 'gizli-sifre-123' };

function signToken(userId: string, issuedAt: number, expiresAt: number) {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(secret);
}

const nowSeconds = () => Math.floor(Date.now() / 1000);
const DAY = 24 * 60 * 60;

beforeEach(async () => {
  // Kullanıcılar ve rate limit sayaçları her testte sıfırdan.
  await db.reset();
  vi.restoreAllMocks();
});

describe('POST /api/auth/register', () => {
  it('hesabı açar, oturum cookie’si verir ve şifre hash’ini döndürmez', async () => {
    const res = await post('/register', validUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: expect.any(String),
      username: 'ahmet_42',
      email: 'ahmet@ornek.com',
      displayName: null,
      avatarUrl: null,
      emailVerified: false,
    });
    expect(res.headers['cache-control']).toBe('no-store');

    const cookie = sessionCookie(res);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');

    const { rows } = await db.query<{ passwordHash: string }>(
      `SELECT "passwordHash" FROM "User" WHERE username = 'ahmet_42'`,
    );
    expect(rows[0]?.passwordHash).toMatch(/^\$2b\$12\$/);
  });

  it('hatalı alanları ayrı ayrı bildirir', async () => {
    const res = await post('/register', {
      username: 'a b',
      email: 'eposta-degil',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'password', 'username']);
  });

  it('bcrypt’in yok sayacağı kadar uzun şifreyi reddeder (72 bayt, Türkçe harf 2 bayt)', async () => {
    const res = await post('/register', { ...validUser, password: 'ş'.repeat(37) });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toEqual(['Şifre çok uzun.']);
  });

  it('alınmış kullanıcı adı ve e-postayı alan bazında 409 ile bildirir', async () => {
    await post('/register', validUser);

    const res = await post('/register', { ...validUser, username: 'AHMET_42' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');
    expect(res.body.error.fields.username).toEqual(['Bu kullanıcı adı alınmış.']);
    expect(res.body.error.fields.email).toEqual(['Bu e-posta ile kayıtlı bir hesap var.']);
  });

  it('kontrol ile kayıt arasında ad kapılırsa veritabanı kısıtı yakalar ve yine 409 döner', async () => {
    await post('/register', { ...validUser, email: 'baska@ornek.com' });
    // Ön kontrol "boş" desin: aynı anda gelen başka bir kayıt adı bizden önce almış gibi.
    vi.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([]);

    const res = await post('/register', validUser);

    expect(res.status).toBe(409);
    expect(res.body.error.fields).toEqual({ username: ['Bu kullanıcı adı alınmış.'] });
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await post('/register', validUser);
  });

  it.each([
    ['kullanıcı adıyla', 'AHMET_42'],
    ['e-postayla', 'ahmet@ornek.com'],
  ])('%s giriş yapılır (büyük/küçük harf fark etmez)', async (_label, identifier) => {
    const res = await post('/login', { identifier, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('ahmet_42');
    expect(sessionCookie(res)).toContain('HttpOnly');
  });

  it('yanlış şifre ve kayıtsız hesap aynı cevabı alır', async () => {
    const wrongPassword = await post('/login', {
      identifier: 'ahmet_42',
      password: 'yanlis-sifre',
    });
    const unknownUser = await post('/login', { identifier: 'kimse', password: 'yanlis-sifre' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();
  });

  it('10 başarısız denemeden sonra doğru şifreyi de 429 ile reddeder', async () => {
    for (let i = 0; i < 10; i++) {
      await post('/login', { identifier: 'ahmet_42', password: 'yanlis-sifre' });
    }

    const res = await post('/login', { identifier: 'ahmet_42', password: validUser.password });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.body.error.message).toBe('Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('başarılı girişler sınıra sayılmaz', async () => {
    for (let i = 0; i < 11; i++) {
      const res = await post('/login', { identifier: 'ahmet_42', password: validUser.password });
      expect(res.status).toBe(200);
    }
  });
});

describe('GET /api/auth/me', () => {
  it('ziyaretçiye hata değil `user: null` döner', async () => {
    const res = await me();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('cookie’deki oturumun kullanıcısını döner', async () => {
    const { cookie } = await signUp(app, validUser);

    const res = await me(cookie);

    expect(res.body.user).toMatchObject({ username: 'ahmet_42', email: 'ahmet@ornek.com' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it.each([
    ['süresi dolmuş', (id: string) => signToken(id, nowSeconds() - 8 * DAY, nowSeconds() - DAY)],
    [
      'başka bir anahtarla imzalanmış',
      (id: string) =>
        new SignJWT()
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject(id)
          .setIssuedAt()
          .setExpirationTime('1d')
          .sign(new TextEncoder().encode('saldirganin-bildigi-baska-bir-anahtar-123')),
    ],
    [
      'imzasız ("alg: none")',
      async (id: string) => {
        const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
        return `${part({ alg: 'none' })}.${part({ sub: id, iat: nowSeconds() })}.`;
      },
    ],
  ])('%s bileti kabul etmez ve cookie’yi temizler', async (_label, makeToken) => {
    const { user } = await signUp(app, validUser);

    const res = await me(`session=${await makeToken(user.id)}`);

    expect(res.body).toEqual({ user: null });
    expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('hesap silinmişse geçerli bilet de oturum açmaz', async () => {
    const { cookie } = await signUp(app, validUser);
    await db.query(`DELETE FROM "User"`);

    const res = await me(cookie);

    expect(res.body).toEqual({ user: null });
  });

  it('bir günden eski oturumu yeniler, yeni oturuma dokunmaz', async () => {
    const { user } = await signUp(app, validUser);
    const oldToken = await signToken(user.id, nowSeconds() - 2 * DAY, nowSeconds() + 5 * DAY);
    const freshToken = await signToken(user.id, nowSeconds() - 60, nowSeconds() + 7 * DAY);

    const refreshed = await me(`session=${oldToken}`);
    const untouched = await me(`session=${freshToken}`);

    expect(refreshed.body.user.id).toBe(user.id);
    expect(sessionCookie(refreshed)).not.toContain(oldToken);
    expect(untouched.headers['set-cookie']).toBeUndefined();
  });
});

describe('POST /api/auth/logout', () => {
  it('oturum cookie’sini siler', async () => {
    const { cookie } = await signUp(app, validUser);

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(sessionCookie(res)).toMatch(/^session=;.*Expires=Thu, 01 Jan 1970/);
  });
});

describe('requireUser', () => {
  // Giriş gerektiren uçlar bunu çağırır; davranışı küçük bir uygulamayla denenir.
  const protectedApp = express();
  protectedApp.get('/', async (req, res) => {
    const user = await requireUser(req);
    res.json({ id: user.id });
  });
  protectedApp.use(errorHandler);

  it('giriş yoksa Türkçe 401 fırlatır', async () => {
    const res = await request(protectedApp).get('/');

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Bu işlem için giriş yapmalısın.',
    });
  });

  it('oturumdaki kullanıcıyı verir', async () => {
    const { cookie, user } = await signUp(app, validUser);

    const res = await request(protectedApp).get('/').set('Cookie', cookie);

    expect(res.body).toEqual({ id: user.id });
  });
});
