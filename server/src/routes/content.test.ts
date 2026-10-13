import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MovieDetail } from '../domain/content.js';
import { ProviderError } from '../lib/http.js';

// Dış kaynaklar taklit edilir: testler internete ve veritabanına bağlı değil.
vi.mock('../providers/tmdb/index.js', () => ({
  getMovie: vi.fn(),
  getTv: vi.fn(),
  getSeason: vi.fn(),
  getPerson: vi.fn(),
  searchMulti: vi.fn(),
  getTrending: vi.fn(),
  getNowPlaying: vi.fn(),
  getPopularTv: vi.fn(),
}));
vi.mock('../providers/omdb/index.js', () => ({ getExternalRatings: vi.fn() }));

const tmdb = await import('../providers/tmdb/index.js');
const omdb = await import('../providers/omdb/index.js');
const { createApp } = await import('../app.js');

const movie: MovieDetail = {
  type: 'movie',
  id: '27205',
  title: 'Başlangıç',
  originalTitle: 'Inception',
  year: 2010,
  poster: null,
  overview: null,
  rating: 8.4,
  tagline: null,
  backdrop: null,
  genres: [],
  voteCount: 1,
  imdbId: 'tt1375666',
  certification: null,
  trailer: null,
  cast: [],
  recommendations: [],
  watchProviders: null,
  externalRatings: null,
  releaseDate: null,
  runtime: null,
  directors: [],
  writers: [],
  collection: null,
};

const app = createApp();

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/movies/:id', () => {
  it('detayı dış puanlarla döner ve CDN önbellek başlığı ekler', async () => {
    vi.mocked(tmdb.getMovie).mockResolvedValue(movie);
    vi.mocked(omdb.getExternalRatings).mockResolvedValue({
      imdb: { rating: 8.8, votes: 100 },
      rottenTomatoes: 86,
      metacritic: 74,
    });

    const res = await request(app).get('/api/movies/27205');

    expect(res.status).toBe(200);
    expect(res.body.externalRatings.rottenTomatoes).toBe(86);
    expect(res.headers['cache-control']).toContain('s-maxage=');
    expect(tmdb.getMovie).toHaveBeenCalledWith(27205);
  });

  it('OMDb çökerse sayfa yine açılır, sadece dış puanlar boş kalır', async () => {
    vi.mocked(tmdb.getMovie).mockResolvedValue(movie);
    vi.mocked(omdb.getExternalRatings).mockRejectedValue(
      new ProviderError('OMDb', 'unavailable', { status: 401 }),
    );

    const res = await request(app).get('/api/movies/27205');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Başlangıç');
    expect(res.body.externalRatings).toBeNull();
  });

  it('TMDB "bulunamadı" derse Türkçe 404 döner', async () => {
    vi.mocked(tmdb.getMovie).mockRejectedValue(new ProviderError('TMDB', 'not_found'));

    const res = await request(app).get('/api/movies/999999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CONTENT_NOT_FOUND');
  });

  it('TMDB erişilemezse 503 döner ve hata yanıtı önbelleğe alınmaz', async () => {
    vi.mocked(tmdb.getMovie).mockRejectedValue(new ProviderError('TMDB', 'unavailable'));

    const res = await request(app).get('/api/movies/27205');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PROVIDER_UNAVAILABLE');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sayı olmayan kimliği reddeder', async () => {
    const res = await request(app).get('/api/movies/abc');
    expect(res.status).toBe(400);
    expect(tmdb.getMovie).not.toHaveBeenCalled();
  });
});

describe('GET /api/search', () => {
  it('boş aramayı Türkçe mesajla reddeder', async () => {
    const res = await request(app).get('/api/search?q=%20');
    expect(res.status).toBe(400);
    expect(res.body.error.fields.q).toEqual(['Aramak için bir şey yaz.']);
  });

  it('özel karakterli aramayı olduğu gibi iletir', async () => {
    vi.mocked(tmdb.searchMulti).mockResolvedValue({
      page: 1,
      totalPages: 1,
      totalResults: 0,
      results: [],
    });

    await request(app).get(`/api/search?q=${encodeURIComponent('Tom & Jerry #2')}&page=2`);

    expect(tmdb.searchMulti).toHaveBeenCalledWith('Tom & Jerry #2', 2);
  });
});
