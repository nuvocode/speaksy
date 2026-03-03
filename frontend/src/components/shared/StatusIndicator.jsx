/**
 * @module components/shared/StatusIndicator
 * Connection status dot + label.
 *   - connected: green dot + "Connected"
 *   - connecting: yellow pulsing dot + "Connecting..."
 *   - disconnected: red dot + "Disconnected"
 *
 * @param {{ status: 'connected'|'connecting'|'disconnected' }} props
 */

import React from 'react';

/** Status → visual configuration mapping */
const STATUS_CONFIG = {
  connected: {
    color: 'var(--color-success)',
    label: 'Connected',
    pulse: false,
  },
  connecting: {
    color: 'var(--color-warning)',
    label: 'Connecting...',
    pulse: true,
  },
  disconnected: {
    color: 'var(--color-error)',
    label: 'Disconnected',
    pulse: false,
  },
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
  },
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-muted)',
    lineHeight: 1,
  },
};

/**
 * StatusIndicator component.
 * @param {{ status: 'connected'|'connecting'|'disconnected' }} props
 * @returns {React.ReactElement}
 */
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
          ...(config.pulse && {
            animation: 'breathe 1.5s ease-in-out infinite',
          }),
        }}
      />
      <span style={styles.label}>{config.label}</span>
    </div>
  );
}
