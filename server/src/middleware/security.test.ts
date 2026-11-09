import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { errorHandler } from './error-handler.js';
import { limitRequests } from './rate-limit.js';
import { sameOriginOnly } from './same-origin.js';

/** Ara katmanı tek başına deneyen en küçük uygulama: veritabanına dokunmaz. */
function appWith(middleware: express.RequestHandler) {
  const app = express();
  app.use(middleware);
  app.all('/', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('sameOriginOnly', () => {
  const app = appWith(sameOriginOnly);

  it('başka siteden gelen veri değiştiren isteği reddeder', async () => {
    const byOrigin = await request(app).post('/').set('Origin', 'https://kotu.example');
    expect(byOrigin.status).toBe(403);
    expect(byOrigin.body.error.code).toBe('CROSS_SITE_REQUEST');

    const byFetchSite = await request(app).delete('/').set('Sec-Fetch-Site', 'cross-site');
    expect(byFetchSite.status).toBe(403);

    const opaque = await request(app).put('/').set('Origin', 'null');
    expect(opaque.status).toBe(403);
  });

  it('aynı siteden gelen isteği ve okuma isteklerini geçirir', async () => {
    const same = await request(app)
      .post('/')
      .set('Host', 'site.example')
      .set('Origin', 'https://site.example')
      .set('Sec-Fetch-Site', 'same-origin');
    expect(same.status).toBe(200);

    const read = await request(app).get('/').set('Origin', 'https://kotu.example');
    expect(read.status).toBe(200);
  });

  it('tarayıcı dışı istemciyi (Origin yok) geçirir: kurbanın oturum çerezini taşıyamaz', async () => {
    expect((await request(app).post('/')).status).toBe(200);
  });

  it('uygulamada bütün API isteklerini korur', async () => {
    const res = await request(createApp())
      .post('/api/auth/logout')
      .set('Origin', 'https://kotu.example');
    expect(res.status).toBe(403);
  });
});

describe('limitRequests (bellek deposu)', () => {
  it('sınırı aşan isteği Türkçe mesajla 429 ile durdurur', async () => {
    const app = appWith(
      limitRequests({
        name: 'deneme',
        windowMinutes: 1,
        limit: 2,
        store: 'memory',
        message: 'Çok fazla istek gönderildi.',
      }),
    );

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toBe(
      'Çok fazla istek gönderildi. 1 dakika sonra tekrar dene.',
    );
  });
});
