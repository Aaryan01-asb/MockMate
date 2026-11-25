import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function Captions({
  visible,
  question,
  finalTranscript,
  interimTranscript,
  isThinking,
  speechSupported,
  canTypeFallback,
  onSubmitTypedAnswer,
}) {
  const [typedText, setTypedText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = typedText.trim();
    if (!cleaned) return;
    onSubmitTypedAnswer?.(cleaned);
    setTypedText('');
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {visible && (
        <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 px-5 py-4 space-y-2">
          <div className="text-sm text-indigo-300 font-medium">
            <span className="text-xs uppercase tracking-wider text-indigo-400 mr-2">Aria:</span>
            {question || '...'}
          </div>

          {isThinking ? (
            <div className="text-sm text-neutral-400 italic">Aria is thinking...</div>
          ) : (
            <div className="text-sm min-h-[1.25rem]">
              <span className="text-xs uppercase tracking-wider text-neutral-500 mr-2">You:</span>
              {finalTranscript || interimTranscript ? (
                <>
                  {finalTranscript && (
                    <span className="text-white">{finalTranscript} </span>
                  )}
                  {interimTranscript && (
                    <span className="text-neutral-400">{interimTranscript}</span>
                  )}
                </>
              ) : (
                <span className="text-neutral-500 italic">Waiting for your answer...</span>
              )}
            </div>
          )}
        </div>
      )}

      {!speechSupported && canTypeFallback && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Speech recognition unavailable — type your answer and press Enter..."
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!typedText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      )}
    </div>
  );
}
