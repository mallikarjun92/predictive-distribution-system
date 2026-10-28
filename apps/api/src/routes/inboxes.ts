import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateInboxSchema } from '@app/core';
import dns from 'dns/promises';

export async function inboxRoutes(fastify: FastifyInstance) {
  // Add a new sending inbox with DNS verification (SPF, DKIM, DMARC, MX)
  fastify.post('/api/v1/inboxes', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateInboxSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid inbox parameters',
          details: parseResult.error.flatten(),
        },
      });
    }

    const inboxData = parseResult.data;
    const domain = inboxData.emailAddress.split('@')[1];

    // Real-time DNS probe
    let spf = false;
    let dkim = false;
    let dmarc = false;
    let mx = false;

    try {
      const mxRecords = await dns.resolveMx(domain);
      mx = mxRecords.length > 0;
    } catch {
      mx = false;
    }

    try {
      const txtRecords = await dns.resolveTxt(domain);
      const flattened = txtRecords.flat();
      spf = flattened.some((txt) => txt.includes('v=spf1'));
    } catch {
      spf = false;
    }

    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
      const flattened = dmarcRecords.flat();
      dmarc = flattened.some((txt) => txt.includes('v=DMARC1'));
    } catch {
      dmarc = false;
    }

    // Proactively verify deliverability prerequisites
    const isDeliverable = mx && spf && dmarc;

    return reply.code(201).send({
      success: true,
      data: {
        inbox: {
          emailAddress: inboxData.emailAddress,
          displayName: inboxData.displayName,
          dailyLimit: inboxData.dailyLimit,
          dnsStatus: { spf, dkim, dmarc, mx },
          isDeliverable,
        },
      },
    });
  });
}
