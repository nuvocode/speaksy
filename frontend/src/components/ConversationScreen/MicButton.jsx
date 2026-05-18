/**
 * @module components/ConversationScreen/MicButton
 * Microphone toggle button — Nuvo Code dark design language.
 *   - Idle: dark surface, border, mic icon
 *   - Listening: purple-pink gradient, pulse rings
 *   - AI speaking: disabled, dimmed
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import useSTT from '../../hooks/useSTT.js';

const BUTTON_SIZE = 72;
const RING_COUNT = 3;

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
    transition: 'all var(--duration-normal) var(--ease-out)',
  },
  buttonIdle: {
    backgroundColor: 'var(--color-s2)',
    border: '1px solid var(--color-b3)',
    color: 'var(--color-t2)',
    boxShadow: '0 0 0 1px var(--color-b2)',
  },
  buttonListening: {
    background: 'var(--grad)',
    border: '2px solid rgba(168,85,247,.6)',
    color: '#FFFFFF',
    boxShadow: '0 0 0 1px rgba(168,85,247,.4), 0 0 32px rgba(168,85,247,.35)',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-s1)',
    border: '1px solid var(--color-b1)',
    color: 'var(--color-t4)',
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(168,85,247,.5)',
    animation: 'pulseRing 1.5s ease-out infinite',
    zIndex: 1,
    pointerEvents: 'none',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
    fontWeight: 'var(--weight-regular)',
    textAlign: 'center',
    minHeight: 'var(--text-base)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};

export default function MicButton({ sendMessage, isAIBusy = false, busyLabel = 'Thinking...' }) {
  const isAISpeaking = useAppStore((s) => s.isAISpeaking);
  const wsStatus = useAppStore((s) => s.wsStatus);

  const transcriptRef = useRef('');
  const [animClass, setAnimClass] = useState('');

  const { isListening, startListening, stopListening, isSupported } = useSTT({
    onTranscript: (text, isFinal) => {
      transcriptRef.current = text;
      if (isFinal && text.trim()) {
        sendMessage(text.trim());
        transcriptRef.current = '';
      }
    },
  });

  useEffect(() => {
    if (isListening) {
      setAnimClass('animate-mic-spring-in');
    } else {
      setAnimClass('animate-mic-spring-out');
    }
    const timer = setTimeout(() => setAnimClass(''), isListening ? 350 : 250);
    return () => clearTimeout(timer);
  }, [isListening]);

  const isDisabled = isAISpeaking || isAIBusy || wsStatus !== 'connected';

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    if (isListening) {
      stopListening();
      if (transcriptRef.current.trim()) {
        sendMessage(transcriptRef.current.trim());
        transcriptRef.current = '';
      }
    } else {
      startListening();
    }
  }, [isDisabled, isListening, startListening, stopListening, sendMessage]);

  let buttonStyle;
  let statusLabel = '';

  if (isDisabled) {
    buttonStyle = styles.buttonDisabled;
    if (wsStatus !== 'connected') statusLabel = 'Not connected';
    else if (isAISpeaking) statusLabel = 'AI is speaking...';
    else statusLabel = busyLabel;
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
        {isListening &&
          Array.from({ length: RING_COUNT }, (_, i) => (
            <span key={i} style={{ ...styles.ring, animationDelay: `${i * 0.4}s` }} aria-hidden="true" />
          ))}

        <button
          className={animClass}
          style={{ ...styles.button, ...buttonStyle }}
          onClick={handleClick}
          disabled={isDisabled && !isListening}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          onMouseEnter={(e) => {
            if (!isDisabled && !isListening) {
              e.currentTarget.style.borderColor = 'rgba(168,85,247,.5)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = 'var(--color-b3)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isListening ? <MicOff size={26} /> : <Mic size={26} />}
        </button>
      </div>

      <span style={styles.label} role="status" aria-live="polite">
        {statusLabel}
      </span>
    </div>
  );
}
