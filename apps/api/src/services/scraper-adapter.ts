import * as cheerio from 'cheerio';

export interface ScrapedBusiness {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  extractedEmails: string[];
  source: string;
}

export interface ScraperOptions {
  query: string;
  location: string;
  maxResults: number;
  extractEmails: boolean;
  googleMapsApiKey?: string;
  apifyToken?: string;
}

/**
 * Extracts emails from HTML text using RFC-compliant regex
 */
export function extractEmailsFromHtml(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];
  
  // Exclude common image extensions or spam honeypots
  const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  const excludedPrefixes = ['sentry@', 'noreply@', 'no-reply@', 'abuse@'];

  const uniqueValid = Array.from(new Set(matches.map((e) => e.toLowerCase()))).filter((email) => {
    if (invalidExtensions.some((ext) => email.endsWith(ext))) return false;
    if (excludedPrefixes.some((p) => email.startsWith(p))) return false;
    return true;
  });

  return uniqueValid;
}

/**
 * Built-in Zero-Cost Web Crawler
 * Probes the root domain, /contact, /about, and /team pages for business emails
 */
export async function crawlWebsiteForEmails(websiteUrl: string, timeoutMs = 8000): Promise<string[]> {
  try {
    let normalizedUrl = websiteUrl;
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const rootHtml = await res.text();
    const emails = new Set<string>(extractEmailsFromHtml(rootHtml));

    // Discover internal /contact or /about sub-links
    const $ = cheerio.load(rootHtml);
    const subpages: string[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (
        (href.includes('contact') || href.includes('about') || href.includes('team')) &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:')
      ) {
        try {
          const resolved = new URL(href, normalizedUrl).toString();
          if (resolved.startsWith(normalizedUrl) && !subpages.includes(resolved) && subpages.length < 2) {
            subpages.push(resolved);
          }
        } catch {
          // Ignore invalid URL
        }
      }
    });

    // Probe up to 2 subpages
    for (const subpageUrl of subpages) {
      try {
        const subRes = await fetch(subpageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        });
        if (subRes.ok) {
          const subHtml = await subRes.text();
          extractEmailsFromHtml(subHtml).forEach((email) => emails.add(email));
        }
      } catch {
        // Skip subpage timeout
      }
    }

    return Array.from(emails);
  } catch {
    return [];
  }
}

/**
 * Pluggable Scraper Execution Strategy
 */
export async function executeScrapeJob(
  provider: 'GOOGLE_MAPS' | 'APIFY' | 'CUSTOM_CRAWLER',
  options: ScraperOptions
): Promise<ScrapedBusiness[]> {
  const results: ScrapedBusiness[] = [];

  if (provider === 'GOOGLE_MAPS' && options.googleMapsApiKey) {
    // Standard Google Places TextSearch API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      `${options.query} in ${options.location}`
    )}&key=${options.googleMapsApiKey}`;

    const res = await fetch(searchUrl);
    const data = (await res.json()) as any;

    if (data.results && Array.isArray(data.results)) {
      for (const place of data.results.slice(0, options.maxResults)) {
        let website: string | undefined;
        let phone: string | undefined;

        // Fetch place details for website and formatted phone
        if (place.place_id) {
          try {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${options.googleMapsApiKey}`;
            const detailRes = await fetch(detailUrl);
            const detailData = (await detailRes.json()) as any;
            website = detailData.result?.website;
            phone = detailData.result?.formatted_phone_number;
          } catch {
            // Non-blocking detail fetch
          }
        }

        let extractedEmails: string[] = [];
        if (options.extractEmails && website) {
          extractedEmails = await crawlWebsiteForEmails(website);
        }

        results.push({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          reviewCount: place.user_ratings_total,
          website,
          phone,
          extractedEmails,
          source: 'google_maps',
        });
      }
    }
  } else if (provider === 'APIFY' && options.apifyToken) {
    // Pluggable Apify Actor Run (e.g. compass/crawler-google-places)
    const actorUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${options.apifyToken}`;
    const runRes = await fetch(actorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [`${options.query} in ${options.location}`],
        maxCrawledPlacesPerSearch: options.maxResults,
      }),
    });
    const runData = (await runRes.json()) as any;
    // Return placeholder state while Apify completes asynchronously
    results.push({
      name: `Apify Actor Run ${runData.data?.id || 'Started'}`,
      extractedEmails: [],
      source: 'apify',
    });
  }

  return results;
}
