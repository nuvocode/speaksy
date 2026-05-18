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
import useSpeechSynthesis from './useSpeechSynthesis.js';

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
  const advanceScriptLine = useAppStore((s) => s.advanceScriptLine);

  const [assistantPhase, setAssistantPhase] = useState(null);
  const { playAudio } = useAudio();
  const speechSynthesis = useSpeechSynthesis();

  const isConnected = wsStatus === 'connected';
  const pendingResponseRef = useRef('');
  const revealTimerRef = useRef(null);
  const awaitingAudioRef = useRef(false);
  const scriptAutoStartedRef = useRef(false);
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

        case 'done': {
          if (typeof data.fullText === 'string') {
            pendingResponseRef.current = data.fullText;
          }

          /* Advance script past the AI line that was just delivered */
          const modeAtDone = useAppStore.getState().activeMode;
          if (modeAtDone?.type === 'script' && modeAtDone.scriptConfig) {
            const { lines, currentLine } = modeAtDone.scriptConfig;
            if (lines?.[currentLine]?.role === 'ai') {
              advanceScriptLine();
            }
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
        }

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

        case 'audio-unavailable': {
          const text = pendingResponseRef.current.trim();
          if (text && speechSynthesis.isSupported) {
            revealPendingResponse(undefined, { preservePhase: true });
            speechSynthesis.speak(text, {
              onEnd: () => setAssistantPhase(null),
            });
          } else {
            revealPendingResponse();
          }
          break;
        }

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
  }, [addMessage, playAudio, speechSynthesis, revealPendingResponse, resetPendingResponse, clearRevealTimer]);

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

      /* Advance script past the user line that was just spoken */
      if (activeMode?.type === 'script' && activeMode.scriptConfig) {
        const { lines, currentLine } = activeMode.scriptConfig;
        if (lines?.[currentLine]?.role === 'user') {
          advanceScriptLine();
        }
      }
    },
    [isConnected, addMessage, sessionId, activeMode, clearRevealTimer, advanceScriptLine]
  );

  /**
   * Clear conversation history (both local and server-side).
   */
  const clearConversation = useCallback(() => {
    resetPendingResponse();
    clearMessages();
    send('clear', { sessionId });
  }, [clearMessages, sessionId, resetPendingResponse]);

  /* Auto-start: when script begins with an AI line, trigger the AI automatically */
  useEffect(() => {
    if (
      activeMode?.type === 'script' &&
      activeMode.scriptConfig &&
      isConnected &&
      !scriptAutoStartedRef.current
    ) {
      const firstLine = activeMode.scriptConfig.lines?.[0];
      if (firstLine?.role === 'ai') {
        scriptAutoStartedRef.current = true;
        assistantCopyRef.current = {
          thinking: pickRandomMessage(THINKING_MESSAGES),
          preparingSpeech: pickRandomMessage(PREPARING_SPEECH_MESSAGES),
        };
        setAssistantPhase('thinking');
        send('message', {
          text: '(Please deliver your first line from the script to begin the conversation.)',
          sessionId,
          modeConfig: activeMode,
        });
      }
    }
  }, [activeMode, isConnected, sessionId]);

  return {
    sendMessage,
    clearConversation,
    isConnected,
    isAIThinking,
    isPreparingSpeech,
    assistantStatus,
  };
}
