import express, { Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authorsRouter, booksRouter } from './routes/books.js';
import { discoverRouter } from './routes/discover.js';
import { healthRouter } from './routes/health.js';
import { moviesRouter } from './routes/movies.js';
import { peopleRouter } from './routes/people.js';
import { searchRouter } from './routes/search.js';
import { tvRouter } from './routes/tv.js';

/**
 * Uygulamayı kurar ama dinlemeye başlamaz. Böylece aynı uygulama hem yerel sunucuda
 * (index.ts) hem testlerde (Supertest) hem de ileride Vercel function'ında kullanılır.
 */
export function createApp() {
  const app = express();

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
  api.use('/search', searchRouter);
  api.use('/discover', discoverRouter);
  api.use('/movies', moviesRouter);
  api.use('/tv', tvRouter);
  api.use('/people', peopleRouter);
  api.use('/books', booksRouter);
  api.use('/authors', authorsRouter);

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
