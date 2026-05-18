/**
 * @module components/ModeSelection/ScriptConfig
 * Configuration panel for Script Based mode.
 *
 * @param {{ onConfigChange: function(scriptConfig) }} props
 */

import React, { useState } from 'react';
import { SCRIPTS } from '../../data/scripts.js';

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
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t4)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
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
  const scripts = SCRIPTS;

  const handleSelect = (script) => {
    setSelectedId(script.id);
    onConfigChange({ scriptId: script.id, title: script.title, lines: script.lines, currentLine: 0 });
  };

  return (
    <div style={styles.container}>
      <span style={styles.sectionLabel}>Choose a script</span>
      <div style={styles.scriptList}>
        {scripts.map((script) => {
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
                  <span style={{
                    ...styles.badge,
                    color: diff.color,
                    backgroundColor: diff.bg,
                    borderColor: diff.border,
                  }}>
                    {DIFFICULTY_LABELS[script.difficulty]}
                  </span>
                  <span style={styles.duration}>~{script.estimatedMinutes}m</span>
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
