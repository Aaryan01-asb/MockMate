const DIMENSIONS = ['relevance', 'technical', 'clarity', 'communication'];
const DIMENSION_LABELS = {
  relevance: 'Relevance',
  technical: 'Technical depth',
  clarity: 'Clarity',
  communication: 'Communication',
};

function round1(num) {
  return Math.round(num * 10) / 10;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function first6Words(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 6) return words.join(' ');
  return `${words.slice(0, 6).join(' ')}...`;
}

/**
 * Build report aggregates, confidence score, timeline, and coaching summary from turns.
 */
function buildReport({ setup, turns = [], totalDurationSec }) {
  // 1. Recompute speech totals from per-turn analytics
  let totalWords = 0;
  let totalFillers = 0;
  let totalLongPauses = 0;
  const wpmValues = [];

  for (const turn of turns) {
    const a = turn.analytics || {};
    totalWords += Number(a.words) || 0;
    totalFillers += Number(a.fillers) || 0;
    totalLongPauses += Number(a.longPauses) || 0;
    if (Number(a.wpm) > 0) {
      wpmValues.push(Number(a.wpm));
    }
  }

  const avgWpm =
    wpmValues.length > 0
      ? Math.round(wpmValues.reduce((sum, v) => sum + v, 0) / wpmValues.length)
      : 0;

  // 2. Compute Confidence Score (0 to 100)
  const durationMinutes = Math.max(
    (Number(totalDurationSec) || (setup?.durationMin || 7) * 60) / 60,
    1
  );

  let confidenceScore = 0;
  let fillerPenalty = 0;
  let pacePenalty = 0;
  let pausePenalty = 0;
  const insufficientData = totalWords < 20;

  if (!insufficientData) {
    const fillerRate = totalFillers / Math.max(totalWords, 1);
    fillerPenalty = Math.min(40, fillerRate * 400);

    if (avgWpm > 0) {
      if (avgWpm < 110) {
        pacePenalty = Math.min(30, (110 - avgWpm) * 0.6);
      } else if (avgWpm > 160) {
        pacePenalty = Math.min(30, (avgWpm - 160) * 0.6);
      }
    }

    const longPausesPerMin = totalLongPauses / durationMinutes;
    pausePenalty = Math.min(30, longPausesPerMin * 6);

    confidenceScore = clamp(
      Math.round(100 - fillerPenalty - pacePenalty - pausePenalty),
      0,
      100
    );
  }

  // 3. Radar averages across non-failed turns
  const validTurns = turns.filter((t) => !t.evalFailed && t.scores);
  const radar = { relevance: 0, technical: 0, clarity: 0, communication: 0 };

  if (validTurns.length > 0) {
    for (const dim of DIMENSIONS) {
      const sum = validTurns.reduce((acc, t) => acc + (Number(t.scores[dim]) || 0), 0);
      radar[dim] = round1(sum / validTurns.length);
    }
  }

  const radarAvg =
    (radar.relevance + radar.technical + radar.clarity + radar.communication) / 4;
  const overall = Math.round((radarAvg / 10) * 70 + (confidenceScore / 100) * 30);

  // 4. Replay timeline events (sorted by tSec ascending, capped at 30)
  const timeline = [];

  for (const turn of turns) {
    const startSec = Math.max(0, Math.round(Number(turn.startedAtSec) || 0));
    const a = turn.analytics || {};

    if (Array.isArray(a.pauseEvents) && a.pauseEvents.length > 0) {
      for (const p of a.pauseEvents) {
        timeline.push({
          tSec: Math.max(0, Math.round(Number(p.tSec) || startSec)),
          type: 'pause',
          label: `Long pause (${Number(p.durationSec || 2).toFixed(1)}s)`,
        });
      }
    } else if (Number(a.longPauses) > 0) {
      timeline.push({
        tSec: startSec,
        type: 'pause',
        label: `Long pause (${a.longPauses} detected)`,
      });
    }

    if (Number(a.fillers) >= 4) {
      timeline.push({
        tSec: startSec,
        type: 'filler',
        label: `Filler burst (${a.fillers} fillers)`,
      });
    }

    if (!turn.evalFailed && turn.scores) {
      const turnAvg =
        DIMENSIONS.reduce((sum, d) => sum + (Number(turn.scores[d]) || 0), 0) / 4;
      if (turnAvg >= 8) {
        timeline.push({
          tSec: startSec,
          type: 'strong',
          label: `Strong answer: ${first6Words(turn.question)}`,
        });
      } else if (turnAvg <= 4) {
        timeline.push({
          tSec: startSec,
          type: 'weak',
          label: `Needs work: ${first6Words(turn.question)}`,
        });
      }
    }
  }

  timeline.sort((a, b) => a.tSec - b.tSec);
  const cappedTimeline = timeline.slice(0, 30);

  // 5. Template-built 2-3 sentence summary
  let summary = '';
  if (validTurns.length === 0 && insufficientData) {
    summary =
      'Not enough speech or scored answers were captured in this session to generate a full assessment. Try speaking clearly for a few minutes in your next mock interview.';
  } else {
    let strongestDim = DIMENSIONS[0];
    let weakestDim = DIMENSIONS[0];
    for (const dim of DIMENSIONS) {
      if (radar[dim] > radar[strongestDim]) strongestDim = dim;
      if (radar[dim] < radar[weakestDim]) weakestDim = dim;
    }

    let deliveryTip = 'Your speaking pace and fluency were well balanced.';
    if (insufficientData) {
      deliveryTip = 'Speak in longer, complete answers so MockMate can score your pacing and confidence.';
    } else if (fillerPenalty >= pacePenalty && fillerPenalty >= pausePenalty && fillerPenalty > 5) {
      deliveryTip = 'Focus on reducing filler words like "um", "uh", and "like" by pausing silently instead.';
    } else if (pacePenalty >= fillerPenalty && pacePenalty >= pausePenalty && pacePenalty > 5) {
      deliveryTip =
        avgWpm < 110
          ? 'Try to speak a bit more briskly toward the 110-160 WPM conversational range.'
          : 'Try slowing down slightly toward the 110-160 WPM range for clearer delivery.';
    } else if (pausePenalty > 5) {
      deliveryTip = 'Work on structuring your thoughts upfront to minimize long mid-answer pauses.';
    }

    summary = `Your strongest area was ${DIMENSION_LABELS[strongestDim]} (${radar[strongestDim]}/10), while ${DIMENSION_LABELS[weakestDim]} (${radar[weakestDim]}/10) has the most room to grow. ${deliveryTip}`;
  }

  return {
    overall,
    radar,
    confidenceScore,
    totals: {
      words: totalWords,
      fillers: totalFillers,
      avgWpm,
      longPauses: totalLongPauses,
    },
    timeline: cappedTimeline,
    summary,
  };
}

module.exports = {
  buildReport,
};
