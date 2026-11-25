const { z } = require('zod');

const questionsSchema = z.object({
  resumeText: z.string().min(1, 'resumeText is required'),
  category: z.string().min(1, 'category is required'),
  tags: z.string().optional().default(''),
  durationMin: z.number().min(5).max(10).optional().default(7),
});

const evaluateSchema = z.object({
  resumeText: z.string().min(1, 'resumeText is required'),
  category: z.string().min(1, 'category is required'),
  tags: z.string().optional().default(''),
  question: z.string().min(1, 'question is required'),
  answer: z.string().optional().default(''),
  isFollowUp: z.boolean().optional().default(false),
  followUpAllowed: z.boolean().optional().default(true),
  history: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  secondsRemaining: z.number().optional().default(300),
  needNextQuestion: z.boolean().optional().default(true),
});

const createSessionSchema = z.object({
  setup: z.object({
    category: z.string().min(1, 'category is required'),
    tags: z.string().optional().default(''),
    durationMin: z.number().min(5).max(10),
    resumeText: z.string().min(1, 'resumeText is required'),
  }),
  turns: z.array(z.any()).default([]),
  totalDurationSec: z.number().optional(),
});

module.exports = {
  questionsSchema,
  evaluateSchema,
  createSessionSchema,
};
