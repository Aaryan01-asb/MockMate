const express = require('express');
const { questionsSchema } = require('../utils/validate');
const { getOpeningQuestion } = require('../prompts/questionPrompt');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const parsed = questionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid request body',
      });
    }

    const { category } = parsed.data;
    const question = getOpeningQuestion(category);
    return res.json({ question });
  } catch (err) {
    // Fallback so opening question never fails
    return res.json({
      question: getOpeningQuestion(''),
    });
  }
});

module.exports = router;
