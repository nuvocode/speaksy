/**
 * @module hooks/useConversation
 * Manages WebSocket message flow for the conversation:
 *   - Buffers streamed AI text until speech is ready
 *   - Reveals the final text when audio arrives (or TTS falls back)
 *   - Delegates playback to useAudio
 *   - Provides sendMessage() for outgoing user messages
 *
 * @returns {{ sendMessage, clearConversation, isConnected, isAIThinking, isPreparingSpeech, assistantStatus }}
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import useAppStore from '../store/appStore.js';
import { send, onMessage } from '../lib/wsClient.js';
import useAudio from './useAudio.js';

const AUDIO_REVEAL_FALLBACK_MS = 15000;
const THINKING_MESSAGES = [
  'Thinking...',
  'Putting the answer together...',
  'One moment, I am framing it clearly...',
];
const PREPARING_SPEECH_MESSAGES = [
  'Voice is getting ready...',
  'Turning that into speech...',
  'Almost there, preparing the audio...',
];

function pickRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Custom hook for conversation management.
 * Should be mounted once per active conversation screen.
 * @returns {{
 *   sendMessage: function(string): void,
 *   clearConversation: function(): void,
 *   isConnected: boolean,
 *   isAIThinking: boolean,
 *   isPreparingSpeech: boolean,
 *   assistantStatus: string
 * }}
 */
export default function useConversation() {
  const wsStatus = useAppStore((s) => s.wsStatus);
  const sessionId = useAppStore((s) => s.sessionId);
  const activeMode = useAppStore((s) => s.activeMode);
  const addMessage = useAppStore((s) => s.addMessage);
  const clearMessages = useAppStore((s) => s.clearMessages);

  const [assistantPhase, setAssistantPhase] = useState(null);
  const { playAudio } = useAudio();

  const isConnected = wsStatus === 'connected';
  const pendingResponseRef = useRef('');
  const revealTimerRef = useRef(null);
  const awaitingAudioRef = useRef(false);
  const assistantCopyRef = useRef({
    thinking: THINKING_MESSAGES[0],
    preparingSpeech: PREPARING_SPEECH_MESSAGES[0],
  });

  const isAIThinking = assistantPhase === 'thinking';
  const isPreparingSpeech = assistantPhase === 'preparing-speech';
  const assistantStatus = isAIThinking
    ? assistantCopyRef.current.thinking
    : isPreparingSpeech
      ? assistantCopyRef.current.preparingSpeech
      : '';

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const resetPendingResponse = useCallback(() => {
    clearRevealTimer();
    awaitingAudioRef.current = false;
    pendingResponseRef.current = '';
    setAssistantPhase(null);
  }, [clearRevealTimer]);

  const revealPendingResponse = useCallback(
    (text = pendingResponseRef.current, { preservePhase = false } = {}) => {
      const visibleText = text.trim();
      clearRevealTimer();
      awaitingAudioRef.current = false;
      pendingResponseRef.current = '';
      if (!preservePhase) {
        setAssistantPhase(null);
      }

      if (visibleText) {
        addMessage('ai', visibleText, false);
      }
    },
    [addMessage, clearRevealTimer]
  );

  /**
   * Handle incoming WebSocket messages.
   */
  useEffect(() => {
    const unsubscribe = onMessage((data) => {
      switch (data.type) {
        case 'chunk':
          pendingResponseRef.current += data.text || '';
          setAssistantPhase((currentPhase) => currentPhase || 'thinking');
          break;

        case 'done':
          if (typeof data.fullText === 'string') {
            pendingResponseRef.current = data.fullText;
          }

          if (pendingResponseRef.current.trim()) {
            clearRevealTimer();
            awaitingAudioRef.current = true;
            setAssistantPhase('preparing-speech');
            revealTimerRef.current = setTimeout(() => {
              revealPendingResponse();
            }, AUDIO_REVEAL_FALLBACK_MS);
          } else {
            resetPendingResponse();
          }
          break;

        case 'audio':
          if (!awaitingAudioRef.current) {
            break;
          }

          if (pendingResponseRef.current.trim()) {
            revealPendingResponse(undefined, { preservePhase: true });
          } else {
            clearRevealTimer();
            awaitingAudioRef.current = false;
          }

          void playAudio(data.data).finally(() => {
            setAssistantPhase(null);
          });
          break;

        case 'audio-unavailable':
          revealPendingResponse();
          break;

        case 'error':
          console.error('[useConversation] Server error:', data.message);
          resetPendingResponse();
          /* Add error as a system-style AI message */
          addMessage('ai', `⚠️ ${data.message}`, false);
          break;

        default:
          break;
      }
    });

    return () => {
      clearRevealTimer();
      unsubscribe();
    };
  }, [addMessage, playAudio, revealPendingResponse, resetPendingResponse, clearRevealTimer]);

  /**
   * Send a user message through WebSocket.
   * @param {string} text — the user's message text
   */
  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !isConnected) return;

      clearRevealTimer();
      awaitingAudioRef.current = false;
      pendingResponseRef.current = '';
      assistantCopyRef.current = {
        thinking: pickRandomMessage(THINKING_MESSAGES),
        preparingSpeech: pickRandomMessage(PREPARING_SPEECH_MESSAGES),
      };

      /* Add user message to local store */
      addMessage('user', text.trim(), false);

      /* Mark as thinking */
      setAssistantPhase('thinking');

      /* Send via WebSocket (include modeConfig for prompt building) */
      send('message', { text: text.trim(), sessionId, modeConfig: activeMode || undefined });
    },
    [isConnected, addMessage, sessionId, activeMode, clearRevealTimer]
  );

  /**
   * Clear conversation history (both local and server-side).
   */
  const clearConversation = useCallback(() => {
    resetPendingResponse();
    clearMessages();
    send('clear', { sessionId });
  }, [clearMessages, sessionId, resetPendingResponse]);

  return {
    sendMessage,
    clearConversation,
    isConnected,
    isAIThinking,
    isPreparingSpeech,
    assistantStatus,
  };
}
