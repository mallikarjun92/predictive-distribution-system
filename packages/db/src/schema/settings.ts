import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(), // 'SCRAPERS' | 'AI_KEYS' | 'GENERAL' | 'INFRASTRUCTURE' | 'SECURITY'
  key: text('key').notNull().unique(), // e.g. 'GOOGLE_MAPS_API_KEY', 'APIFY_TOKEN'
  value: text('value').notNull(), // Stored encrypted if isSecret = true
  isSecret: boolean('is_secret').default(false).notNull(),
  description: text('description'),
  updatedBy: text('updated_by').default('super_admin'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

