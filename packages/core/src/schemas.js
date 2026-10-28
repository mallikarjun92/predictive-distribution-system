"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCampaignSchema = exports.CreateInboxSchema = exports.CreateScrapeJobSchema = exports.LeadSchema = exports.ScrapeProviderSchema = exports.AutonomyTierSchema = void 0;
const zod_1 = require("zod");
// Autonomy Tiers
exports.AutonomyTierSchema = zod_1.z.union([
    zod_1.z.literal(0), // Deterministic + Spintax
    zod_1.z.literal(1), // Copilot / Human-in-the-loop
    zod_1.z.literal(2), // Guardrailed Autonomous
]);
// Lead Scrape Providers
exports.ScrapeProviderSchema = zod_1.z.enum([
    'GOOGLE_MAPS',
    'APIFY',
    'CUSTOM_CRAWLER',
]);
// Lead Validation Schema
exports.LeadSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    workspaceId: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().nullable().optional(),
    lastName: zod_1.z.string().nullable().optional(),
    company: zod_1.z.string().nullable().optional(),
    website: zod_1.z.string().url().nullable().optional(),
    phone: zod_1.z.string().nullable().optional(),
    source: zod_1.z.string().default('manual'),
    customAttributes: zod_1.z.record(zod_1.z.unknown()).default({}),
});
// Scrape Job Trigger Schema
exports.CreateScrapeJobSchema = zod_1.z.object({
    provider: exports.ScrapeProviderSchema,
    query: zod_1.z.string().min(2),
    location: zod_1.z.string().min(2),
    maxResults: zod_1.z.number().int().min(1).max(500).default(50),
    extractEmails: zod_1.z.boolean().default(true),
    targetCampaignId: zod_1.z.string().uuid().optional(),
});
// Inbox Creation Schema
exports.CreateInboxSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1),
    emailAddress: zod_1.z.string().email(),
    smtpHost: zod_1.z.string().min(1),
    smtpPort: zod_1.z.number().int().default(587),
    smtpUser: zod_1.z.string().min(1),
    smtpPass: zod_1.z.string().min(1),
    imapHost: zod_1.z.string().min(1),
    imapPort: zod_1.z.number().int().default(993),
    dailyLimit: zod_1.z.number().int().min(5).max(100).default(40),
});
// Campaign Creation Schema
exports.CreateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    autonomyTier: exports.AutonomyTierSchema.default(0),
    minDelaySeconds: zod_1.z.number().int().min(30).default(180),
    maxDelaySeconds: zod_1.z.number().int().min(60).default(360),
    sendingWindow: zod_1.z.object({
        days: zod_1.z.array(zod_1.z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
        startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
        endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('17:00'),
        timezone: zod_1.z.string().default('UTC'),
    }).default({}),
});
//# sourceMappingURL=schemas.js.map