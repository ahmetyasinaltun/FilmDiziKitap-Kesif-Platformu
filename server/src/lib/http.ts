import type { z } from 'zod';
import { logger } from './logger.js';

export type ProviderName = 'TMDB' | 'OMDb' | 'Google Books' | 'Open Library';

/**
 * Dış kaynak hatası.
 * - `not_found`: kaynak "böyle bir içerik yok" dedi (404)
 * - `unavailable`: kaynak yanıt vermedi, zaman aşımı, 5xx, kota/anahtar sorunu
 * - `invalid_response`: yanıt beklenen biçimde değil
 */
export class ProviderError extends Error {
  readonly provider: ProviderName;
  readonly kind: 'not_found' | 'unavailable' | 'invalid_response';
  readonly status: number | undefined;

  constructor(
    provider: ProviderName,
    kind: ProviderError['kind'],
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(`${provider}: ${kind}${options.status ? ` (HTTP ${options.status})` : ''}`, {
      cause: options.cause,
    });
    this.name = 'ProviderError';
    this.provider = provider;
    this.kind = kind;
    this.status = options.status;
  }
}

interface FetchJsonOptions<S extends z.ZodType> {
  provider: ProviderName;
  url: URL;
  schema: S;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Ağ hatası, zaman aşımı, 429 ve 5xx'te kaç kez tekrar denensin */
  retries?: number;
}

const RETRY_DELAY_MS = 300;

/** Loglara sadece adresin yolu yazılır; sorgu dizesi (API anahtarları) asla. */
function safeUrl(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dış kaynaktan JSON çeker ve Zod şemasıyla doğrular.
 * Doğrulama, kaynağın biçimi değişirse anlamsız bir "undefined" hatası yerine
 * net bir `invalid_response` hatası verir.
 */
export async function fetchJson<S extends z.ZodType>(
  options: FetchJsonOptions<S>,
): Promise<z.output<S>> {
  const { provider, url, schema, headers, timeoutMs = 8000, retries = 1 } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return fetchJson({ ...options, retries: retries - 1 });
    }
    logger.warn(
      { provider, url: safeUrl(url), reason: errorName(error) },
      'Dış kaynağa ulaşılamadı',
    );
    throw new ProviderError(provider, 'unavailable', { cause: error });
  }

  if (response.status === 404) {
    throw new ProviderError(provider, 'not_found', { status: 404 });
  }
  if ((response.status === 429 || response.status >= 500) && retries > 0) {
    await sleep(RETRY_DELAY_MS);
    return fetchJson({ ...options, retries: retries - 1 });
  }
  if (!response.ok) {
    logger.warn({ provider, url: safeUrl(url), status: response.status }, 'Dış kaynak hata döndü');
    throw new ProviderError(provider, 'unavailable', { status: response.status });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new ProviderError(provider, 'invalid_response', {
      status: response.status,
      cause: error,
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    logger.error(
      { provider, url: safeUrl(url), issues: parsed.error.issues.slice(0, 5) },
      'Dış kaynak yanıtı beklenen biçimde değil',
    );
    throw new ProviderError(provider, 'invalid_response', { cause: parsed.error });
  }
  return parsed.data;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}
