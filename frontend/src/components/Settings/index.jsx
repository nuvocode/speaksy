/**
 * @module components/Settings
 * Settings panel — slides in from the right.
 * Nuvo Code dark design language.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import ProviderForm from './ProviderForm.jsx';
import { send } from '../../lib/wsClient.js';

const PANEL_WIDTH = 380;

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'opacity var(--duration-normal) var(--ease-out)',
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    maxWidth: '100vw',
    zIndex: 101,
    backgroundColor: 'var(--color-s1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderLeft: '1px solid var(--color-b2)',
    boxShadow: '-8px 0 40px rgba(0,0,0,.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-6)',
    borderBottom: '1px solid var(--color-b1)',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  titleLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-t1)',
    letterSpacing: '-0.01em',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    minWidth: 32,
    minHeight: 32,
    padding: 0,
    background: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: 'var(--color-t3)',
    transition: 'all var(--duration-fast) var(--ease-out)',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-6)',
  },
  footer: {
    padding: 'var(--space-4) var(--space-6)',
    borderTop: '1px solid var(--color-b1)',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
    letterSpacing: '0.04em',
  },
};

export default function Settings() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const settings = useAppStore((s) => s.settings);

  const [isVisible, setIsVisible] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [closeHover, setCloseHover] = useState(false);

  const panelRef = useRef(null);
  const prevSettingsRef = useRef(settings);
  const unmountTimerRef = useRef(null);

  useEffect(() => {
    if (settingsOpen) {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
      }
      setIsVisible(true);
      requestAnimationFrame(() => setAnimClass('settings-entering'));
    } else {
      setAnimClass('settings-leaving');
      unmountTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setAnimClass('');
        unmountTimerRef.current = null;
      }, 250);
    }
    return () => {
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') toggleSettings(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, toggleSettings]);

  useEffect(() => {
    const prev = prevSettingsRef.current;
    if (
      prev.aiProvider !== settings.aiProvider ||
      prev.aiModel !== settings.aiModel ||
      prev.voice !== settings.voice
    ) {
      send('settings', { provider: settings.aiProvider, model: settings.aiModel, voice: settings.voice });
    }
    prevSettingsRef.current = settings;
  }, [settings]);

  const handleOverlayClick = useCallback(
    (e) => { if (e.target === e.currentTarget) toggleSettings(); },
    [toggleSettings]
  );

  if (!isVisible) return null;

  return (
    <>
      <div
        style={{
          ...styles.overlay,
          opacity: settingsOpen ? 1 : 0,
          pointerEvents: settingsOpen ? 'auto' : 'none',
        }}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={animClass}
        style={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.titleLabel}>Configuration</span>
            <h2 style={styles.title}>Settings</h2>
          </div>
          <button
            style={{
              ...styles.closeButton,
              borderColor: closeHover ? 'var(--color-b3)' : 'var(--color-b2)',
              color: closeHover ? 'var(--color-t1)' : 'var(--color-t3)',
            }}
            onClick={toggleSettings}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            aria-label="Close settings"
          >
            <X size={14} />
          </button>
        </div>

        <div style={styles.body}>
          <ProviderForm />
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>Settings saved to browser storage.</p>
        </div>
      </div>
    </>
  );
}
