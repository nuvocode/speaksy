/**
 * @module components/Settings/ProviderForm
 * Form for configuring AI provider, API key, STT, and voice settings.
 * Also includes a connection test button.
 */

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore.js';

/** Available AI providers with their configuration */
const AI_PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', requiresKey: true },
  { value: 'openai', label: 'OpenAI', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic Claude', requiresKey: true },
  { value: 'groq', label: 'Groq', requiresKey: true },
  { value: 'ollama', label: 'Ollama (Local)', requiresKey: false },
  { value: 'lmstudio', label: 'LM Studio (Local)', requiresKey: false },
];

/** STT provider options */
const STT_PROVIDERS = [
  { value: 'webspeech', label: 'Browser (Web Speech)' },
  { value: 'whisper', label: 'Whisper (Local)' },
];

/** Kokoro voice options */
const VOICES = [
  { value: 'af_heart', label: 'Heart (Female)' },
  { value: 'af_bella', label: 'Bella (Female)' },
  { value: 'af_sarah', label: 'Sarah (Female)' },
  { value: 'am_adam', label: 'Adam (Male)' },
];

/** API key field mapping per provider */
const API_KEY_FIELDS = {
  gemini: 'geminiApiKey',
  openai: 'openaiApiKey',
  anthropic: 'anthropicApiKey',
  groq: 'groqApiKey',
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-primary)',
  },
  sublabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
    marginTop: '-2px',
  },
  select: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-primary)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    cursor: 'pointer',
    transition: `border-color var(--duration-fast) var(--ease-out)`,
    appearance: 'none',
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%238E8E9A\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 'var(--space-10)',
  },
  input: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-primary)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    transition: `border-color var(--duration-fast) var(--ease-out)`,
  },
  testButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-6)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-surface)',
    backgroundColor: 'var(--color-accent)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: `opacity var(--duration-fast) var(--ease-out)`,
  },
  testResult: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    textAlign: 'center',
  },
  helperText: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
    lineHeight: 'var(--leading-normal)',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'var(--color-border)',
  },
};

/**
 * Provider configuration form.
 * @returns {React.ReactElement}
 */
