'use client';

interface Props {
  distribution: { rating: number; count: number }[];
}

function ratingToStars(r: number): string {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}

export default function RatingDistribution({ distribution }: Props) {
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {[...distribution].reverse().map(({ rating, count }) => (
        <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              width: '3.5rem',
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {ratingToStars(rating)}
          </span>
          <div style={{ flex: 1, height: 8, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / maxCount) * 100}%`,
                background: count === 0 ? 'transparent' : `linear-gradient(90deg, var(--accent-dim), var(--accent))`,
                borderRadius: 4,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              color: count > 0 ? 'var(--text-muted)' : 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              width: '1.5rem',
              flexShrink: 0,
            }}
          >
            {count > 0 ? count : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
