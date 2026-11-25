import { useCallback, useEffect, useRef, useState } from 'react';
import { countWords } from '../utils/analytics';

const PAUSE_COMPLETE_MS = 4500;
const INITIAL_SILENCE_PROMPT_MS = 12000;
const FOLLOWUP_SILENCE_TIMEOUT_MS = 10000;

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition({
  onAnswerComplete,
  onInitialSilencePrompt,
  onSilenceTimeout,
  onPermissionError,
}) {
  const isSupported = Boolean(getRecognitionCtor());

  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // Refs to avoid stale closures inside Web Speech callbacks
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const isMutedRef = useRef(false);
  const langRef = useRef('en-IN');

  const finalRef = useRef('');
  const interimRef = useRef('');
  const resultTimestampsRef = useRef([]);
  const hasSpokenRef = useRef(false);
  const promptedSilenceRef = useRef(false);

  const pauseTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Callback refs
  const callbacksRef = useRef({
    onAnswerComplete,
    onInitialSilencePrompt,
    onSilenceTimeout,
    onPermissionError,
  });
  callbacksRef.current = {
    onAnswerComplete,
    onInitialSilencePrompt,
    onSilenceTimeout,
    onPermissionError,
  };

  const clearTimers = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopInternal = useCallback(() => {
    shouldListenRef.current = false;
    clearTimers();
    setIsListening(false);
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onend = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
      recognitionRef.current = null;
    }
  }, [clearTimers]);

  const scheduleSilenceWatchers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (hasSpokenRef.current || !shouldListenRef.current || isMutedRef.current) {
      return;
    }

    if (!promptedSilenceRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        if (!shouldListenRef.current || isMutedRef.current || hasSpokenRef.current) return;
        promptedSilenceRef.current = true;
        callbacksRef.current.onInitialSilencePrompt?.();
        // Start second 10s timer for empty-answer move-on
        silenceTimerRef.current = setTimeout(() => {
          if (!shouldListenRef.current || isMutedRef.current || hasSpokenRef.current) return;
          stopInternal();
          callbacksRef.current.onSilenceTimeout?.();
        }, FOLLOWUP_SILENCE_TIMEOUT_MS);
      }, INITIAL_SILENCE_PROMPT_MS);
    } else {
      silenceTimerRef.current = setTimeout(() => {
        if (!shouldListenRef.current || isMutedRef.current || hasSpokenRef.current) return;
        stopInternal();
        callbacksRef.current.onSilenceTimeout?.();
      }, FOLLOWUP_SILENCE_TIMEOUT_MS);
    }
  }, [stopInternal]);

  const startRecognitionInstance = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || !shouldListenRef.current || isMutedRef.current) return;

    try {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = langRef.current;

      rec.onresult = (event) => {
        if (!shouldListenRef.current) return;

        let newFinal = finalRef.current;
        let currentInterim = '';
        let gotNewFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            newFinal = newFinal ? `${newFinal.trim()} ${text.trim()}` : text.trim();
            gotNewFinal = true;
          } else {
            currentInterim += text;
          }
        }

        if (gotNewFinal) {
          resultTimestampsRef.current.push(Date.now());
        }

        finalRef.current = newFinal;
        interimRef.current = currentInterim.trim();
        setFinalTranscript(finalRef.current);
        setInterimTranscript(interimRef.current);

        const combined = `${finalRef.current} ${interimRef.current}`.trim();
        if (combined.length > 0 && !hasSpokenRef.current) {
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }

        // Reset 2.5s answer-completion timer when >= 3 words spoken
        if (pauseTimerRef.current) {
          clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = null;
        }

        if (countWords(combined) >= 3) {
          pauseTimerRef.current = setTimeout(() => {
            if (!shouldListenRef.current) return;
            const fullAnswer = `${finalRef.current} ${interimRef.current}`.trim();
            const timestamps = [...resultTimestampsRef.current];
            stopInternal();
            callbacksRef.current.onAnswerComplete?.({
              text: fullAnswer,
              resultTimestamps: timestamps,
            });
          }, PAUSE_COMPLETE_MS);
        }
      };

      rec.onerror = (event) => {
        const errCode = event?.error;
        if (errCode === 'no-speech' || errCode === 'aborted') {
          return;
        }
        if (errCode === 'language-not-supported' && langRef.current !== 'en-US') {
          langRef.current = 'en-US';
          return;
        }
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          stopInternal();
          callbacksRef.current.onPermissionError?.(
            'Microphone speech recognition permission was denied.'
          );
        }
      };

      rec.onend = () => {
        recognitionRef.current = null;
        if (shouldListenRef.current && !isMutedRef.current) {
          // Chrome stops recognition after silence; guarded restart
          setTimeout(() => {
            if (shouldListenRef.current && !isMutedRef.current) {
              startRecognitionInstance();
            }
          }, 120);
        }
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch {
      // Ignore start race errors
    }
  }, [stopInternal]);

  const startListening = useCallback(
    ({ reset = true } = {}) => {
      if (reset) {
        finalRef.current = '';
        interimRef.current = '';
        resultTimestampsRef.current = [];
        hasSpokenRef.current = false;
        promptedSilenceRef.current = false;
        setFinalTranscript('');
        setInterimTranscript('');
      }
      shouldListenRef.current = true;
      if (!isMutedRef.current && isSupported) {
        startRecognitionInstance();
        scheduleSilenceWatchers();
      }
    },
    [isSupported, scheduleSilenceWatchers, startRecognitionInstance]
  );

  const stopListening = useCallback(() => {
    stopInternal();
  }, [stopInternal]);

  const setMuted = useCallback(
    (muted) => {
      isMutedRef.current = muted;
      if (muted) {
        clearTimers();
        setIsListening(false);
        const rec = recognitionRef.current;
        if (rec) {
          try {
            rec.onend = null;
            rec.stop();
          } catch {
            // Ignore
          }
          recognitionRef.current = null;
        }
      } else if (shouldListenRef.current && isSupported) {
        startRecognitionInstance();
        scheduleSilenceWatchers();
      }
    },
    [clearTimers, isSupported, scheduleSilenceWatchers, startRecognitionInstance]
  );

  const getPartialAnswer = useCallback(() => {
    return {
      text: `${finalRef.current} ${interimRef.current}`.trim(),
      resultTimestamps: [...resultTimestampsRef.current],
    };
  }, []);

  const submitNow = useCallback(() => {
    if (!shouldListenRef.current) return;
    const fullAnswer = `${finalRef.current} ${interimRef.current}`.trim();
    const timestamps = [...resultTimestampsRef.current];
    stopInternal();
    callbacksRef.current.onAnswerComplete?.({
      text: fullAnswer,
      resultTimestamps: timestamps,
    });
  }, [stopInternal]);

  const resetTranscript = useCallback(() => {
    finalRef.current = '';
    interimRef.current = '';
    resultTimestampsRef.current = [];
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      stopInternal();
    };
  }, [stopInternal]);

  return {
    isSupported,
    isListening,
    finalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    setMuted,
    getPartialAnswer,
    submitNow,
    resetTranscript,
  };
}
