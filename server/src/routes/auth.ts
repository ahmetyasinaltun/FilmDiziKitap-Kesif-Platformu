import { Router } from 'express';
import { z } from 'zod';
import { noStore } from '../middleware/cache-control.js';
import { limitRequests } from '../middleware/rate-limit.js';
import { isPasswordTooLong } from '../lib/password.js';
import {
  clearSessionCookie,
  hasSessionCookie,
  setSessionCookie,
  shouldRefresh,
} from '../lib/session.js';
import { getSession, loginUser, registerUser } from '../services/auth.js';

/** Profil adresinde kullanılır (/u/{username}): sadece URL dostu karakterler. */
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,20}$/,
    '3-20 karakter; sadece harf (a-z), rakam ve alt çizgi kullanılabilir.',
  );

const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı.')
  .refine((password) => !isPasswordTooLong(password), 'Şifre çok uzun.');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Geçerli bir e-posta adresi gir.'));

const registerBody = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginBody = z.object({
  /** E-posta ya da kullanıcı adı */
  identifier: z.string().trim().toLowerCase().min(1, 'Kullanıcı adı veya e-posta gir.').max(254),
  password: z.string().min(1, 'Şifre gir.'),
});

export const authRouter = Router();

// Kullanıcıya özel yanıtlar: tarayıcı ya da CDN önbelleğinde saklanmaz.
authRouter.use(noStore);

authRouter.post(
  '/register',
  limitRequests({ name: 'register', windowMinutes: 60, limit: 10 }),
  async (req, res) => {
    const input = registerBody.parse(req.body);
    const user = await registerUser(input);
    await setSessionCookie(res, user.id);
    res.status(201).json({ user });
  },
);

authRouter.post(
  '/login',
  // Sadece başarısız denemeler sayılır: şifreyi bilen kullanıcı hiç engellenmez.
  limitRequests({ name: 'login', windowMinutes: 15, limit: 10, countOnlyFailures: true }),
  async (req, res) => {
    const { identifier, password } = loginBody.parse(req.body);
    const user = await loginUser(identifier, password);
    await setSessionCookie(res, user.id);
    res.json({ user });
  },
);

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

/**
 * Arayüz açılışta bunu çağırır. Ziyaretçi bir hata durumu değil (site herkese açık):
 * giriş yoksa 401 yerine `{ user: null }` döner.
 */
authRouter.get('/me', async (req, res) => {
  const session = await getSession(req);
  if (!session) {
    // Süresi dolmuş ya da geçersiz bir cookie kaldıysa temizlenir.
    if (hasSessionCookie(req)) clearSessionCookie(res);
    res.json({ user: null });
    return;
  }
  if (shouldRefresh(session.token)) await setSessionCookie(res, session.user.id);
  res.json({ user: session.user });
});
