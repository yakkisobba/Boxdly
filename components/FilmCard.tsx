'use client';

import StarRating from './StarRating';
import type { DiaryEntry } from '@/lib/scraper';

interface Props {
  entry: DiaryEntry;
  rank?: number;
  size?: 'sm' | 'lg';
}

export default function FilmCard({ entry, rank, size = 'sm' }: Props) {
  const isLg = size === 'lg';

  return (
    <a
      href={`https://letterboxd.com/film/${entry.slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(0.3rem, 1.5vw, 0.625rem)',
        padding: 'clamp(0.35rem, 1.2vw, 0.625rem)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
        minWidth: 0,
        overflow: 'hidden',
         height: '100%',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(244,238,20,0.35)';
        el.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--border)';
        el.style.background = 'var(--bg-elevated)';
      }}
    >
      {rank !== undefined && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
          fontWeight: 700,
          color: 'var(--text-dim)',
          minWidth: 'clamp(0.6rem, 1.5vw, 0.75rem)',
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {rank}
        </span>
      )}

      {/* Poster */}
      <div style={{
        width:     isLg ? 'clamp(28px, 4vw, 44px)' : 'clamp(16px, 2.5vw, 24px)',
        height:    isLg ? 'clamp(42px, 6vw, 66px)' : 'clamp(24px, 3.5vw, 36px)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(0.6rem, 1.5vw, 1rem)',
      }}>
        {entry.posterUrl
          ? <img
              src={entry.posterUrl}
              alt={entry.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          : '🎬'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.5rem, 1.4vw, 0.65rem)',
          color: 'var(--text)',
           overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          whiteSpace: 'normal',
          marginBottom: '0.15rem',
          lineHeight: 1.2,
        }}>
          {entry.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.2rem, 0.8vw, 0.375rem)', flexWrap: 'wrap' }}>
          <StarRating rating={entry.rating} size="sm" />
          {entry.rewatch && (
            <span style={{
              fontSize: 'clamp(0.45rem, 1vw, 0.58rem)',
              color: 'var(--accent)',
              background: 'var(--accent-glow)',
              border: '1px solid rgba(244,238,20,0.2)',
              padding: '1px 4px',
              borderRadius: '3px',
              fontFamily: 'var(--font-display)',
              flexShrink: 0,
            }}>
              rewatch
            </span>
          )}
        </div>
      </div>
    </a>
  );
}