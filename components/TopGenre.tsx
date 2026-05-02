'use client';

interface Props {
  genre: string | null;
}

export default function TopGenre({ genre }: Props) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: genre && genre.length > 10
        ? 'clamp(0.75rem, 3vw, 1.5rem)'
        : 'clamp(0.9rem, 3.5vw, 2rem)',
      fontWeight: 700,
      color: genre ? 'var(--text)' : 'var(--text-dim)',
      lineHeight: 1,
    }}>
      {genre ?? '—'}
    </div>
  );
}