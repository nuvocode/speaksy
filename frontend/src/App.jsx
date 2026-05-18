/**
 * @module App
 * Root application component for Speaksy.
 * - Fills entire viewport (100dvh)
 * - Establishes WebSocket connection on mount
 * - Routes between ModeSelection and ConversationScreen based on currentView
 * - Initialises theme from localStorage
 * - Renders Settings panel as overlay
 */

import React, { useEffect, useState } from 'react';
import { connect, disconnect } from './lib/wsClient.js';
import useAppStore from './store/appStore.js';
import ModeSelection from './components/ModeSelection/index.jsx';
import ConversationScreen from './components/ConversationScreen/index.jsx';
import Settings from './components/Settings/index.jsx';

/**
 * Determine the WebSocket URL based on environment.
 * Falls back to deriving from the current page location.
 * @returns {string}
 */
function getWsUrl() {
  /* Vite env variable (set in docker-compose or .env) */
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  /* Derive from current location (works with Vite proxy) */
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

/**
 * App root component.
 * @returns {React.ReactElement}
 */
export default function App() {
  const currentView = useAppStore((s) => s.currentView);
  const theme = useAppStore((s) => s.theme);

  /* Task 10.1 — transition state and displayed view */
  const [transitionState, setTransitionState] = useState('visible');
  const [displayedView, setDisplayedView] = useState(currentView);

  /* Task 10.4 — detect prefers-reduced-motion once on mount */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Initialise theme on mount — apply to DOM without transition to avoid flash */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    /* Enable transitions only after initial paint */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme-loaded', '');
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Establish WebSocket connection on mount, disconnect on unmount */
  useEffect(() => {
    const url = getWsUrl();
    connect(url);

    return () => {
      disconnect();
    };
  }, []);

  /* Task 10.2 — watch currentView and drive enter/leave transition */
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

  /* Task 10.3 — derive className from transitionState; Task 10.4 — reduced-motion fallback */
  const viewClassName = transitionState === 'leaving'
    ? 'view-leaving'
    : transitionState === 'entering'
      ? 'view-entering'
      : undefined;

  const reducedMotionStyle = prefersReducedMotion
    ? { transition: 'opacity 150ms ease', opacity: transitionState === 'leaving' ? 0 : 1 }
    : undefined;

  return (
    <>
      <div className={prefersReducedMotion ? undefined : viewClassName} style={reducedMotionStyle}>
        {displayedView === 'selection' ? <ModeSelection /> : <ConversationScreen />}
      </div>
      <Settings />
    </>
  );
}
