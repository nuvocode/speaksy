import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import config from '../config.js';

const DATA_DIR    = process.env.DATA_DIR || '/app/data';
const CONFIG_PATH = join(DATA_DIR, 'config.json');

const CLOUD_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq'];

const KEY_MAP = {
  openai:    'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini:    'GEMINI_API_KEY',
  groq:      'GROQ_API_KEY',
};

export const CONFIG_FIELD_MAP = {
  AI_PROVIDER:       'aiProvider',
  GEMINI_API_KEY:    'geminiApiKey',
  OPENAI_API_KEY:    'openaiApiKey',
  ANTHROPIC_API_KEY: 'anthropicApiKey',
  GROQ_API_KEY:      'groqApiKey',
  OLLAMA_BASE_URL:   'ollamaBaseUrl',
  OLLAMA_MODEL:      'ollamaModel',
  LMSTUDIO_BASE_URL: 'lmstudioBaseUrl',
  LMSTUDIO_MODEL:    'lmstudioModel',
  STT_PROVIDER:      'sttProvider',
  WHISPER_URL:       'whisperUrl',
  KOKORO_URL:        'kokoroUrl',
  KOKORO_VOICE:      'kokoroVoice',
};

export function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function configFileExists() {
  return existsSync(CONFIG_PATH);
}

export function readConfigFile() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function writeConfigFile(data) {
  ensureDataDir();
  writeFileSync(
    CONFIG_PATH,
    JSON.stringify({ _version: 1, _createdAt: new Date().toISOString(), ...data }, null, 2),
    'utf8'
  );
}

export function isSetupRequired() {
  if (!configFileExists()) return true;
  const data = readConfigFile();
  if (!data?.AI_PROVIDER) return true;
  if (CLOUD_PROVIDERS.includes(data.AI_PROVIDER)) {
    const key = KEY_MAP[data.AI_PROVIDER];
    if (!data[key]) return true;
  }
  return false;
}

/** Returns all current config values so the wizard can pre-fill from env vars. */
export function getConfigDefaults() {
  return Object.fromEntries(
    Object.entries(CONFIG_FIELD_MAP).map(([envKey, configKey]) => [envKey, config[configKey] || ''])
  );
}

/** Merges saved file values onto the live in-memory config object. */
export function applyConfigFile(data) {
  if (!data) return;
  for (const [fileKey, configKey] of Object.entries(CONFIG_FIELD_MAP)) {
    if (data[fileKey] !== undefined && data[fileKey] !== '') {
      config[configKey] = data[fileKey];
    }
  }
}
