/**
 * @module websocket/handler
 * WebSocket message handler for LinguaAI.
 *
 * Message types (Client → Server):
 *   { type: 'message', text: string, sessionId: string, modeConfig?: ModeConfig }
 *   { type: 'clear', sessionId: string }
 *   { type: 'settings', provider: string, voice: string }
 *
 * Message types (Server → Client):
 *   { type: 'chunk', text: string }          — streaming AI chunk
 *   { type: 'done', fullText: string }       — stream complete
 *   { type: 'audio', data: base64string }    — TTS audio data
 *   { type: 'audio-unavailable' }            — TTS failed, show text fallback
 *   { type: 'error', message: string }       — error notification
 */

import config from '../config.js';
import { addMessage, getHistory, clearHistory } from '../services/conversation.js';
import { buildSystemPrompt } from '../services/prompt.js';

/* Provider imports */
import GeminiProvider from '../providers/gemini.js';
import OpenAIProvider from '../providers/openai.js';
import AnthropicProvider from '../providers/anthropic.js';
import GroqProvider from '../providers/groq.js';
import OllamaProvider from '../providers/ollama.js';
import LMStudioProvider from '../providers/lmstudio.js';

/**
 * Provider instances cache.
 * @type {Object<string, import('../providers/base.js').default>}
 */
const providers = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  groq: new GroqProvider(),
  ollama: new OllamaProvider(),
  lmstudio: new LMStudioProvider(),
};

/** Per-connection settings overrides */
const connectionSettings = new WeakMap();

/**
 * Get a provider instance by name.
 * @param {string} [name] — provider identifier, defaults to config.aiProvider
 * @returns {import('../providers/base.js').default}
 */
export function getProvider(name) {
  const providerName = name || config.aiProvider;
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  return provider;
}

/**
 * Send a JSON message to a WebSocket client.
 * @param {import('ws').WebSocket} ws
 * @param {Object} data
 */
function send(ws, data) {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * Fetch TTS audio from Kokoro and send it to the client as base64.
 * @param {import('ws').WebSocket} ws
 * @param {string} text — the text to synthesize
 * @param {string} [voice] — Kokoro voice name
 */
async function sendTTSAudio(ws, text, voice) {
  try {
    const selectedVoice = voice || config.kokoroVoice;
    const kokoroUrl = `${config.kokoroUrl}/v1/audio/speech`;

    const response = await fetch(kokoroUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      console.error(`[ws/tts] Kokoro error: ${response.status}`);
      send(ws, { type: 'audio-unavailable' });
      return;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    send(ws, { type: 'audio', data: base64 });
  } catch (error) {
    console.error('[ws/tts] TTS failed (graceful degradation):', error.message);
    send(ws, { type: 'audio-unavailable' });
  }
}

/**
 * Handle an incoming user message: stream AI response, then send TTS.
 * @param {import('ws').WebSocket} ws
 * @param {string} text — user's message
 * @param {string} sessionId
 * @param {Object} [modeConfig] — mode configuration from client
 */
async function handleMessage(ws, text, sessionId, modeConfig) {
  try {
    /* Ensure conversation has a system prompt (rebuilt per message for script position tracking) */
    const history = getHistory(sessionId);
    if (history.length === 0) {
      addMessage(sessionId, 'system', buildSystemPrompt(modeConfig));
    } else if (modeConfig?.type === 'script') {
      /* Update system prompt with current script position */
      const systemIdx = history.findIndex((m) => m.role === 'system');
      if (systemIdx >= 0) {
        history[systemIdx] = { role: 'system', content: buildSystemPrompt(modeConfig) };
      }
    }

    /* Add user message to history */
    addMessage(sessionId, 'user', text);
    const messages = getHistory(sessionId);

    /* Get appropriate provider */
    const settings = connectionSettings.get(ws) || {};
    const provider = getProvider(settings.provider);

    /* Stream the AI response */
    let fullText = '';
    for await (const chunk of provider.stream(messages)) {
      fullText += chunk;
      send(ws, { type: 'chunk', text: chunk });
    }

    /* Store assistant response in history */
    addMessage(sessionId, 'assistant', fullText);

    /* Notify client that streaming is complete */
    send(ws, { type: 'done', fullText });

    /* Generate TTS audio (non-blocking — fire and forget) */
    const voice = settings.voice || config.kokoroVoice;
    sendTTSAudio(ws, fullText, voice);
  } catch (error) {
    console.error('[ws] Message handling error:', error.message);
    send(ws, { type: 'error', message: error.message });
  }
}

/**
 * Initialize WebSocket handling on the given server.
 * @param {import('ws').WebSocketServer} wss
 */
export function initWebSocket(wss) {
  wss.on('connection', (ws) => {
    console.log('[ws] Client connected');

    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'error', message: 'Invalid JSON message.' });
        return;
      }

      switch (data.type) {
        case 'message':
          if (!data.text || !data.sessionId) {
            send(ws, { type: 'error', message: 'Missing "text" or "sessionId".' });
            return;
          }
          handleMessage(ws, data.text, data.sessionId, data.modeConfig);
          break;

        case 'clear':
          if (data.sessionId) {
            clearHistory(data.sessionId);
            send(ws, { type: 'done', fullText: '' });
          }
          break;

        case 'settings':
          connectionSettings.set(ws, {
            provider: data.provider || config.aiProvider,
            voice: data.voice || config.kokoroVoice,
          });
          break;

        default:
          send(ws, { type: 'error', message: `Unknown message type: ${data.type}` });
      }
    });

    ws.on('close', () => {
      console.log('[ws] Client disconnected');
      connectionSettings.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[ws] WebSocket error:', error.message);
    });
  });
}

export default { initWebSocket, getProvider };
