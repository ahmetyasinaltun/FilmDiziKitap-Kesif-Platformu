import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Varsayılan server/.env; canlı veritabanı için ENV_FILE=.env.production (bkz. docs/SETUP.md §5).
config({ path: process.env.ENV_FILE ?? '.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migration'lar pooler'dan değil doğrudan bağlantıdan geçmeli.
  // `env()` yerine process.env: `prisma generate` CI'da adres olmadan da çalışabilsin.
  datasource: { url: process.env.DIRECT_URL },
});
