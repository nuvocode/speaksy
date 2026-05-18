import React, { useState } from 'react';

const CLOUD_KEY_FIELD = {
  openai:    'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini:    'GEMINI_API_KEY',
  groq:      'GROQ_API_KEY',
};

function mask(value) {
  if (!value || value.length < 8) return value ? '••••••••' : '(not set)';
  return value.slice(0, 4) + '••••••••';
}

function SummaryRow({ label, value, masked = false }) {
  return (
    <div className="sw-summary-row">
      <span className="sw-summary-key">{label}</span>
      <span className="sw-summary-eq">=</span>
      <span className={masked ? 'sw-summary-value sw-summary-value--masked' : 'sw-summary-value'}>
        "{masked ? mask(value) : (value || '(not set)')}"
      </span>
    </div>
  );
}

export default function StepConfirm({ data, error, saving }) {
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null);

  const isCloud  = ['openai', 'anthropic', 'gemini', 'groq'].includes(data.AI_PROVIDER);
  const isOllama = data.AI_PROVIDER === 'ollama';
  const isLMStudio = data.AI_PROVIDER === 'lmstudio';

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const body = { provider: data.AI_PROVIDER };
      if (isCloud)    body.apiKey = data[CLOUD_KEY_FIELD[data.AI_PROVIDER]];
      if (isOllama)   { body.baseUrl = data.OLLAMA_BASE_URL;   body.model = data.OLLAMA_MODEL; }
      if (isLMStudio) { body.baseUrl = data.LMSTUDIO_BASE_URL; body.model = data.LMSTUDIO_MODEL; }

      const res  = await fetch('/api/setup/test-provider', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      setTestResult(json);
    } catch (e) {
      setTestResult({ available: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {error && <div className="sw-error-banner">Error: {error}</div>}

      <div className="sw-summary">
        <div className="sw-summary-comment"># AI Provider</div>
        <SummaryRow label="AI_PROVIDER" value={data.AI_PROVIDER} />

        {isCloud && (
          <SummaryRow label={CLOUD_KEY_FIELD[data.AI_PROVIDER]}
                      value={data[CLOUD_KEY_FIELD[data.AI_PROVIDER]]} masked />
        )}
        {isOllama && (
          <>
            <SummaryRow label="OLLAMA_BASE_URL" value={data.OLLAMA_BASE_URL} />
            <SummaryRow label="OLLAMA_MODEL"    value={data.OLLAMA_MODEL} />
          </>
        )}
        {isLMStudio && (
          <>
            <SummaryRow label="LMSTUDIO_BASE_URL" value={data.LMSTUDIO_BASE_URL} />
            <SummaryRow label="LMSTUDIO_MODEL"    value={data.LMSTUDIO_MODEL} />
          </>
        )}

        <div className="sw-summary-spacer" />
        <div className="sw-summary-comment"># Speech</div>
        <SummaryRow label="KOKORO_URL"   value={data.KOKORO_URL} />
        <SummaryRow label="KOKORO_VOICE" value={data.KOKORO_VOICE} />
        <SummaryRow label="STT_PROVIDER" value={data.STT_PROVIDER} />
        {data.STT_PROVIDER === 'whisper' && (
          <SummaryRow label="WHISPER_URL" value={data.WHISPER_URL} />
        )}
      </div>

      <div className="sw-test-row">
        <button
          type="button"
          className="sw-btn-test"
          onClick={handleTest}
          disabled={testing || saving}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult && (
          <div className={`sw-test-result ${testResult.available
            ? 'sw-test-result--success'
            : 'sw-test-result--error'}`}>
            {testResult.available
              ? `✓ ${data.AI_PROVIDER} reachable`
              : `✗ ${testResult.error || 'Unreachable'}`}
          </div>
        )}
      </div>
    </>
  );
}
