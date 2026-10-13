import { Router } from 'express';
import { z } from 'zod';
import { publicCache } from '../middleware/cache-control.js';
import { searchBooks } from '../providers/openlibrary/index.js';
import { searchTmdb } from '../providers/tmdb/index.js';
import { isPartial, searchAll } from '../services/search.js';
import { pageQuery } from './params.js';

export const searchRouter = Router();

const searchQuery = pageQuery.extend({
  q: z.string().trim().min(1, 'Aramak için bir şey yaz.').max(100),
  type: z.enum(['all', 'movie', 'tv', 'person', 'book']).default('all'),
});

/**
 * - `type=all` (varsayılan): film/dizi/kişi ve kitaplar ayrı bölümlerde (`CombinedSearch`)
 * - `type=movie|tv|person|book`: tek tür, sayfalı liste (`Paginated`)
 */
searchRouter.get('/', publicCache(3600), async (req, res) => {
  const { q, page, type } = searchQuery.parse(req.query);

  if (type === 'all') {
    const result = await searchAll(q, page);
    // Bir kaynak o an çökmüşse bu eksik yanıt CDN'de saklanmasın.
    if (isPartial(result)) res.set('Cache-Control', 'no-store');
    res.json(result);
    return;
  }
  res.json(type === 'book' ? await searchBooks(q, page) : await searchTmdb(type, q, page));
});
