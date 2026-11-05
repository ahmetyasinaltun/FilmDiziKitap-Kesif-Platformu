import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { BookDetail, MovieDetail, TvDetail } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';
import * as tmdb from '../providers/tmdb/index.js';
import * as books from '../services/books.js';
import { db } from '../test/database.js';
import { signUp } from '../test/session.js';

// Dış kaynaklar taklit edilir; veritabanı gerçek.
vi.mock('../providers/tmdb/index.js', async (importOriginal) => ({
  ...(await importOriginal<typeof tmdb>()),
  getMovie: vi.fn(),
  getTv: vi.fn(),
}));
vi.mock('../services/books.js', async (importOriginal) => ({
  ...(await importOriginal<typeof books>()),
  getBookDetail: vi.fn(),
}));

const app = createApp();

const movie = { type: 'movie', id: '27205', title: 'Başlangıç', year: 2010, poster: '/b.jpg' };
const tv = { type: 'tv', id: '1396', title: 'Breaking Bad', year: 2008, poster: '/bb.jpg' };
const book = {
  type: 'book',
  id: 'OL1168083W',
  title: 'Bin Dokuz Yüz Seksen Dört',
  year: 1949,
  poster: 'https://covers.openlibrary.org/b/id/1-M.jpg',
  authorNames: ['George Orwell'],
};

let cookie = '';

const put = (path: string, body: object, as = cookie) =>
  request(app).put(`/api/library/${path}`).set('Cookie', as).send(body);
const get = (path: string, as = cookie) =>
  request(app).get(`/api/library/${path}`).set('Cookie', as);
const library = (query = '', username = 'ahmet') =>
  request(app).get(`/api/users/${username}/library${query}`);

async function contentRows() {
  const { rows } = await db.query<{ title: string; externalId: string; authorNames: string[] }>(
    `SELECT title, "externalId", "authorNames" FROM "Content" ORDER BY "externalId"`,
  );
  return rows;
}

beforeEach(async () => {
  await db.reset();
  vi.resetAllMocks();
  vi.mocked(tmdb.getMovie).mockResolvedValue(movie as MovieDetail);
  vi.mocked(tmdb.getTv).mockResolvedValue(tv as TvDetail);
  vi.mocked(books.getBookDetail).mockResolvedValue(book as BookDetail);
  ({ cookie } = await signUp(app, { username: 'ahmet', email: 'ahmet@ornek.com' }));
});

