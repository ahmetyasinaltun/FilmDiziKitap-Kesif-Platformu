import { describe, expect, it } from 'vitest';
import { describeIssues, envSchema } from './env-schema.js';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
  TMDB_API_TOKEN: 't',
  OMDB_API_KEY: 'o',
  GOOGLE_BOOKS_API_KEY: 'g',
  APP_USER_AGENT: 'FilmDiziKitap/test',
  APP_URL: 'http://localhost:5173',
};

const issues = (env: Record<string, string>) => {
  const result = envSchema.safeParse(env);
  return result.success ? [] : describeIssues(result.error);
};

describe('e-posta ayarları', () => {
  it('geliştirmede boş bırakılabilir (e-posta terminale yazılır)', () => {
    const result = envSchema.safeParse({ ...base, BREVO_API_KEY: '', MAIL_FROM: ' ' });

    expect(result.success && result.data).toMatchObject({
      BREVO_API_KEY: undefined,
      MAIL_FROM: undefined,
    });
  });

  it('canlıda zorunlu: eksikse site hiç açılmaz, kayıtlar sessizce doğrulanamaz olmaz', () => {
    expect(issues({ ...base, NODE_ENV: 'production' })).toEqual([
      'BREVO_API_KEY: canlı ortamda zorunlu',
      'MAIL_FROM: canlı ortamda zorunlu',
    ]);
  });

  it('biri doluysa öteki de istenir', () => {
    expect(issues({ ...base, BREVO_API_KEY: 'anahtar' })).toEqual([
      'MAIL_FROM: BREVO_API_KEY ve MAIL_FROM birlikte doldurulur',
    ]);
  });

  it('gönderen adresi geçerli bir e-posta olmalı', () => {
    expect(issues({ ...base, BREVO_API_KEY: 'anahtar', MAIL_FROM: 'adres-degil' })).toEqual([
      'MAIL_FROM: geçerli bir e-posta adresi olmalı',
    ]);
  });
});
