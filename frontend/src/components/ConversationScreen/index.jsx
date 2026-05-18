/**
 * @module components/ConversationScreen
 * Main conversation screen — Nuvo Code dark design language.
 */

import React, { useRef, useEffect, useCallback } from 'react';
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
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-8)',
    height: 54,
    backgroundColor: 'rgba(9,9,11,.85)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid var(--color-b1)',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 10,
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
    width: 36,
    height: 36,
    minWidth: 36,
    minHeight: 36,
    padding: 0,
    background: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-t3)',
    transition: 'all var(--duration-fast) var(--ease-out)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: '6px var(--space-2)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-t3)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    transition: 'all var(--duration-fast) var(--ease-out)',
    borderRadius: 'var(--radius-sm)',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  modeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t3)',
    letterSpacing: '0.04em',
  },

  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    width: '100%',
    maxWidth: 1366,
    margin: '0 auto'
  },
  messagesPlaceholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-t4)',
    fontWeight: 'var(--weight-regular)',
    textAlign: 'center',
    padding: 'var(--space-8)',
    letterSpacing: '0.04em',
    animation: 'fadeInUp var(--duration-slow) var(--ease-out) both',
  },
  spacer: {
    flexGrow: 1,
  },
  scrollAnchor: {
    height: 1,
    flexShrink: 0,
  },

  bottomSection: {
    flexShrink: 0,
    padding: 'var(--space-4) var(--space-6) var(--space-8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
    borderTop: '1px solid var(--color-b1)',
    backgroundColor: 'rgba(9,9,11,1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  assistantStatus: {
    minHeight: 'var(--text-base)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-t4)',
    fontWeight: 'var(--weight-regular)',
    textAlign: 'center',
    letterSpacing: '0.06em',
    animation: 'fadeInUp var(--duration-fast) var(--ease-out) both',
  },
  waveContainer: {
    width: '100%',
    maxWidth: 300,
  },
};

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

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBack = useCallback(() => {
    if (messages.length > 0) {
      const confirmed = window.confirm('Are you sure? Your conversation progress will be lost.');
      if (!confirmed) return;
    }
    endSession();
  }, [messages.length, endSession]);

  let waveMode = 'idle';
  let waveActive = false;
  const isAIBusy = isAIThinking || isPreparingSpeech;

  if (isUserSpeaking) { waveMode = 'user'; waveActive = true; }
  else if (isAISpeaking) { waveMode = 'ai'; waveActive = true; }
  else if (isAIBusy) { waveMode = 'ai'; waveActive = true; }

  const hasMessages = messages.length > 0;
  const isScriptMode = activeMode?.type === 'script';

  const modeBadgeText = (() => {
    if (!activeMode) return '';
    if (activeMode.type === 'freestyle') return 'FREE STYLE';
    if (activeMode.type === 'topic') {
      const { topic, subtopic } = activeMode.topicConfig || {};
      return `TOPIC · ${topic || ''}${subtopic ? ` · ${subtopic}` : ''}`;
    }
    if (activeMode.type === 'script') return `SCRIPT · ${activeMode.scriptConfig?.title || ''}`;
    return activeMode.label.toUpperCase();
  })();

  return (
    <div style={styles.container}>
      {/* ── Header ─────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backButton}
            onClick={handleBack}
            aria-label="Back to mode selection"
            title="Back"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-t1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-t3)'; }}
          >
            <ChevronLeft size={16} />
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(248,113,113,.4)';
                e.currentTarget.style.color = 'var(--color-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-b2)';
                e.currentTarget.style.color = 'var(--color-t3)';
              }}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-spring-press')}
              onMouseUp={(e) => {
                const btn = e.currentTarget;
                setTimeout(() => btn.classList.remove('animate-spring-press'), 250);
              }}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-spring-press')}
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            style={styles.iconButton}
            onClick={toggleSettings}
            aria-label="Open settings"
            title="Settings"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-b3)';
              e.currentTarget.style.color = 'var(--color-t2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-b2)';
              e.currentTarget.style.color = 'var(--color-t3)';
            }}
            onMouseDown={(e) => e.currentTarget.classList.add('animate-spring-press')}
            onMouseUp={(e) => {
              const btn = e.currentTarget;
              setTimeout(() => btn.classList.remove('animate-spring-press'), 250);
            }}
            onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-spring-press')}
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </header>

      {/* ── Script Prompt ──────────────────────── */}
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
