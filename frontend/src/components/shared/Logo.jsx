/**
 * @module components/shared/Logo
 * LinguaAI brand logo.
 * "Lingua" in Fraunces display font, "AI" as accent badge.
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
  },
};

/**
 * LinguaAI Logo component.
 * @returns {React.ReactElement}
 */
export default function Logo() {
  return (
    <div style={styles.container} aria-label="LinguaAI">
      <span style={styles.text}>Lingua</span>
      <span style={styles.badge}>AI</span>
    </div>
  );
}
