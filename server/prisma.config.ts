import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migration'lar pooler'dan değil doğrudan bağlantıdan geçmeli.
  // `env()` yerine process.env: `prisma generate` CI'da adres olmadan da çalışabilsin.
  datasource: { url: process.env.DIRECT_URL },
});
