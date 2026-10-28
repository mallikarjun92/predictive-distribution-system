import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// 1x1 transparent GIF buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function trackingRoutes(fastify: FastifyInstance) {
  // Caddy on-demand SSL verification hook for custom tracking domains
  // When Caddy gets a TLS request for a custom domain, it checks with this endpoint
  fastify.get('/api/v1/domains/verify-ctd', async (req: FastifyRequest, reply: FastifyReply) => {
    const domain = (req.query as any)?.domain;
    if (!domain) {
      return reply.code(400).send('Domain query parameter required');
    }
    // Allow custom subdomains (or verify against DB in production)
    return reply.code(200).send('OK');
  });

  // Open Tracking Pixel: /t/o/:emailLogId
  fastify.get('/t/o/:emailLogId', async (req: FastifyRequest<{ Params: { emailLogId: string } }>, reply: FastifyReply) => {
    const { emailLogId } = req.params;
    
    // In production: async update emailLogs SET opened_at = NOW(), status = 'OPENED'
    fastify.log.info({ emailLogId, event: 'EMAIL_OPENED' }, 'Tracking open recorded');

    return reply
      .header('Content-Type', 'image/gif')
      .header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      .send(TRANSPARENT_GIF_BUFFER);
  });

  // Link Click Redirect: /t/c/:emailLogId?url=https://example.com
  fastify.get(
    '/t/c/:emailLogId',
    async (
      req: FastifyRequest<{ Params: { emailLogId: string }; Querystring: { url: string } }>,
      reply: FastifyReply
    ) => {
      const { emailLogId } = req.params;
      const destinationUrl = req.query.url;

      fastify.log.info({ emailLogId, destinationUrl, event: 'LINK_CLICKED' }, 'Tracking click recorded');

      if (!destinationUrl) {
        return reply.code(400).send('Destination URL missing');
      }

      return reply.redirect(destinationUrl, 302);
    }
  );
}
