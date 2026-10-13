/** Sunucunun hata yanıtı biçimi (server/src/lib/errors.ts ile aynı). */
interface ErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[] | undefined>;
  };
}

/** API'den dönen hata. `message` Türkçe ve doğrudan kullanıcıya gösterilebilir. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[] | undefined> | undefined;

  constructor(status: number, body: ErrorBody['error']) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    value.error !== null &&
    'message' in value.error
  );
}

/**
 * Tüm API istekleri buradan geçer. Component'ler bunu doğrudan değil,
 * TanStack Query hook'ları üzerinden kullanır.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.',
    });
  }

  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      isErrorBody(body)
        ? body.error
        : { code: 'UNKNOWN_ERROR', message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.' },
    );
  }
  return body as T;
}
