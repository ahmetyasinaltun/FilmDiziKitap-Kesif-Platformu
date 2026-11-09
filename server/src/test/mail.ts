import { vi } from 'vitest';
import { sendEmail, type Email } from '../lib/mailer.js';

/** Testte "gönderilen" e-postalar, gönderim sırasıyla (gönderim `src/test/database.ts`'te taklit). */
export const sentEmails = (): Email[] => vi.mocked(sendEmail).mock.calls.map(([email]) => email);

/** Bu adrese giden son e-postadaki doğrulama bağlantısı ve içindeki kod. */
export function lastVerificationLink(to: string) {
  const email = sentEmails().findLast((sent) => sent.to === to);
  const href = email?.text.match(/https?:\/\/\S+/)?.[0];
  if (!href) throw new Error(`${to} adresine doğrulama bağlantısı gitmedi`);
  const url = new URL(href);
  return { url, code: url.searchParams.get('kod') ?? '' };
}
