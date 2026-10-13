import { Router } from 'express';
import { z } from 'zod';
import { publicCache } from '../middleware/cache-control.js';
import { getTrendingBooks, getTurkishLiterature } from '../providers/openlibrary/index.js';
import { getNowPlaying, getPopularTv, getTrending } from '../providers/tmdb/index.js';
import { pageQuery } from './params.js';

/** Ana sayfa vitrinleri: trendler, vizyondakiler, popüler diziler, kitap rafları. */
export const discoverRouter = Router();

const trendingQuery = z.object({
  type: z.enum(['all', 'movie', 'tv']).default('all'),
  window: z.enum(['day', 'week']).default('week'),
});

discoverRouter.get('/trending', publicCache(3600), async (req, res) => {
  const { type, window } = trendingQuery.parse(req.query);
  res.json(await getTrending(type, window));
});

discoverRouter.get('/now-playing', publicCache(3 * 3600), async (req, res) => {
  const { page } = pageQuery.parse(req.query);
  res.json(await getNowPlaying(page));
});

discoverRouter.get('/popular-tv', publicCache(3 * 3600), async (req, res) => {
  const { page } = pageQuery.parse(req.query);
  res.json(await getPopularTv(page));
});

discoverRouter.get('/books/trending', publicCache(3 * 3600), async (_req, res) => {
  res.json(await getTrendingBooks());
});

discoverRouter.get('/books/turkish-literature', publicCache(6 * 3600), async (_req, res) => {
  res.json(await getTurkishLiterature());
});
