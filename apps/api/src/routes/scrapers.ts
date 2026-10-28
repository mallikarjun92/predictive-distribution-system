import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateScrapeJobSchema } from '@app/core';
import { executeScrapeJob } from '../services/scraper-adapter.js';

export async function scraperRoutes(fastify: FastifyInstance) {
  // Trigger a new lead scrape job
  fastify.post('/api/v1/scrapers/jobs', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateScrapeJobSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid scrape job request parameters',
          details: parseResult.error.flatten(),
        },
      });
    }

    const { provider, query, location, maxResults, extractEmails } = parseResult.data;

    // In background worker this runs asynchronously via BullMQ.
    // For synchronous preview or immediate small batches:
    try {
      const results = await executeScrapeJob(provider, {
        query,
        location,
        maxResults,
        extractEmails,
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        apifyToken: process.env.APIFY_TOKEN,
      });

      return reply.code(201).send({
        success: true,
        data: {
          jobId: 'mock-scrape-job-uuid',
          totalFound: results.length,
          leadsWithEmails: results.filter((r) => r.extractedEmails.length > 0).length,
          results,
        },
      });
    } catch (err: any) {
      fastify.log.error(err, 'Failed to execute scrape job');
      return reply.code(500).send({
        success: false,
        error: { code: 'SCRAPER_ERROR', message: err.message || 'Scraper execution failed' },
      });
    }
  });
}
