/**
 * @module store/appStore
 * Zustand global state store for LinguaAI.
 * Central state management for conversation, connection, audio, settings, view, mode, and theme.
 */

import { create } from 'zustand';

/**
 * Generate a UUID v4 string.
 * @returns {string}
 */
function generateId() {
  return crypto.randomUUID?.() ||
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

/**
 * Load settings from localStorage.
 * @returns {Object} saved settings or defaults
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem('linguaai-settings');
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore parse errors */
  }
  return {
    aiProvider: 'gemini',
    sttProvider: 'webspeech',
    voice: 'af_heart',
    aiModel: '',
    geminiApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    groqApiKey: '',
  };
}

/**
 * Persist settings to localStorage.
 * @param {Object} settings
 */
function saveSettings(settings) {
  try {
    localStorage.setItem('linguaai-settings', JSON.stringify(settings));
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Load theme preference from localStorage.
 * @returns {'light'|'dark'}
 */
function loadTheme() {
  try {
    const saved = localStorage.getItem('linguaai-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  return 'light';
}

/**
 * Persist theme to localStorage and update DOM attribute.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  try {
    localStorage.setItem('linguaai-theme', theme);
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * @typedef {Object} Message
 * @property {string} id — unique message identifier
 * @property {'user'|'ai'} role — message sender
 * @property {string} text — message content
 * @property {number} timestamp — Unix timestamp (ms)
 * @property {boolean} isStreaming — whether the message is still being streamed
 */

/**
 * @typedef {Object} ModeConfig
 * @property {'freestyle' | 'topic' | 'script'} type
 * @property {string} label           — Display name
 * @property {Object} [topicConfig]   — Only for type === 'topic'
 * @property {string} topicConfig.topic        — Selected topic (e.g. "Cinema")
 * @property {string} [topicConfig.subtopic]   — Optional subtopic (e.g. "Hollywood")
 * @property {Object} [scriptConfig]  — Only for type === 'script'
 * @property {string} scriptConfig.scriptId    — Script ID
 * @property {string} scriptConfig.title       — Script title
 * @property {Array}  scriptConfig.lines       — [{role: 'user'|'ai', text: string}]
 * @property {number} scriptConfig.currentLine — Current line index
 */

/**
 * @typedef {Object} AppState
 * @property {Message[]} messages
 * @property {'disconnected'|'connecting'|'connected'} wsStatus
 * @property {boolean} isUserSpeaking
 * @property {boolean} isAISpeaking
 * @property {number} audioLevel — 0-1 range for wave animation
 * @property {Object} settings
 * @property {boolean} settingsOpen
 * @property {string} sessionId
 * @property {'selection'|'conversation'} currentView
 * @property {ModeConfig|null} activeMode
 * @property {'light'|'dark'} theme
 */

const useAppStore = create((set, get) => ({
  /* ── Conversation ─────────────────────────────── */
  messages: [],

  /**
   * Add a new message to the conversation.
   * @param {'user'|'ai'} role
   * @param {string} text
   * @param {boolean} [isStreaming=false]
   */
  addMessage: (role, text, isStreaming = false) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role,
          text,
          timestamp: Date.now(),
          isStreaming,
        },
      ],
    })),

  /**
   * Append text to the last message (for streaming chunks).
   * @param {string} chunk
   */
  updateLastMessage: (chunk) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last) {
        messages[messages.length - 1] = { ...last, text: last.text + chunk };
      }
      return { messages };
    }),

  /**
   * Mark the last message as no longer streaming.
   * @param {string} [fullText] — optional final text override
   */
  finalizeLastMessage: (fullText) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last) {
        messages[messages.length - 1] = {
          ...last,
          isStreaming: false,
          ...(fullText !== undefined && { text: fullText }),
        };
      }
      return { messages };
    }),

  /** Clear all messages. */
  clearMessages: () => set({ messages: [] }),

  /* ── Connection ───────────────────────────────── */
  wsStatus: 'disconnected',
  setWsStatus: (wsStatus) => set({ wsStatus }),

  /* ── Audio State ──────────────────────────────── */
  isUserSpeaking: false,
  isAISpeaking: false,
  audioLevel: 0,
  setUserSpeaking: (isUserSpeaking) => set({ isUserSpeaking }),
  setAISpeaking: (isAISpeaking) => set({ isAISpeaking }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  /* ── Settings ─────────────────────────────────── */
  settings: loadSettings(),

  /**
   * Update settings and persist to localStorage.
   * @param {Partial<Object>} patch
   */
  updateSettings: (patch) =>
    set((state) => {
      const settings = { ...state.settings, ...patch };
      saveSettings(settings);
      return { settings };
    }),

  settingsOpen: false,
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),

  /* ── View & Mode ──────────────────────────────── */
  currentView: 'selection',
  activeMode: null,

  /** Set the current view. */
  setView: (view) => set({ currentView: view }),

  /** Set the active mode config. */
  setActiveMode: (mode) => set({ activeMode: mode }),

  /**
   * Start a conversation session with a given mode config.
   * Switches view to 'conversation' and resets messages.
   * @param {ModeConfig} modeConfig
   */
  startSession: (modeConfig) =>
    set({
      activeMode: modeConfig,
      currentView: 'conversation',
      messages: [],
      sessionId: generateId(),
    }),

  /**
   * End the current session and return to mode selection.
   * Clears messages and resets active mode.
   */
  endSession: () =>
    set({
      currentView: 'selection',
      activeMode: null,
      messages: [],
    }),

  /**
   * Advance the script line counter (for script mode).
   */
  advanceScriptLine: () =>
    set((state) => {
      if (!state.activeMode?.scriptConfig) return state;
      return {
        activeMode: {
          ...state.activeMode,
          scriptConfig: {
            ...state.activeMode.scriptConfig,
            currentLine: state.activeMode.scriptConfig.currentLine + 1,
          },
        },
      };
    }),

  /* ── Theme ────────────────────────────────────── */
  theme: loadTheme(),

  /** Toggle between light and dark themes. */
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    }),

  /* ── Session ──────────────────────────────────── */
  sessionId: generateId(),
}));

export default useAppStore;
