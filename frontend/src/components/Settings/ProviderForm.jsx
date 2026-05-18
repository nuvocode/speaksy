/**
 * @module components/Settings/ProviderForm
 * AI provider configuration form — Nuvo Code dark design language.
 */

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore.js';

const AI_PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', requiresKey: true },
  { value: 'openai', label: 'OpenAI', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic Claude', requiresKey: true },
  { value: 'groq', label: 'Groq', requiresKey: true },
  { value: 'ollama', label: 'Ollama (Local)', requiresKey: false },
  { value: 'lmstudio', label: 'LM Studio (Local)', requiresKey: false },
];

const STT_PROVIDERS = [
  { value: 'webspeech', label: 'Browser (Web Speech)' },
  { value: 'whisper', label: 'Whisper (Local)' },
];

const VOICES = [
  { value: 'af_heart', label: 'Heart (Female)' },
  { value: 'af_bella', label: 'Bella (Female)' },
  { value: 'af_sarah', label: 'Sarah (Female)' },
  { value: 'am_adam', label: 'Adam (Male)' },
];

const API_KEY_FIELDS = {
  gemini: 'geminiApiKey',
  openai: 'openaiApiKey',
  anthropic: 'anthropicApiKey',
  groq: 'groqApiKey',
};

const CHEVRON_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2352525b' d='M6 8L1 3h10z'/%3E%3C/svg%3E";

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  sectionHeader: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t4)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    paddingBottom: 'var(--space-1)',
    borderBottom: '1px solid var(--color-b1)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t2)',
  },
  sublabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-t4)',
    marginTop: '-4px',
  },
  select: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-t1)',
    backgroundColor: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color var(--duration-fast) var(--ease-out)',
    appearance: 'none',
    backgroundImage: `url("${CHEVRON_SVG}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 'var(--space-10)',
  },
  input: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-t1)',
    backgroundColor: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color var(--duration-fast) var(--ease-out)',
  },
  testButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-5)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-semibold)',
    color: '#ffffff',
    background: 'var(--grad)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'opacity var(--duration-fast) var(--ease-out)',
    letterSpacing: '-0.01em',
    minHeight: 'auto',
  },
  testResult: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 'var(--weight-medium)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    letterSpacing: '0.02em',
  },
  helperText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
    lineHeight: 'var(--leading-normal)',
    letterSpacing: '0.02em',
  },
  divider: {
    width: '100%',
    height: 1,
    background: 'linear-gradient(90deg, transparent, var(--color-b3), transparent)',
  },
};

export default function ProviderForm() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [modelsStatus, setModelsStatus] = useState('idle');
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
        const response = await fetch(`/api/chat/models?provider=${encodeURIComponent(settings.aiProvider)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load models.');
        const models = Array.isArray(data.models) ? data.models : [];
        if (cancelled) return;
        setModelOptions(models);
        setModelsStatus('success');
        if (models.length === 0) {
          setModelsMessage('No models returned for this provider.');
          if (settings.aiModel) updateSettings({ aiModel: '' });
          return;
        }
        const hasCurrentModel = models.some((m) => m.id === settings.aiModel);
        const hasDefaultModel = models.some((m) => m.id === data.selectedModel);
        const nextModel = hasCurrentModel ? settings.aiModel : hasDefaultModel ? data.selectedModel : models[0].id;
        if (nextModel !== settings.aiModel) updateSettings({ aiModel: nextModel });
      } catch (error) {
        if (cancelled) return;
        setModelOptions([]);
        setModelsStatus('error');
        setModelsMessage(error.message);
        if (settings.aiModel) updateSettings({ aiModel: '' });
      }
    };
    loadModels();
    return () => { cancelled = true; };
  }, [settings.aiProvider, updateSettings]);

  const handleProviderChange = useCallback((e) => {
    updateSettings({ aiProvider: e.target.value, aiModel: '' });
    setTestStatus(null);
  }, [updateSettings]);

  const handleApiKeyChange = useCallback((e) => {
    if (apiKeyField) updateSettings({ [apiKeyField]: e.target.value });
  }, [updateSettings, apiKeyField]);

  const handleTestConnection = useCallback(async () => {
    setTestStatus('loading');
    setTestMessage('Testing connection...');
    try {
      const response = await fetch(`/api/chat/health?provider=${encodeURIComponent(settings.aiProvider)}&model=${encodeURIComponent(settings.aiModel || '')}`);
      const data = await response.json();
      if (data.available) {
        setTestStatus('success');
        setTestMessage(`✓ ${data.provider} is available`);
      } else {
        setTestStatus('error');
        setTestMessage(`✗ ${data.provider} unreachable${data.error ? `: ${data.error}` : ''}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`✗ ${error.message}`);
    }
  }, [settings.aiProvider, settings.aiModel]);

  const focusBorder = (e) => { e.target.style.borderColor = 'rgba(168,85,247,.5)'; };
  const blurBorder = (e) => { e.target.style.borderColor = 'var(--color-b2)'; };

  return (
    <div style={styles.form}>
      {/* AI Section */}
      <div style={styles.section}>
        <span style={styles.sectionHeader}>AI Provider</span>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="ai-provider">Provider</label>
          <select
            id="ai-provider"
            style={styles.select}
            value={settings.aiProvider}
            onChange={handleProviderChange}
            onFocus={focusBorder}
            onBlur={blurBorder}
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {selectedProviderConfig?.requiresKey && apiKeyField && (
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="api-key">API Key</label>
            <p style={styles.sublabel}>Required for {selectedProviderConfig.label}</p>
            <input
              id="api-key"
              type="password"
              style={styles.input}
              value={settings[apiKeyField] || ''}
              onChange={handleApiKeyChange}
              placeholder="Enter your API key"
              autoComplete="off"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="ai-model">Model</label>
          <select
            id="ai-model"
            style={styles.select}
            value={settings.aiModel || ''}
            onChange={(e) => updateSettings({ aiModel: e.target.value })}
            disabled={modelsStatus === 'loading' || modelOptions.length === 0}
            onFocus={focusBorder}
            onBlur={blurBorder}
          >
            {modelsStatus === 'loading' && <option value="">Loading models...</option>}
            {modelsStatus !== 'loading' && modelOptions.length === 0 && <option value="">No models available</option>}
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>{model.label || model.id}</option>
            ))}
          </select>
          {modelsMessage && (
            <div style={{
              ...styles.helperText,
              color: modelsStatus === 'error' ? 'var(--color-red)' : 'var(--color-t4)',
            }}>
              {modelsMessage}
            </div>
          )}
        </div>

        <div style={styles.fieldGroup}>
          <button
            style={{ ...styles.testButton, opacity: testStatus === 'loading' ? 0.6 : 1, cursor: testStatus === 'loading' ? 'wait' : 'pointer' }}
            onClick={handleTestConnection}
            disabled={testStatus === 'loading'}
          >
            {testStatus === 'loading' ? 'Testing...' : 'Test Connection'}
          </button>
          {testStatus && testStatus !== 'loading' && (
            <div style={{
              ...styles.testResult,
              backgroundColor: testStatus === 'success' ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)',
              border: `1px solid ${testStatus === 'success' ? 'rgba(74,222,128,.25)' : 'rgba(248,113,113,.25)'}`,
              color: testStatus === 'success' ? 'var(--color-green)' : 'var(--color-red)',
            }}>
              {testMessage}
            </div>
          )}
        </div>
      </div>

      <div style={styles.divider} />

      {/* STT Section */}
      <div style={styles.section}>
        <span style={styles.sectionHeader}>Speech Recognition</span>
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="stt-provider">Provider</label>
          <select
            id="stt-provider"
            style={styles.select}
            value={settings.sttProvider}
            onChange={(e) => updateSettings({ sttProvider: e.target.value })}
            onFocus={focusBorder}
            onBlur={blurBorder}
          >
            {STT_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Voice Section */}
      <div style={styles.section}>
        <span style={styles.sectionHeader}>AI Voice</span>
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="voice-select">Voice</label>
          <select
            id="voice-select"
            style={styles.select}
            value={settings.voice}
            onChange={(e) => updateSettings({ voice: e.target.value })}
            onFocus={focusBorder}
            onBlur={blurBorder}
          >
            {VOICES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
