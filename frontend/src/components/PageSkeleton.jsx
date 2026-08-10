import React from 'react';

/**
 * PageSkeleton
 * ─────────────────────────────────────────────────────────
 * Shimmer loading skeleton shown while React.lazy() chunks
 * are being downloaded. Fully responsive at all breakpoints.
 */
export default function PageSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg-primary, #0a0a0f)',
        overflow: 'hidden',
        maxWidth: '100vw',
      }}
    >
      {/* Sidebar skeleton — hidden on mobile */}
      <div
        className="hidden-mobile-skeleton"
        style={{
          width: 240,
          minHeight: '100vh',
          background: 'var(--bg-secondary, #111118)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div className="skeleton-pulse" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
          <div className="skeleton-pulse" style={{ width: 90, height: 16, borderRadius: 6 }} />
        </div>

        {/* Nav items */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 10px',
              borderRadius: 10,
            }}
          >
            <div className="skeleton-pulse" style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0 }} />
            <div className="skeleton-pulse" style={{ width: `${50 + i * 7}px`, height: 13, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          padding: 'clamp(12px, 4vw, 28px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="skeleton-pulse" style={{ width: 'clamp(140px, 40%, 200px)', height: 26, borderRadius: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton-pulse" style={{ width: 34, height: 34, borderRadius: 10 }} />
            <div className="skeleton-pulse" style={{ width: 34, height: 34, borderRadius: 10 }} />
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-pulse"
              style={{ height: 90, borderRadius: 14 }}
            />
          ))}
        </div>

        {/* Two-column content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          <div className="skeleton-pulse" style={{ height: 200, borderRadius: 14 }} />
          <div className="skeleton-pulse" style={{ height: 200, borderRadius: 14 }} />
        </div>

        {/* Wide row */}
        <div className="skeleton-pulse" style={{ height: 140, borderRadius: 14 }} />

        {/* List items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'var(--bg-card, #16161f)',
                overflow: 'hidden',
              }}
            >
              <div className="skeleton-pulse" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div className="skeleton-pulse" style={{ width: '55%', height: 13, borderRadius: 4 }} />
                <div className="skeleton-pulse" style={{ width: '38%', height: 10, borderRadius: 4 }} />
              </div>
              <div className="skeleton-pulse" style={{ width: 60, height: 28, borderRadius: 8, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 0px,
            rgba(255,255,255,0.09) 80px,
            rgba(255,255,255,0.04) 160px
          );
          background-size: 600px 100%;
          animation: skeleton-shimmer 1.4s infinite linear;
        }
        @media (max-width: 767px) {
          .hidden-mobile-skeleton { display: none !important; }
        }
      `}</style>
    </div>
  );
}
