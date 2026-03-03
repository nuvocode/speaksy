/**
 * @module services/conversation
 * Manages per-session conversation histories.
 * Each WebSocket session gets its own message history stored in a Map.
 */

/** Maximum number of messages to keep in history (context window management) */
const MAX_HISTORY_LENGTH = 20;

/**
 * In-memory conversation history store.
 * Key: sessionId (string), Value: array of { role, content, timestamp }
 * @type {Map<string, Array<{role: string, content: string, timestamp: number}>>}
 */
const sessions = new Map();

/**
 * Ensure a session entry exists.
 * @param {string} sessionId
 */
function ensureSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
}

/**
 * Add a message to a session's history.
 * @param {string} sessionId — unique session identifier
 * @param {string} role — 'user' | 'assistant' | 'system'
 * @param {string} content — message text
 */
export function addMessage(sessionId, role, content) {
  ensureSession(sessionId);
  const history = sessions.get(sessionId);

  history.push({ role, content, timestamp: Date.now() });

  /* Trim history to MAX_HISTORY_LENGTH, always keeping the system message if present */
  if (history.length > MAX_HISTORY_LENGTH) {
    const systemMsg = history.find(m => m.role === 'system');
    const trimmed = history.slice(-MAX_HISTORY_LENGTH);

    /* Make sure the system message is always the first entry */
    if (systemMsg && trimmed[0]?.role !== 'system') {
      trimmed.unshift(systemMsg);
    }

    sessions.set(sessionId, trimmed);
  }
}

/**
 * Retrieve the last N messages for a session.
 * @param {string} sessionId
 * @returns {Array<{role: string, content: string}>} — messages formatted for provider consumption
 */
export function getHistory(sessionId) {
  ensureSession(sessionId);
  return sessions.get(sessionId).map(({ role, content }) => ({ role, content }));
}

/**
 * Clear all history for a session.
 * @param {string} sessionId
 */
export function clearHistory(sessionId) {
  sessions.delete(sessionId);
}

/**
 * Get the number of active sessions (useful for monitoring).
 * @returns {number}
 */
export function getActiveSessionCount() {
  return sessions.size;
}

export default { addMessage, getHistory, clearHistory, getActiveSessionCount };
