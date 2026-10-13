import { Router } from 'express';
import { z } from 'zod';
import { publicCache } from '../middleware/cache-control.js';
import { getSeason } from '../providers/tmdb/index.js';
import { getTvDetail } from '../services/titles.js';
import { idParams, tmdbId } from './params.js';

export const tvRouter = Router();

tvRouter.get('/:id', publicCache(3600), async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await getTvDetail(id));
});

const seasonParams = z.object({
  id: tmdbId,
  season: z.coerce.number().int().min(0).max(1000),
});

tvRouter.get('/:id/seasons/:season', publicCache(3600), async (req, res) => {
  const { id, season } = seasonParams.parse(req.params);
  res.json(await getSeason(id, season));
});
