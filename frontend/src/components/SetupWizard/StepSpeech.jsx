import React from 'react';

const VOICES = [
  { value: 'af_heart',   label: 'af_heart   — Warm, natural female (EN)' },
  { value: 'af_bella',   label: 'af_bella   — Bright female (EN)' },
  { value: 'af_nicole',  label: 'af_nicole  — Soft female (EN)' },
  { value: 'am_adam',    label: 'am_adam    — Neutral male (EN)' },
  { value: 'am_michael', label: 'am_michael — Deep male (EN)' },
  { value: 'bf_emma',    label: 'bf_emma    — British female (EN)' },
  { value: 'bm_george',  label: 'bm_george  — British male (EN)' },
];

export default function StepSpeech({ data, onChange }) {
  return (
    <>
      <div className="sw-section">
        <div className="sw-section-title">Text-to-Speech (Kokoro)</div>
        <div className="sw-field-group">
          <div className="sw-field">
            <label className="sw-field-label">KOKORO_URL</label>
            <input
              className="sw-field-input"
              type="text"
              value={data.KOKORO_URL}
              onChange={(e) => onChange({ KOKORO_URL: e.target.value })}
              placeholder="http://kokoro:8880"
            />
            <span className="sw-field-hint">
              Kokoro FastAPI service URL — use service name when running with Docker Compose
            </span>
          </div>
          <div className="sw-field">
            <label className="sw-field-label">KOKORO_VOICE</label>
            <select
              className="sw-field-select"
              value={data.KOKORO_VOICE}
              onChange={(e) => onChange({ KOKORO_VOICE: e.target.value })}
            >
              {VOICES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sw-section">
        <div className="sw-section-title">Speech-to-Text</div>
        <div className="sw-option-grid" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`sw-option-card${data.STT_PROVIDER === 'webspeech' ? ' sw-option-card--selected' : ''}`}
            onClick={() => onChange({ STT_PROVIDER: 'webspeech' })}
          >
            <span className="sw-option-name">Web Speech API</span>
            <span className="sw-option-desc">Browser built-in, no server needed. Works on Chrome.</span>
          </button>
          <button
            type="button"
            className={`sw-option-card${data.STT_PROVIDER === 'whisper' ? ' sw-option-card--selected' : ''}`}
            onClick={() => onChange({ STT_PROVIDER: 'whisper' })}
          >
            <span className="sw-option-name">Whisper</span>
            <span className="sw-option-desc">Self-hosted Whisper service. Better accuracy, all browsers.</span>
          </button>
        </div>

        {data.STT_PROVIDER === 'whisper' && (
          <div className="sw-field-group" style={{ marginTop: 14 }}>
            <div className="sw-field">
              <label className="sw-field-label">WHISPER_URL</label>
              <input
                className="sw-field-input"
                type="text"
                value={data.WHISPER_URL}
                onChange={(e) => onChange({ WHISPER_URL: e.target.value })}
                placeholder="http://whisper:9000"
              />
              <span className="sw-field-hint">
                Faster-Whisper or compatible OpenAI-format service URL
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
