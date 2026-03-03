/**
 * @module components/Settings
 * Settings panel — slides in from the right with a backdrop blur overlay.
 * Contains the ProviderForm for configuring AI, STT, and voice settings.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import ProviderForm from './ProviderForm.jsx';
import { send } from '../../lib/wsClient.js';

/** Panel width in pixels */
const PANEL_WIDTH = 380;

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    backgroundColor: 'rgba(26, 26, 46, 0.3)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    transition: `opacity var(--duration-normal) var(--ease-out)`,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    maxWidth: '100vw',
    zIndex: 101,
    backgroundColor: 'var(--color-bg)',
    borderLeft: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    transition: `transform var(--duration-slow) var(--ease-out)`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-6)',
    borderBottom: '1px solid var(--color-border)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-primary)',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    padding: 0,
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: 'var(--color-muted)',
    transition: `all var(--duration-fast) var(--ease-out)`,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-6)',
  },
  footer: {
    padding: 'var(--space-4) var(--space-6)',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
  },
};

/**
 * Settings slide-in panel component.
 * @returns {React.ReactElement|null}
 */
export default function Settings() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const settings = useAppStore((s) => s.settings);

  const panelRef = useRef(null);
  const prevSettingsRef = useRef(settings);

  /**
   * Close panel on Escape key.
   */
  useEffect(() => {
    if (!settingsOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        toggleSettings();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, toggleSettings]);

  /**
   * When settings change, sync to WebSocket backend.
   */
  useEffect(() => {
    const prev = prevSettingsRef.current;
    if (
      prev.aiProvider !== settings.aiProvider ||
      prev.voice !== settings.voice
    ) {
      send('settings', {
        provider: settings.aiProvider,
        voice: settings.voice,
      });
    }
    prevSettingsRef.current = settings;
  }, [settings]);

  /**
   * Handle overlay click (close panel).
   */
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        toggleSettings();
      }
    },
    [toggleSettings]
  );

  if (!settingsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          ...styles.overlay,
          opacity: settingsOpen ? 1 : 0,
          pointerEvents: settingsOpen ? 'auto' : 'none',
        }}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          ...styles.panel,
          transform: settingsOpen ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Settings</h2>
          <button
            style={styles.closeButton}
            onClick={toggleSettings}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <ProviderForm />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Settings are saved automatically to your browser.
          </p>
        </div>
      </div>
    </>
  );
}
