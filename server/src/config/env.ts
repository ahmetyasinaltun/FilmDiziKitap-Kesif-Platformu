import { config } from 'dotenv';
import { describeIssues, envSchema, type Env } from './env-schema.js';

// Varsayılan server/.env; canlı veritabanı için ENV_FILE=.env.production (bkz. docs/SETUP.md §5).
config({ path: process.env.ENV_FILE ?? '.env', quiet: true });

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (result.success) return result.data;

  const lines = describeIssues(result.error).map((line) => `  - ${line}`);
  console.error(
    [
      `Ortam değişkenleri eksik veya hatalı (server/${process.env.ENV_FILE ?? '.env'}, bkz. docs/SETUP.md):`,
      ...lines,
    ].join('\n'),
  );
  process.exit(1);
}

export const env = loadEnv();
