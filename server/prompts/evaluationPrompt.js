const { ARIA_SYSTEM_RULES } = require('./questionPrompt');

const EVALUATION_SYSTEM_INSTRUCTION = [
  'You are a strict but fair interview coach evaluating a spoken answer transcribed by speech recognition.',
  'Ignore minor transcription errors and filler words when judging content.',
  'Return ONLY valid JSON matching the required schema. No markdown fences, no extra text.',
  `When writing nextQuestion, follow Aria's persona: ${ARIA_SYSTEM_RULES}`,
].join(' ');

/**
 * Build the user prompt for evaluating an answer and generating the next question.
 */
function buildEvaluationPrompt({
  resumeText,
  category,
  tags,
  question,
  answer,
  history = [],
  followUpAllowed = true,
  needNextQuestion = true,
  secondsRemaining = 300,
}) {
  const trimmedResume = (resumeText || '').slice(0, 6000);
  const recentHistory = Array.isArray(history) ? history.slice(-4) : [];
  const isFirstTurn = recentHistory.length === 0 && /tell me about yourself/i.test(question);

  const historyText =
    recentHistory.length > 0
      ? recentHistory
          .map((h, i) => `Turn ${i + 1}:\nQ: ${h.question}\nA: ${h.answer || '(no answer)'}`)
          .join('\n\n')
      : 'None (this is the first turn).';

  return `Evaluate the candidate's spoken answer and return JSON with this exact schema:
{
  "scores": { "relevance": 0-10, "technical": 0-10, "clarity": 0-10, "communication": 0-10 },
  "strengths": ["max 2 short strings"],
  "weaknesses": ["max 2 short strings"],
  "improvedAnswer": "a better version of the candidate's answer in first person, 40-90 words, spoken style",
  "nextQuestion": "string or null",
  "nextIsFollowUp": true or false
}

Rules:
- Scores must be integers from 0 to 10. Empty or off-topic answers score 0 to 2.
- "technical" is how correct and deep the content is for the category; for HR/Behavioral judge structure (situation, action, result).
- If needNextQuestion is false, set "nextQuestion" to null and "nextIsFollowUp" to false.
- If followUpAllowed is true AND the answer contained a specific claim, tool, project or decision worth probing, "nextQuestion" MUST be a specific follow-up referencing the candidate's exact words, and "nextIsFollowUp" true. Otherwise ask a NEW question from a different resume project or skill and set "nextIsFollowUp" false.
- If followUpAllowed is false, "nextIsFollowUp" MUST be false.
- ${
    isFirstTurn
      ? 'Because this is the answer to "Tell me about yourself", "nextQuestion" MUST be a cross-question that ties a specific claim, project or skill from that introduction to the resume (for example: "You mentioned <project>. What was your exact role and why did you pick <tool>?").'
      : 'Never repeat a question from history.'
  }
- Keep "nextQuestion" under 40 words and conversational.
- Respect category ("${category}") and tags ("${tags || 'none'}") — e.g. "TCS-style" means fundamentals-focused; "Amazon-style" means behavioral/leadership-principle flavored.

Context:
- Category: ${category}
- Tags: ${tags || 'None'}
- Seconds Remaining: ${secondsRemaining}
- followUpAllowed: ${followUpAllowed}
- needNextQuestion: ${needNextQuestion}

Candidate Resume:
${trimmedResume}

Recent History:
${historyText}

Current Question:
${question}

Candidate's Spoken Answer:
${answer || '(no answer)'}`;
}

module.exports = {
  EVALUATION_SYSTEM_INSTRUCTION,
  buildEvaluationPrompt,
};
