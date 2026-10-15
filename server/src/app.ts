import express, { Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { authorsRouter, booksRouter } from './routes/books.js';
import { discoverRouter } from './routes/discover.js';
import { healthRouter } from './routes/health.js';
import { libraryRouter } from './routes/library.js';
import { moviesRouter } from './routes/movies.js';
import { peopleRouter } from './routes/people.js';
import { searchRouter } from './routes/search.js';
import { tvRouter } from './routes/tv.js';
import { usersRouter } from './routes/users.js';

/**
 * Uygulamayı kurar ama dinlemeye başlamaz. Böylece aynı uygulama hem yerel sunucuda
 * (index.ts) hem testlerde (Supertest) hem de ileride Vercel function'ında kullanılır.
 */
export function createApp() {
  const app = express();

  // Canlıda istekler Vercel'in proxy'sinden geçer; gerçek istemci IP'si (rate limit için)
  // X-Forwarded-For başlığındadır. Sadece bir proxy katmanına güvenilir: istemcinin kendi
  // eklediği sahte değerler IP olarak kabul edilmez.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      // İstek başına tek satır yeter; başlıklar (cookie, IP...) loga girmesin.
      serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  const api = Router();
  api.use('/health', healthRouter);
  api.use('/auth', authRouter);
  api.use('/search', searchRouter);
  api.use('/discover', discoverRouter);
  api.use('/movies', moviesRouter);
  api.use('/tv', tvRouter);
  api.use('/people', peopleRouter);
  api.use('/books', booksRouter);
  api.use('/authors', authorsRouter);
  api.use('/library', libraryRouter);
  api.use('/users', usersRouter);

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
