import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown(durationMin, onExpire) {
  const totalSec = Math.max(1, Number(durationMin) || 7) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSec);
  const [isRunning, setIsRunning] = useState(false);

  const startMsRef = useRef(null);
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const getSecondsRemaining = useCallback(() => {
    if (!startMsRef.current) return totalSec;
    const elapsed = Math.floor((Date.now() - startMsRef.current) / 1000);
    return Math.max(0, totalSec - elapsed);
  }, [totalSec]);

  const getElapsedSec = useCallback(() => {
    if (!startMsRef.current) return 0;
    return Math.max(0, Math.round((Date.now() - startMsRef.current) / 1000));
  }, []);

  const start = useCallback(() => {
    if (startMsRef.current) return startMsRef.current;
    const now = Date.now();
    startMsRef.current = now;
    expiredRef.current = false;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const rem = Math.max(0, totalSec - Math.floor((Date.now() - now) / 1000));
      setSecondsRemaining(rem);
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        stop();
        onExpireRef.current?.();
      }
    }, 250);

    return now;
  }, [stop, totalSec]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    secondsRemaining,
    isRunning,
    start,
    stop,
    getSecondsRemaining,
    getElapsedSec,
  };
}
