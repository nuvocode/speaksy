/**
 * @module components/ModeSelection/ScriptConfig
 * Configuration panel for Script Based mode.
 * Renders a list of script cards with preview, difficulty badges,
 * and estimated duration.
 *
 * Ready for async loadScripts() pattern — currently uses sync import.
 *
 * @param {{ onConfigChange: function(scriptConfig) }} props
 */

import React, { useState } from 'react';
import { SCRIPTS } from '../../data/scripts.js';

/** Difficulty badge color mapping */
const DIFFICULTY_COLORS = {
  beginner: 'var(--color-ai)',
  intermediate: '#FFB347',
  advanced: 'var(--color-user)',
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
  },
  sectionLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-primary)',
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
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    cursor: 'pointer',
    transition: 'all 200ms var(--ease-out)',
    outline: 'none',
    textAlign: 'left',
  },
  scriptHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-2)',
  },
  scriptTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-primary)',
  },
  scriptMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-semibold)',
    color: '#FFFFFF',
    lineHeight: 1.4,
  },
  duration: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
  },
  scriptDescription: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-muted)',
    lineHeight: 'var(--leading-normal)',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--color-border)',
  },
  previewLine: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
    lineHeight: 'var(--leading-normal)',
  },
  previewRole: {
    fontWeight: 'var(--weight-semibold)',
    textTransform: 'uppercase',
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
  },
};

/**
 * ScriptConfig component.
 * @param {{ onConfigChange: function }} props
 * @returns {React.ReactElement}
 */
export default function ScriptConfig({ onConfigChange }) {
  const [selectedId, setSelectedId] = useState(null);

  /** Async-ready load pattern (currently sync) */
  const scripts = SCRIPTS;

  const handleSelect = (script) => {
    setSelectedId(script.id);
    onConfigChange({
      scriptId: script.id,
      title: script.title,
      lines: script.lines,
      currentLine: 0,
    });
  };

  return (
    <div style={styles.container}>
      <span style={styles.sectionLabel}>Choose a script</span>
      <div style={styles.scriptList}>
        {scripts.map((script) => {
          const isActive = selectedId === script.id;
          const diffColor = DIFFICULTY_COLORS[script.difficulty] || 'var(--color-muted)';

          return (
            <button
              key={script.id}
              style={{
                ...styles.scriptCard,
                borderColor: isActive ? 'var(--color-user)' : 'var(--color-border)',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                backgroundColor: isActive ? 'var(--color-surface-2)' : 'var(--color-surface)',
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
                  <span style={{ ...styles.badge, backgroundColor: diffColor }}>
                    {DIFFICULTY_LABELS[script.difficulty]}
                  </span>
                  <span style={styles.duration}>~{script.estimatedMinutes} min</span>
                </div>
              </div>
              <span style={styles.scriptDescription}>{script.description}</span>

              {/* Preview lines */}
              <div style={styles.preview}>
                {script.lines.slice(0, isActive ? script.lines.length : 2).map((line, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.previewLine,
                      filter: !isActive && i >= 2 ? 'blur(4px)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        ...styles.previewRole,
                        color: line.role === 'ai' ? 'var(--color-ai)' : 'var(--color-user)',
                      }}
                    >
                      {line.role === 'ai' ? 'AI' : 'You'}:
                    </span>{' '}
                    {line.text}
                  </div>
                ))}
                {!isActive && script.lines.length > 2 && (
                  <div
                    style={{
                      ...styles.previewLine,
                      filter: 'blur(4px)',
                      userSelect: 'none',
                    }}
                  >
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
