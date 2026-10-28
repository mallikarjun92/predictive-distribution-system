import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UpdateSettingsInputSchema, TestApiKeyInputSchema } from '@app/core';
import { getAllSettingsForAdmin, updateSettings, testApiKey } from '../services/settings-service.js';

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET: Fetch all categorized settings for Super Admin
  fastify.get('/api/v1/admin/settings', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await getAllSettingsForAdmin();
      return reply.send({
        success: true,
        data: {
          settings,
          total: settings.length,
        },
      });
    } catch (err: any) {
      fastify.log.error(err, 'Failed to fetch settings');
      return reply.code(500).send({
        success: false,
        error: { code: 'SETTINGS_FETCH_ERROR', message: err.message || 'Failed to fetch settings' },
      });
    }
  });

  // PUT: Update settings dynamically in memory, DB & .env
  fastify.put('/api/v1/admin/settings', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateSettingsInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid settings payload',
          details: parseResult.error.flatten(),
        },
      });
    }

    try {
      const result = await updateSettings(parseResult.data.settings, 'super_admin');
      return reply.send({
        success: true,
        data: result,
        message: 'Settings updated and synced successfully',
      });
    } catch (err: any) {
      fastify.log.error(err, 'Failed to update settings');
      return reply.code(500).send({
        success: false,
        error: { code: 'SETTINGS_UPDATE_ERROR', message: err.message || 'Failed to update settings' },
      });
    }
  });

  // POST: Live test verification for API keys
  fastify.post('/api/v1/admin/settings/test-key', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = TestApiKeyInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid test-key payload',
          details: parseResult.error.flatten(),
        },
      });
    }

    const { provider, apiKey } = parseResult.data;
    const testResult = await testApiKey(provider, apiKey);

    return reply.send({
      success: testResult.success,
      message: testResult.message,
    });
  });
}

