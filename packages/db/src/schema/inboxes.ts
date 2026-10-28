import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.js';

export const inboxes = pgTable('inboxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  emailAddress: text('email_address').notNull(),
  displayName: text('display_name').notNull(),
  smtpHost: text('smtp_host').notNull(),
  smtpPort: integer('smtp_port').notNull().default(587),
  smtpUser: text('smtp_user').notNull(),
  smtpPassEncrypted: text('smtp_pass_encrypted').notNull(),
  imapHost: text('imap_host').notNull(),
  imapPort: integer('imap_port').notNull().default(993),
  dailyLimit: integer('daily_limit').notNull().default(40),
  sentToday: integer('sent_today').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  warmupEnabled: boolean('warmup_enabled').notNull().default(false),
  dnsStatus: jsonb('dns_status').default({ spf: false, dkim: false, dmarc: false, mx: false }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('inboxes_workspace_idx').on(table.workspaceId),
  emailUnique: uniqueIndex('inboxes_workspace_email_idx').on(table.workspaceId, table.emailAddress),
}));
