import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { leadCampaigns } from './leads.js';
import { inboxes } from './inboxes.js';

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadCampaignId: uuid('lead_campaign_id').references(() => leadCampaigns.id, { onDelete: 'cascade' }).notNull(),
  inboxId: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'set null' }),
  messageId: text('message_id').unique(),
  status: text('status', {
    enum: ['QUEUED', 'SENT', 'OPENED', 'CLICKED', 'BOUNCED', 'REPLIED', 'FAILED']
  }).notNull().default('QUEUED'),
  subjectSent: text('subject_sent'),
  bodySent: text('body_sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  messageIdIdx: index('email_logs_message_id_idx').on(table.messageId),
  leadCampaignIdx: index('email_logs_lead_campaign_idx').on(table.leadCampaignId),
}));
