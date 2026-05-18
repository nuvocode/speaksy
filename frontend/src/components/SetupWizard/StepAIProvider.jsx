import React from 'react';

const PROVIDERS = [
  { value: 'ollama',    label: 'Ollama',    badge: 'LOCAL', desc: 'Self-hosted, privacy-first' },
  { value: 'lmstudio', label: 'LM Studio', badge: 'LOCAL', desc: 'GUI-based local inference' },
  { value: 'openai',   label: 'OpenAI',    badge: 'CLOUD', desc: 'GPT-4o, GPT-4 mini' },
  { value: 'anthropic',label: 'Anthropic', badge: 'CLOUD', desc: 'Claude 3.5 Sonnet, Haiku' },
  { value: 'gemini',   label: 'Gemini',    badge: 'CLOUD', desc: 'Flash, Pro models' },
  { value: 'groq',     label: 'Groq',      badge: 'CLOUD', desc: 'Ultra-fast inference' },
];

const CLOUD_FIELDS = {
  openai:    { label: 'OPENAI_API_KEY',    key: 'OPENAI_API_KEY',    placeholder: 'sk-...' },
  anthropic: { label: 'ANTHROPIC_API_KEY', key: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...' },
  gemini:    { label: 'GEMINI_API_KEY',    key: 'GEMINI_API_KEY',    placeholder: 'AIza...' },
  groq:      { label: 'GROQ_API_KEY',      key: 'GROQ_API_KEY',      placeholder: 'gsk_...' },
};

export default function StepAIProvider({ data, onChange }) {
  const selected = data.AI_PROVIDER;
  const isCloud  = ['openai', 'anthropic', 'gemini', 'groq'].includes(selected);
  const isLocal  = selected === 'ollama' || selected === 'lmstudio';

  return (
    <>
      <div className="sw-provider-grid">
        {PROVIDERS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`sw-provider-card${selected === p.value ? ' sw-provider-card--selected' : ''}`}
            onClick={() => onChange({ AI_PROVIDER: p.value })}
          >
            <div className="sw-provider-header">
              <span className="sw-provider-name">{p.label}</span>
              <span className={`sw-provider-badge sw-provider-badge--${p.badge.toLowerCase()}`}>
                {p.badge}
              </span>
            </div>
            <span className="sw-provider-desc">{p.desc}</span>
          </button>
        ))}
      </div>

      {isCloud && (
        <div>
          <div className="sw-fields-label">API Credentials</div>
          <div className="sw-field-group">
            <div className="sw-field">
              <label className="sw-field-label">{CLOUD_FIELDS[selected].label}</label>
              <input
                className="sw-field-input"
                type="password"
                value={data[CLOUD_FIELDS[selected].key]}
                onChange={(e) => onChange({ [CLOUD_FIELDS[selected].key]: e.target.value })}
                placeholder={CLOUD_FIELDS[selected].placeholder}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      )}

      {isLocal && (
        <div>
          <div className="sw-fields-label">
            {selected === 'ollama' ? 'Ollama' : 'LM Studio'} Connection
          </div>
          <div className="sw-field-group">
            {selected === 'ollama' && (
              <>
                <div className="sw-field">
                  <label className="sw-field-label">OLLAMA_BASE_URL</label>
                  <input
                    className="sw-field-input"
                    type="text"
                    value={data.OLLAMA_BASE_URL}
                    onChange={(e) => onChange({ OLLAMA_BASE_URL: e.target.value })}
                    placeholder="http://host.docker.internal:11434"
                  />
                  <span className="sw-field-hint">
                    Use host.docker.internal when running inside Docker
                  </span>
                </div>
                <div className="sw-field">
                  <label className="sw-field-label">OLLAMA_MODEL</label>
                  <input
                    className="sw-field-input"
                    type="text"
                    value={data.OLLAMA_MODEL}
                    onChange={(e) => onChange({ OLLAMA_MODEL: e.target.value })}
                    placeholder="llama3.2"
                  />
                </div>
              </>
            )}
            {selected === 'lmstudio' && (
              <>
                <div className="sw-field">
                  <label className="sw-field-label">LMSTUDIO_BASE_URL</label>
                  <input
                    className="sw-field-input"
                    type="text"
                    value={data.LMSTUDIO_BASE_URL}
                    onChange={(e) => onChange({ LMSTUDIO_BASE_URL: e.target.value })}
                    placeholder="http://host.docker.internal:1234"
                  />
                  <span className="sw-field-hint">
                    Use host.docker.internal when running inside Docker
                  </span>
                </div>
                <div className="sw-field">
                  <label className="sw-field-label">LMSTUDIO_MODEL</label>
                  <input
                    className="sw-field-input"
                    type="text"
                    value={data.LMSTUDIO_MODEL}
                    onChange={(e) => onChange({ LMSTUDIO_MODEL: e.target.value })}
                    placeholder="local-model"
                  />
                  <span className="sw-field-hint">
                    Use the model identifier shown in LM Studio
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
