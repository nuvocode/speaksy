/**
 * @module config
 * Central configuration module for Speaksy backend.
 * Reads and validates all environment variables.
 */

import 'dotenv/config';

/** Supported AI provider identifiers */
const VALID_AI_PROVIDERS = ['gemini', 'openai', 'anthropic', 'groq', 'ollama', 'lmstudio'];

/** Supported STT provider identifiers */
const VALID_STT_PROVIDERS = ['webspeech', 'whisper'];

/**
 * Application configuration derived from environment variables.
 * @type {Object}
 */
const config = {
  /** Server port */
  port: parseInt(process.env.PORT || '3001', 10),

  /** Selected AI provider */
  aiProvider: process.env.AI_PROVIDER || 'ollama',

  /** Selected STT provider */
  sttProvider: process.env.STT_PROVIDER || 'webspeech',

  /** API keys for cloud providers */
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',

  /** Local provider base URLs */
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',

  lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234',
  lmstudioModel: process.env.LMSTUDIO_MODEL || 'local-model',

  /** Whisper STT service URL */
  whisperUrl: process.env.WHISPER_URL || 'http://whisper:9000',

  /** Kokoro TTS settings */
  kokoroUrl: process.env.KOKORO_URL || 'http://kokoro:8880',
  kokoroVoice: process.env.KOKORO_VOICE || 'af_heart',
};

/**
 * Validates the configuration and logs warnings for missing values.
 * @returns {void}
 */
export function validateConfig() {
  if (!VALID_AI_PROVIDERS.includes(config.aiProvider)) {
    console.warn(
      `[config] Invalid AI_PROVIDER "${config.aiProvider}". ` +
      `Valid options: ${VALID_AI_PROVIDERS.join(', ')}. Falling back to "ollama".`
    );
    config.aiProvider = 'ollama';
  }

  if (!VALID_STT_PROVIDERS.includes(config.sttProvider)) {
    console.warn(
      `[config] Invalid STT_PROVIDER "${config.sttProvider}". ` +
      `Valid options: ${VALID_STT_PROVIDERS.join(', ')}. Falling back to "webspeech".`
    );
    config.sttProvider = 'webspeech';
  }

  /* Check that the selected cloud provider has an API key */
  const keyMap = {
    gemini: 'geminiApiKey',
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    groq: 'groqApiKey',
  };

  const requiredKey = keyMap[config.aiProvider];
  if (requiredKey && !config[requiredKey]) {
    console.warn(
      `[config] AI_PROVIDER is "${config.aiProvider}" but no API key is set. ` +
      `Please set the corresponding environment variable.`
    );
  }
}

export default config;