describe('PUT /api/library/:type/:id', () => {
  it('giriş yoksa 401 döner', async () => {
    const res = await put('movie/27205', { status: 'planned' }, '');

    expect(res.status).toBe(401);
  });

  it('içeriği ekler ve özetini sağlayıcıdan doğrulayarak kaydeder', async () => {
    const res = await put('movie/27205', { status: 'planned' });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.entry).toMatchObject({
      status: 'planned',
      rating: null,
      finishedAt: null,
    });
    expect(tmdb.getMovie).toHaveBeenCalledWith(27205);
    expect(await contentRows()).toEqual([
      { title: 'Başlangıç', externalId: '27205', authorNames: [] },
    ]);
  });

  it('sağlayıcıda olmayan içerik için kayıt açmaz', async () => {
    vi.mocked(tmdb.getMovie).mockRejectedValue(new ProviderError('TMDB', 'not_found'));

    const res = await put('movie/999999999', { status: 'planned' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CONTENT_NOT_FOUND');
    expect(await contentRows()).toEqual([]);
  });

  it('aynı içerik için tek kayıt tutar; ikinci kullanıcı sağlayıcıya gitmez', async () => {
    const other = await signUp(app, { username: 'zeynep', email: 'zeynep@ornek.com' });

    await put('movie/27205', { status: 'planned' });
    await put('movie/27205', { status: 'completed' }, other.cookie);

    expect(tmdb.getMovie).toHaveBeenCalledTimes(1);
    expect(await contentRows()).toHaveLength(1);
  });

  it('izlenince bitiş tarihini yazar; puan, durum değişse de korunur', async () => {
    const completed = await put('movie/27205', { status: 'completed', rating: 8 });
    const again = await put('movie/27205', { status: 'completed' });

    expect(completed.body.entry).toMatchObject({ status: 'completed', rating: 8 });
    expect(completed.body.entry.finishedAt).not.toBeNull();
    // Aynı durumu tekrar göndermek tarihi ve puanı değiştirmez.
    expect(again.body.entry.rating).toBe(8);
    expect(again.body.entry.finishedAt).toBe(completed.body.entry.finishedAt);
  });

  it('"izleyeceğim"e dönen içeriğin puanı ve bitiş tarihi silinir', async () => {
    await put('tv/1396', { status: 'completed', rating: 9 });

    const res = await put('tv/1396', { status: 'planned' });

    expect(res.body.entry).toMatchObject({
      status: 'planned',
      rating: null,
      finishedAt: null,
    });
  });

  it('puan `null` gönderilince silinir', async () => {
    await put('book/OL1168083W', { status: 'completed', rating: 7 });

    const res = await put('book/OL1168083W', { status: 'completed', rating: null });

    expect(res.body.entry.rating).toBeNull();
  });

  it.each([
    ['kaldırılan "izliyorum" durumu', 'tv/1396', { status: 'in_progress' }, 'status'],
    ['kaldırılan "bıraktım" durumu', 'book/OL1168083W', { status: 'dropped' }, 'status'],
    ['bilinmeyen durum', 'tv/1396', { status: 'watching' }, 'status'],
    ['izlenmemiş içeriğe puan', 'movie/27205', { status: 'planned', rating: 5 }, 'rating'],
    ['10’dan büyük puan', 'movie/27205', { status: 'completed', rating: 11 }, 'rating'],
    ['küsuratlı puan', 'movie/27205', { status: 'completed', rating: 7.5 }, 'rating'],
  ])('%s → 400', async (_label, path, body, field) => {
    const res = await put(path, body);

    expect(res.status).toBe(400);
    expect(res.body.error.fields[field]).toHaveLength(1);
    expect(await contentRows()).toEqual([]);
  });

  it.each([
    ['bilinmeyen tür', 'anime/1'],
    ['harf içeren film kimliği', 'movie/abc'],
    ['Open Library biçiminde olmayan kitap kimliği', 'book/123'],
  ])('%s → 400', async (_label, path) => {
    const res = await put(path, { status: 'planned' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  describe('eskimiş özet', () => {
    beforeEach(async () => {
      await put('movie/27205', { status: 'planned' });
      await db.query(`UPDATE "Content" SET "updatedAt" = now() - interval '8 days'`);
    });

    it('7 günden eskiyse sağlayıcıdan yenilenir (örn. Türkçe ad sonradan eklenmiş)', async () => {
      vi.mocked(tmdb.getMovie).mockResolvedValue({ ...movie, title: 'Yeni Ad' } as MovieDetail);

      await put('movie/27205', { status: 'completed' });

      expect((await contentRows())[0]?.title).toBe('Yeni Ad');
    });

    it('sağlayıcı o an çökmüşse eski özetle devam eder', async () => {
      vi.mocked(tmdb.getMovie).mockRejectedValue(new ProviderError('TMDB', 'unavailable'));

      const res = await put('movie/27205', { status: 'completed' });

      expect(res.status).toBe(200);
      expect((await contentRows())[0]?.title).toBe('Başlangıç');
    });
  });
});

describe('GET ve DELETE /api/library/:type/:id', () => {
  it('kütüphanede olmayan içerik için `entry: null` döner ve kayıt açmaz', async () => {
    const res = await get('movie/27205');

    expect(res.body).toEqual({ entry: null });
    expect(tmdb.getMovie).not.toHaveBeenCalled();
  });

  it('kullanıcının kendi kaydını döner, başkasınınkini değil', async () => {
    const other = await signUp(app, { username: 'zeynep', email: 'zeynep@ornek.com' });
    await put('movie/27205', { status: 'completed', rating: 6 }, other.cookie);

    expect((await get('movie/27205')).body).toEqual({ entry: null });
    expect((await get('movie/27205', other.cookie)).body.entry.rating).toBe(6);
  });

  it('çıkarır; zaten yoksa da 204 döner', async () => {
    await put('movie/27205', { status: 'planned' });

    const first = await request(app).delete('/api/library/movie/27205').set('Cookie', cookie);
    const second = await request(app).delete('/api/library/movie/27205').set('Cookie', cookie);

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect((await get('movie/27205')).body).toEqual({ entry: null });
  });
});

describe('GET /api/users/:username/library', () => {
  beforeEach(async () => {
    await put('movie/27205', { status: 'completed', rating: 8 });
    await put('tv/1396', { status: 'completed' });
    await put('book/OL1168083W', { status: 'planned' });
  });

  it('girişsiz görülür; son güncellenen önce gelir', async () => {
    const res = await library();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, totalPages: 1, totalResults: 3 });
    expect(res.body.results.map((item: { content: { id: string } }) => item.content.id)).toEqual([
      'OL1168083W',
      '1396',
      '27205',
    ]);
  });

  it('kartları veritabanındaki özetten kurar; kitapta yazar da gelir', async () => {
    const res = await library();

    expect(res.body.results[0].content).toEqual({
      type: 'book',
      id: 'OL1168083W',
      title: 'Bin Dokuz Yüz Seksen Dört',
      year: 1949,
      poster: 'https://covers.openlibrary.org/b/id/1-M.jpg',
      authorNames: ['George Orwell'],
    });
    expect(res.body.results[2]).toMatchObject({
      status: 'completed',
      rating: 8,
      content: { type: 'movie', id: '27205', title: 'Başlangıç', poster: '/b.jpg' },
    });
  });

  it('türe ve duruma göre süzer', async () => {
    const movies = await library('?type=movie');
    const planned = await library('?status=planned');
    const none = await library('?type=movie&status=planned');

    expect(movies.body.results.map((item: { content: { id: string } }) => item.content.id)).toEqual(
      ['27205'],
    );
    expect(planned.body.totalResults).toBe(1);
    expect(none.body).toMatchObject({ totalResults: 0, totalPages: 0, results: [] });
  });

  it('kullanıcı adı büyük/küçük harf duyarsız; olmayan kullanıcı 404', async () => {
    expect((await library('', 'AHMET')).body.totalResults).toBe(3);

    const missing = await library('', 'olmayan_biri');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('sayfalar 24’er öğe', async () => {
    const userId = (await db.query<{ id: string }>(`SELECT id FROM "User"`)).rows[0]?.id;
    await db.query(
      `INSERT INTO "Content" (id, type, source, "externalId", title, "updatedAt")
       SELECT 'c' || n, 'MOVIE', 'TMDB', (1000 + n)::text, 'Film ' || n, now()
       FROM generate_series(1, 30) AS n`,
    );
    await db.query(
      `INSERT INTO "LibraryEntry" (id, "userId", "contentId", status, "updatedAt")
       SELECT 'e' || n, $1, 'c' || n, 'PLANNED', now() - n * interval '1 minute'
       FROM generate_series(1, 30) AS n`,
      [userId],
    );

    const page2 = await library('?page=2');

    expect(page2.body).toMatchObject({ page: 2, totalPages: 2, totalResults: 33 });
    expect(page2.body.results).toHaveLength(9);
  });
});
