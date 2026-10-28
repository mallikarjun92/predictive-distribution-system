import { pgTable, uuid, text, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { campaigns } from './campaigns.js';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  company: text('company'),
  website: text('website'),
  phone: text('phone'),
  source: text('source').default('manual'),
  customAttributes: jsonb('custom_attributes').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceEmailIdx: uniqueIndex('leads_workspace_email_idx').on(table.workspaceId, table.email),
  workspaceIdx: index('leads_workspace_idx').on(table.workspaceId),
}));

export const leadCampaigns = pgTable('lead_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', {
    enum: ['UNCONTACTED', 'IN_PROGRESS', 'REPLIED', 'BOUNCED', 'UNSUBSCRIBED', 'COMPLETED']
  }).notNull().default('UNCONTACTED'),
  currentStep: integer('current_step').notNull().default(0),
  nextScheduledAt: timestamp('next_scheduled_at', { withTimezone: true }),
  personalizedHook: text('personalized_hook'),
  reviewStatus: text('review_status', { enum: ['NONE', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] }).default('NONE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignLeadIdx: uniqueIndex('lead_campaign_unique_idx').on(table.campaignId, table.leadId),
  scheduledIdx: index('lead_campaign_scheduled_idx').on(table.status, table.nextScheduledAt),
}));
