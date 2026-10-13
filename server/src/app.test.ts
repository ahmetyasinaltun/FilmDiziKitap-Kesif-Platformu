import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from './app.js';
import { AppError } from './lib/errors.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './lib/logger.js';
import { pinoHttp } from 'pino-http';

describe('API', () => {
  const app = createApp();

  it('GET /api/health çalışır', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('olmayan bir uç için Türkçe 404 döner', async () => {
    const res = await request(app).get('/api/olmayan-uc');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('bozuk JSON gövdesine 400 döner', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"bozuk":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('errorHandler', () => {
  // Hata türlerini denemek için sadece hata fırlatan küçük bir uygulama.
  function appThatThrows(error: unknown) {
    const app = express();
    app.use(pinoHttp({ logger }));
    app.get('/', async () => {
      throw error;
    });
    app.use(errorHandler);
    return app;
  }

  it('AppError durum kodunu ve mesajını korur', async () => {
    const res = await request(
      appThatThrows(new AppError(409, 'TAKEN', 'Bu kullanıcı adı alınmış.')),
    ).get('/');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'TAKEN', message: 'Bu kullanıcı adı alınmış.' } });
  });

  it('Zod hatasını alan bazında 400 olarak döner', async () => {
    const result = z.object({ username: z.string().min(3) }).safeParse({ username: 'a' });
    const res = await request(appThatThrows(result.error)).get('/');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.username).toHaveLength(1);
  });

  it('beklenmeyen hatanın detayını kullanıcıya göstermez', async () => {
    const res = await request(appThatThrows(new Error('connection string: postgres://gizli'))).get(
      '/',
    );
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('gizli');
  });
});
