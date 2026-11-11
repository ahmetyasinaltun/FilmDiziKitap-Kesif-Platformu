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
import { logger } from '../lib/logger.js';
import { getSession, loginUser, registerUser, requireUser } from '../services/auth.js';
import { sendVerificationEmail, verifyEmail } from '../services/email-verification.js';

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

const verifyBody = z.object({
  // 32 rastgele baytın base64url hali (43 karakter)
  token: z.string().trim().min(20, 'Doğrulama kodu eksik.').max(100),
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
    // E-posta servisi düşse de kayıt tamamlanır: kullanıcı "tekrar gönder" ile yeni bağlantı ister.
    await sendVerificationEmail(user).catch((error: unknown) => {
      logger.error({ err: error }, 'Kayıttan sonra doğrulama e-postası gönderilemedi');
    });
    res.status(201).json({ user });
  },
);

/** E-postadaki bağlantı: giriş gerekmez, bağlantı başka bir cihazda da açılabilir. */
authRouter.post('/verify-email', async (req, res) => {
  const { token } = verifyBody.parse(req.body);
  const user = await verifyEmail(token);
  res.json({ user });
});

authRouter.post(
  '/verify-email/resend',
  // Kişi başına saatte 3: aynı Wi-Fi'deki biri diğerlerinin hakkını tüketmez. IP başına saatte 10
  // ek sınır: çok hesap açıp e-posta kotasını (Brevo, günde 300) tüketmeyi yavaşlatır.
  limitRequests({
    name: 'verify-resend-user',
    windowMinutes: 60,
    limit: 3,
    per: 'user',
    message: 'Çok fazla doğrulama e-postası istendi.',
  }),
  limitRequests({
    name: 'verify-resend',
    windowMinutes: 60,
    limit: 10,
    message: 'Bu ağdan çok fazla doğrulama e-postası istendi.',
  }),
  async (req, res) => {
    const user = await requireUser(req);
    if (!user.emailVerified) await sendVerificationEmail(user);
    res.status(204).end();
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
