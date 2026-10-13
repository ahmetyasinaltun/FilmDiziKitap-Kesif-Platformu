import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const app = createApp();

app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'Sunucu başlatılamadı');
    process.exit(1);
  }
  logger.info(`API hazır: http://localhost:${env.PORT}/api/health`);
});
