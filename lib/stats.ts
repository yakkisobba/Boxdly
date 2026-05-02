import type { DiaryEntry } from './scraper';

export type TimeWindow = '1m' | '3m' | '6m' | '12m';

export type TimeRange =
  | { type: 'rolling'; days: number }        // e.g. last 30 days
  | { type: 'month'; year: number; month: number }; // calendar month

export interface MonthStats {
  year: number;
  month: number; // 0-indexed
  label: string;
  top4: DiaryEntry[];
  totalWatched: number;
  avgRating: number | null;
}

export interface WindowStats {
  window: TimeWindow;
  label: string;
  topFilm: DiaryEntry | null;
  totalWatched: number;
  avgRating: number | null;
  ratedCount: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getWindowCutoff(window: TimeWindow): string {
  const d = new Date();
  switch (window) {
    case '1m': d.setMonth(d.getMonth() - 1); break;
    case '3m': d.setMonth(d.getMonth() - 3); break;
    case '6m': d.setMonth(d.getMonth() - 6); break;
    case '12m': d.setFullYear(d.getFullYear() - 1); break;
  }
  return d.toISOString().split('T')[0];
}

export function getCutoff(range: TimeRange): string {
  const d = new Date();

  if (range.type === 'rolling') {
    d.setDate(d.getDate() - range.days);
  } else {
    d.setFullYear(range.year);
    d.setMonth(range.month);
    d.setDate(1);
  }

  return d.toISOString().split('T')[0];
}

export function filterEntries(entries: DiaryEntry[], range: TimeRange) {
  const cutoff = getCutoff(range);
  return entries.filter(e => e.date >= cutoff);
}

function sortByRatingThenDate(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => {
    // 1. Highest rating first (null rating goes to bottom)
    const ra = a.rating ?? -1;
    const rb = b.rating ?? -1;
    if (rb !== ra) return rb - ra;
    // 2. Most recent date first
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    // 3. Alphabetical
    return a.title.localeCompare(b.title);
  });
}

export function getMonthStats(entries: DiaryEntry[], range: TimeRange): MonthStats {
  const filtered = filterEntries(entries, range);
  const sorted = sortByRatingThenDate(filtered);

  const rated = filtered.filter(e => e.rating !== null);

  return {
    year: range.type === 'month' ? range.year : 0,
    month: range.type === 'month' ? range.month : 0,
    label:
      range.type === 'month'
        ? `${MONTH_NAMES[range.month]} ${range.year}`
        : `Last ${range.days} Days`,
    top4: sorted.slice(0, 4),
    totalWatched: filtered.length,
    avgRating:
      rated.length > 0
        ? rated.reduce((s, e) => s + e.rating!, 0) / rated.length
        : null,
  };
}

export function getWindowStats(entries: DiaryEntry[], range: TimeRange): WindowStats {
  const filtered = filterEntries(entries, range);
  const sorted = sortByRatingThenDate(filtered);
  const rated = filtered.filter(e => e.rating !== null);

  const label =
    range.type === 'rolling'
      ? `Last ${range.days} Days`
      : `${MONTH_NAMES[range.month]} ${range.year}`;

  return {
    window: range.type === 'rolling' ? `${range.days}d` as any : '1m',
    label,
    topFilm: sorted[0] ?? null,
    totalWatched: filtered.length,
    avgRating:
      rated.length > 0
        ? rated.reduce((s, e) => s + e.rating!, 0) / rated.length
        : null,
    ratedCount: rated.length,
  };
}

export function getHeatmapData(entries: DiaryEntry[], days = 30): HeatmapDay[] {
  const countMap = new Map<string, number>();

  for (const e of entries) {
    countMap.set(e.date, (countMap.get(e.date) ?? 0) + 1);
  }

  const today = new Date();
  const result: HeatmapDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const dateStr = d.toISOString().split('T')[0];

    result.push({
      date: dateStr,
      count: countMap.get(dateStr) ?? 0,
    });
  }

  return result;
}

export function getAvailableMonths(entries: DiaryEntry[]): { year: number; month: number; label: string }[] {
  const seen = new Set<string>();
  const months: { year: number; month: number; label: string }[] = [];

  for (const e of entries) {
    if (!e.date) continue;
    const [yr, mo] = e.date.split('-').map(Number);
    const key = `${yr}-${mo}`;
    if (!seen.has(key)) {
      seen.add(key);
      months.push({ year: yr, month: mo - 1, label: `${MONTH_NAMES[mo - 1]} ${yr}` });
    }
  }

  return months.sort((a, b) => b.year - a.year || b.month - a.month);
}

export function getRatingDistribution(entries: DiaryEntry[]): { rating: number; count: number }[] {
  const dist = new Map<number, number>();
  for (const e of entries) {
    if (e.rating !== null) {
      dist.set(e.rating, (dist.get(e.rating) ?? 0) + 1);
    }
  }
  const allRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  return allRatings.map(r => ({ rating: r, count: dist.get(r) ?? 0 }));
}
