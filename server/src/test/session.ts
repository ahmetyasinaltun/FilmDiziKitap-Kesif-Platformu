import type { Express } from 'express';
import request from 'supertest';

/** Yanıttaki oturum cookie'sinin tamamı (öznitelikleriyle birlikte). */
export function sessionCookie(res: request.Response): string {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = header?.find((value) => value.startsWith('session='));
  if (!cookie) throw new Error('Oturum cookie’si yok');
  return cookie;
}

/** Kayıt olur; sonraki isteklere eklenecek `Cookie` başlığını ve kullanıcıyı döner. */
export async function signUp(
  app: Express,
  user: { username: string; email: string; password?: string },
) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ password: 'gizli-sifre-123', ...user });
  if (res.status !== 201) throw new Error(`Kayıt olmadı: ${JSON.stringify(res.body)}`);
  return {
    cookie: sessionCookie(res).split(';')[0] as string,
    user: res.body.user as { id: string; username: string },
  };
}
