import { config } from 'dotenv';
import { describeIssues, envSchema, type Env } from './env-schema.js';

config({ quiet: true });

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (result.success) return result.data;

  const lines = describeIssues(result.error).map((line) => `  - ${line}`);
  console.error(
    ['Ortam değişkenleri eksik veya hatalı (server/.env, bkz. docs/SETUP.md):', ...lines].join(
      '\n',
    ),
  );
  process.exit(1);
}

export const env = loadEnv();