export default function ProviderForm() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [testStatus, setTestStatus] = useState(null); /* null | 'loading' | 'success' | 'error' */
  const [testMessage, setTestMessage] = useState('');
  const [modelsStatus, setModelsStatus] = useState('idle'); /* idle | loading | success | error */
  const [modelsMessage, setModelsMessage] = useState('');
  const [modelOptions, setModelOptions] = useState([]);

  const selectedProviderConfig = AI_PROVIDERS.find((p) => p.value === settings.aiProvider);
  const apiKeyField = API_KEY_FIELDS[settings.aiProvider];

  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      setModelsStatus('loading');
      setModelsMessage('');

      try {
        const response = await fetch(
          `/api/chat/models?provider=${encodeURIComponent(settings.aiProvider)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load models.');
        }

        const models = Array.isArray(data.models) ? data.models : [];
        if (cancelled) return;

        setModelOptions(models);
        setModelsStatus('success');

        if (models.length === 0) {
          setModelsMessage('No models were returned for this provider.');
          if (settings.aiModel) updateSettings({ aiModel: '' });
          return;
        }

        const hasCurrentModel = models.some((model) => model.id === settings.aiModel);
        const hasDefaultModel = models.some((model) => model.id === data.selectedModel);
        const nextModel = hasCurrentModel
          ? settings.aiModel
          : hasDefaultModel
            ? data.selectedModel
            : models[0].id;

        if (nextModel !== settings.aiModel) {
          updateSettings({ aiModel: nextModel });
        }
      } catch (error) {
        if (cancelled) return;
        setModelOptions([]);
        setModelsStatus('error');
        setModelsMessage(error.message);
        if (settings.aiModel) updateSettings({ aiModel: '' });
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [settings.aiProvider, updateSettings]);

  /**
   * Handle provider change.
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleProviderChange = useCallback(
    (e) => {
      updateSettings({ aiProvider: e.target.value, aiModel: '' });
      setTestStatus(null);
    },
    [updateSettings]
  );

  /**
   * Handle API key change.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleApiKeyChange = useCallback(
    (e) => {
      if (apiKeyField) {
        updateSettings({ [apiKeyField]: e.target.value });
      }
    },
    [updateSettings, apiKeyField]
  );

  /**
   * Test the connection to the selected provider.
   */
  const handleTestConnection = useCallback(async () => {
    setTestStatus('loading');
    setTestMessage('Testing connection...');

    try {
      const response = await fetch(
        `/api/chat/health?provider=${encodeURIComponent(settings.aiProvider)}&model=${encodeURIComponent(settings.aiModel || '')}`
      );
      const data = await response.json();

      if (data.available) {
        setTestStatus('success');
        setTestMessage(`✓ ${data.provider} is available`);
      } else {
        setTestStatus('error');
        setTestMessage(`✗ ${data.provider} is not reachable${data.error ? `: ${data.error}` : ''}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`✗ Connection test failed: ${error.message}`);
    }
  }, [settings.aiProvider, settings.aiModel]);

  return (
    <div style={styles.form}>
      {/* AI Provider */}
      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="ai-provider">
          AI Provider
        </label>
        <select
          id="ai-provider"
          style={styles.select}
          value={settings.aiProvider}
          onChange={handleProviderChange}
          aria-label="Select AI provider"
        >
          {AI_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key (conditional) */}
      {selectedProviderConfig?.requiresKey && apiKeyField && (
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="api-key">
            API Key
          </label>
          <p style={styles.sublabel}>
            Required for {selectedProviderConfig.label}
          </p>
          <input
            id="api-key"
            type="password"
            style={styles.input}
            value={settings[apiKeyField] || ''}
            onChange={handleApiKeyChange}
            placeholder="Enter your API key"
            aria-label={`${selectedProviderConfig.label} API key`}
            autoComplete="off"
          />
        </div>
      )}

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="ai-model">
          AI Model
        </label>
        <p style={styles.sublabel}>
          Available models are loaded from the selected provider.
        </p>
        <select
          id="ai-model"
          style={styles.select}
          value={settings.aiModel || ''}
          onChange={(e) => updateSettings({ aiModel: e.target.value })}
          disabled={modelsStatus === 'loading' || modelOptions.length === 0}
          aria-label="Select AI model"
        >
          {modelsStatus === 'loading' && (
            <option value="">Loading models...</option>
          )}
          {modelsStatus !== 'loading' && modelOptions.length === 0 && (
            <option value="">No models available</option>
          )}
          {modelOptions.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label || model.id}
            </option>
          ))}
        </select>
        {modelsMessage && (
          <div
            style={{
              ...styles.helperText,
              color: modelsStatus === 'error' ? 'var(--color-error)' : 'var(--color-muted)',
            }}
          >
            {modelsMessage}
          </div>
        )}
      </div>

      {/* Connection Test */}
      <div style={styles.fieldGroup}>
        <button
          style={{
            ...styles.testButton,
            ...(testStatus === 'loading' && { opacity: 0.7, cursor: 'wait' }),
          }}
          onClick={handleTestConnection}
          disabled={testStatus === 'loading'}
          aria-label="Test provider connection"
        >
          {testStatus === 'loading' ? 'Testing...' : 'Test Connection'}
        </button>
        {testStatus && testStatus !== 'loading' && (
          <div
            style={{
              ...styles.testResult,
              backgroundColor:
                testStatus === 'success'
                  ? 'rgba(0, 200, 150, 0.1)'
                  : 'rgba(255, 71, 87, 0.1)',
              color:
                testStatus === 'success'
                  ? 'var(--color-success)'
                  : 'var(--color-error)',
            }}
          >
            {testMessage}
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* STT Provider */}
      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="stt-provider">
          Speech Recognition
        </label>
        <select
          id="stt-provider"
          style={styles.select}
          value={settings.sttProvider}
          onChange={(e) => updateSettings({ sttProvider: e.target.value })}
          aria-label="Select speech recognition provider"
        >
          {STT_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.divider} />

      {/* Voice Selection */}
      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="voice-select">
          AI Voice
        </label>
        <select
          id="voice-select"
          style={styles.select}
          value={settings.voice}
          onChange={(e) => updateSettings({ voice: e.target.value })}
          aria-label="Select AI voice"
        >
          {VOICES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
