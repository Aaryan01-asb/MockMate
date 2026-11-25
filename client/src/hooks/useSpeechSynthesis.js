import { useCallback, useEffect, useRef, useState } from 'react';

function pickEnglishVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const priorities = ['en-IN', 'en-GB', 'en-US'];
  for (const lang of priorities) {
    const match = voices.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase());
    if (match) return match;
  }
  return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];
}

function splitIntoSentences(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?]+[.!?]*\s*/g);
  return parts ? parts.map((p) => p.trim()).filter(Boolean) : [cleaned];
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef(null);
  const speakTokenRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = pickEnglishVoice(voices);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      speakTokenRef.current += 1;
      window.speechSynthesis.cancel();
    };
  }, []);

  const cancel = useCallback(() => {
    speakTokenRef.current += 1;
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback((text, { onStart, onEnd } = {}) => {
    const token = ++speakTokenRef.current;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSpeaking(false);
      onStart?.();
      setTimeout(() => {
        if (speakTokenRef.current === token) onEnd?.();
      }, 0);
      return;
    }

    window.speechSynthesis.cancel();

    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) {
      setIsSpeaking(false);
      onStart?.();
      onEnd?.();
      return;
    }

    if (!voiceRef.current) {
      voiceRef.current = pickEnglishVoice(window.speechSynthesis.getVoices());
    }

    setIsSpeaking(true);
    let started = false;

    const speakSentence = (index) => {
      if (speakTokenRef.current !== token) return;

      if (index >= sentences.length) {
        setIsSpeaking(false);
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
        utterance.lang = voiceRef.current.lang;
      } else {
        utterance.lang = 'en-IN';
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (speakTokenRef.current !== token) return;
        if (!started) {
          started = true;
          onStart?.();
        }
      };

      utterance.onend = () => {
        if (speakTokenRef.current !== token) return;
        speakSentence(index + 1);
      };

      utterance.onerror = () => {
        if (speakTokenRef.current !== token) return;
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakSentence(0);
  }, []);

  return { speak, cancel, isSpeaking };
}
