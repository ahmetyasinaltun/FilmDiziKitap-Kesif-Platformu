import { Router } from 'express';
import { publicCache } from '../middleware/cache-control.js';
import { getMovieDetail } from '../services/titles.js';
import { idParams } from './params.js';

export const moviesRouter = Router();

moviesRouter.get('/:id', publicCache(3600), async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await getMovieDetail(id));
});
