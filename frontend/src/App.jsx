/**
 * @module App
 * Root application component for Speaksy.
 * - Fills entire viewport (100dvh)
 * - Checks setup status before establishing WebSocket connection
 * - Routes between SetupWizard, ModeSelection and ConversationScreen
 * - Initialises theme from localStorage
 * - Renders Settings panel as overlay (hidden during setup)
 */

import React, { useEffect, useState } from 'react';
import { connect, disconnect } from './lib/wsClient.js';
import useAppStore from './store/appStore.js';
import ModeSelection from './components/ModeSelection/index.jsx';
import ConversationScreen from './components/ConversationScreen/index.jsx';
import Settings from './components/Settings/index.jsx';
import SetupWizard from './components/SetupWizard/index.jsx';

/**
 * Determine the WebSocket URL based on environment.
 * Falls back to deriving from the current page location.
 * @returns {string}
 */
function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export default function App() {
  const currentView      = useAppStore((s) => s.currentView);
  const theme            = useAppStore((s) => s.theme);
  const setupRequired    = useAppStore((s) => s.setupRequired);
  const setSetupRequired = useAppStore((s) => s.setSetupRequired);
  const setView          = useAppStore((s) => s.setView);

  const [transitionState, setTransitionState] = useState('visible');
  const [displayedView, setDisplayedView]     = useState(currentView);
  const [setupDefaults, setSetupDefaults]     = useState({});

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Apply theme on mount without flash */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme-loaded', '');
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Check setup status — runs before WS connect */
  useEffect(() => {
    fetch('/api/setup/status')
      .then((r) => r.json())
      .then((data) => {
        setSetupDefaults(data.defaults || {});
        setSetupRequired(data.setupRequired);
        if (data.setupRequired) setView('setup');
      })
      .catch(() => {
        // Don't block the app if the check fails
        setSetupRequired(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Establish WebSocket only after setup is resolved and not required */
  useEffect(() => {
    if (setupRequired === null || setupRequired) return;
    const url = getWsUrl();
    connect(url);
    return () => disconnect();
  }, [setupRequired]);

  /* Animate view transitions */
  useEffect(() => {
    if (currentView !== displayedView) {
      const delay1 = prefersReducedMotion ? 150 : 250;
      const delay2 = prefersReducedMotion ? 150 : 350;
      setTransitionState('leaving');
      const t1 = setTimeout(() => {
        setDisplayedView(currentView);
        setTransitionState('entering');
        const t2 = setTimeout(() => setTransitionState('visible'), delay2);
        return () => clearTimeout(t2);
      }, delay1);
      return () => clearTimeout(t1);
    }
  }, [currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  const viewClassName = transitionState === 'leaving'
    ? 'view-leaving'
    : transitionState === 'entering'
      ? 'view-entering'
      : undefined;

  const reducedMotionStyle = prefersReducedMotion
    ? { transition: 'opacity 150ms ease', opacity: transitionState === 'leaving' ? 0 : 1 }
    : undefined;

  /* Show nothing until setup check resolves to avoid flash */
  if (setupRequired === null) return null;

  return (
    <>
      <div className={prefersReducedMotion ? undefined : viewClassName} style={reducedMotionStyle}>
        {displayedView === 'setup'
          ? <SetupWizard defaults={setupDefaults} />
          : displayedView === 'selection'
            ? <ModeSelection />
            : <ConversationScreen />
        }
      </div>
      {displayedView !== 'setup' && <Settings />}
    </>
  );
}
