import fs from 'fs';
import path from 'path';
import { encryptSecret, decryptSecret } from '@app/core';
import { createDbClient, systemSettings } from '@app/db';
import { eq } from 'drizzle-orm';

export interface SettingMeta {
  key: string;
  category: 'SCRAPERS' | 'AI_KEYS' | 'GENERAL' | 'INFRASTRUCTURE' | 'SECURITY';
  description: string;
  isSecret: boolean;
  defaultValue?: string;
}

export const SETTINGS_REGISTRY: SettingMeta[] = [
  // Lead Scrapers
  {
    key: 'GOOGLE_MAPS_API_KEY',
    category: 'SCRAPERS',
    description: 'Google Places API Key for local business search & place details',
    isSecret: true,
  },
  {
    key: 'APIFY_TOKEN',
    category: 'SCRAPERS',
    description: 'Apify API Token for running Google Places crawler actors',
    isSecret: true,
  },

  // AI & LLM BYOK Keys
  {
    key: 'OPENAI_API_KEY',
    category: 'AI_KEYS',
    description: 'OpenAI API key for cold email hook generation (GPT-4o / GPT-4o-mini)',
    isSecret: true,
  },
  {
    key: 'DEEPSEEK_API_KEY',
    category: 'AI_KEYS',
    description: 'DeepSeek API key for low-cost high-volume reasoning and draft hooks',
    isSecret: true,
  },
  {
    key: 'ANTHROPIC_API_KEY',
    category: 'AI_KEYS',
    description: 'Anthropic Claude API key for high-autonomy drafting',
    isSecret: true,
  },
  {
    key: 'GROQ_API_KEY',
    category: 'AI_KEYS',
    description: 'Groq Cloud API key for ultra-fast Llama-3 inference',
    isSecret: true,
  },

  // General & App Configuration
  {
    key: 'APP_DOMAIN',
    category: 'GENERAL',
    description: 'Public domain or host for application & Caddy reverse proxy',
    isSecret: false,
    defaultValue: 'localhost',
  },
  {
    key: 'ACME_EMAIL',
    category: 'GENERAL',
    description: 'Admin email for automated Let\'s Encrypt SSL certificates',
    isSecret: false,
    defaultValue: 'admin@example.com',
  },
  {
    key: 'LOG_LEVEL',
    category: 'GENERAL',
    description: 'Server logging verbosity (debug, info, warn, error)',
    isSecret: false,
    defaultValue: 'info',
  },
  {
    key: 'PORT',
    category: 'GENERAL',
    description: 'Fastify API server listening port',
    isSecret: false,
    defaultValue: '4000',
  },

  // Security Secrets
  {
    key: 'JWT_SECRET',
    category: 'SECURITY',
    description: 'Cryptographic secret for signing API and session JWT tokens',
    isSecret: true,
  },
  {
    key: 'MASTER_ENCRYPTION_KEY',
    category: 'SECURITY',
    description: '32-byte hex key for AES-256-GCM vault encryption',
    isSecret: true,
  },

  // Core Infrastructure
  {
    key: 'DATABASE_URL',
    category: 'INFRASTRUCTURE',
    description: 'PostgreSQL 16 connection URL',
    isSecret: true,
  },
  {
    key: 'REDIS_URL',
    category: 'INFRASTRUCTURE',
    description: 'Valkey / Redis connection URL for BullMQ queues',
    isSecret: true,
    defaultValue: 'redis://valkey:6379',
  },
];

// Runtime in-memory cache for ultra-fast access
const inMemoryCache = new Map<string, string>();

function getMasterKey(): string {
  return process.env.MASTER_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

function maskSecret(val: string): string {
  if (!val) return '';
  if (val.length <= 8) return '********';
  return `${val.substring(0, 4)}...****...${val.substring(val.length - 4)}`;
}

/**
 * Gets a database client if DATABASE_URL is available
 */
function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    return createDbClient(dbUrl);
  } catch {
    return null;
  }
}

/**
 * Retrieves setting value: In-Memory -> DB -> process.env -> defaultValue
 */
export async function getSetting(key: string): Promise<string | undefined> {
  if (inMemoryCache.has(key)) {
    return inMemoryCache.get(key);
  }

  const db = getDb();
  if (db) {
    try {
      const records = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
      if (records.length > 0) {
        const item = records[0];
        let val = item.value;
        if (item.isSecret) {
          try {
            val = decryptSecret(item.value, getMasterKey());
          } catch {
            val = item.value;
          }
        }
        inMemoryCache.set(key, val);
        return val;
      }
    } catch {
      // Non-blocking fallback to process.env
    }
  }

  const envVal = process.env[key];
  if (envVal) {
    inMemoryCache.set(key, envVal);
    return envVal;
  }

  const meta = SETTINGS_REGISTRY.find((s) => s.key === key);
  return meta?.defaultValue;
}

/**
 * Retrieves all registered settings for Super Admin view with masked values for secrets
 */
