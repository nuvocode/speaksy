import React, { useState } from 'react';
import './setup.css';
import StepAIProvider from './StepAIProvider.jsx';
import StepSpeech     from './StepSpeech.jsx';
import StepConfirm    from './StepConfirm.jsx';
import useAppStore    from '../../store/appStore.js';
import { connect }    from '../../lib/wsClient.js';

const STEPS = [
  { label: 'AI Provider', title: 'Choose your AI backend' },
  { label: 'Speech',      title: 'Configure voice & speech' },
  { label: 'Confirm',     title: 'Review and finish' },
];

const CLOUD_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq'];
const KEY_MAP = {
  openai:    'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini:    'GEMINI_API_KEY',
  groq:      'GROQ_API_KEY',
};

function getWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export default function SetupWizard({ defaults = {} }) {
  const setSetupRequired = useAppStore((s) => s.setSetupRequired);
  const setView          = useAppStore((s) => s.setView);

  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [formData, setFormData] = useState({
    AI_PROVIDER:       defaults.AI_PROVIDER       || 'ollama',
    OLLAMA_BASE_URL:   defaults.OLLAMA_BASE_URL   || 'http://host.docker.internal:11434',
    OLLAMA_MODEL:      defaults.OLLAMA_MODEL       || 'llama3.2',
    LMSTUDIO_BASE_URL: defaults.LMSTUDIO_BASE_URL || 'http://host.docker.internal:1234',
    LMSTUDIO_MODEL:    defaults.LMSTUDIO_MODEL     || 'local-model',
    GEMINI_API_KEY:    defaults.GEMINI_API_KEY     || '',
    OPENAI_API_KEY:    defaults.OPENAI_API_KEY     || '',
    ANTHROPIC_API_KEY: defaults.ANTHROPIC_API_KEY  || '',
    GROQ_API_KEY:      defaults.GROQ_API_KEY       || '',
    STT_PROVIDER:      defaults.STT_PROVIDER       || 'webspeech',
    WHISPER_URL:       defaults.WHISPER_URL        || 'http://whisper:9000',
    KOKORO_URL:        defaults.KOKORO_URL         || 'http://kokoro:8880',
    KOKORO_VOICE:      defaults.KOKORO_VOICE       || 'af_heart',
  });

  const updateFormData = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const canNext = () => {
    if (step === 0) {
      if (CLOUD_PROVIDERS.includes(formData.AI_PROVIDER)) {
        return !!formData[KEY_MAP[formData.AI_PROVIDER]];
      }
      return true;
    }
    if (step === 1) {
      if (formData.STT_PROVIDER === 'whisper') return !!formData.WHISPER_URL;
      return true;
    }
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/setup/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setSetupRequired(false);
      setView('selection');
      connect(getWsUrl());
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sw-root">
      <div className="sw-brand">
        <div className="sw-brand-dot" />
        <span className="sw-brand-name">Speaksy Setup</span>
      </div>

      <div className="sw-progress" role="progressbar"
           aria-valuenow={step + 1} aria-valuemax={STEPS.length}>
        {STEPS.map((s, i) => (
          <div key={i} className={[
            'sw-progress-step',
            i < step  ? 'sw-progress-step--done'   : '',
            i === step ? 'sw-progress-step--active' : '',
          ].join(' ')}>
            <span className="sw-step-num">{i < step ? '✓' : i + 1}</span>
            <span className="sw-step-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="sw-card">
        <div className="sw-card-header">
          <span className="sw-step-badge">STEP {step + 1} / {STEPS.length}</span>
          <h1 className="sw-card-title">{STEPS[step].title}</h1>
        </div>

        <div className="sw-card-body">
          {step === 0 && <StepAIProvider data={formData} onChange={updateFormData} />}
          {step === 1 && <StepSpeech     data={formData} onChange={updateFormData} />}
          {step === 2 && (
            <StepConfirm data={formData} error={error} saving={saving} />
          )}
        </div>

        <div className="sw-card-footer">
          <button
            className="sw-btn sw-btn--ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              className="sw-btn sw-btn--primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
            >
              Next →
            </button>
          ) : (
            <button
              className="sw-btn sw-btn--finish"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
