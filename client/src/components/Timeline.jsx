import React from 'react';
import { AlertTriangle, CheckCircle2, MessageSquareWarning, PauseCircle } from 'lucide-react';

function formatTimestamp(sec) {
  const safe = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const EVENT_STYLES = {
  pause: {
    icon: PauseCircle,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
  },
  filler: {
    icon: MessageSquareWarning,
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600',
  },
  strong: {
    icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  weak: {
    icon: AlertTriangle,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'text-rose-600',
  },
};

export default function Timeline({ events = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Replay Timeline</h2>
      <p className="text-xs text-slate-500 mb-4">
        Key moments detected during your interview
      </p>

      {events.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No notable timeline events recorded.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev, idx) => {
            const style = EVENT_STYLES[ev.type] || EVENT_STYLES.pause;
            const Icon = style.icon;
            return (
              <li
                key={`${ev.tSec}-${ev.type}-${idx}`}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${style.badge}`}
                >
                  {formatTimestamp(ev.tSec)}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
                <span className="text-slate-800">{ev.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
