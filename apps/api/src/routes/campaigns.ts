import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateCampaignSchema } from '@app/core';

export async function campaignRoutes(fastify: FastifyInstance) {
  // Create a new campaign with autonomy configuration
  fastify.post('/api/v1/campaigns', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateCampaignSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid campaign configuration',
          details: parseResult.error.flatten(),
        },
      });
    }

    const campaign = parseResult.data;

    return reply.code(201).send({
      success: true,
      data: {
        campaign: {
          id: 'mock-campaign-uuid',
          name: campaign.name,
          autonomyTier: campaign.autonomyTier,
          status: 'DRAFT',
          minDelaySeconds: campaign.minDelaySeconds,
          maxDelaySeconds: campaign.maxDelaySeconds,
          sendingWindow: campaign.sendingWindow,
        },
      },
    });
  });
}
