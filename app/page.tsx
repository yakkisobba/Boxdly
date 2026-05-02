'use client';

import { useState, useCallback } from 'react';
import type { DiaryEntry } from '@/lib/scraper';
import {
  getMonthStats,
  getWindowStats,
  getHeatmapData,
  getAvailableMonths,
  type TimeWindow,
} from '@/lib/stats';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import FilmCard from '@/components/FilmCard';
import StarRating from '@/components/StarRating';
import TopGenre from '@/components/TopGenre';


type AppState = 'idle' | 'loading' | 'done' | 'error';

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'clamp(0.4rem, 2vw, 1rem)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 'clamp(0.48rem, 1.8vw, 0.65rem)',
      fontFamily: 'var(--font-display)',
      color: 'var(--text-dim)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 'clamp(0.25rem, 1.5vw, 0.6rem)',
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Panel style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
      <PanelLabel>{label}</PanelLabel>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1rem, 4vw, 2.75rem)',
        fontWeight: 700,
        lineHeight: 1,
        color: 'var(--text)',
      }}>
        {value}
      </div>
      {sub && <div style={{ marginTop: '0.1rem' }}>{sub}</div>}
    </Panel>
  );
}

function BoxFrame({ children }: { children: React.ReactNode }) {
  const STROKE = 3;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* left flap */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 'clamp(40px, 10vw, 180px)',
        height: STROKE,
        background: 'var(--accent)',
        transformOrigin: 'left center',
        transform: 'rotate(-18deg) translateY(-2px)',
      }} />
      {/* right flap */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 'clamp(40px, 10vw, 180px)',
        height: STROKE,
        background: 'var(--accent)',
        transformOrigin: 'right center',
        transform: 'rotate(18deg) translateY(-2px)',
      }} />
      {/* box body */}
      <div style={{
        border: `${STROKE}px solid var(--accent)`,
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        padding: 'clamp(0.5rem, 2.5vw, 1.25rem)',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── responsive hook ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );
  if (typeof window !== 'undefined') {
    // lightweight — only runs once on mount via useState initialiser above
    // for SSR safety we skip the effect and rely on clamp() for most things
  }
  return isMobile;
}

