/**
 * @module hooks/useAudio
 * Audio playback hook — receives base64 audio from WebSocket,
 * plays it via AudioContext, and provides real-time audio level analysis.
 *
 * @returns {{ isPlaying, playAudio, stop }}
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import useAppStore from '../store/appStore.js';

/** How often to sample the audio level (ms) */
const LEVEL_SAMPLE_INTERVAL = 50;

/**
 * Custom hook for audio playback with real-time level analysis.
 * @returns {{ isPlaying: boolean, playAudio: function(string): Promise<void>, stop: function }}
 */
export default function useAudio() {
  const setAISpeaking = useAppStore((s) => s.setAISpeaking);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);

  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  /**
   * Get or create an AudioContext (lazy init).
   * @returns {AudioContext}
   */
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Monitor audio level using AnalyserNode via requestAnimationFrame.
   * @param {AnalyserNode} analyser
   */
  const startLevelMonitor = useCallback(
    (analyser) => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    [setAudioLevel]
  );

  /**
   * Stop the level monitor.
   */
  const stopLevelMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, [setAudioLevel]);

  /**
   * Play base64-encoded audio data.
   * @param {string} base64Data — base64 MP3 audio string
   * @returns {Promise<void>}
   */
  const playAudio = useCallback(
    async (base64Data) => {
      try {
        /* Stop any currently playing audio */
        if (sourceRef.current) {
          try {
            sourceRef.current.stop();
          } catch {
            /* ignore if already stopped */
          }
        }
        stopLevelMonitor();

        const ctx = getAudioContext();

        /* Decode base64 to ArrayBuffer */
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

        /* Create audio graph: source → analyser → destination */
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(ctx.destination);

        /* Track playback state */
        setIsPlaying(true);
        setAISpeaking(true);
        sourceRef.current = source;

        startLevelMonitor(analyser);

        source.onended = () => {
          setIsPlaying(false);
          setAISpeaking(false);
          stopLevelMonitor();
          sourceRef.current = null;
        };

        source.start(0);
      } catch (error) {
        console.error('[useAudio] Playback error:', error.message);
        setIsPlaying(false);
        setAISpeaking(false);
        stopLevelMonitor();
      }
    },
    [getAudioContext, setAISpeaking, startLevelMonitor, stopLevelMonitor]
  );

  /**
   * Stop currently playing audio.
   */
  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        /* ignore */
      }
      sourceRef.current = null;
    }
    stopLevelMonitor();
    setIsPlaying(false);
    setAISpeaking(false);
  }, [setAISpeaking, stopLevelMonitor]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stop]);

  return { isPlaying, playAudio, stop };
}
