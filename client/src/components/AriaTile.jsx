import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AriaTile({ isSpeaking, status }) {
  return (
    <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 aspect-video w-full flex flex-col items-center justify-center overflow-hidden p-6">
      {/* Avatar with pulsing ring when speaking */}
      <div className="relative flex items-center justify-center mb-4">
        {isSpeaking && (
          <>
            <span className="absolute w-32 h-32 rounded-full bg-indigo-500/20 animate-ping" />
            <span className="absolute w-28 h-28 rounded-full border-2 border-indigo-400/70 animate-pulse" />
          </>
        )}
        <div
          className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 flex items-center justify-center shadow-lg transition-transform duration-300 ${
            isSpeaking ? 'scale-105' : 'scale-100'
          }`}
        >
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      </div>

      <p className="text-sm font-medium text-neutral-200">
        {status === 'Thinking'
          ? 'Thinking...'
          : isSpeaking
          ? 'Speaking...'
          : 'Listening'}
      </p>

      {/* Nameplate */}
      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-neutral-950/80 backdrop-blur text-xs font-medium text-neutral-200 border border-neutral-800">
        Aria · AI Interviewer
      </div>
    </div>
  );
}
