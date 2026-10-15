type FieldErrors = Record<string, string[] | undefined>;

/**
 * Kullanıcıya gösterilebilecek, beklenen hatalar (404, 403, 409...).
 * `message` Türkçe ve doğrudan arayüzde gösterilecek şekilde yazılır.
 * `fields` verilirse form, hatayı ilgili alanın altında gösterebilir.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldErrors | undefined;

  constructor(status: number, code: string, message: string, fields?: FieldErrors) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** API'nin tüm hata yanıtlarının biçimi. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    fields?: FieldErrors;
  };
}