export async function getAllSettingsForAdmin() {
  const result: Array<{
    key: string;
    category: string;
    description: string;
    isSecret: boolean;
    isConfigured: boolean;
    value: string;
    maskedValue: string;
    updatedAt?: string;
  }> = [];

  const db = getDb();
  let dbSettingsMap = new Map<string, { value: string; isSecret: boolean; updatedAt: Date }>();

  if (db) {
    try {
      const allDb = await db.select().from(systemSettings);
      for (const row of allDb) {
        dbSettingsMap.set(row.key, {
          value: row.value,
          isSecret: row.isSecret,
          updatedAt: row.updatedAt,
        });
      }
    } catch {
      // Database not ready yet or running headless
    }
  }

  for (const meta of SETTINGS_REGISTRY) {
    let rawVal: string | undefined;
    let updatedAt: string | undefined;

    if (inMemoryCache.has(meta.key)) {
      rawVal = inMemoryCache.get(meta.key);
    } else if (dbSettingsMap.has(meta.key)) {
      const dbEntry = dbSettingsMap.get(meta.key)!;
      updatedAt = dbEntry.updatedAt.toISOString();
      if (dbEntry.isSecret) {
        try {
          rawVal = decryptSecret(dbEntry.value, getMasterKey());
        } catch {
          rawVal = dbEntry.value;
        }
      } else {
        rawVal = dbEntry.value;
      }
    } else {
      rawVal = process.env[meta.key] || meta.defaultValue;
    }

    const isConfigured = Boolean(rawVal && rawVal !== meta.defaultValue);

    result.push({
      key: meta.key,
      category: meta.category,
      description: meta.description,
      isSecret: meta.isSecret,
      isConfigured,
      value: meta.isSecret ? '' : rawVal || '',
      maskedValue: meta.isSecret ? maskSecret(rawVal || '') : rawVal || '',
      updatedAt,
    });
  }

  return result;
}

/**
 * Updates settings in Memory, Database, process.env, and syncs to .env on disk
 */
export async function updateSettings(updates: Record<string, string>, updatedBy = 'super_admin') {
  const masterKey = getMasterKey();
  const db = getDb();

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;

    const trimmed = value.trim();
    const meta = SETTINGS_REGISTRY.find((s) => s.key === key);
    const isSecret = meta ? meta.isSecret : true;
    const category = meta ? meta.category : 'GENERAL';

    // 1. Update In-Memory cache & process.env immediately
    inMemoryCache.set(key, trimmed);
    process.env[key] = trimmed;

    // 2. Persist to DB if available
    if (db) {
      try {
        const storedValue = isSecret ? encryptSecret(trimmed, masterKey) : trimmed;

        const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
        if (existing.length > 0) {
          await db
            .update(systemSettings)
            .set({
              value: storedValue,
              category,
              isSecret,
              updatedBy,
              updatedAt: new Date(),
            })
            .where(eq(systemSettings.key, key));
        } else {
          await db.insert(systemSettings).values({
            key,
            value: storedValue,
            category,
            isSecret,
            updatedBy,
          });
        }
      } catch (err) {
        console.warn(`[SettingsService] Could not persist key ${key} to DB:`, err);
      }
    }
  }

  // 3. Sync to .env file on host
  syncToEnvFile(updates);

  return { success: true, updatedCount: Object.keys(updates).length };
}

/**
 * Helper to update key-values in deploy/.env.prod or root .env
 */
function syncToEnvFile(updates: Record<string, string>) {
  const possiblePaths = [
    path.resolve(process.cwd(), 'deploy', '.env.prod'),
    path.resolve(process.cwd(), '..', 'deploy', '.env.prod'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        let content = fs.readFileSync(envPath, 'utf8');
        for (const [key, value] of Object.entries(updates)) {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(content)) {
            content = content.replace(regex, `${key}=${value}`);
          } else {
            content += `\n${key}=${value}`;
          }
        }
        fs.writeFileSync(envPath, content, 'utf8');
      } catch {
        // Silently skip if file is read-only
      }
    }
  }
}

/**
 * Probes and tests an API key live to verify credentials before saving
 */
export async function testApiKey(
  provider: 'GOOGLE_MAPS' | 'APIFY' | 'OPENAI' | 'DEEPSEEK',
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (provider === 'GOOGLE_MAPS') {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=coffee&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as any;
      if (data.status === 'REQUEST_DENIED') {
        return { success: false, message: data.error_message || 'Google Maps API request denied. Check Places API permissions.' };
      }
      return { success: true, message: 'Google Places API key is valid and operational!' };
    }

    if (provider === 'APIFY') {
      const url = `https://api.apify.com/v2/users/me?token=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.status === 401) {
        return { success: false, message: 'Invalid Apify API token.' };
      }
      const data = (await res.json()) as any;
      return { success: true, message: `Apify connected successfully! User: ${data.data?.username || 'Active'}` };
    }

    if (provider === 'OPENAI') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(6000),
      });
      if (res.status === 401) {
        return { success: false, message: 'Invalid OpenAI API key.' };
      }
      return { success: true, message: 'OpenAI API key verified and operational!' };
    }

    if (provider === 'DEEPSEEK') {
      const res = await fetch('https://api.deepseek.com/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(6000),
      });
      if (res.status === 401) {
        return { success: false, message: 'Invalid DeepSeek API key.' };
      }
      return { success: true, message: 'DeepSeek API key verified and operational!' };
    }

    return { success: false, message: 'Unknown provider.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error verifying API key' };
  }
}

