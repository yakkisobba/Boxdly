'use client';

interface Props {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'clamp(0.65rem, 2.2vw, 0.2rem)',
  md: 'clamp(0.8rem, 2.5vw, 0.5rem)',
  lg: 'clamp(1rem, 3vw, 1.3rem)',
};

export default function StarRating({ rating, size = 'sm' }: Props) {
  if (rating === null)
    return <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>—</span>;

  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span
      style={{ color: 'var(--accent)', fontSize: SIZES[size], letterSpacing: '0.5px' }}
      aria-label={`${rating} out of 5`}
    >
      {'★'.repeat(full)}
      {half ? '½' : ''}
      <span style={{ color: 'var(--heatmap-empty)' }}>{'★'.repeat(empty)}</span>
    </span>
  );
}