export default function Home() {
  const [username, setUsername]     = useState('');
  const [inputValue, setInputValue] = useState('');
  const [state, setState]           = useState<AppState>('idle');
  const [error, setError]           = useState('');
  const [entries, setEntries]       = useState<DiaryEntry[]>([]);
  const [selectedMonthIdx]          = useState(0);
  const selectedRange = { type: 'rolling', days: 30 } as const;
  const [topGenre, setTopGenre] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const u = inputValue.trim().replace(/^@/, '');
    if (!u) return;
    setState('loading'); setError(''); setEntries([]);
    try {
      const res  = await fetch(`/api/scrape?username=${encodeURIComponent(u)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch data');
      setEntries(data.entries);
      setUsername(data.username);
      setTopGenre(data.topGenre ?? null);  
      setState('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('error');
    }
  }, [inputValue]);

  const windowStats     = getWindowStats(entries, selectedRange);
  const monthStats = getMonthStats(entries, selectedRange);
  const heatmapData = getHeatmapData(entries);

  const totalRated = entries.filter(e => e.rating !== null).length;
  const avgRating  = totalRated > 0
    ? entries.filter(e => e.rating !== null).reduce((s, e) => s + e.rating!, 0) / totalRated
    : null;

  /* ── LANDING ── */
  if (state !== 'done') return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 5vw, 2rem)',
      position: 'relative',
      zIndex: 1,
    }}>
      <div className="fade-up" style={{ marginBottom: 'clamp(2rem, 8vw, 3.5rem)', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3.5rem, 18vw, 8rem)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-1px',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>un</span>
          <span style={{ color: 'var(--accent)' }}>[boxd]</span>
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.6rem, 2.5vw, 0.85rem)',
          color: 'var(--text-dim)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: '0.8rem',
          textAlign: 'right',
        }}>
          your letterboxd diary, unwrapped
        </p>
      </div>

      <form onSubmit={handleSearch} className="fade-up-1" style={{
        display: 'flex',
        gap: '0.5rem',
        width: '100%',
        maxWidth: 380,
      }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0 0.75rem',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(244,238,20,0.4)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span style={{ color: 'var(--text-dim)', fontSize: '1rem', marginRight: '0.4rem', fontFamily: 'var(--font-display)' }}>@</span>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="username"
            disabled={state === 'loading'}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '1rem',
              fontFamily: 'var(--font-display)',
              width: '100%',
              padding: '0.75rem 0',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={state === 'loading' || !inputValue.trim()}
          style={{
            background: inputValue.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            color: inputValue.trim() ? '#0f0f0f' : 'var(--text-dim)',
            border: '1px solid ' + (inputValue.trim() ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 'var(--radius-md)',
            padding: '0 1.1rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: inputValue.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {state === 'loading' ? '···' : 'Go'}
        </button>
      </form>

      {state === 'error' && (
        <p className="fade-up" style={{ marginTop: '1rem', color: 'var(--red)', fontSize: '0.85rem', fontFamily: 'var(--font-display)' }}>
          {error}
        </p>
      )}

      <div style={{
        position: 'absolute',
        bottom: '1.25rem',
        left: '1rem',
        right: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)',
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-display)',
        flexWrap: 'wrap',
        gap: '0.25rem',
      }}>
        <span>data sourced from letterboxd.com · not affiliated</span>
        <a
  href="https://letterboxd.com/yakisobaa"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    color: 'var(--text-dim)',
    textDecoration: 'none',
  }}
>
  by yakisobaa
</a>
      </div>
    </main>
  );

  /* ── EMPTY ── */
  if (entries.length === 0) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1, position: 'relative' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          No diary entries found for @{username}.
        </p>
        <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
          Make sure your diary is public and you've logged some films.
        </p>
        <button onClick={() => { setState('idle'); setEntries([]); setTopGenre(null); }} style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-display)',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
        }}>
          ← back
        </button>
      </div>
    </main>
  );

  /* ── DASHBOARD ── */
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',         
      flexDirection: 'column',  
      padding: 'clamp(0.75rem, 3vw, 2.5rem) clamp(0.5rem, 3vw, 2rem)',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* centred column — narrower on mobile so BoxFrame has breathing room */}
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* header */}
        <div className="fade-up" style={{
          marginTop: 'clamp(0.5rem, 2vw, 1.75rem)',
          marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 7vw, 4rem)',
            fontWeight: 800,
            lineHeight: 0.95,
            color: 'var(--accent)',
            margin: 0,
          }}>
            {username}
          </h1>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1rem, 3vw, 1.75rem)',
            fontWeight: 700,
            marginTop: '0.15rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>un</span>
            <span style={{ color: 'var(--accent)' }}>[boxd]</span>
          </div>
        </div>

        {/* ── BoxFrame — centred, max-width tightened on mobile ── */}
        <div className="fade-up-1" style={{
          maxWidth: 'min(100%, 700px)',
          margin: '0 auto',
        }}>
          <BoxFrame>

            {/* stat row — 4 cols always, font/padding shrink via clamp */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 'clamp(0.2rem, 1.2vw, 0.5rem)',
              marginBottom: 'clamp(0.3rem, 1.5vw, 0.75rem)',
            }}>
              <StatCard label="Logged"    value={entries.length} />
              <StatCard label="Rated"     value={totalRated} />
              <StatCard label="Rewatches" value={entries.filter(e => e.rewatch).length} />
              <StatCard
                label="Avg"
                value={avgRating ? avgRating.toFixed(1) : '—'}
                sub={avgRating
                  ? <StarRating rating={Math.round(avgRating * 2) / 2} size="sm" />
                  : undefined}
              />
            </div>

            {/* lower grid — stacks to 1 col on narrow screens */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',  /* mobile: 1 col */
              gap: 'clamp(0.3rem, 1.5vw, 0.75rem)',
            }}
              /* desktop: 2 cols via inline media isn't possible — use a wrapper class instead */
            >
              {/* 
                Because inline styles can't use @media, we split the lower section
                into two panels that stack on mobile and sit side-by-side on wider screens
                using a CSS trick: we wrap them in a flex container with flex-wrap.
              */}
            </div>

            {/* lower section — flex-wrap approach for responsive 2-col */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(0.3rem, 1.5vw, 0.75rem)',
            }}>
              {/* four favourites — full width on mobile, 62% on wider */}
              <Panel style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 clamp(180px, 55%, 999px)',
              }}>
                <PanelLabel>This Month's Favourites</PanelLabel>
                {monthStats?.top4?.length ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'clamp(0.2rem, 1.5vw, 0.5rem)',
                    flex: 1,
                    
                  }}>
                    {monthStats.top4.map((e, i) => (
                      <FilmCard key={`${e.title}-${i}`} entry={e} rank={i + 1} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                    fontSize: 'clamp(0.6rem, 2vw, 0.8rem)',
                    fontFamily: 'var(--font-display)',
                    padding: '1.5rem 0',
                  }}>
                    no films found
                  </div>
                )}
              </Panel>

              {/* right column — full width on mobile, remaining space on wider */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(0.3rem, 1.5vw, 0.75rem)',
                flex: '1 1 clamp(120px, 30%, 999px)',
              }}>
                <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <PanelLabel>Watch Activity</PanelLabel>
                  <CalendarHeatmap data={heatmapData} totalFilms={entries.length} />
                </Panel>

                <Panel style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: 'clamp(50px, 8vw, 100px)',
                }}>
                  <PanelLabel>Top Genre </PanelLabel>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(0.9rem, 3.5vw, 2.25rem)',
                    fontWeight: 700,
                    color: 'var(--text)',
                    lineHeight: 1,
                  }}>
                    
                    <TopGenre genre={topGenre} />
                  </div>
                </Panel>
              </div>
            </div>

          </BoxFrame>
        </div>

        {/* footer row */}
        <div className="fade-up-2" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',        // ← replaces the clamp margin
        paddingTop: 'clamp(0.6rem, 2vw, 1.25rem)',  // ← keeps spacing
        flexWrap: 'wrap',
        gap: '0.5rem',
        maxWidth: 'min(100%, 700px)',
        margin: 'auto auto 0',   // ← top:auto pushes it down, bottom:0 pins it
        width: '100%',
      }}>
          <span style={{
            fontSize: 'clamp(0.55rem, 1.5vw, 0.7rem)',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-display)',
            lineHeight: 1.6,
          }}>
            un[boxd] shows your Letterboxd stats in the last 30 days.<br />
            Not affiliated with Letterboxd.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setState('idle'); setEntries([]); setUsername(''); }}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'clamp(0.35rem, 1vw, 0.55rem) clamp(0.6rem, 2vw, 1.25rem)',
                fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(244,238,20,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              Back
            </button>
            <button style={{
              background: 'var(--accent)',
              color: '#0f0f0f',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: 'clamp(0.35rem, 1vw, 0.55rem) clamp(0.6rem, 2vw, 1.25rem)',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
            }}>
              Download
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}