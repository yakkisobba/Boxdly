import { NextRequest, NextResponse } from 'next/server';
import { scrapeDiaryLast12Months } from '@/lib/scraper';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function fetchGenresForSlug(slug: string): Promise<string[]> {
  if (!slug) return [];
  try {
    const res = await fetch(`https://letterboxd.com/film/${slug}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const genres: string[] = [];
    $('a[href^="/films/genre/"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) genres.push(text);
    });
    return Array.from(new Set(genres));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }

  try {
    const entries = await scrapeDiaryLast12Months(username);

    const uniqueSlugs = Array.from(new Set(entries.map(e => e.slug).filter(Boolean))).slice(0, 20);
    const genreResults = await Promise.all(uniqueSlugs.map(fetchGenresForSlug));

    const genreFreq = new Map<string, number>();
    for (const genres of genreResults) {
      for (const g of genres) {
        genreFreq.set(g, (genreFreq.get(g) ?? 0) + 1);
      }
    }

    const topGenre = Array.from(genreFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return NextResponse.json({ entries, username, topGenre });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}