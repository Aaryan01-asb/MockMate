import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Home,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { getSession } from '../services/api';
import ScoreRadar from '../components/ScoreRadar';
import ConfidenceGauge from '../components/ConfidenceGauge';
import AnswerCard from '../components/AnswerCard';
import Timeline from '../components/Timeline';

function formatTimestamp(sec) {
  const safe = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildPlainTranscript(session) {
  const turns = session?.turns || [];
  const header = [
    `MockMate · AI Interview Coach Transcript`,
    `Category: ${session?.setup?.category || 'N/A'}`,
    session?.setup?.tags ? `Tags: ${session.setup.tags}` : null,
    `Date: ${session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}`,
    `Overall Score: ${session?.report?.overall ?? 0}/100`,
    '----------------------------------------',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const body = turns
    .map((t) => {
      const time = formatTimestamp(t.startedAtSec);
      const ans = t.answer && t.answer.trim() ? t.answer.trim() : '(no answer)';
      return `[${time}] Aria: ${t.question}\n[${time}] You: ${ans}\n`;
    })
    .join('\n');

  return `${header}${body}`;
}

export default function Report() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { status, message }
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSession(id);
      setSession(data);
    } catch (err) {
      setError({
        status: err.status || 500,
        message: err.message || 'Could not load your interview report.',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const plainTranscript = useMemo(() => buildPlainTranscript(session), [session]);

  async function handleCopyTranscript() {
    try {
      await navigator.clipboard.writeText(plainTranscript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  }

  function handleDownloadTxt() {
    const blob = new Blob([plainTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockmate-transcript-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72 rounded-2xl bg-slate-200" />
            <div className="h-72 rounded-2xl bg-slate-200" />
          </div>
          <div className="h-56 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFound = error.status === 404;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {isNotFound ? 'Report not found' : 'Failed to load report'}
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            {isNotFound
              ? 'We could not find an interview session with that ID. It may have expired or the link is incorrect.'
              : error.message}
          </p>
          <div className="flex items-center justify-center gap-3">
            {!isNotFound && (
              <button
                type="button"
                onClick={loadSession}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50"
            >
              <Home className="w-4 h-4" />
              Start new interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const report = session?.report || {};
  const turns = session?.turns || [];
  const overall = Math.max(0, Math.min(100, Math.round(Number(report.overall) || 0)));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 1. Header: Overall Readiness Score & Summary */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{overall}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                Overall Readiness
              </span>
              <span className="text-xs text-slate-500">
                {session?.setup?.category} · {session?.setup?.durationMin} min
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Interview Coaching Report</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{report.summary}</p>
          </div>
        </section>

        {/* 2 & 3. RadarChart + Confidence Gauge */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScoreRadar radar={report.radar} />
          <ConfidenceGauge confidenceScore={report.confidenceScore} totals={report.totals} />
        </section>

        {/* 4. Answer Cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Question-by-Question Review ({turns.length})
          </h2>
          {turns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
              No answers were recorded in this session.
            </div>
          ) : (
            turns.map((turn, idx) => <AnswerCard key={turn.index ?? idx} turn={turn} idx={idx} />)
          )}
        </section>

        {/* 5. Replay Timeline */}
        <section>
          <Timeline events={report.timeline || []} />
        </section>

        {/* 6. Full Transcript (collapsible, required before bottom buttons) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setTranscriptOpen((v) => !v)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Full transcript</h2>
                <p className="text-xs text-slate-500">
                  {turns.length} {turns.length === 1 ? 'exchange' : 'exchanges'} recorded in order
                </p>
              </div>
            </div>
            {transcriptOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {transcriptOpen && (
            <div className="border-t border-slate-200 px-6 py-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copiedTranscript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy transcript
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </button>
              </div>

              {turns.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No transcript entries available.</p>
              ) : (
                <div className="space-y-4">
                  {turns.map((t, idx) => (
                    <div
                      key={t.index ?? idx}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs text-slate-500 mt-0.5 shrink-0">
                          {formatTimestamp(t.startedAtSec)}
                        </span>
                        <p className="text-slate-900">
                          <strong className="text-indigo-600">Aria:</strong> {t.question}
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs text-slate-400 mt-0.5 shrink-0">
                          {formatTimestamp(t.endedAtSec)}
                        </span>
                        <p className="text-slate-700 whitespace-pre-wrap">
                          <strong className="text-slate-900">You:</strong>{' '}
                          {t.answer && t.answer.trim() ? t.answer : '(no answer)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Bottom action buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 pt-2 pb-8">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Report link copied!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Copy report link
              </>
            )}
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Start new interview
          </Link>
        </div>
      </div>
    </div>
  );
}
