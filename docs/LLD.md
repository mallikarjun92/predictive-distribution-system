# Low-Level Design (LLD) Document
## Project: Predictive Distribution System

### 1. Domain Entities & Zod Boundary Schemas

All network inputs, queue payloads, and database boundaries are validated using Zod schemas located in `@app/core`.

```typescript
import { z } from 'zod';

// Autonomy Tiers
export const AutonomyTierSchema = z.union([
  z.literal(0), // Deterministic + Spintax
  z.literal(1), // Copilot / Human-in-the-loop
  z.literal(2), // Guardrailed Autonomous
]);

// Scrape Providers
export const ScrapeProviderSchema = z.enum([
  'GOOGLE_MAPS',
  'APIFY',
  'CUSTOM_CRAWLER',
]);

// Lead Schema
export const LeadSchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  source: z.string().default('manual'),
  customAttributes: z.record(z.unknown()).default({}),
});

// Scrape Job Trigger Schema
export const CreateScrapeJobSchema = z.object({
  provider: ScrapeProviderSchema,
  query: z.string().min(2),
  location: z.string().min(2),
  maxResults: z.number().int().min(1).max(500).default(50),
  extractEmails: z.boolean().default(true),
  targetCampaignId: z.string().uuid().optional(),
});

// Inbox Creation & SMTP Validation Schema
export const CreateInboxSchema = z.object({
  displayName: z.string().min(1),
  emailAddress: z.string().email(),
  smtpHost: z.string().min(1),
  smtpPort: z.number().int().default(587),
  smtpUser: z.string().min(1),
  smtpPass: z.string().min(1),
  imapHost: z.string().min(1),
  imapPort: z.number().int().default(993),
  dailyLimit: z.number().int().min(5).max(100).default(40),
});
```

---

### 2. Drizzle ORM Schema Definitions (`@app/db`)

```typescript
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Workspaces (Tenant Boundary)
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  byokKeysEncrypted: jsonb('byok_keys_encrypted').default({}),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Inboxes (Sending Accounts)
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

// Campaigns
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  status: text('status', { enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] }).notNull().default('DRAFT'),
  autonomyTier: integer('autonomy_tier').notNull().default(0),
  minDelaySeconds: integer('min_delay_seconds').notNull().default(180),
  maxDelaySeconds: integer('max_delay_seconds').notNull().default(360),
  sendingWindow: jsonb('sending_window').default({
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC'
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('campaigns_workspace_idx').on(table.workspaceId),
}));

// Sequence Steps
export const sequenceSteps = pgTable('sequence_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  stepNumber: integer('step_number').notNull(),
  delayDays: integer('delay_days').notNull().default(2),
  subjectTemplate: text('subject_template').notNull(),
  bodyTemplate: text('body_template').notNull(),
}, (table) => ({
  campaignStepIdx: uniqueIndex('steps_campaign_step_idx').on(table.campaignId, table.stepNumber),
}));

// Leads
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
}));

// Scrape Jobs
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('scrape_jobs_workspace_idx').on(table.workspaceId),
}));
```

---

### 3. Asynchronous Queue Contracts (BullMQ)

Queue names and job data payloads are strictly typed:

```typescript
export enum QueueName {
  DISPATCH_EMAIL = 'dispatch-email-queue',
  SCRAPE_LEADS = 'scrape-leads-queue',
  IMAP_SYNC = 'imap-sync-queue',
  AI_PERSONALIZE = 'ai-personalize-queue',
}

export interface DispatchEmailJobPayload {
  workspaceId: string;
  campaignId: string;
  leadCampaignId: string;
  inboxId: string;
  stepNumber: number;
}

export interface ScrapeLeadsJobPayload {
  workspaceId: string;
  scrapeJobId: string;
  provider: 'GOOGLE_MAPS' | 'APIFY' | 'CUSTOM_CRAWLER';
  query: string;
  location: string;
  maxResults: number;
  extractEmails: boolean;
  targetCampaignId?: string;
}

export interface AIPersonalizeJobPayload {
  workspaceId: string;
  leadId: string;
  campaignId: string;
  provider: 'deepseek' | 'openai' | 'anthropic' | 'groq';
  context: {
    company: string;
    website?: string;
    scrapedReviews?: number;
    scrapedRating?: number;
  };
}
```

---

### 4. Core Algorithms

#### 4.1 Recursive Spintax Parser
```typescript
export function parseSpintax(text: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;
  let result = text;
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (_, choices) => {
      const options = choices.split('|');
      const chosen = options[Math.floor(Math.random() * options.length)];
      return chosen.trim();
    });
  }
  return result;
}
```

#### 4.2 Jitter Delay & Active Window Calculation
```typescript
export function calculateJitterDelayMs(minSec: number, maxSec: number): number {
  const randomizedSec = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
  return randomizedSec * 1000;
}

export function isWithinSendingWindow(
  now: Date,
  window: { days: number[]; startTime: string; endTime: string; timezone: string }
): boolean {
  // Convert current time to target timezone and verify weekday & hour bounds
  const currentDay = now.getUTCDay(); // Normalized
  if (!window.days.includes(currentDay)) return false;
  
  const currentHourMinute = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  return currentHourMinute >= window.startTime && currentHourMinute <= window.endTime;
}
```

#### 4.3 AES-256-GCM Vault Encryption
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export function encryptSecret(plaintext: string, masterKeyHex: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(masterKeyHex, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(ciphertext: string, masterKeyHex: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = Buffer.from(masterKeyHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```
