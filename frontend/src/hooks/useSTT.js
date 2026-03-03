/**
 * @module hooks/useSTT
 * Speech-to-Text hook supporting two providers:
 *   - Web Speech API (browser-native)
 *   - Whisper (local service via backend proxy)
 *
 * @returns {{ isListening, startListening, stopListening, transcript, isSupported }}
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import useAppStore from '../store/appStore.js';

/** Silence detection threshold for Whisper mode (seconds) */
const SILENCE_TIMEOUT = 1500;

/** Audio level simulation range for Web Speech API */
const AUDIO_LEVEL_MIN = 0.3;
const AUDIO_LEVEL_MAX = 0.9;

/** Audio level simulation interval (ms) */
const AUDIO_LEVEL_INTERVAL = 100;

/**
 * Custom hook for speech-to-text.
 * @param {Object} [options]
 * @param {function(string, boolean): void} [options.onTranscript] — called with (text, isFinal)
 * @returns {{ isListening: boolean, startListening: function, stopListening: function, transcript: string, isSupported: boolean }}
 */
export default function useSTT({ onTranscript } = {}) {
  const sttProvider = useAppStore((s) => s.settings.sttProvider);
  const setUserSpeaking = useAppStore((s) => s.setUserSpeaking);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  /* Refs for cleanup */
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioLevelTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  /* Check browser support for Web Speech API */
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = sttProvider === 'whisper' || !!SpeechRecognition;

  /**
   * Simulate audio level for Web Speech API (no real analyser available).
   */
  const startAudioSimulation = useCallback(() => {
    audioLevelTimerRef.current = setInterval(() => {
      const level = AUDIO_LEVEL_MIN + Math.random() * (AUDIO_LEVEL_MAX - AUDIO_LEVEL_MIN);
      setAudioLevel(level);
    }, AUDIO_LEVEL_INTERVAL);
  }, [setAudioLevel]);

  const stopAudioSimulation = useCallback(() => {
    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }
    setAudioLevel(0);
  }, [setAudioLevel]);

  /**
   * Start listening via Web Speech API.
   */
  const startWebSpeech = useCallback(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setUserSpeaking(true);
      startAudioSimulation();
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
        onTranscript?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        setTranscript(interimTranscript.trim());
        onTranscript?.(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event) => {
      console.error('[useSTT] Web Speech error:', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
        setUserSpeaking(false);
        stopAudioSimulation();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setUserSpeaking(false);
      stopAudioSimulation();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognition, setUserSpeaking, startAudioSimulation, stopAudioSimulation, onTranscript]);

  /**
   * Stop Web Speech API recognition.
   */
  const stopWebSpeech = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  /**
   * Start listening via Whisper (MediaRecorder + silence detection).
   */
  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      /* Set up AnalyserNode for real audio level */
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      /* Monitor audio level */
      const monitorLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setAudioLevel(normalized);

        /* Silence detection */
        if (normalized < 0.05) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              stopWhisper();
            }, SILENCE_TIMEOUT);
          }
        } else {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }

        if (mediaRecorderRef.current?.state === 'recording') {
          requestAnimationFrame(monitorLevel);
        }
      };

      /* Set up MediaRecorder */
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        /* Cleanup */
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        analyserRef.current = null;
        setAudioLevel(0);
        setUserSpeaking(false);
        setIsListening(false);

        /* Send to backend for transcription */
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (blob.size === 0) return;

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { text } = await response.json();
            if (text) {
              setTranscript(text.trim());
              onTranscript?.(text.trim(), true);
            }
          } else {
            console.error('[useSTT] Whisper STT error:', response.status);
          }
        } catch (error) {
          console.error('[useSTT] Whisper request failed:', error.message);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); /* collect data every 250ms */
      setIsListening(true);
      setUserSpeaking(true);
      monitorLevel();
    } catch (error) {
      console.error('[useSTT] Microphone access error:', error.message);
      setIsListening(false);
      setUserSpeaking(false);
    }
  }, [setUserSpeaking, setAudioLevel, onTranscript]);

  /**
   * Stop Whisper recording.
   */
  const stopWhisper = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * Start listening (provider-agnostic).
   */
  const startListening = useCallback(() => {
    setTranscript('');
    if (sttProvider === 'whisper') {
      startWhisper();
    } else {
      startWebSpeech();
    }
  }, [sttProvider, startWhisper, startWebSpeech]);

  /**
   * Stop listening (provider-agnostic).
   */
  const stopListening = useCallback(() => {
    if (sttProvider === 'whisper') {
      stopWhisper();
    } else {
      stopWebSpeech();
    }
  }, [sttProvider, stopWhisper, stopWebSpeech]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      stopWebSpeech();
      stopWhisper();
      stopAudioSimulation();
    };
  }, [stopWebSpeech, stopWhisper, stopAudioSimulation]);

  return { isListening, startListening, stopListening, transcript, isSupported };
}
