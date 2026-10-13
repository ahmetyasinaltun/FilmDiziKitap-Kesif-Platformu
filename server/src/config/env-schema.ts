import { z } from 'zod';

// Zod hata mesajları Türkçe olsun (env kontrolü ve API girdi doğrulaması için).
z.config(z.locales.tr());

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: 'postgresql:// ile başlayan bir adres olmalı',
});
const required = z.string().trim().min(1, 'boş olamaz');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: postgresUrl,
  JWT_SECRET: z.string().min(32, 'en az 32 karakter olmalı'),
  TMDB_API_TOKEN: required,
  OMDB_API_KEY: required,
  GOOGLE_BOOKS_API_KEY: required,
  OPEN_LIBRARY_USER_AGENT: required,
});

/** Sadece migration komutları kullanır (prisma.config.ts); uygulama çalışırken gerekmez. */
export const migrationEnvSchema = z.object({ DIRECT_URL: postgresUrl });

export type Env = z.infer<typeof envSchema>;

/** Sorunları "DEĞİŞKEN: mesaj" satırları olarak verir. Değerler asla yazılmaz. */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}
