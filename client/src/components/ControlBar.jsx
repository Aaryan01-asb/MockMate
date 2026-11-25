import React from 'react';
import {
  Captions as CaptionsIcon,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from 'lucide-react';

export default function ControlBar({
  isMuted,
  onToggleMute,
  cameraOn,
  onToggleCamera,
  captionsOn,
  onToggleCaptions,
  onDoneSpeaking,
  showDoneSpeaking,
  onEndCall,
  disabled,
}) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <button
        type="button"
        onClick={onToggleMute}
        disabled={disabled}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        className={`p-3.5 rounded-full border transition-colors disabled:opacity-50 ${
          isMuted
            ? 'bg-rose-600/20 border-rose-500/50 text-rose-400 hover:bg-rose-600/30'
            : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
        }`}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        type="button"
        onClick={onToggleCamera}
        disabled={disabled}
        title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
        className={`p-3.5 rounded-full border transition-colors disabled:opacity-50 ${
          !cameraOn
            ? 'bg-rose-600/20 border-rose-500/50 text-rose-400 hover:bg-rose-600/30'
            : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
        }`}
      >
        {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      <button
        type="button"
        onClick={onToggleCaptions}
        disabled={disabled}
        title={captionsOn ? 'Hide captions' : 'Show captions'}
        className={`p-3.5 rounded-full border transition-colors disabled:opacity-50 ${
          captionsOn
            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30'
            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
        }`}
      >
        <CaptionsIcon className="w-5 h-5" />
      </button>

      {showDoneSpeaking && (
        <button
          type="button"
          onClick={onDoneSpeaking}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Done Speaking</span>
        </button>
      )}

      <button
        type="button"
        onClick={onEndCall}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
      >
        <PhoneOff className="w-4 h-4" />
        <span>End call</span>
      </button>
    </div>
  );
}
