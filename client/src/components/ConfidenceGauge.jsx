import React from 'react';
import { Activity, AlertCircle, MessageSquareWarning, PauseCircle } from 'lucide-react';

export default function ConfidenceGauge({ confidenceScore = 0, totals = {} }) {
  const words = Number(totals.words) || 0;
  const fillers = Number(totals.fillers) || 0;
  const avgWpm = Number(totals.avgWpm) || 0;
  const longPauses = Number(totals.longPauses) || 0;
  const insufficientData = words < 20;

  const clamped = Math.max(0, Math.min(100, Math.round(confidenceScore)));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">Delivery & Confidence</h2>
        <p className="text-xs text-slate-500 mb-5">
          Based on filler rate, speaking pace (110–160 WPM ideal), and long pauses
        </p>

        <div className="flex items-center gap-5 mb-6">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={insufficientData ? '#cbd5e1' : '#4f46e5'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={insufficientData ? circumference : offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">
                {insufficientData ? '—' : clamped}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">/ 100</span>
            </div>
          </div>

          <div>
            {insufficientData ? (
              <div className="inline-flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Not enough speech to score (under 20 words captured).</span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {clamped >= 80
                    ? 'Strong, steady delivery'
                    : clamped >= 60
                    ? 'Good delivery with minor habits to polish'
                    : 'Delivery needs pacing & filler control'}
                </p>
                <p className="text-xs text-slate-500 mt-1">{words} total words spoken</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MessageSquareWarning className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fillers</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{fillers}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Avg WPM</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{avgWpm}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <PauseCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Long pauses</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{longPauses}</p>
        </div>
      </div>
    </div>
  );
}
