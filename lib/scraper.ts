import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export interface DiaryEntry {
  title: string;
  year: string;
  rating: number | null;
  date: string; // YYYY-MM-DD
  rewatch: boolean;
  slug: string;
  posterUrl: string | null;
}

// ---------------------------------------------------------------------------
// RSS XML helpers — based on zoetrope69/letterboxd approach
// Letterboxd's RSS feed is public, server-rendered, and not Cloudflare-protected.
// It includes: filmTitle, filmYear, memberRating, watchedDate, rewatch, poster image.
// ---------------------------------------------------------------------------

function getWatchedDate($el: cheerio.Cheerio<Element>): string {
  // Letterboxd RSS gives watchedDate as "2024-03-17" already in YYYY-MM-DD
  return $el.find('letterboxd\\:watchedDate').text().trim();
}

function getFilmTitle($el: cheerio.Cheerio<Element>): string {
  return $el.find('letterboxd\\:filmTitle').text().trim();
}

function getFilmYear($el: cheerio.Cheerio<Element>): string {
  return $el.find('letterboxd\\:filmYear').text().trim();
}

function getMemberRating($el: cheerio.Cheerio<Element>): number | null {
  const raw = $el.find('letterboxd\\:memberRating').text().trim();
  if (!raw) return null;
  const n = parseFloat(raw);
  return isNaN(n) || n < 0 ? null : n;
}

function getIsRewatch($el: cheerio.Cheerio<Element>): boolean {
  return $el.find('letterboxd\\:rewatch').text().trim() === 'Yes';
}

function getSlug($el: cheerio.Cheerio<Element>): string {
  // link format: https://letterboxd.com/username/film/dune-part-two/1/
  const link = $el.find('link').text().trim()
    || $el.find('guid').text().trim();
  const match = link.match(/\/film\/([^/]+)/);
  return match ? match[1] : '';
}

function getPosterUrl($el: cheerio.Cheerio<Element>): string | null {
  // Poster is embedded as an <img> inside the <description> CDATA block
  const description = $el.find('description').text();
  const $d = cheerio.load(description);
  const src = $d('p img').attr('src');
  if (!src) return null;
  // Letterboxd image URLs have a size crop segment — upgrade to medium
  return src.replace(/-0-.*?-crop/, '-0-150-0-225-crop');
}

function isListItem($el: cheerio.Cheerio<Element>): boolean {
  const link = $el.find('link').text().trim();
  const guid = $el.find('guid').text().trim();
  return link.includes('/list/') || guid.includes('/list/');
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

const RSS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: RSS_HEADERS, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchRSS(username: string): Promise<string> {
  const url = `https://letterboxd.com/${username}/rss/`;
  let res: Response;

  try {
    res = await fetchWithTimeout(url, 10000);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Network error fetching Letterboxd RSS: ${msg}`);
  }

  if (res.status === 404) {
    throw new Error(
      `Letterboxd user "${username}" not found, or their diary is private.`
    );
  }
  if (!res.ok) {
    throw new Error(`Letterboxd returned HTTP ${res.status}. Try again shortly.`);
  }

  const text = await res.text();
  if (!text.includes('<rss') && !text.includes('<?xml')) {
    throw new Error('Unexpected response from Letterboxd. The account may be private.');
  }
  return text;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseRSS(xml: string): DiaryEntry[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const entries: DiaryEntry[] = [];

  $('item').each((_, el) => {
    const $el = $(el);
    if (isListItem($el)) return; // skip list entries

    const title = getFilmTitle($el);
    if (!title) return; // skip malformed items

    entries.push({
      title,
      year: getFilmYear($el),
      rating: getMemberRating($el),
      date: getWatchedDate($el),
      rewatch: getIsRewatch($el),
      slug: getSlug($el),
      posterUrl: getPosterUrl($el),
    });
  });

  return entries;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a user's Letterboxd diary via their public RSS feed.
 *
 * NOTE: Letterboxd RSS returns the ~50 most recent diary entries only.
 * There is no RSS pagination. For heavy users this means some months
 * may be missing, but it covers the vast majority of use cases and
 * avoids all scraping/proxy issues entirely.
 */
export async function scrapeDiaryLast12Months(username: string): Promise<DiaryEntry[]> {
  const xml = await fetchRSS(username);
  const all = parseRSS(xml);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return all.filter(e => !e.date || e.date >= cutoffStr);
}
