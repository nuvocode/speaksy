/**
 * @module components/ConversationScreen/MicButton
 * Microphone toggle button.
 *   - Idle: surface bg, border, mic icon
 *   - Listening: coral bg, white icon, pulse rings
 *   - AI speaking: disabled, dimmed, "AI is speaking..." label
 *
 * Reads state from Zustand store directly.
 * Triggers start/stop listening and sends final transcript.
 */

import React, { useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import useSTT from '../../hooks/useSTT.js';
import useConversation from '../../hooks/useConversation.js';

/** Button diameter in pixels */
const BUTTON_SIZE = 72;

/** Pulse ring count */
const RING_COUNT = 2;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  buttonWrapper: {
    position: 'relative',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  button: {
    position: 'relative',
    zIndex: 2,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 'var(--radius-full)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all var(--duration-normal) var(--ease-out)`,
  },
  buttonIdle: {
    backgroundColor: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    color: 'var(--color-primary)',
    boxShadow: 'var(--shadow-md)',
  },
  buttonListening: {
    backgroundColor: 'var(--color-user)',
    border: '2px solid var(--color-user)',
    color: '#FFFFFF',
    boxShadow: 'var(--shadow-lg)',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    color: 'var(--color-muted)',
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'var(--shadow-sm)',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 'var(--radius-full)',
    border: '2px solid var(--color-user)',
    animation: 'pulseRing 1.5s ease-out infinite',
    zIndex: 1,
    pointerEvents: 'none',
  },
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
    fontWeight: 'var(--weight-medium)',
    textAlign: 'center',
    minHeight: 'var(--text-base)',
  },
};

/**
 * MicButton component.
 * @returns {React.ReactElement}
 */
export default function MicButton() {
  const isUserSpeaking = useAppStore((s) => s.isUserSpeaking);
  const isAISpeaking = useAppStore((s) => s.isAISpeaking);
  const wsStatus = useAppStore((s) => s.wsStatus);

  const { sendMessage } = useConversation();
  const transcriptRef = useRef('');

  const { isListening, startListening, stopListening, isSupported } = useSTT({
    onTranscript: (text, isFinal) => {
      transcriptRef.current = text;
      if (isFinal && text.trim()) {
        sendMessage(text.trim());
        transcriptRef.current = '';
      }
    },
  });

  const isDisabled = isAISpeaking || wsStatus !== 'connected';

  /**
   * Toggle listening state.
   */
  const handleClick = useCallback(() => {
    if (isDisabled) return;

    if (isListening) {
      stopListening();
      /* If Web Speech API didn't fire a final event, send what we have */
      if (transcriptRef.current.trim()) {
        sendMessage(transcriptRef.current.trim());
        transcriptRef.current = '';
      }
    } else {
      startListening();
    }
  }, [isDisabled, isListening, startListening, stopListening, sendMessage]);

  /* Determine visual state */
  let buttonStyle;
  let statusLabel = '';

  if (isDisabled) {
    buttonStyle = styles.buttonDisabled;
    statusLabel = isAISpeaking ? 'AI is speaking...' : 'Not connected';
  } else if (isListening) {
    buttonStyle = styles.buttonListening;
    statusLabel = 'Listening...';
  } else {
    buttonStyle = styles.buttonIdle;
    statusLabel = isSupported ? 'Tap to speak' : 'Speech not supported';
  }

  return (
    <div style={styles.container}>
      <div style={styles.buttonWrapper}>
        {/* Pulse rings (only when listening) */}
        {isListening &&
          Array.from({ length: RING_COUNT }, (_, i) => (
            <span
              key={i}
              style={{
                ...styles.ring,
                animationDelay: `${i * 0.4}s`,
              }}
              aria-hidden="true"
            />
          ))}

        <button
          style={{ ...styles.button, ...buttonStyle }}
          onClick={handleClick}
          disabled={isDisabled && !isListening}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
      </div>

      <span style={styles.label} role="status" aria-live="polite">
        {statusLabel}
      </span>
    </div>
  );
}
