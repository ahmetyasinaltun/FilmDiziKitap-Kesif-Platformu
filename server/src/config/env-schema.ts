import { z } from 'zod';

// Zod hata mesajları Türkçe olsun (env kontrolü ve API girdi doğrulaması için).
z.config(z.locales.tr());

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: 'postgresql:// ile başlayan bir adres olmalı',
});
const required = z.string().trim().min(1, 'boş olamaz');
/** Boş bırakılabilen değer: boş metin "yok" (`undefined`) sayılır, doluysa `schema` denetler. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: postgresUrl,
    JWT_SECRET: z.string().min(32, 'en az 32 karakter olmalı'),
    TMDB_API_TOKEN: required,
    OMDB_API_KEY: required,
    GOOGLE_BOOKS_API_KEY: required,
    APP_USER_AGENT: required,
    // E-posta doğrulama (Brevo). Geliştirmede boş bırakılabilir: e-posta gönderilmez, bağlantı
    // terminale yazılır (projeyi deneyen biri Brevo hesabı açmak zorunda kalmasın). Canlıda zorunlu.
    BREVO_API_KEY: optional(z.string().trim()),
    MAIL_FROM: optional(z.email('geçerli bir e-posta adresi olmalı')),
    // Bağlantının adresi sabit bir ayardan gelir, isteğin Host başlığından değil: başlık
    // değiştirilip bağlantı başka siteye yönlendirilemesin.
    APP_URL: z.url({ protocol: /^https?$/, error: 'http(s):// ile başlayan bir adres olmalı' }),
  })
  .superRefine((env, ctx) => {
    const mailRequired = env.NODE_ENV === 'production' || env.BREVO_API_KEY || env.MAIL_FROM;
    if (!mailRequired) return;
    for (const key of ['BREVO_API_KEY', 'MAIL_FROM'] as const) {
      if (!env[key]) {
        const message =
          env.NODE_ENV === 'production'
            ? 'canlı ortamda zorunlu'
            : 'BREVO_API_KEY ve MAIL_FROM birlikte doldurulur';
        ctx.addIssue({ code: 'custom', path: [key], message });
      }
    }
  });

/** Sadece migration komutları kullanır (prisma.config.ts); uygulama çalışırken gerekmez. */
export const migrationEnvSchema = z.object({ DIRECT_URL: postgresUrl });

export type Env = z.infer<typeof envSchema>;

/** Sorunları "DEĞİŞKEN: mesaj" satırları olarak verir. Değerler asla yazılmaz. */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}
