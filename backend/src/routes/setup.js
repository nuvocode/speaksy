import { Router } from 'express';
import config, { validateConfig } from '../config.js';
import {
  isSetupRequired,
  getConfigDefaults,
  writeConfigFile,
  readConfigFile,
  applyConfigFile,
} from '../services/setupService.js';
import { reinitProviders } from '../websocket/handler.js';

import GeminiProvider    from '../providers/gemini.js';
import OpenAIProvider    from '../providers/openai.js';
import AnthropicProvider from '../providers/anthropic.js';
import GroqProvider      from '../providers/groq.js';
import OllamaProvider    from '../providers/ollama.js';
import LMStudioProvider  from '../providers/lmstudio.js';

const router = Router();

const PROVIDER_CLASSES = {
  gemini:    GeminiProvider,
  openai:    OpenAIProvider,
  anthropic: AnthropicProvider,
  groq:      GroqProvider,
  ollama:    OllamaProvider,
  lmstudio:  LMStudioProvider,
};

/** Maps provider name → which config field holds its credential/URL for testing. */
const PROVIDER_TEST_FIELD = {
  gemini:    'geminiApiKey',
  openai:    'openaiApiKey',
  anthropic: 'anthropicApiKey',
  groq:      'groqApiKey',
  ollama:    'ollamaBaseUrl',
  lmstudio:  'lmstudioBaseUrl',
};

// GET /api/setup/status
router.get('/status', (_req, res) => {
  res.json({
    setupRequired: isSetupRequired(),
    defaults: getConfigDefaults(),
  });
});

// POST /api/setup/save
router.post('/save', (req, res) => {
  try {
    const data = req.body;
    if (!data?.AI_PROVIDER) {
      return res.status(400).json({ success: false, error: 'AI_PROVIDER is required.' });
    }
    writeConfigFile(data);
    applyConfigFile(readConfigFile());
    validateConfig();
    reinitProviders();
    res.json({ success: true });
  } catch (err) {
    console.error('[setup] Save error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/setup/test-provider
// Body: { provider, apiKey?, baseUrl?, model? }
router.post('/test-provider', async (req, res) => {
  const { provider, apiKey, baseUrl, model } = req.body || {};
  const ProviderClass = PROVIDER_CLASSES[provider];
  if (!ProviderClass) {
    return res.json({ available: false, error: `Unknown provider: ${provider}` });
  }

  const configField = PROVIDER_TEST_FIELD[provider];
  const origValue   = configField ? config[configField] : undefined;

  // Temporarily apply candidate credential/URL so the new instance uses it
  if (configField) {
    if (provider === 'ollama' || provider === 'lmstudio') {
      config[configField] = baseUrl || origValue;
    } else {
      config[configField] = apiKey || origValue;
    }
  }

  try {
    const instance  = new ProviderClass();
    const available = await instance.isAvailable(model ? { model } : {});
    res.json({ available, provider });
  } catch (err) {
    res.json({ available: false, provider, error: err.message });
  } finally {
    if (configField && origValue !== undefined) config[configField] = origValue;
  }
});

export default router;
