import { parseCookie } from 'cookie';
import type { CookieOptions, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env.js';

/**
 * Oturum: kullanıcı kimliğini taşıyan imzalı bir JWT, httpOnly cookie içinde.
 * - httpOnly: sayfadaki JavaScript cookie'yi okuyamaz; bir XSS açığı oturumu çalamaz.
 * - SameSite=Lax: başka bir siteden gönderilen POST isteklerine cookie eklenmez (CSRF koruması).
 *   Bu yüzden durum değiştiren hiçbir uç GET ile çalışmaz.
 * - Secure (canlıda): cookie sadece HTTPS üzerinden gider.
 */

const COOKIE_NAME = 'session';
const SESSION_DAYS = 7;
/** Bundan eski bir oturum, kullanıcı siteyi açtığında yenilenir (aktif kullanıcı çıkış yapmış olmaz). */
const REFRESH_AFTER_SECONDS = 24 * 60 * 60;

const secret = new TextEncoder().encode(env.JWT_SECRET);

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export interface SessionToken {
  userId: string;
  /** Saniye cinsinden imzalanma zamanı */
  issuedAt: number;
}

function signSession(userId: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
}

export async function setSessionCookie(res: Response, userId: string): Promise<void> {
  res.cookie(COOKIE_NAME, await signSession(userId), {
    ...cookieOptions,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

export function hasSessionCookie(req: Request): boolean {
  return readCookie(req) !== undefined;
}

function readCookie(req: Request): string | undefined {
  return parseCookie(req.headers.cookie ?? '')[COOKIE_NAME];
}

/** Cookie'deki bileti doğrular. Yoksa, imzası bozuksa ya da süresi dolmuşsa `null`. */
export async function readSessionToken(req: Request): Promise<SessionToken | null> {
  const token = readCookie(req);
  if (!token) return null;
  try {
    // Algoritma sabitlenir: bilet kendi başlığında başka bir algoritma iddia edemez.
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (!payload.sub || payload.iat === undefined) return null;
    return { userId: payload.sub, issuedAt: payload.iat };
  } catch {
    return null;
  }
}

export function shouldRefresh(session: SessionToken, now = Date.now()): boolean {
  return now / 1000 - session.issuedAt > REFRESH_AFTER_SECONDS;
}
