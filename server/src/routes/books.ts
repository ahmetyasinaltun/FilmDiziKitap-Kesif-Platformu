import { Router } from 'express';
import { z } from 'zod';
import { publicCache } from '../middleware/cache-control.js';
import { getAuthor } from '../providers/openlibrary/index.js';
import { getBookDetail } from '../services/books.js';

const bookParams = z.object({ id: z.string().regex(/^OL\d+W$/, 'Geçersiz kitap kimliği') });
const authorParams = z.object({ id: z.string().regex(/^OL\d+A$/, 'Geçersiz yazar kimliği') });

export const booksRouter = Router();

booksRouter.get('/:id', publicCache(6 * 3600), async (req, res) => {
  const { id } = bookParams.parse(req.params);
  res.json(await getBookDetail(id));
});

export const authorsRouter = Router();

authorsRouter.get('/:id', publicCache(6 * 3600), async (req, res) => {
  const { id } = authorParams.parse(req.params);
  res.json(await getAuthor(id));
});
