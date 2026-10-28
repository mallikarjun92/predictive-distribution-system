import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { trackingRoutes } from './routes/tracking.js';
import { scraperRoutes } from './routes/scrapers.js';
import { inboxRoutes } from './routes/inboxes.js';
import { campaignRoutes } from './routes/campaigns.js';
import { settingsRoutes } from './routes/settings.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await fastify.register(cors, {
    origin: true,
  });

  // Register feature routes
  await fastify.register(healthRoutes);
  await fastify.register(trackingRoutes);
  await fastify.register(scraperRoutes);
  await fastify.register(inboxRoutes);
  await fastify.register(campaignRoutes);
  await fastify.register(settingsRoutes);

  return fastify;
}

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    app.log.info(`API Server running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only start directly if run as main
if (process.env.NODE_ENV !== 'test') {
  start();
}
