import { Router } from 'express';
import { z } from 'zod';
import { publicCache } from '../middleware/cache-control.js';
import { searchMulti } from '../providers/tmdb/index.js';
import { pageQuery } from './params.js';

export const searchRouter = Router();

const searchQuery = pageQuery.extend({
  q: z.string().trim().min(1, 'Aramak için bir şey yaz.').max(100),
});

/** Kitap araması eklenince (Faz 2, kitap adapter'ı) bu uç film, dizi, kişi ve kitapları birleştirecek. */
searchRouter.get('/', publicCache(3600), async (req, res) => {
  const { q, page } = searchQuery.parse(req.query);
  res.json(await searchMulti(q, page));
});
