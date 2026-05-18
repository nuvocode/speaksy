/**
 * @module components/shared/StatusIndicator
 * Connection status dot + label — Nuvo Code dark design language.
 *
 * @param {{ status: 'connected'|'connecting'|'disconnected' }} props
 */

import React from 'react';

const STATUS_CONFIG = {
  connected: {
    color: 'var(--color-green)',
    glow: '0 0 6px rgba(74,222,128,.5)',
    label: 'Connected',
    pulse: false,
  },
  connecting: {
    color: 'var(--color-amber)',
    glow: 'none',
    label: 'Connecting...',
    pulse: true,
  },
  disconnected: {
    color: 'var(--color-red)',
    glow: 'none',
    label: 'Disconnected',
    pulse: false,
  },
};

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-b2)',
    background: 'var(--color-s2)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t3)',
    letterSpacing: '0.06em',
    lineHeight: 1,
  },
};

export default function StatusIndicator({ status = 'disconnected' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;

  return (
    <div
      style={styles.container}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <span
        style={{
          ...styles.dot,
          backgroundColor: config.color,
          boxShadow: config.glow,
          ...(config.pulse && { animation: 'breathe 1.5s ease-in-out infinite' }),
        }}
      />
      <span style={styles.label}>{config.label}</span>
    </div>
  );
}
