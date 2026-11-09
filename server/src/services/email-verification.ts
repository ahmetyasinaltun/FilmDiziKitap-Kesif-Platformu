import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import type { SessionUser } from '../domain/user.js';
import { AppError } from '../lib/errors.js';
import { sendEmail, SENDER_NAME } from '../lib/mailer.js';
import { prisma } from '../lib/prisma.js';
import { sessionUserSelect, toSessionUser } from './auth.js';

const VALID_HOURS = 24;
const PURPOSE = 'VERIFY_EMAIL';

/** Bağlantıdaki kodun veritabanında saklanan hali: kod sızan bir veritabanından üretilemez. */
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Yeni bir doğrulama bağlantısı üretip e-postayla gönderir. Önceki bağlantılar geçersiz olur:
 * "tekrar gönder"e basan kişinin elinde yalnızca son e-postadaki bağlantı çalışır.
 */
export async function sendVerificationEmail(user: Pick<SessionUser, 'id' | 'email' | 'username'>) {
  const token = randomBytes(32).toString('base64url');
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId: user.id, purpose: PURPOSE } }),
    prisma.authToken.create({
      data: {
        userId: user.id,
        purpose: PURPOSE,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + VALID_HOURS * 60 * 60 * 1000),
      },
    }),
  ]);

  const link = new URL('/eposta-dogrula', env.APP_URL);
  link.searchParams.set('kod', token);
  await sendEmail({ to: user.email, ...verificationEmail(user.username, link.toString()) });
}

/**
 * Bağlantıdaki kodu doğrular ve hesabı doğrulanmış yapar. Kod tek kullanımlıktır; süresi
 * dolmuş, kullanılmış ya da hiç var olmamış kod aynı mesajı alır.
 */
export async function verifyEmail(token: string): Promise<SessionUser> {
  const row = await prisma.authToken.findUnique({
    where: { tokenHash: hash(token) },
    select: { userId: true, purpose: true, expiresAt: true },
  });
  if (!row || row.purpose !== PURPOSE || row.expiresAt <= new Date()) {
    throw new AppError(
      400,
      'INVALID_TOKEN',
      'Doğrulama bağlantısı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.',
    );
  }

  const [, user] = await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId: row.userId, purpose: PURPOSE } }),
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
      select: sessionUserSelect,
    }),
  ]);
  return toSessionUser(user);
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Düz metin ve HTML sürümü: HTML göstermeyen e-posta programları da bağlantıyı görür. */
export function verificationEmail(username: string, link: string) {
  const subject = `${SENDER_NAME}: e-posta adresini doğrula`;
  const text = [
    `Merhaba ${username},`,
    '',
    `${SENDER_NAME} hesabın hazır. İzlediklerini ve okuduklarını kaydedebilmek için e-posta adresini doğrula:`,
    link,
    '',
    `Bağlantı ${VALID_HOURS} saat geçerli. Bu hesabı sen açmadıysan bu e-postayı yok sayabilirsin.`,
  ].join('\n');

  const safeLink = escapeHtml(link);
  const html = `<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:24px;background:#f4efe6;font-family:Arial,Helvetica,sans-serif;color:#17110a">
    <p style="margin:0 0 16px">Merhaba ${escapeHtml(username)},</p>
    <p style="margin:0 0 24px">${SENDER_NAME} hesabın hazır. İzlediklerini ve okuduklarını kaydedebilmek için e-posta adresini doğrula.</p>
    <p style="margin:0 0 24px">
      <a href="${safeLink}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#17110a;color:#f4efe6;text-decoration:none;font-weight:bold">E-postamı doğrula</a>
    </p>
    <p style="margin:0 0 8px;font-size:14px">Düğme çalışmazsa bu adresi tarayıcına yapıştır:</p>
    <p style="margin:0 0 24px;font-size:14px;word-break:break-all"><a href="${safeLink}" style="color:#17110a">${safeLink}</a></p>
    <p style="margin:0;font-size:14px">Bağlantı ${VALID_HOURS} saat geçerli. Bu hesabı sen açmadıysan bu e-postayı yok sayabilirsin.</p>
  </body>
</html>`;

  return { subject, text, html };
}
