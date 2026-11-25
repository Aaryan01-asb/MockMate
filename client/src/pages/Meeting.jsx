import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { evaluateTurn, getOpeningQuestion, saveSession } from '../services/api';
import { computeAnswerAnalytics, countWords } from '../utils/analytics';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useCountdown } from '../hooks/useCountdown';
import AriaTile from '../components/AriaTile';
import WebcamTile from '../components/WebcamTile';
import Timer from '../components/Timer';
import Captions from '../components/Captions';
import ControlBar from '../components/ControlBar';
import ConfirmDialog from '../components/ConfirmDialog';

const FALLBACK_OPENING =
  "Hi, I'm Aria, and I'll be your interviewer today. Let's begin. Tell me about yourself.";

const CLOSING_LINE =
  "That's all the time we have. Thank you for your answers. I'm preparing your report now.";

const STATUS_LABELS = {
  INIT: 'Starting...',
  FETCH_FIRST_Q: 'Starting...',
  ARIA_SPEAKING: 'Aria speaking',
  LISTENING: 'Listening',
  ANSWER_COMPLETE: 'Thinking',
  CLOSING: 'Closing',
  ENDED: 'Ended',
};

export default function Meeting() {
  const navigate = useNavigate();
  const { setup, mediaStreamRef, stopMediaStream } = useInterview();

  const [engineState, setEngineState] = useState('INIT');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [stream, setStream] = useState(mediaStreamRef.current);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [permissionBanner, setPermissionBanner] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // Refs for state-machine callbacks (avoid stale closures & StrictMode double-start)
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const engineStateRef = useRef('INIT');
  const currentQuestionRef = useRef('');
  const currentIsFollowUpRef = useRef(false);
  const interviewStartMsRef = useRef(0);
  const turnStartSecRef = useRef(0);
  const turnsRef = useRef([]);
  const pendingEvaluationsRef = useRef([]);
  const savedPayloadRef = useRef(null);

  const setMachineState = useCallback((next) => {
    engineStateRef.current = next;
    setEngineState(next);
  }, []);

  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis();

  // Forward-declared ref for handleExpire / finishInterview
  const finishInterviewRef = useRef(null);
  const handleExpireRef = useRef(null);

  const {
    secondsRemaining,
    start: startCountdown,
    stop: stopCountdown,
    getSecondsRemaining,
    getElapsedSec,
  } = useCountdown(setup.durationMin, () => {
    handleExpireRef.current?.();
  });

  const recognitionCallbacksRef = useRef({});

  const {
    isSupported: speechSupported,
    isListening,
    finalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    setMuted: setRecognitionMuted,
    getPartialAnswer,
    submitNow,
    resetTranscript,
  } = useSpeechRecognition({
    onAnswerComplete: (payload) => recognitionCallbacksRef.current.onAnswerComplete?.(payload),
    onInitialSilencePrompt: () => recognitionCallbacksRef.current.onInitialSilencePrompt?.(),
    onSilenceTimeout: () => recognitionCallbacksRef.current.onSilenceTimeout?.(),
    onPermissionError: (msg) => setPermissionBanner(msg),
  });

  const submitSavePayload = useCallback(
    async (payload) => {
      setSaving(true);
      setSaveError('');
      try {
        const res = await saveSession(payload);
        navigate(`/report/${res.sessionId}`, { replace: true });
      } catch (err) {
        setSaving(false);
        setSaveError(err.message || 'Failed to save your interview report. Please retry.');
      }
    },
    [navigate]
  );

  const finishInterview = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setMachineState('ENDED');

    stopCountdown();
    stopListening();
    cancelSpeech();
    stopMediaStream();
    setStream(null);
    setSaving(true);

    await Promise.allSettled(pendingEvaluationsRef.current);

    const payload = {
      setup: {
        category: setup.category,
        tags: setup.tags || '',
        durationMin: Number(setup.durationMin) || 7,
        resumeText: setup.resumeText,
      },
      turns: turnsRef.current,
      totalDurationSec: getElapsedSec(),
    };
    savedPayloadRef.current = payload;

    await submitSavePayload(payload);
  }, [
    cancelSpeech,
    getElapsedSec,
    setMachineState,
    setup,
    stopCountdown,
    stopListening,
    stopMediaStream,
    submitSavePayload,
  ]);

  finishInterviewRef.current = finishInterview;

  const startClosing = useCallback(() => {
    if (endedRef.current || engineStateRef.current === 'CLOSING') return;
    stopListening();
    setMachineState('CLOSING');
    currentQuestionRef.current = CLOSING_LINE;
    setCurrentQuestion(CLOSING_LINE);

    speak(CLOSING_LINE, {
      onEnd: () => {
        if (!endedRef.current) {
          finishInterviewRef.current?.();
        }
      },
    });
  }, [setMachineState, speak, stopListening]);

  const speakQuestionAndListen = useCallback(
    (questionText, isFollowUp) => {
      if (endedRef.current) return;
      if (getSecondsRemaining() <= 45) {
        startClosing();
        return;
      }

      currentQuestionRef.current = questionText;
      currentIsFollowUpRef.current = Boolean(isFollowUp);
      setCurrentQuestion(questionText);
      resetTranscript();
      setMachineState('ARIA_SPEAKING');

      speak(questionText, {
        onEnd: () => {
          if (endedRef.current) return;
          if (getSecondsRemaining() <= 45) {
            startClosing();
            return;
          }
          turnStartSecRef.current = getElapsedSec();
          setMachineState('LISTENING');
          startListening({ reset: true });
        },
      });
    },
    [
      getElapsedSec,
      getSecondsRemaining,
      resetTranscript,
      setMachineState,
      speak,
      startClosing,
      startListening,
    ]
  );

  const enqueueEvaluation = useCallback(
    ({ text, resultTimestamps, startedAtSec, endedAtSec, needNextQuestion }) => {
      const questionAsked = currentQuestionRef.current;
      const isFollowUp = currentIsFollowUpRef.current;
      const followUpAllowed = !isFollowUp;

      const analytics = computeAnswerAnalytics({
        text,
        startedAtSec,
        endedAtSec,
        resultTimestamps,
        interviewStartMs: interviewStartMsRef.current,
      });

      const historySnapshot = turnsRef.current.slice(-4).map((t) => ({
        question: t.question,
        answer: t.answer,
      }));

      const turnRecord = {
        index: turnsRef.current.length,
        question: questionAsked,
        isFollowUp,
        answer: text,
        startedAtSec,
        endedAtSec,
        scores: { relevance: 5, technical: 5, clarity: 5, communication: 5 },
        strengths: [],
        weaknesses: [],
        improvedAnswer: '',
        evalFailed: false,
        analytics,
      };
      turnsRef.current.push(turnRecord);

      const evalPromise = evaluateTurn({
        resumeText: setup.resumeText,
        category: setup.category,
        tags: setup.tags || '',
        question: questionAsked,
        answer: text,
        isFollowUp,
        followUpAllowed,
        history: historySnapshot,
        secondsRemaining: getSecondsRemaining(),
        needNextQuestion,
      })
        .then((res) => {
          turnRecord.scores = res.scores || turnRecord.scores;
          turnRecord.strengths = Array.isArray(res.strengths) ? res.strengths : [];
          turnRecord.weaknesses = Array.isArray(res.weaknesses) ? res.weaknesses : [];
          turnRecord.improvedAnswer = res.improvedAnswer || '';
          turnRecord.evalFailed = Boolean(res.evalFailed);
          return res;
        })
        .catch(() => {
          turnRecord.evalFailed = true;
          return {
            nextQuestion: null,
            nextIsFollowUp: false,
            evalFailed: true,
          };
        });

      pendingEvaluationsRef.current.push(evalPromise);
      return evalPromise;
    },
    [getSecondsRemaining, setup]
  );

  const handleAnswerComplete = useCallback(
    async ({ text, resultTimestamps = [] }) => {
      if (endedRef.current || engineStateRef.current !== 'LISTENING') return;

      stopListening();
      setMachineState('ANSWER_COMPLETE');

      const endedAtSec = getElapsedSec();
      const startedAtSec = turnStartSecRef.current;
      const needNextQuestion = getSecondsRemaining() > 45;

      const evalPromise = enqueueEvaluation({
        text,
        resultTimestamps,
        startedAtSec,
        endedAtSec,
        needNextQuestion,
      });

      if (!needNextQuestion) {
        startClosing();
        return;
      }

      const evalResult = await evalPromise;
      if (endedRef.current) return;

      if (getSecondsRemaining() <= 45 || !evalResult?.nextQuestion) {
        startClosing();
        return;
      }

      speakQuestionAndListen(evalResult.nextQuestion, Boolean(evalResult.nextIsFollowUp));
    },
    [
      enqueueEvaluation,
      getElapsedSec,
      getSecondsRemaining,
      setMachineState,
      speakQuestionAndListen,
      startClosing,
      stopListening,
    ]
  );

  // Wire recognition callbacks
  recognitionCallbacksRef.current = {
    onAnswerComplete: handleAnswerComplete,
    onInitialSilencePrompt: () => {
      if (endedRef.current || engineStateRef.current !== 'LISTENING') return;
      stopListening();
      speak('Take your time. Would you like me to repeat the question?', {
        onEnd: () => {
          if (!endedRef.current && engineStateRef.current === 'LISTENING') {
            startListening({ reset: false });
          }
        },
      });
    },
    onSilenceTimeout: () => {
      handleAnswerComplete({ text: '', resultTimestamps: [] });
    },
  };

  // End-of-timer (00:00) and End Call handler
  const handleImmediateEnd = useCallback(() => {
    if (endedRef.current) return;

    if (engineStateRef.current === 'LISTENING') {
      const partial = getPartialAnswer();
      if (countWords(partial.text) >= 3) {
        enqueueEvaluation({
          text: partial.text,
          resultTimestamps: partial.resultTimestamps,
          startedAtSec: turnStartSecRef.current,
          endedAtSec: getElapsedSec(),
          needNextQuestion: false,
        });
      }
    }

    finishInterview();
  }, [enqueueEvaluation, finishInterview, getElapsedSec, getPartialAnswer]);

  handleExpireRef.current = handleImmediateEnd;

  // Ensure media stream exists (reuse Lobby stream; fallback request on direct refresh)
  useEffect(() => {
    let active = true;
    async function ensureStream() {
      const existing = mediaStreamRef.current;
      const hasLive = existing && existing.getTracks().some((t) => t.readyState === 'live');
      if (hasLive) {
        setStream(existing);
        return;
      }
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const fresh = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (!active) {
            fresh.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = fresh;
          setStream(fresh);
        } catch {
          // Proceed without stream if denied on refresh
        }
      }
    }
    ensureStream();
    return () => {
      active = false;
    };
  }, [mediaStreamRef]);

  // Start sequence (idempotent under React StrictMode)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function begin() {
      setMachineState('FETCH_FIRST_Q');
      let opening = FALLBACK_OPENING;
      try {
        const res = await getOpeningQuestion({
          resumeText: setup.resumeText,
          category: setup.category,
          tags: setup.tags || '',
          durationMin: Number(setup.durationMin) || 7,
        });
        if (res?.question) opening = res.question;
      } catch {
        // Fallback already set
      }

      if (endedRef.current) return;
      interviewStartMsRef.current = startCountdown();
      speakQuestionAndListen(opening, false);
    }

    begin();
  }, [setMachineState, setup, speakQuestionAndListen, startCountdown]);

  // Warn on browser tab close/refresh while active
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!endedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Cleanup all streams, synthesis, recognition on unmount
  useEffect(() => {
    return () => {
      stopCountdown();
      stopListening();
      cancelSpeech();
      stopMediaStream();
    };
  }, [cancelSpeech, stopCountdown, stopListening, stopMediaStream]);

  function handleToggleMute() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }
    setRecognitionMuted(nextMuted);
  }

  function handleToggleCamera() {
    const nextCam = !cameraOn;
    setCameraOn(nextCam);
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = nextCam;
      });
    }
  }

  function handleTypedAnswerSubmit(text) {
    handleAnswerComplete({ text, resultTimestamps: [] });
  }

  // Full-screen loader or retry error when interview has ended
  if (engineState === 'ENDED') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
          {saveError ? (
            <>
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">Could not save report</h2>
              <p className="text-sm text-neutral-400 mb-6">{saveError}</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => savedPayloadRef.current && submitSavePayload(savedPayloadRef.current)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                Retry saving report
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-1">Generating your report...</h2>
              <p className="text-sm text-neutral-400">
                Finalizing your scores, speech analytics, and answer rewrites.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-neutral-800/80 px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <h1 className="text-sm sm:text-base font-semibold truncate">
            Mock Interview · {setup.category}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 text-indigo-300">
            {STATUS_LABELS[engineState] || engineState}
          </span>
          <Timer secondsRemaining={secondsRemaining} />
        </div>
      </header>

      {permissionBanner && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2.5 text-center text-xs sm:text-sm text-rose-200">
          {permissionBanner}
        </div>
      )}

      {/* Main tiles */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto gap-5">
        {/* Prominent Speak vs. Stand By turn banner */}
        <div className="flex justify-center">
          {engineState === 'LISTENING' ? (
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/60 text-emerald-300 text-sm font-semibold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Your turn — Speak now</span>
            </div>
          ) : engineState === 'ANSWER_COMPLETE' ? (
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-200 text-sm font-semibold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Aria is thinking — Stand by</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-200 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Aria is speaking — Stand by</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <AriaTile isSpeaking={isSpeaking} status={STATUS_LABELS[engineState]} />
          <WebcamTile
            stream={stream}
            cameraOn={cameraOn}
            isMuted={isMuted}
            isListening={isListening}
            isUserTurn={engineState === 'LISTENING'}
          />
        </div>

        <Captions
          visible={captionsOn}
          question={currentQuestion}
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
          isThinking={engineState === 'ANSWER_COMPLETE'}
          speechSupported={speechSupported}
          canTypeFallback={engineState === 'LISTENING'}
          onSubmitTypedAnswer={handleTypedAnswerSubmit}
        />
      </main>

      {/* Control bar */}
      <footer className="border-t border-neutral-800/80 py-4 px-4">
        <ControlBar
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          cameraOn={cameraOn}
          onToggleCamera={handleToggleCamera}
          captionsOn={captionsOn}
          onToggleCaptions={() => setCaptionsOn((v) => !v)}
          showDoneSpeaking={engineState === 'LISTENING' && speechSupported}
          onDoneSpeaking={submitNow}
          onEndCall={() => setShowEndDialog(true)}
          disabled={engineState === 'ENDED'}
        />
      </footer>

      <ConfirmDialog
        open={showEndDialog}
        title="End interview?"
        message="End the interview now? Your answers so far will still be scored."
        onCancel={() => setShowEndDialog(false)}
        onConfirm={() => {
          setShowEndDialog(false);
          handleImmediateEnd();
        }}
      />
    </div>
  );
}
