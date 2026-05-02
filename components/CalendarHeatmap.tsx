'use client';

import type { HeatmapDay } from '@/lib/stats';

function getColor(count: number): string {
  if (count === 0) return 'var(--heatmap-empty)';
  if (count === 1) return 'var(--heatmap-1)';
  if (count === 2) return 'var(--heatmap-2)';
  if (count === 3) return 'var(--heatmap-3)';
  return 'var(--heatmap-4)';
}

interface Props {
  data: HeatmapDay[];
  totalFilms: number;
}

export default function CalendarHeatmap({ data, totalFilms }: Props) {
  const countMap = new Map(data.map(d => [d.date, d.count]));

  const today = new Date();
  const days: { date: Date; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d, count: countMap.get(d.toISOString().split('T')[0]) ?? 0 });
  }

  const columns: { date: Date; count: number }[][] = [];
const COLUMN_SIZE = 5;

for (let i = 0; i < days.length; i += COLUMN_SIZE) {
  columns.push(days.slice(i, i + COLUMN_SIZE));
}

  const S = 10; // cell size px
  const G = 3;  // gap px

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%',  alignItems: 'center' }}>

      {/* legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
        
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
          <span>less</span>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: S, height: S, borderRadius: 2, background: getColor(i) }} />
          ))}
          <span>more</span>
        </div>
      </div>

      {/* graph */}
<div style={{ display: 'flex', gap: G }}>
  {columns.map((col, ci) => (
    <div
      key={ci}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: G,
      }}
    >
      {col.map((day, di) => (
        <div
          key={di}
          title={`${day.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}: ${day.count} film${day.count !== 1 ? 's' : ''}`}
          style={{
            width: S,
            height: S,
            borderRadius: 2,
            background: getColor(day.count),
            cursor: day.count > 0 ? 'pointer' : 'default',
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (day.count > 0) (e.currentTarget.style.opacity = '0.6');
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1';
          }}
        />
      ))}
    </div>
  ))}
</div>

        
      </div>

  
  );
}