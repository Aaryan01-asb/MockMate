import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'mockmate_interview_setup_v1';

const DEFAULT_SETUP = {
  category: 'Software Engineering',
  tags: '',
  durationMin: 7,
  resumeText: '',
  resumeFileName: '',
  resumeChars: 0,
};

function loadInitialSetup() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETUP;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETUP,
      ...parsed,
      category: parsed.category || DEFAULT_SETUP.category,
    };
  } catch {
    return DEFAULT_SETUP;
  }
}

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [setup, setSetupState] = useState(loadInitialSetup);
  // Holds active MediaStream from Lobby so Meeting avoids a second permission prompt
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
    } catch {
      // Ignore storage quota errors
    }
  }, [setup]);

  const updateSetup = useCallback((patch) => {
    setSetupState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSetup = useCallback(() => {
    setSetupState(DEFAULT_SETUP);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const hasValidSetup = Boolean(
    setup.resumeText && setup.resumeText.trim().length > 0 && setup.category
  );

  return (
    <InterviewContext.Provider
      value={{
        setup,
        updateSetup,
        resetSetup,
        hasValidSetup,
        mediaStreamRef,
        stopMediaStream,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return ctx;
}
