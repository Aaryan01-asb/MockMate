const { z } = require('zod');

const GENERIC_QUESTIONS = {
  'Software Engineering': [
    'Can you walk me through a challenging bug you fixed recently and how you isolated the root cause?',
    'How do you design a system or module so that it stays maintainable as requirements grow?',
    'Tell me about a time you had to make a technical tradeoff under a tight deadline.',
  ],
  'Web Development': [
    'How do you optimize the performance and rendering speed of a modern web application?',
    'Can you explain how you manage state and API errors in your frontend projects?',
    'Walk me through how authentication and data validation work in a project from your resume.',
  ],
  'Data Science/Analytics': [
    'How do you handle missing values, outliers, and imbalanced data in a real dataset?',
    'Tell me about a data project from your resume and how you validated your model or insights.',
    'How would you explain a complex model metric to a non-technical stakeholder?',
  ],
  'HR/Behavioral': [
    'Tell me about a time you disagreed with a teammate and how you resolved it.',
    'Describe a situation where you had to learn something quickly to deliver on time.',
    'What is a mistake you made in a project, and what did you change afterward?',
  ],
  'Core CS (OS, DBMS, CN)': [
    'Can you explain the difference between a process and a thread, and when you would use each?',
    'How do database indexes work, and when can an index actually slow down writes?',
    'What happens step by step when you type a URL into a browser and press Enter?',
  ],
  'Aptitude/General': [
    'How do you break down an unfamiliar problem when you are not sure where to start?',
    'Tell me about a project or achievement you are most proud of and why.',
    'How do you prioritize multiple competing tasks with similar deadlines?',
  ],
};

function getFallbackQuestion(category) {
  const list = GENERIC_QUESTIONS[category] || GENERIC_QUESTIONS['Software Engineering'];
  return list[Math.floor(Math.random() * list.length)];
}

function getFallbackEvaluation(category, needNextQuestion = true) {
  return {
    scores: { relevance: 5, technical: 5, clarity: 5, communication: 5 },
    strengths: [],
    weaknesses: [],
    improvedAnswer: '',
    nextQuestion: needNextQuestion ? getFallbackQuestion(category) : null,
    nextIsFollowUp: false,
    evalFailed: true,
  };
}

const clampScore = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 5;
  return Math.max(0, Math.min(10, Math.round(num)));
};

const evalResultSchema = z.object({
  scores: z.object({
    relevance: z.any().transform(clampScore),
    technical: z.any().transform(clampScore),
    clarity: z.any().transform(clampScore),
    communication: z.any().transform(clampScore),
  }),
  strengths: z
    .array(z.any())
    .optional()
    .default([])
    .transform((arr) => arr.slice(0, 2).map((s) => String(s))),
  weaknesses: z
    .array(z.any())
    .optional()
    .default([])
    .transform((arr) => arr.slice(0, 2).map((s) => String(s))),
  improvedAnswer: z
    .any()
    .optional()
    .default('')
    .transform((v) => (typeof v === 'string' ? v : String(v || ''))),
  nextQuestion: z
    .union([z.string(), z.null()])
    .optional()
    .default(null),
  nextIsFollowUp: z.boolean().optional().default(false),
});

/**
 * Defensively parse raw LLM output into a valid evaluation response.
 */
function parseEvaluationResponse(rawText, { category, needNextQuestion = true, followUpAllowed = true }) {
  try {
    if (!rawText || typeof rawText !== 'string') {
      return getFallbackEvaluation(category, needNextQuestion);
    }

    // 1. Strip markdown code fences if present
    let cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // 2. Try JSON.parse, fallback to substring between first { and last }
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        return getFallbackEvaluation(category, needNextQuestion);
      }
    }

    // 3. Validate and normalize with zod
    const validated = evalResultSchema.safeParse(parsed);
    if (!validated.success) {
      return getFallbackEvaluation(category, needNextQuestion);
    }

    const data = validated.data;
    const nextQuestion = needNextQuestion
      ? data.nextQuestion && data.nextQuestion.trim()
        ? data.nextQuestion.trim()
        : getFallbackQuestion(category)
      : null;

    const nextIsFollowUp = needNextQuestion && followUpAllowed ? Boolean(data.nextIsFollowUp) : false;

    return {
      scores: data.scores,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      improvedAnswer: data.improvedAnswer,
      nextQuestion,
      nextIsFollowUp,
      evalFailed: false,
    };
  } catch {
    return getFallbackEvaluation(category, needNextQuestion);
  }
}

module.exports = {
  GENERIC_QUESTIONS,
  getFallbackQuestion,
  getFallbackEvaluation,
  parseEvaluationResponse,
};
