/**
 * @module App
 * Root application component for LinguaAI.
 * - Fills entire viewport (100dvh)
 * - Establishes WebSocket connection on mount
 * - Routes between ModeSelection and ConversationScreen based on currentView
 * - Initialises theme from localStorage
 * - Renders Settings panel as overlay
 */

import React, { useEffect } from 'react';
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

  return (
    <>
      <div
        className={currentView === 'selection' ? 'view-entering' : 'view-entering'}
        key={currentView}
      >
        {currentView === 'selection' ? <ModeSelection /> : <ConversationScreen />}
      </div>
      <Settings />
    </>
  );
}
