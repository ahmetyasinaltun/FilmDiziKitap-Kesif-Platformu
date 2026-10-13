/**
 * Kullanıcıya gösterilebilecek, beklenen hatalar (404, 403, 409...).
 * `message` Türkçe ve doğrudan arayüzde gösterilecek şekilde yazılır.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

/** API'nin tüm hata yanıtlarının biçimi. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[] | undefined>;
  };
}
