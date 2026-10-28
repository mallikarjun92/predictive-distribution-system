import { createDispatchWorker } from './dispatcher.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`[Workers] Starting BullMQ background workers connected to ${redisUrl}...`);

const dispatchWorker = createDispatchWorker(redisUrl);

process.on('SIGTERM', async () => {
  console.log('[Workers] Shutting down workers gracefully...');
  await dispatchWorker.close();
  process.exit(0);
});
