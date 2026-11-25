import React from 'react';
import { AlertCircle, CheckCircle2, Sparkles, XCircle } from 'lucide-react';

function formatTimestamp(sec) {
  const safe = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AnswerCard({ turn, idx }) {
  const scores = turn.scores || {};
  const strengths = Array.isArray(turn.strengths) ? turn.strengths : [];
  const weaknesses = Array.isArray(turn.weaknesses) ? turn.weaknesses : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {formatTimestamp(turn.startedAtSec)}
            </span>
            <span className="text-xs font-medium text-slate-500">Question {idx + 1}</span>
            {turn.isFollowUp && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Follow-up
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900">{turn.question}</h3>
        </div>

        {!turn.evalFailed && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              ['Relevance', scores.relevance],
              ['Technical', scores.technical],
              ['Clarity', scores.clarity],
              ['Comm.', scores.communication],
            ].map(([label, val]) => (
              <span
                key={label}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium"
              >
                {label}: <strong className="text-indigo-600">{val ?? '—'}/10</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {turn.evalFailed && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Scoring unavailable for this answer.</span>
        </div>
      )}

      {/* Two-column Your answer vs Improved answer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Your answer
          </p>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {turn.answer && turn.answer.trim() ? turn.answer : '(no answer)'}
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Improved answer
          </p>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {turn.improvedAnswer && turn.improvedAnswer.trim()
              ? turn.improvedAnswer
              : 'No rewrite generated for this turn.'}
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {strengths.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Strengths
              </p>
              <ul className="space-y-1">
                {strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Areas to improve
              </p>
              <ul className="space-y-1">
                {weaknesses.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
