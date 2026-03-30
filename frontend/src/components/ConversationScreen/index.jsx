/**
 * @module components/ConversationScreen
 * Main conversation screen — the primary view of Speaksy.
 *
 * Layout (top to bottom):
 *   1. Header bar — Back (left), Mode badge (center), Settings/Theme (right)
 *   2. ScriptPrompt (only in script mode)
 *   3. Message area — scrollable, messages stack from bottom
 *   4. WaveAnimation — active during speech
 *   5. MicButton — centered at bottom
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Settings as SettingsIcon, Trash2, ChevronLeft } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import useConversation from '../../hooks/useConversation.js';
import Logo from '../shared/Logo.jsx';
import StatusIndicator from '../shared/StatusIndicator.jsx';
import ThemeToggle from '../shared/ThemeToggle.jsx';
import MessageBubble from './MessageBubble.jsx';
import WaveAnimation from './WaveAnimation.jsx';
import MicButton from './MicButton.jsx';
import ScriptPrompt from './ScriptPrompt.jsx';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: 'var(--color-bg)',
    overflow: 'hidden',
  },

  /* ── Header ────────────────────────────────── */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  headerCenter: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    padding: 0,
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: 'var(--color-muted)',
    transition: `all var(--duration-fast) var(--ease-out)`,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-1) var(--space-2)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    transition: 'all var(--duration-fast) var(--ease-out)',
    borderRadius: 'var(--radius-sm)',
  },
  modeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-primary)',
  },

  /* ── Messages ──────────────────────────────── */
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  messagesPlaceholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-lg)',
    color: 'var(--color-muted)',
    fontWeight: 'var(--weight-medium)',
    textAlign: 'center',
    padding: 'var(--space-8)',
    animation: 'fadeInUp var(--duration-slow) var(--ease-out) both',
  },
  spacer: {
    flexGrow: 1,
  },
  scrollAnchor: {
    height: 1,
    flexShrink: 0,
  },

  /* ── Bottom section ────────────────────────── */
  bottomSection: {
    flexShrink: 0,
    padding: 'var(--space-4) var(--space-6) var(--space-8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  },
  assistantStatus: {
    minHeight: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-muted)',
    fontWeight: 'var(--weight-medium)',
    textAlign: 'center',
    animation: 'fadeInUp var(--duration-fast) var(--ease-out) both',
  },
  waveContainer: {
    width: '100%',
    maxWidth: 300,
  },
};

/**
 * ConversationScreen component.
 * @returns {React.ReactElement}
 */
export default function ConversationScreen() {
  const messages = useAppStore((s) => s.messages);
  const wsStatus = useAppStore((s) => s.wsStatus);
  const isUserSpeaking = useAppStore((s) => s.isUserSpeaking);
  const isAISpeaking = useAppStore((s) => s.isAISpeaking);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const activeMode = useAppStore((s) => s.activeMode);
  const endSession = useAppStore((s) => s.endSession);

  const { sendMessage, clearConversation, isAIThinking, isPreparingSpeech, assistantStatus } = useConversation();
  const scrollAnchorRef = useRef(null);

  /* Auto-scroll to bottom when new messages arrive */
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Handle back button with confirmation */
  const handleBack = useCallback(() => {
    if (messages.length > 0) {
      const confirmed = window.confirm('Are you sure? Your conversation progress will be lost.');
      if (!confirmed) return;
    }
    endSession();
  }, [messages.length, endSession]);

  /* Determine wave animation mode */
  let waveMode = 'idle';
  let waveActive = false;
  const isAIBusy = isAIThinking || isPreparingSpeech;

  if (isUserSpeaking) {
    waveMode = 'user';
    waveActive = true;
  } else if (isAISpeaking) {
    waveMode = 'ai';
    waveActive = true;
  } else if (isAIBusy) {
    waveMode = 'ai';
    waveActive = true;
  }

  const hasMessages = messages.length > 0;
  const isScriptMode = activeMode?.type === 'script';

  /** Build the mode badge text */
  const modeBadgeText = (() => {
    if (!activeMode) return '';
    if (activeMode.type === 'freestyle') return '💬 Free Style';
    if (activeMode.type === 'topic') {
      const { topic, subtopic } = activeMode.topicConfig || {};
      return `📚 Topic: ${topic || ''}${subtopic ? ` · ${subtopic}` : ''}`;
    }
    if (activeMode.type === 'script') {
      return `📄 Script: ${activeMode.scriptConfig?.title || ''}`;
    }
    return activeMode.label;
  })();

  return (
    <div style={styles.container}>
      {/* ── Header ─────────────────────────────── */}
      <header style={{ ...styles.header, position: 'relative' }}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backButton}
            onClick={handleBack}
            aria-label="Back to mode selection"
            title="Back"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-muted)'; }}
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
        </div>

        <div style={styles.headerCenter}>
          {activeMode ? (
            <span style={styles.modeBadge}>{modeBadgeText}</span>
          ) : (
            <StatusIndicator status={wsStatus} />
          )}
        </div>

        <div style={styles.headerRight}>
          {hasMessages && (
            <button
              style={styles.iconButton}
              onClick={clearConversation}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 size={18} />
            </button>
          )}
          <ThemeToggle />
          <button
            style={styles.iconButton}
            onClick={toggleSettings}
            aria-label="Open settings"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      {/* ── Script Prompt (script mode only) ──── */}
      {isScriptMode && <ScriptPrompt />}

      {/* ── Messages ───────────────────────────── */}
      <div style={styles.messagesContainer}>
        {!hasMessages ? (
          <div style={styles.messagesPlaceholder}>
            Start speaking to begin...
          </div>
        ) : (
          <>
            <div style={styles.spacer} />
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </>
        )}
        <div ref={scrollAnchorRef} style={styles.scrollAnchor} />
      </div>

      {/* ── Bottom: Wave + Mic ─────────────────── */}
      <div style={styles.bottomSection}>
        {assistantStatus ? (
          <div style={styles.assistantStatus} role="status" aria-live="polite">
            {assistantStatus}
          </div>
        ) : (
          <div style={styles.assistantStatus} aria-hidden="true" />
        )}
        <div style={styles.waveContainer}>
          <WaveAnimation
            isActive={waveActive}
            audioLevel={
              isAIBusy && !isAISpeaking && !isUserSpeaking
                ? 0.3 + Math.sin(Date.now() / 300) * 0.15
                : audioLevel
            }
            mode={waveMode}
          />
        </div>
        <MicButton sendMessage={sendMessage} isAIBusy={isAIBusy} busyLabel={assistantStatus} />
      </div>
    </div>
  );
}
