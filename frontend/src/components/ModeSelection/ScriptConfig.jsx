/**
 * @module components/ModeSelection/ScriptConfig
 * Configuration panel for Script Based mode.
 *
 * @param {{ onConfigChange: function(scriptConfig) }} props
 */

import React, { useState, useRef } from 'react';
import { SCRIPTS } from '../../data/scripts.js';

const CUSTOM_SCRIPTS_KEY = 'speaksy-custom-scripts';

function loadCustomScripts() {
  try {
    const saved = localStorage.getItem(CUSTOM_SCRIPTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveCustomScripts(scripts) {
  try {
    localStorage.setItem(CUSTOM_SCRIPTS_KEY, JSON.stringify(scripts));
  } catch {}
}

function validateScripts(data) {
  if (!Array.isArray(data)) return false;
  return data.every(
    (s) =>
      typeof s.id === 'string' &&
      typeof s.title === 'string' &&
      Array.isArray(s.lines) &&
      s.lines.every((l) => (l.role === 'ai' || l.role === 'user') && typeof l.text === 'string')
  );
}

const SAMPLE_JSON = [
  {
    id: 'my-script-1',
    title: 'My Custom Script',
    description: 'A short example conversation',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    lines: [
      { role: 'ai', text: 'Hello! How are you today?' },
      { role: 'user', text: 'I am fine, thank you!' },
      { role: 'ai', text: 'Great to hear that. What brings you here?' },
      { role: 'user', text: 'I am here to practice my English.' },
    ],
  },
];

const DIFFICULTY_COLORS = {
  beginner: { color: 'var(--color-green)', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.25)' },
  intermediate: { color: 'var(--color-amber)', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.25)' },
  advanced: { color: 'var(--color-red)', bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.25)' },
};

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    height: '26vh'
  },
  sectionLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t4)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
  },
  importIconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-b2)',
    backgroundColor: 'transparent',
    color: 'var(--color-t4)',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 150ms, border-color 150ms, background-color 150ms',
    flexShrink: 0,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,.45)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--color-s1)',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    width: '360px',
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    boxShadow: '0 24px 48px rgba(0,0,0,.25)',
  },
  modalTitle: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-t1)',
    letterSpacing: '-0.01em',
  },
  modalDesc: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-t3)',
    lineHeight: 'var(--leading-normal)',
  },
  dropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-5)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px dashed var(--color-b3)',
    backgroundColor: 'var(--color-s2)',
    cursor: 'pointer',
    transition: 'border-color 150ms, background-color 150ms',
  },
  dropZoneText: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-t3)',
  },
  dropZoneHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    color: 'var(--color-t5)',
    letterSpacing: '.06em',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-2)',
  },
  sampleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-purple)',
    backgroundColor: 'rgba(168,85,247,.08)',
    border: '1px solid rgba(168,85,247,.2)',
    borderRadius: 'var(--radius-md)',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'background-color 150ms',
  },
  cancelBtn: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t3)',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-md)',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'color 150ms',
  },
  errorMsg: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-red)',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(248,113,113,.1)',
    border: '1px solid rgba(248,113,113,.2)',
  },
  customBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: '8px',
    fontWeight: 'var(--weight-medium)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--color-blue, #60a5fa)',
    backgroundColor: 'rgba(96,165,250,.1)',
    border: '1px solid rgba(96,165,250,.2)',
  },
  scriptList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    maxHeight: '340px',
    overflowY: 'auto',
  },
  scriptCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-b2)',
    backgroundColor: 'var(--color-s2)',
    cursor: 'pointer',
    transition: 'all 200ms var(--ease-out)',
    outline: 'none',
    textAlign: 'left',
    minHeight: 'auto',
  },
  scriptHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-2)',
  },
  scriptTitle: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-t1)',
    letterSpacing: '-0.01em',
  },
  scriptMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: 'var(--weight-medium)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    border: '1px solid',
  },
  duration: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
  },
  scriptDescription: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-t3)',
    lineHeight: 'var(--leading-normal)',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--color-b1)',
  },
  previewLine: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-t3)',
    lineHeight: 'var(--leading-normal)',
  },
  previewRole: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 'var(--weight-medium)',
    textTransform: 'uppercase',
    fontSize: '9px',
    letterSpacing: '0.08em',
  },
};

