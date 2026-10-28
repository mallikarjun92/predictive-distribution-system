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
