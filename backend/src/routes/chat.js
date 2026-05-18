/**
 * @module routes/chat
 * REST endpoint for non-WebSocket chat interactions and provider health checks.
 * GET  /api/chat/health  → check if the selected provider is reachable
 * POST /api/chat         → send a message and get a full (non-streaming) response
 */

import { Router } from 'express';
import { getProvider } from '../websocket/handler.js';
import { addMessage, getHistory } from '../services/conversation.js';
import { buildSystemPrompt } from '../services/prompt.js';

const router = Router();

/**
 * Health check for the currently configured AI provider.
 */
router.get('/health', async (req, res) => {
  try {
    const provider = getProvider(req.query.provider);
    const available = await provider.isAvailable({ model: req.query.model });
    res.json({ provider: provider.name, available });
  } catch (error) {
    res.json({ provider: req.query.provider || 'unknown', available: false, error: error.message });
  }
});

/**
 * Available model list for the selected provider.
 */
router.get('/models', async (req, res) => {
  try {
    const provider = getProvider(req.query.provider);
    const models = await provider.listModels();
    res.json({
      provider: provider.name,
      selectedModel: provider.model || '',
      models,
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'unknown',
      models: [],
      error: error.message,
    });
  }
});

/**
 * Non-streaming chat endpoint (useful for testing).
 * Body: { text, sessionId }
 */
router.post('/', async (req, res) => {
  try {
    const {
      text,
      sessionId = 'rest-default',
      provider: providerName,
      model,
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body.' });
    }

    /* Ensure system prompt is in history */
    const history = getHistory(sessionId);
    if (history.length === 0) {
      addMessage(sessionId, 'system', buildSystemPrompt());
    }

    addMessage(sessionId, 'user', text);
    const messages = getHistory(sessionId);

    const provider = getProvider(providerName);
    const reply = await provider.chat(messages, model ? { model } : {});

    addMessage(sessionId, 'assistant', reply);
    res.json({ reply });
  } catch (error) {
    console.error('[chat] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
