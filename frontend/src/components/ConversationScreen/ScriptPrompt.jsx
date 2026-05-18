/**
 * @module components/ConversationScreen/ScriptPrompt
 * Teleprompter-style bar for Script Based mode — Nuvo Code dark design.
 */

import React from 'react';
import useAppStore from '../../store/appStore.js';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'var(--color-s1)',
    borderRadius: 'var(--radius-md)',
    margin: 'var(--space-2) auto 0 auto',
    border: '1px solid var(--color-b2)',
    borderLeft: '3px solid var(--color-purple)',
    flexShrink: 0,
    animation: 'fadeInUp 300ms var(--ease-out) both',
    width: '100%',
    maxWidth: 1366,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t4)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  counter: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
    letterSpacing: '0.06em',
  },
  lineText: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontStyle: 'italic',
    color: 'var(--color-t1)',
    lineHeight: 'var(--leading-relaxed)',
  },
  completedText: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-green)',
    textAlign: 'center',
    padding: 'var(--space-2) 0',
    letterSpacing: '-0.01em',
  },
  aiSpeaking: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-green)',
    letterSpacing: '0.04em',
  },
};

export default function ScriptPrompt() {
  const activeMode = useAppStore((s) => s.activeMode);

  if (!activeMode?.scriptConfig) return null;

  const { lines, currentLine } = activeMode.scriptConfig;
  const totalLines = lines.length;
  const isComplete = currentLine >= totalLines;

  if (isComplete) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.content, alignItems: 'center' }}>
          <span style={styles.completedText}>Script completed!</span>
        </div>
      </div>
    );
  }

  const currentLineData = lines[currentLine];
  const isAILine = currentLineData.role === 'ai';

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.label}>
            {isAILine ? '→ AI speaking' : '→ Your line'}
          </span>
          <span style={styles.counter}>
            [{currentLine + 1}/{totalLines}]
          </span>
        </div>
        {!isAILine && (
          <span style={styles.lineText}>"{currentLineData.text}"</span>
        )}
        {isAILine && (
          <span style={styles.aiSpeaking}>Waiting for AI to deliver the next line...</span>
        )}
      </div>
    </div>
  );
}
