import React from 'react';
import { Clock } from 'lucide-react';

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function Timer({ secondsRemaining }) {
  const isUrgent = secondsRemaining <= 60;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold transition-colors ${
        isUrgent
          ? 'bg-rose-950/70 border-rose-500/60 text-rose-400 animate-pulse'
          : 'bg-neutral-900 border-neutral-800 text-neutral-200'
      }`}
    >
      <Clock className="w-4 h-4" />
      <span>{formatTime(secondsRemaining)}</span>
    </div>
  );
}
