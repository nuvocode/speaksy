/**
 * @module App
 * Root application component for LinguaAI.
 * - Fills entire viewport (100dvh)
 * - Establishes WebSocket connection on mount
 * - Renders ConversationScreen as main content
 * - Renders Settings panel as overlay
 */

import React, { useEffect } from 'react';
import { connect, disconnect } from './lib/wsClient.js';
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
      <ConversationScreen />
      <Settings />
    </>
  );
}
