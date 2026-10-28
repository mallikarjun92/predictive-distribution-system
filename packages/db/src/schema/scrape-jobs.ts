import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';

export const scrapeJobs = pgTable('scrape_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider', { enum: ['GOOGLE_MAPS', 'APIFY', 'CUSTOM_CRAWLER'] }).notNull(),
  query: text('query').notNull(),
  location: text('location').notNull(),
  status: text('status', { enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'] }).notNull().default('QUEUED'),
  totalFound: integer('total_found').notNull().default(0),
  emailsExtracted: integer('emails_extracted').notNull().default(0),
  config: jsonb('config').default({}),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('scrape_jobs_workspace_idx').on(table.workspaceId),
}));
