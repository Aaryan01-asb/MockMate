import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, User } from 'lucide-react';

export default function WebcamTile({ stream, cameraOn, isMuted, isListening, isUserTurn }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraOn]);

  return (
    <div
      className={`relative rounded-2xl bg-neutral-900 aspect-video w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
        isUserTurn && !isMuted
          ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
          : 'border border-neutral-800'
      }`}
    >
      {cameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
          <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
            <User className="w-10 h-10 text-neutral-500" />
          </div>
          <span className="text-xs text-neutral-500">Camera off</span>
        </div>
      )}

      {/* Mic-active indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur border border-neutral-800 text-xs">
        {isMuted ? (
          <>
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300">Muted</span>
          </>
        ) : isUserTurn && isListening ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">Mic live</span>
          </>
        ) : (
          <>
            <MicOff className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="text-neutral-400">Stand by</span>
          </>
        )}
      </div>

      {/* Nameplate */}
      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-neutral-950/80 backdrop-blur text-xs font-medium text-neutral-200 border border-neutral-800">
        You
      </div>
    </div>
  );
}
