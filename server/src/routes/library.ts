import { Router } from 'express';
import { z } from 'zod';
import type { MediaType } from '../domain/content.js';
import { STATUSES_BY_TYPE } from '../domain/library.js';
import { noStore } from '../middleware/cache-control.js';
import { requireUser } from '../services/auth.js';
import { getEntry, removeEntry, saveEntry } from '../services/library.js';
import { contentRefParams } from './params.js';

const rating = z
  .number()
  .int('Puan 1 ile 10 arasında bir tam sayı olmalı.')
  .min(1, 'Puan 1 ile 10 arasında bir tam sayı olmalı.')
  .max(10, 'Puan 1 ile 10 arasında bir tam sayı olmalı.');

/** Durumlar türe göre değişir (film için "izliyorum" yok); şema türe göre kurulur. */
function entryBody(type: MediaType) {
  return z
    .object({
      status: z.enum(STATUSES_BY_TYPE[type], { error: 'Bu içerik için geçersiz bir durum.' }),
      rating: rating.nullable().optional(),
    })
    .refine((body) => body.status !== 'planned' || body.rating == null, {
      path: ['rating'],
      message: 'Henüz izlemediğin ya da okumadığın bir içeriğe puan verilemez.',
    });
}

/**
 * Oturumdaki kullanıcının kütüphanesi: `/api/library/{movie|tv|book}/{id}`.
 * Herkese açık okumalar (bir kullanıcının kütüphanesi) /api/users altında.
 */
export const libraryRouter = Router();

libraryRouter.use(noStore);

libraryRouter.get('/:type/:id', async (req, res) => {
  const ref = contentRefParams.parse(req.params);
  const user = await requireUser(req);
  res.json({ entry: await getEntry(user.id, ref) });
});

libraryRouter.put('/:type/:id', async (req, res) => {
  const ref = contentRefParams.parse(req.params);
  const user = await requireUser(req);
  const input = entryBody(ref.type).parse(req.body);
  res.json({ entry: await saveEntry(user.id, ref, input) });
});

libraryRouter.delete('/:type/:id', async (req, res) => {
  const ref = contentRefParams.parse(req.params);
  const user = await requireUser(req);
  await removeEntry(user.id, ref);
  res.status(204).end();
});
