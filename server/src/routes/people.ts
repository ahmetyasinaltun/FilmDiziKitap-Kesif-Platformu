import { Router } from 'express';
import { publicCache } from '../middleware/cache-control.js';
import { getPerson } from '../providers/tmdb/index.js';
import { idParams } from './params.js';

export const peopleRouter = Router();

peopleRouter.get('/:id', publicCache(6 * 3600), async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await getPerson(id));
});
