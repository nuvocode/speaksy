/**
 * @module components/shared/Logo
 * Speaksy brand logo.
 * "Speak" in Fraunces display font, "sy" as accent badge.
 */

import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    userSelect: 'none',
  },
  text: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--weight-bold)',
    color: 'var(--color-primary)',
    lineHeight: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 8px',
    backgroundColor: 'var(--color-accent)',
    color: '#FFFFFF',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-semibold)',
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.05em',
    lineHeight: 1.4,
    animation: 'logoBreathe 4s var(--ease-in-out) infinite',
  },
};

/**
 * Speaksy logo component.
 * @returns {React.ReactElement}
 */
export default function Logo() {
  return (
    <div style={styles.container} aria-label="Speaksy">
      <span style={styles.text}>Speak</span>
      <span style={styles.badge}>sy</span>
    </div>
  );
}
