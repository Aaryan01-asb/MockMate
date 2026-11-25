const { generateJson } = require('./gemini');
const { EVALUATION_SYSTEM_INSTRUCTION, buildEvaluationPrompt } = require('../prompts/evaluationPrompt');
const { parseEvaluationResponse, getFallbackEvaluation } = require('../utils/safeJson');

/**
 * Evaluate a candidate's answer using Gemini, with safe fallback on any failure.
 */
async function evaluateAnswer(params) {
  const { category, needNextQuestion = true, followUpAllowed = true } = params;
  try {
    const userPrompt = buildEvaluationPrompt(params);
    const rawText = await generateJson({
      systemInstruction: EVALUATION_SYSTEM_INSTRUCTION,
      userPrompt,
      temperature: 0.4,
    });
    return parseEvaluationResponse(rawText, { category, needNextQuestion, followUpAllowed });
  } catch (err) {
    console.error('Evaluation fallback triggered:', err.message);
    return getFallbackEvaluation(category, needNextQuestion);
  }
}

module.exports = {
  evaluateAnswer,
};
