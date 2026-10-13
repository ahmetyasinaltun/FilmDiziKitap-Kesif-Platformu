import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { fetchJson, ProviderError } from './http.js';

const schema = z.object({ title: z.string() });
const url = new URL('https://api.example.com/movie/1?api_key=gizli');

function mockFetch(...responses: (Response | Error)[]) {
  const fn = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) fn.mockRejectedValueOnce(response);
    else fn.mockResolvedValueOnce(response);
  }
  vi.stubGlobal('fetch', fn);
  return fn;
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  it('yanıtı şemayla doğrulayıp döner, fazla alanları ayıklar', async () => {
    mockFetch(json({ title: 'Inception', extra: 1 }));
    expect(await fetchJson({ provider: 'TMDB', url, schema })).toEqual({ title: 'Inception' });
  });

  it('5xx sonrası bir kez tekrar dener', async () => {
    const fetch = mockFetch(json({}, 503), json({ title: 'Inception' }));
    expect(await fetchJson({ provider: 'TMDB', url, schema })).toEqual({ title: 'Inception' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ağ hatası tekrar edince "unavailable" olur', async () => {
    mockFetch(new TypeError('fetch failed'), new TypeError('fetch failed'));
    await expect(fetchJson({ provider: 'TMDB', url, schema })).rejects.toMatchObject({
      kind: 'unavailable',
    });
  });

  it('404 tekrar denenmez, "not_found" olur', async () => {
    const fetch = mockFetch(json({}, 404));
    await expect(fetchJson({ provider: 'TMDB', url, schema })).rejects.toMatchObject({
      kind: 'not_found',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('401 (geçersiz anahtar, kota) "unavailable" olur', async () => {
    mockFetch(json({}, 401));
    await expect(fetchJson({ provider: 'OMDb', url, schema })).rejects.toMatchObject({
      kind: 'unavailable',
      status: 401,
    });
  });

  it('beklenmeyen biçim "invalid_response" olur', async () => {
    mockFetch(json({ name: 'başlık yok' }));
    await expect(fetchJson({ provider: 'TMDB', url, schema })).rejects.toMatchObject({
      kind: 'invalid_response',
    });
  });

  it('hata mesajı adresi ve anahtarı içermez', async () => {
    mockFetch(json({}, 500), json({}, 500));
    const error = await fetchJson({ provider: 'TMDB', url, schema }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(String(error)).not.toContain('gizli');
  });
});
