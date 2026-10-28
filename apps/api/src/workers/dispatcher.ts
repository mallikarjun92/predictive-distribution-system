import { Worker, Job } from 'bullmq';
import { QueueName, DispatchEmailJobPayload } from '@app/core';

export function createDispatchWorker(redisUrl: string) {
  const worker = new Worker<DispatchEmailJobPayload>(
    QueueName.DISPATCH_EMAIL,
    async (job: Job<DispatchEmailJobPayload>) => {
      const { campaignId, leadCampaignId, inboxId, stepNumber } = job.data;
      console.log(
        `[Dispatcher] Processing email job ${job.id} for lead ${leadCampaignId} via inbox ${inboxId} (step ${stepNumber}) in campaign ${campaignId}`
      );

      // In production:
      // 1. Fetch encrypted SMTP credentials from DB
      // 2. Decrypt via decryptSecret(smtpPassEncrypted, MASTER_ENCRYPTION_KEY)
      // 3. Resolve Spintax & interpolate tags
      // 4. Send email via Nodemailer transport
      // 5. Update lead_campaigns status and log to email_logs

      return { success: true, messageId: `<mock-${Date.now()}@pds.internal>` };
    },
    {
      connection: { url: redisUrl },
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Dispatcher] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Dispatcher] Job ${job?.id} failed:`, err);
  });

  return worker;
}
