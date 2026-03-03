/**
 * @module components/ConversationScreen
 * Main conversation screen — the primary view of LinguaAI.
 *
 * Layout (top to bottom):
 *   1. Header bar — Logo (left), StatusIndicator (center), Settings icon (right)
 *   2. Message area — scrollable, messages stack from bottom
 *   3. WaveAnimation — active during speech
 *   4. MicButton — centered at bottom
 */

import React, { useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Trash2 } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import useConversation from '../../hooks/useConversation.js';
import Logo from '../shared/Logo.jsx';
import StatusIndicator from '../shared/StatusIndicator.jsx';
import MessageBubble from './MessageBubble.jsx';
import WaveAnimation from './WaveAnimation.jsx';
import MicButton from './MicButton.jsx';

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

  const { clearConversation, isAIThinking } = useConversation();
  const scrollAnchorRef = useRef(null);

  /* Auto-scroll to bottom when new messages arrive */
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Determine wave animation mode */
  let waveMode = 'idle';
  let waveActive = false;
  if (isUserSpeaking) {
    waveMode = 'user';
    waveActive = true;
  } else if (isAISpeaking) {
    waveMode = 'ai';
    waveActive = true;
  } else if (isAIThinking) {
    waveMode = 'ai';
    waveActive = true;
  }

  const hasMessages = messages.length > 0;

  return (
    <div style={styles.container}>
      {/* ── Header ─────────────────────────────── */}
      <header style={{ ...styles.header, position: 'relative' }}>
        <div style={styles.headerLeft}>
          <Logo />
        </div>

        <div style={styles.headerCenter}>
          <StatusIndicator status={wsStatus} />
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
        <div style={styles.waveContainer}>
          <WaveAnimation
            isActive={waveActive}
            audioLevel={
              isAIThinking && !isAISpeaking && !isUserSpeaking
                ? 0.3 + Math.sin(Date.now() / 300) * 0.15
                : audioLevel
            }
            mode={waveMode}
          />
        </div>
        <MicButton />
      </div>
    </div>
  );
}
