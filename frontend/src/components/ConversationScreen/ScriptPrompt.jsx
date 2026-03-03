/**
 * @module components/ConversationScreen/ScriptPrompt
 * Teleprompter-style bar showing the current script line.
 * Displayed above the message area in Script Based mode.
 *
 * - Shows the user's next expected line in italics
 * - Displays current/total line counter
 * - When the current line is an AI line, shows "AI is speaking..."
 * - When all lines are done, shows completion message
 */

import React from 'react';
import useAppStore from '../../store/appStore.js';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'var(--color-surface-2)',
    borderRadius: 'var(--radius-sm)',
    margin: '0 var(--space-6)',
    marginTop: 'var(--space-2)',
    borderLeft: '3px solid var(--color-accent)',
    flexShrink: 0,
    animation: 'fadeInUp 300ms var(--ease-out) both',
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
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
  },
  counter: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-muted)',
  },
  lineText: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-base)',
    fontStyle: 'italic',
    color: 'var(--color-primary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  completedText: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-ai)',
    textAlign: 'center',
    padding: 'var(--space-2) 0',
  },
  aiSpeaking: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-ai)',
    fontStyle: 'italic',
  },
};

/**
 * ScriptPrompt component.
 * @returns {React.ReactElement|null}
 */
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
          <span style={styles.completedText}>Script completed! 🎉</span>
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
            📄 {isAILine ? 'AI is speaking...' : 'Your line:'}
          </span>
          <span style={styles.counter}>
            [{currentLine + 1} / {totalLines}]
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
