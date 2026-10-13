import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { AppError, type ErrorBody } from '../lib/errors.js';
import { ProviderError } from '../lib/http.js';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'Bu adreste bir API ucu yok.'));
};

/** body-parser gibi ara katmanların fırlattığı, durum kodu taşıyan hatalar (örn. bozuk JSON). */
function isClientHttpError(err: unknown): err is { status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  );
}

/**
 * Merkezi hata yöneticisi. Express 5'te async route'lardaki hatalar da otomatik buraya gelir.
 * Kullanıcıya Türkçe ve sade mesaj, loga teknik detay.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  let status = 500;
  let body: ErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Beklenmeyen bir hata oluştu. Lütfen biraz sonra tekrar dene.',
    },
  };

  if (err instanceof AppError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message } };
  } else if (err instanceof z.ZodError) {
    status = 400;
    body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Gönderilen bilgiler geçersiz.',
        fields: z.flattenError(err).fieldErrors,
      },
    };
  } else if (err instanceof ProviderError) {
    // Ayrıntısı http.ts'te loglandı; burada sadece kullanıcıya uygun cevaba çevrilir.
    if (err.kind === 'not_found') {
      status = 404;
      body = { error: { code: 'CONTENT_NOT_FOUND', message: 'Aradığın içerik bulunamadı.' } };
    } else {
      status = 503;
      body = {
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: `${err.provider} şu an yanıt vermiyor. Biraz sonra tekrar dene.`,
        },
      };
    }
  } else if (isClientHttpError(err)) {
    status = err.status;
    body = { error: { code: 'BAD_REQUEST', message: 'İstek okunamadı.' } };
  }

  if (status >= 500 && !(err instanceof ProviderError)) {
    req.log.error({ err }, 'Beklenmeyen hata');
  }
  // Hata yanıtları asla önbelleğe alınmaz (yoksa geçici bir 503, CDN'de saatlerce kalabilir).
  res.set('Cache-Control', 'no-store');
  res.status(status).json(body);
};
