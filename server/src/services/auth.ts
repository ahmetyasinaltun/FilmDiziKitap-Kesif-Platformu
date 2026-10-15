import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { readSessionToken, type SessionToken } from '../lib/session.js';

/** Oturumdaki kullanıcı: kendi bilgileri (e-posta dahil). Şifre hash'i asla dışarı çıkmaz. */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const sessionUserSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

const USERNAME_TAKEN = 'Bu kullanıcı adı alınmış.';
const EMAIL_TAKEN = 'Bu e-posta ile kayıtlı bir hesap var.';

/** Kullanıcı adı veya e-posta kullanılıyorsa hangi alan olduğunu söyleyen 409 fırlatır. */
async function assertAvailable(username: string, email: string): Promise<void> {
  const existing = await prisma.user.findMany({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });
  const fields: Record<string, string[]> = {};
  if (existing.some((user) => user.username === username)) fields.username = [USERNAME_TAKEN];
  if (existing.some((user) => user.email === email)) fields.email = [EMAIL_TAKEN];
  const messages = Object.values(fields).flat();
  if (messages.length > 0) {
    throw new AppError(409, 'ACCOUNT_EXISTS', messages.join(' '), fields);
  }
}

/** `username` ve `email` küçük harfe çevrilmiş gelir (route'taki Zod şeması). */
export async function registerUser(input: RegisterInput): Promise<SessionUser> {
  await assertAvailable(input.username, input.email);
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.user.create({
      data: { username: input.username, email: input.email, passwordHash },
      select: sessionUserSelect,
    });
  } catch (error) {
    // Kontrol ile kayıt arasında aynı adı başka biri almış olabilir; veritabanının unique
    // kısıtı bunu yakalar (P2002). Hangi alan olduğunu bulmak için kontrol tekrarlanır.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      await assertAvailable(input.username, input.email);
    }
    throw error;
  }
}

/**
 * `identifier` e-posta ya da kullanıcı adı olabilir (küçük harfe çevrilmiş).
 * Kullanıcı yoksa da şifre yanlışsa da aynı mesaj ve aynı süre: dışarıdan hangi
 * hesapların kayıtlı olduğu anlaşılamaz.
 */
export async function loginUser(identifier: string, password: string): Promise<SessionUser> {
  const row = await prisma.user.findUnique({
    where: identifier.includes('@') ? { email: identifier } : { username: identifier },
    select: { ...sessionUserSelect, passwordHash: true },
  });
  // Önce şifre kontrolü: `!row` önce bakılsaydı kayıtsız hesapta karşılaştırma atlanırdı.
  const valid = await verifyPassword(password, row?.passwordHash ?? null);
  if (!row || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Kullanıcı adı, e-posta veya şifre hatalı.');
  }
  const { passwordHash, ...user } = row;
  return user;
}

export interface Session {
  user: SessionUser;
  token: SessionToken;
}

/** Cookie'deki oturumu ve kullanıcıyı döner. Bilet geçersizse ya da hesap silinmişse `null`. */
export async function getSession(req: Request): Promise<Session | null> {
  const token = await readSessionToken(req);
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    select: sessionUserSelect,
  });
  return user ? { user, token } : null;
}

/** Giriş gerektiren uçlar için: kullanıcı yoksa 401 fırlatır. */
export async function requireUser(req: Request): Promise<SessionUser> {
  const session = await getSession(req);
  if (!session) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Bu işlem için giriş yapmalısın.');
  }
  return session.user;
}
