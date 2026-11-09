import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Giriş testleri bcrypt'i onlarca kez çalıştırır ve bcrypt bilerek yavaştır: dizüstü pildeyken
    // işlem başına ~1 sn. Bu sınır hız ölçmek için değil, takılan testi yakalamak için var.
    testTimeout: 30_000,
    // Testler gerçek .env'ye ve dış servislere bağlı olmasın: sahte ama geçerli değerler.
    // dotenv mevcut değişkenlerin üzerine yazmadığı için bunlar .env'deki değerlerden önce gelir.
    // Veritabanı testlerinde DATABASE_URL, dosyaya özel test veritabanını gösterir (src/test/database.ts).
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
      TMDB_API_TOKEN: 'test',
      OMDB_API_KEY: 'test',
      GOOGLE_BOOKS_API_KEY: 'test',
      APP_USER_AGENT: 'FilmDiziKitap/test (test@example.com)',
    },
    projects: [
      {
        extends: true,
        test: {
          // Veritabanı ve Docker gerektirmeyen testler
          name: 'unit',
          exclude: [...configDefaults.exclude, 'src/**/*.db.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // Docker'daki gerçek PostgreSQL ile çalışan testler
          name: 'db',
          include: ['src/**/*.db.test.ts'],
          globalSetup: ['src/test/postgres-container.ts'],
          setupFiles: ['src/test/database.ts'],
        },
      },
    ],
  },
});
