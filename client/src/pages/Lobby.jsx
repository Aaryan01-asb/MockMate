import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Clock,
  FileText,
  Mic,
  RefreshCw,
  Tag,
  VideoOff,
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

function getSpeechRecognitionAvailable() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export default function Lobby() {
  const navigate = useNavigate();
  const { setup, mediaStreamRef, stopMediaStream } = useInterview();

  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const joiningRef = useRef(false);

  const [streamReady, setStreamReady] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [mediaError, setMediaError] = useState(null); // { type, message }
  const speechSupported = getSpeechRecognitionAvailable();

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const startMedia = useCallback(async () => {
    setMediaError(null);
    setStreamReady(false);
    stopAnalyser();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError({
        type: 'unsupported',
        message:
          'Your browser does not support camera and microphone access. Please open this page in Google Chrome.',
      });
      return;
    }

    try {
      // Reuse existing active stream if present, otherwise request a fresh one
      let stream = mediaStreamRef.current;
      const hasLiveTracks =
        stream && stream.getTracks().some((t) => t.readyState === 'live');
      if (!hasLiveTracks) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Live mic level meter using AudioContext + AnalyserNode
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i += 1) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const pct = Math.min(100, Math.round(rms * 320));
          setMicLevel(pct);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      }

      setStreamReady(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError({
          type: 'denied',
          message:
            'Camera or microphone permission was denied. Click the lock icon in your browser address bar, allow Camera and Microphone, then click Retry.',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMediaError({
          type: 'not_found',
          message:
            'No camera or microphone was found. Please connect a webcam and mic, then click Retry.',
        });
      } else {
        setMediaError({
          type: 'other',
          message: err.message || 'Unable to access camera and microphone.',
        });
      }
    }
  }, [mediaStreamRef, stopAnalyser]);

  useEffect(() => {
    startMedia();
    return () => {
      stopAnalyser();
      // Keep the stream alive only if the user clicked Join Interview
      if (!joiningRef.current) {
        stopMediaStream();
      }
    };
  }, [startMedia, stopAnalyser, stopMediaStream]);

  function handleJoin() {
    if (!streamReady) return;
    joiningRef.current = true;
    stopAnalyser();
    navigate('/meeting');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/setup"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to setup
          </Link>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Step 2 of 2 · Pre-interview check
          </span>
        </div>

        {!speechSupported && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3 text-sm text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Please use Google Chrome for voice features.</strong> Your current browser
              does not support Web Speech recognition (you can still type answers as a fallback).
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Webcam & Mic Check */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Camera & Microphone Check</h1>
            <p className="text-sm text-slate-600 mb-4">
              Make sure you are visible and your mic meter moves when you speak.
            </p>

            <div className="relative aspect-video w-full rounded-xl bg-neutral-950 overflow-hidden flex items-center justify-center mb-4">
              {mediaError ? (
                <div className="p-6 text-center max-w-md text-white">
                  <VideoOff className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-200 mb-4">{mediaError.message}</p>
                  <button
                    type="button"
                    onClick={startMedia}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry permissions
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  {!streamReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 text-neutral-300 text-sm gap-2">
                      <Camera className="w-7 h-7 animate-pulse" />
                      <span>Requesting camera and microphone...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mic Level Meter */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Microphone input level
                </span>
                <span className="text-slate-500">
                  {streamReady ? (micLevel > 5 ? 'Signal detected' : 'Speak to test') : 'Waiting...'}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-75 rounded-full"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Setup Summary & Join */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Interview Summary</h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Category
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">{setup.category}</dd>
                </div>

                {setup.tags && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Focus tags
                    </dt>
                    <dd className="mt-1 text-slate-700">{setup.tags}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Duration
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">{setup.durationMin} minutes</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Resume
                  </dt>
                  <dd className="mt-1 text-slate-700 truncate">
                    {setup.resumeFileName
                      ? `${setup.resumeFileName} (${setup.resumeChars || setup.resumeText.length} chars)`
                      : `Pasted text (${setup.resumeText.length} chars)`}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200">
              <button
                type="button"
                disabled={!streamReady}
                onClick={handleJoin}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Join Interview
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-slate-500 text-center mt-2.5">
                Aria will greet you and start with “Tell me about yourself.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
