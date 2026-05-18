/**
 * @module hooks/useSpeechSynthesis
 * Thin wrapper around the browser's Web Speech Synthesis API.
 * Used as a fallback when Kokoro TTS is unavailable.
 */

import { useCallback, useRef } from 'react';
import useAppStore from '../store/appStore.js';

/**
 * @returns {{ speak: function, stop: function, isSupported: boolean }}
 */
export default function useSpeechSynthesis() {
  const setAISpeaking = useAppStore((s) => s.setAISpeaking);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    (text, { onEnd } = {}) => {
      if (!isSupported || !text.trim()) {
        onEnd?.();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.onstart = () => setAISpeaking(true);
      utterance.onend = () => {
        setAISpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setAISpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, setAISpeaking]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setAISpeaking(false);
  }, [isSupported, setAISpeaking]);

  return { speak, stop, isSupported };
}
