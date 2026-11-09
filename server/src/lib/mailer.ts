import { env } from '../config/env.js';
import { AppError } from './errors.js';
import { logger } from './logger.js';

/** Gönderen adı: e-postanın "Kimden" satırında görünür. Ürün adının sunucudaki tek yeri. */
export const SENDER_NAME = 'Film Dizi Kitap';

const TIMEOUT_MS = 10_000;

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Brevo'nun HTTP API'siyle e-posta gönderir (ücretsiz plan: günde 300). SMTP yerine HTTP:
 * sunucusuz ortamda bağlantı açık tutmak gerekmez. Loglara alıcı adresi ya da içerik yazılmaz.
 */
export async function sendEmail({ to, subject, html, text }: Email): Promise<void> {
  // Yalnız geliştirmede mümkün (canlıda env şeması bu iki değeri zorunlu tutar): e-posta
  // gönderilmez, geliştirici bağlantıyı terminalden açar.
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) {
    console.info(
      `\n[E-posta gönderilmedi: BREVO_API_KEY boş]\nKime: ${to}\nKonu: ${subject}\n\n${text}\n`,
    );
    return;
  }

  let res: Response;
  try {
    res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: env.MAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    logger.error({ err: error }, 'E-posta servisine ulaşılamadı');
    throw unavailable();
  }

  if (!res.ok) {
    // Brevo hata gövdesi { code, message } verir; yalnız kod loglanır.
    const body = (await res.json().catch(() => null)) as { code?: unknown } | null;
    logger.error({ status: res.status, code: body?.code }, 'E-posta gönderilemedi');
    throw unavailable();
  }
}

function unavailable() {
  return new AppError(
    503,
    'EMAIL_UNAVAILABLE',
    'E-posta şu an gönderilemedi. Biraz sonra tekrar dene.',
  );
}
