/**
 * @module hooks/useConversation
 * Manages WebSocket message flow for the conversation:
 *   - Receives 'chunk' messages and appends to streaming AI message
 *   - Receives 'done' and finalises the message
 *   - Receives 'audio' and delegates to useAudio
 *   - Provides sendMessage() for outgoing user messages
 *
 * @returns {{ sendMessage, isConnected, isAIThinking }}
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import useAppStore from '../store/appStore.js';
import { send, onMessage } from '../lib/wsClient.js';
import useAudio from './useAudio.js';

/**
 * Custom hook for conversation management.
 * @returns {{ sendMessage: function(string): void, isConnected: boolean, isAIThinking: boolean }}
 */
export default function useConversation() {
  const wsStatus = useAppStore((s) => s.wsStatus);
  const sessionId = useAppStore((s) => s.sessionId);
  const addMessage = useAppStore((s) => s.addMessage);
  const updateLastMessage = useAppStore((s) => s.updateLastMessage);
  const finalizeLastMessage = useAppStore((s) => s.finalizeLastMessage);
  const clearMessages = useAppStore((s) => s.clearMessages);

  const [isAIThinking, setIsAIThinking] = useState(false);
  const { playAudio } = useAudio();

  const isConnected = wsStatus === 'connected';

  /* Track whether we are currently streaming an AI response */
  const streamingRef = useRef(false);

  /**
   * Handle incoming WebSocket messages.
   */
  useEffect(() => {
    const unsubscribe = onMessage((data) => {
      switch (data.type) {
        case 'chunk':
          if (!streamingRef.current) {
            /* First chunk — create a new AI message in streaming mode */
            streamingRef.current = true;
            addMessage('ai', data.text, true);
            setIsAIThinking(false);
          } else {
            /* Subsequent chunks — append to existing message */
            updateLastMessage(data.text);
          }
          break;

        case 'done':
          if (streamingRef.current) {
            finalizeLastMessage(data.fullText);
            streamingRef.current = false;
          }
          setIsAIThinking(false);
          break;

        case 'audio':
          playAudio(data.data);
          break;

        case 'error':
          console.error('[useConversation] Server error:', data.message);
          setIsAIThinking(false);
          streamingRef.current = false;
          /* Add error as a system-style AI message */
          addMessage('ai', `⚠️ ${data.message}`, false);
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, [addMessage, updateLastMessage, finalizeLastMessage, playAudio]);

  /**
   * Send a user message through WebSocket.
   * @param {string} text — the user's message text
   */
  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !isConnected) return;

      /* Add user message to local store */
      addMessage('user', text.trim(), false);

      /* Mark as thinking */
      setIsAIThinking(true);
      streamingRef.current = false;

      /* Send via WebSocket */
      send('message', { text: text.trim(), sessionId });
    },
    [isConnected, addMessage, sessionId]
  );

  /**
   * Clear conversation history (both local and server-side).
   */
  const clearConversation = useCallback(() => {
    clearMessages();
    send('clear', { sessionId });
  }, [clearMessages, sessionId]);

  return { sendMessage, clearConversation, isConnected, isAIThinking };
}