export default function ScriptConfig({ onConfigChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [customScripts, setCustomScripts] = useState(() => loadCustomScripts());
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const allScripts = [...customScripts, ...SCRIPTS];

  const handleSelect = (script) => {
    setSelectedId(script.id);
    onConfigChange({ scriptId: script.id, title: script.title, lines: script.lines, currentLine: 0 });
  };

  const handleDownloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (file) => {
    if (!file || file.type !== 'application/json') {
      setImportError('Please select a valid .json file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!validateScripts(data)) {
          setImportError('Invalid format. Each script needs id, title, and lines array.');
          return;
        }
        const withSource = data.map((s) => ({ ...s, _imported: true }));
        saveCustomScripts(withSource);
        setCustomScripts(withSource);
        setImportError('');
        setImportOpen(false);
      } catch {
        setImportError('Could not parse JSON. Make sure the file is valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileImport(file);
  };

  return (
    <div style={styles.container}>
      {importOpen && (
        <div style={styles.backdrop} onClick={() => { setImportOpen(false); setImportError(''); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <span style={styles.modalTitle}>Import Scripts</span>
            <p style={styles.modalDesc}>
              Upload a JSON file with your custom scripts. It must follow the same structure as the sample file.
            </p>

            <div
              style={{
                ...styles.dropZone,
                borderColor: dragOver ? 'rgba(168,85,247,.6)' : 'var(--color-b3)',
                backgroundColor: dragOver ? 'rgba(168,85,247,.05)' : 'var(--color-s2)',
              }}
              onClick={handleDropZoneClick}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-t4)' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={styles.dropZoneText}>Click or drag & drop a JSON file</span>
              <span style={styles.dropZoneHint}>.json only</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => handleFileImport(e.target.files?.[0])}
              />
            </div>

            {importError && <span style={styles.errorMsg}>{importError}</span>}

            <div style={styles.modalActions}>
              <button style={styles.sampleBtn} onClick={handleDownloadSample}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download sample.json
              </button>
              <button style={styles.cancelBtn} onClick={() => { setImportOpen(false); setImportError(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.sectionLabelRow}>
        <span style={styles.sectionLabel}>Choose a script</span>
        <button
          style={styles.importIconBtn}
          onClick={() => { setImportOpen(true); setImportError(''); }}
          title="Import scripts from JSON"
          aria-label="Import scripts"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>
      <div style={styles.scriptList}>
        {allScripts.map((script) => {
          const isActive = selectedId === script.id;
          const diff = DIFFICULTY_COLORS[script.difficulty] || DIFFICULTY_COLORS.beginner;

          return (
            <button
              key={script.id}
              style={{
                ...styles.scriptCard,
                borderColor: isActive ? 'rgba(168,85,247,.4)' : 'var(--color-b2)',
                backgroundColor: isActive ? 'rgba(168,85,247,.06)' : 'var(--color-s2)',
                boxShadow: isActive ? '0 0 0 1px rgba(168,85,247,.2)' : 'none',
              }}
              onClick={() => handleSelect(script)}
              tabIndex={0}
              role="radio"
              aria-checked={isActive}
              aria-label={`${script.title}: ${script.description}`}
            >
              <div style={styles.scriptHeader}>
                <span style={styles.scriptTitle}>{script.title}</span>
                <div style={styles.scriptMeta}>
                  {script._imported && (
                    <span style={styles.customBadge}>Custom</span>
                  )}
                  {script.difficulty && (
                    <span style={{
                      ...styles.badge,
                      color: diff.color,
                      backgroundColor: diff.bg,
                      borderColor: diff.border,
                    }}>
                      {DIFFICULTY_LABELS[script.difficulty] ?? script.difficulty}
                    </span>
                  )}
                  {script.estimatedMinutes && (
                    <span style={styles.duration}>~{script.estimatedMinutes}m</span>
                  )}
                </div>
              </div>
              <span style={styles.scriptDescription}>{script.description}</span>

              <div style={styles.preview}>
                {script.lines.slice(0, isActive ? script.lines.length : 2).map((line, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.previewLine,
                      filter: !isActive && i >= 2 ? 'blur(4px)' : 'none',
                    }}
                  >
                    <span style={{
                      ...styles.previewRole,
                      color: line.role === 'ai' ? 'var(--color-green)' : 'var(--color-purple)',
                    }}>
                      {line.role === 'ai' ? 'AI' : 'You'}:
                    </span>{' '}
                    {line.text}
                  </div>
                ))}
                {!isActive && script.lines.length > 2 && (
                  <div style={{ ...styles.previewLine, filter: 'blur(4px)', userSelect: 'none' }}>
                    {script.lines[2]?.role === 'ai' ? 'AI' : 'You'}: {script.lines[2]?.text}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
