import { z } from 'zod';

// Autonomy Tiers
export const AutonomyTierSchema = z.union([
  z.literal(0), // Deterministic + Spintax
  z.literal(1), // Copilot / Human-in-the-loop
  z.literal(2), // Guardrailed Autonomous
]);
export type AutonomyTier = z.infer<typeof AutonomyTierSchema>;

// Lead Scrape Providers
export const ScrapeProviderSchema = z.enum([
  'GOOGLE_MAPS',
  'APIFY',
  'CUSTOM_CRAWLER',
]);
export type ScrapeProvider = z.infer<typeof ScrapeProviderSchema>;

// Lead Validation Schema
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
export type Lead = z.infer<typeof LeadSchema>;

// Scrape Job Trigger Schema
export const CreateScrapeJobSchema = z.object({
  provider: ScrapeProviderSchema,
  query: z.string().min(2),
  location: z.string().min(2),
  maxResults: z.number().int().min(1).max(500).default(50),
  extractEmails: z.boolean().default(true),
  targetCampaignId: z.string().uuid().optional(),
});
export type CreateScrapeJobInput = z.infer<typeof CreateScrapeJobSchema>;

// Inbox Creation Schema
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
export type CreateInboxInput = z.infer<typeof CreateInboxSchema>;

// Campaign Creation Schema
export const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  autonomyTier: AutonomyTierSchema.default(0),
  minDelaySeconds: z.number().int().min(30).default(180),
  maxDelaySeconds: z.number().int().min(60).default(360),
  sendingWindow: z.object({
    days: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('17:00'),
    timezone: z.string().default('UTC'),
  }).default({}),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

// Setting Category
export const SettingCategorySchema = z.enum([
  'SCRAPERS',
  'AI_KEYS',
  'GENERAL',
  'INFRASTRUCTURE',
  'SECURITY',
]);
export type SettingCategory = z.infer<typeof SettingCategorySchema>;

// System Setting Item Schema
export const SystemSettingItemSchema = z.object({
  key: z.string(),
  value: z.string(),
  category: SettingCategorySchema,
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
  isConfigured: z.boolean().optional(),
});
export type SystemSettingItem = z.infer<typeof SystemSettingItemSchema>;

// Update Settings Input Schema
export const UpdateSettingsInputSchema = z.object({
  settings: z.record(z.string(), z.string()),
});
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;

// Test Key Input Schema
export const TestApiKeyInputSchema = z.object({
  provider: z.enum(['GOOGLE_MAPS', 'APIFY', 'OPENAI', 'DEEPSEEK']),
  apiKey: z.string().min(1),
});
export type TestApiKeyInput = z.infer<typeof TestApiKeyInputSchema>;
