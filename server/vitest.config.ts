import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Testler gerçek .env'ye ve dış servislere bağlı olmasın: sahte ama geçerli değerler.
    // dotenv mevcut değişkenlerin üzerine yazmadığı için bunlar .env'deki değerlerden önce gelir.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
      TMDB_API_TOKEN: 'test',
      OMDB_API_KEY: 'test',
      GOOGLE_BOOKS_API_KEY: 'test',
      OPEN_LIBRARY_USER_AGENT: 'SosyalKutuphane/test (test@example.com)',
    },
  },
});
