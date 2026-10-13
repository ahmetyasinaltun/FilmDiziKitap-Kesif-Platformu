import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { AppError, type ErrorBody } from '../lib/errors.js';

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
  } else if (isClientHttpError(err)) {
    status = err.status;
    body = { error: { code: 'BAD_REQUEST', message: 'İstek okunamadı.' } };
  }

  if (status >= 500) {
    req.log.error({ err }, 'Beklenmeyen hata');
  }
  res.status(status).json(body);
};
