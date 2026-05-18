/**
 * @module components/shared/Logo
 * Lingua AI brand logo — Nuvo Code visual language.
 * SVG stacked-bar icon + gradient wordmark.
 */

import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    userSelect: 'none',
  },
  wordmark: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    lineHeight: 1,
  },
  textGrad: {
    fontFamily: 'var(--font-ui)',
    fontSize: '15px',
    fontWeight: 'var(--weight-bold)',
    letterSpacing: '-0.02em',
    background: 'var(--grad)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  textPlain: {
    fontFamily: 'var(--font-ui)',
    fontSize: '15px',
    fontWeight: 'var(--weight-semibold)',
    letterSpacing: '-0.02em',
    color: 'var(--color-t1)',
  },
};

export default function Logo() {
  return (
    <div style={styles.container} aria-label="Speaksy">
      <svg width="22" height="20" viewBox="0 0 26 24" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="lg-logo" x1="0" y1="24" x2="26" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a855f7" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <rect x="0" y="14" width="8" height="10" rx="2" fill="url(#lg-logo)" />
        <rect x="9" y="7" width="8" height="10" rx="2" fill="url(#lg-logo)" opacity=".75" />
        <rect x="18" y="0" width="8" height="10" rx="2" fill="url(#lg-logo)" opacity=".5" />
      </svg>
      <div style={styles.wordmark}>
        <span style={styles.textGrad}>Speak</span>
        <span style={styles.textPlain}>sy</span>
      </div>
    </div>
  );
}
