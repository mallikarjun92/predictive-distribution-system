import { z } from 'zod';
export declare const AutonomyTierSchema: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>, z.ZodLiteral<2>]>;
export type AutonomyTier = z.infer<typeof AutonomyTierSchema>;
export declare const ScrapeProviderSchema: z.ZodEnum<["GOOGLE_MAPS", "APIFY", "CUSTOM_CRAWLER"]>;
export type ScrapeProvider = z.infer<typeof ScrapeProviderSchema>;
export declare const LeadSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    workspaceId: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    company: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    website: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source: z.ZodDefault<z.ZodString>;
    customAttributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    email: string;
    source: string;
    customAttributes: Record<string, unknown>;
    id?: string | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    company?: string | null | undefined;
    website?: string | null | undefined;
    phone?: string | null | undefined;
}, {
    workspaceId: string;
    email: string;
    id?: string | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    company?: string | null | undefined;
    website?: string | null | undefined;
    phone?: string | null | undefined;
    source?: string | undefined;
    customAttributes?: Record<string, unknown> | undefined;
}>;
export type Lead = z.infer<typeof LeadSchema>;
export declare const CreateScrapeJobSchema: z.ZodObject<{
    provider: z.ZodEnum<["GOOGLE_MAPS", "APIFY", "CUSTOM_CRAWLER"]>;
    query: z.ZodString;
    location: z.ZodString;
    maxResults: z.ZodDefault<z.ZodNumber>;
    extractEmails: z.ZodDefault<z.ZodBoolean>;
    targetCampaignId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    location: string;
    provider: "GOOGLE_MAPS" | "APIFY" | "CUSTOM_CRAWLER";
    maxResults: number;
    extractEmails: boolean;
    targetCampaignId?: string | undefined;
}, {
    query: string;
    location: string;
    provider: "GOOGLE_MAPS" | "APIFY" | "CUSTOM_CRAWLER";
    maxResults?: number | undefined;
    extractEmails?: boolean | undefined;
    targetCampaignId?: string | undefined;
}>;
export type CreateScrapeJobInput = z.infer<typeof CreateScrapeJobSchema>;
export declare const CreateInboxSchema: z.ZodObject<{
    displayName: z.ZodString;
    emailAddress: z.ZodString;
    smtpHost: z.ZodString;
    smtpPort: z.ZodDefault<z.ZodNumber>;
    smtpUser: z.ZodString;
    smtpPass: z.ZodString;
    imapHost: z.ZodString;
    imapPort: z.ZodDefault<z.ZodNumber>;
    dailyLimit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    emailAddress: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    imapHost: string;
    imapPort: number;
    dailyLimit: number;
}, {
    displayName: string;
    emailAddress: string;
    smtpHost: string;
    smtpUser: string;
    smtpPass: string;
    imapHost: string;
    smtpPort?: number | undefined;
    imapPort?: number | undefined;
    dailyLimit?: number | undefined;
}>;
export type CreateInboxInput = z.infer<typeof CreateInboxSchema>;
export declare const CreateCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    autonomyTier: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>, z.ZodLiteral<2>]>>;
    minDelaySeconds: z.ZodDefault<z.ZodNumber>;
    maxDelaySeconds: z.ZodDefault<z.ZodNumber>;
    sendingWindow: z.ZodDefault<z.ZodObject<{
        days: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
        startTime: z.ZodDefault<z.ZodString>;
        endTime: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        days: number[];
        startTime: string;
        endTime: string;
        timezone: string;
    }, {
        days?: number[] | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        timezone?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    autonomyTier: 0 | 1 | 2;
    minDelaySeconds: number;
    maxDelaySeconds: number;
    sendingWindow: {
        days: number[];
        startTime: string;
        endTime: string;
        timezone: string;
    };
}, {
    name: string;
    autonomyTier?: 0 | 1 | 2 | undefined;
    minDelaySeconds?: number | undefined;
    maxDelaySeconds?: number | undefined;
    sendingWindow?: {
        days?: number[] | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
}>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
//# sourceMappingURL=schemas.d.ts.map