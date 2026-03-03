/**
 * @module lib/wsClient
 * WebSocket singleton client with automatic reconnection (exponential backoff).
 *
 * Exports:
 *   connect(url)       — establish connection, update store
 *   send(type, payload) — JSON stringify + send
 *   disconnect()       — close connection
 *   onMessage(handler) — register message listener
 */

import useAppStore from '../store/appStore.js';

/** Reconnect timing constants (ms) */
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 2;

/** @type {WebSocket|null} */
let socket = null;

/** @type {Set<function>} */
const messageHandlers = new Set();

/** @type {number|null} */
let reconnectTimer = null;

/** Current reconnect delay (resets on successful connection) */
let reconnectDelay = INITIAL_RECONNECT_DELAY;

/** URL to reconnect to */
let savedUrl = '';

/** Whether disconnect was intentional */
let intentionalClose = false;

/**
 * Clear any pending reconnect timer.
 */
function clearReconnect() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/**
 * Schedule a reconnect attempt with exponential backoff.
 */
function scheduleReconnect() {
  if (intentionalClose || !savedUrl) return;

  clearReconnect();
  console.log(`[ws] Reconnecting in ${reconnectDelay}ms...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(savedUrl);
  }, reconnectDelay);

  /* Increase delay for next attempt (capped) */
  reconnectDelay = Math.min(reconnectDelay * RECONNECT_MULTIPLIER, MAX_RECONNECT_DELAY);
}

/**
 * Establish a WebSocket connection.
 * @param {string} url — WebSocket server URL (e.g. ws://localhost:3001/ws)
 */
export function connect(url) {
  savedUrl = url;
  intentionalClose = false;

  /* Close existing connection if any */
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    socket.close();
  }

  useAppStore.getState().setWsStatus('connecting');

  try {
    socket = new WebSocket(url);
  } catch (error) {
    console.error('[ws] Failed to create WebSocket:', error.message);
    useAppStore.getState().setWsStatus('disconnected');
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    console.log('[ws] Connected');
    useAppStore.getState().setWsStatus('connected');
    reconnectDelay = INITIAL_RECONNECT_DELAY; /* reset backoff */

    /* Send current settings to backend */
    const { settings } = useAppStore.getState();
    send('settings', {
      provider: settings.aiProvider,
      voice: settings.voice,
    });
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      for (const handler of messageHandlers) {
        handler(data);
      }
    } catch (error) {
      console.error('[ws] Failed to parse message:', error.message);
    }
  };

  socket.onclose = (event) => {
    console.log('[ws] Disconnected', event.code, event.reason);
    useAppStore.getState().setWsStatus('disconnected');
    socket = null;

    if (!intentionalClose) {
      scheduleReconnect();
    }
  };

  socket.onerror = (error) => {
    console.error('[ws] Error:', error);
  };
}

/**
 * Send a typed message to the server.
 * @param {string} type — message type (e.g. 'message', 'clear', 'settings')
 * @param {Object} [payload={}] — additional data
 */
export function send(type, payload = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[ws] Cannot send — not connected.');
    return;
  }

  socket.send(JSON.stringify({ type, ...payload }));
}

/**
 * Intentionally close the WebSocket connection.
 */
export function disconnect() {
  intentionalClose = true;
  clearReconnect();

  if (socket) {
    socket.close();
    socket = null;
  }

  useAppStore.getState().setWsStatus('disconnected');
}

/**
 * Register a message handler.
 * @param {function(Object): void} handler — called with parsed message data
 * @returns {function} unsubscribe function
 */
export function onMessage(handler) {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

/**
 * Check if WebSocket is currently connected.
 * @returns {boolean}
 */
export function isConnected() {
  return socket?.readyState === WebSocket.OPEN;
}

export default { connect, send, disconnect, onMessage, isConnected };
