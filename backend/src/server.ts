import cron from 'node-cron';
import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { expireRequests } from './jobs/expireRequests.js';
import { logger } from './utils/logger.js';

async function start(): Promise<void> {
  await connectDatabase();
  await expireRequests();
  cron.schedule('*/10 * * * *', () => { void expireRequests(); });
  app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'BloodFinder API listening'));
}
void start().catch((error) => { logger.fatal({ err: error }, 'API failed to start'); process.exit(1); });
