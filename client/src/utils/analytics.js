// Strong filler set per PRD Section 10:
// Multi-word phrases checked before single words so we don't double-count.
const PHRASE_FILLERS = ['you know', 'i mean', 'kind of', 'sort of'];
const SINGLE_FILLERS = ['um', 'uh', 'umm', 'uhh', 'er', 'erm', 'basically', 'like'];

export function countWords(text) {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Compute per-answer speech analytics from transcript and recognition timestamps.
 *
 * @param {object} params
 * @param {string} params.text
 * @param {number} params.startedAtSec - Answer start relative to interview start
 * @param {number} params.endedAtSec - Answer end relative to interview start
 * @param {number[]} [params.resultTimestamps] - Epoch ms timestamps of final recognition chunks
 * @param {number} [params.interviewStartMs] - Epoch ms when interview countdown started
 */
export function computeAnswerAnalytics({
  text = '',
  startedAtSec = 0,
  endedAtSec = 0,
  resultTimestamps = [],
  interviewStartMs = 0,
}) {
  const cleanText = String(text || '').trim();
  const words = countWords(cleanText);

  // Count fillers (case-insensitive whole-word matches)
  const fillerList = [];
  let working = cleanText.toLowerCase();

  for (const phrase of PHRASE_FILLERS) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = working.match(regex);
    if (matches) {
      for (const m of matches) fillerList.push(m);
      working = working.replace(regex, ' ');
    }
  }

  for (const word of SINGLE_FILLERS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = working.match(regex);
    if (matches) {
      for (const m of matches) fillerList.push(m);
    }
  }

  // WPM: words / ((endedAtSec - firstSpeechSec) / 60)
  // Exclude answers under 3 seconds or with 0 words.
  let firstSpeechSec = startedAtSec;
  if (resultTimestamps.length > 0 && interviewStartMs > 0) {
    firstSpeechSec = Math.max(0, (resultTimestamps[0] - interviewStartMs) / 1000);
  }
  const speakingDurationSec = Math.max(0, endedAtSec - firstSpeechSec);
  const wpm =
    words > 0 && speakingDurationSec >= 3
      ? Math.round(words / (speakingDurationSec / 60))
      : 0;

  // Long pauses: gaps > 2000 ms between consecutive final result timestamps
  let longPauses = 0;
  const pauseEvents = [];
  for (let i = 1; i < resultTimestamps.length; i += 1) {
    const gapMs = resultTimestamps[i] - resultTimestamps[i - 1];
    if (gapMs > 2000) {
      longPauses += 1;
      const tSec =
        interviewStartMs > 0
          ? Math.max(0, Math.round((resultTimestamps[i - 1] - interviewStartMs) / 1000))
          : Math.round(startedAtSec);
      pauseEvents.push({
        tSec,
        durationSec: Math.round((gapMs / 1000) * 10) / 10,
      });
    }
  }

  return {
    words,
    fillers: fillerList.length,
    fillerList,
    wpm,
    longPauses,
    pauseEvents,
  };
}
