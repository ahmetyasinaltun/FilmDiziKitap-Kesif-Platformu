import { Router } from 'express';
import { z } from 'zod';
import { LIBRARY_STATUSES } from '../domain/library.js';
import { noStore } from '../middleware/cache-control.js';
import { listLibrary } from '../services/library.js';
import { pageQuery } from './params.js';

const userParams = z.object({ username: z.string().trim().toLowerCase().max(50) });

const libraryQuery = pageQuery.extend({
  type: z.enum(['movie', 'tv', 'book']).optional(),
  status: z.enum(LIBRARY_STATUSES).optional(),
});

/** Kullanıcı profilleri: herkese açık, giriş gerekmez. */
export const usersRouter = Router();

// Herkese açık ama sık değişen veri: kullanıcı durumu değiştirdiğinde hemen görmeli.
usersRouter.use(noStore);

usersRouter.get('/:username/library', async (req, res) => {
  const { username } = userParams.parse(req.params);
  res.json(await listLibrary(username, libraryQuery.parse(req.query)));
});
