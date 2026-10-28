import { pgTable, uuid, text, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';
import { inboxes } from './inboxes.js';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  status: text('status', { enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] }).notNull().default('DRAFT'),
  autonomyTier: integer('autonomy_tier').notNull().default(0),
  minDelaySeconds: integer('min_delay_seconds').notNull().default(180),
  maxDelaySeconds: integer('max_delay_seconds').notNull().default(360),
  sendingWindow: jsonb('sending_window').default({
    days: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('campaigns_workspace_idx').on(table.workspaceId),
}));

export const sequenceSteps = pgTable('sequence_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  stepNumber: integer('step_number').notNull(),
  delayDays: integer('delay_days').notNull().default(2),
  subjectTemplate: text('subject_template').notNull(),
  bodyTemplate: text('body_template').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignStepIdx: uniqueIndex('steps_campaign_step_idx').on(table.campaignId, table.stepNumber),
}));

export const campaignInboxPools = pgTable('campaign_inbox_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  inboxId: uuid('inbox_id').references(() => inboxes.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignInboxIdx: uniqueIndex('pool_campaign_inbox_idx').on(table.campaignId, table.inboxId),
}));
