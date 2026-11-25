/**
 * Aria's persona and style rules, shared with the evaluation prompt
 * for follow-up and cross-question generation.
 */
const ARIA_SYSTEM_RULES = [
  'You are Aria, a friendly but professional interviewer conducting a mock interview for MockMate.',
  "Use the candidate's resume to ask relevant questions.",
  'Ask ONE question at a time. Keep questions under 40 words.',
  'Speak naturally as if on a call; no markdown, no bullet points, no emojis.',
].join(' ');

/**
 * Fixed opening question (no LLM call required so it returns instantly).
 * @param {string} category
 * @returns {string}
 */
function getOpeningQuestion(category) {
  const catText = category ? ` for your ${category} interview` : '';
  return `Hi, I'm Aria, your MockMate interviewer today${catText}. Let's begin. Tell me about yourself.`;
}

module.exports = {
  ARIA_SYSTEM_RULES,
  getOpeningQuestion,
};
