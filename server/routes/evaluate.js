const express = require('express');
const { evaluateSchema } = require('../utils/validate');
const { evaluateAnswer } = require('../services/evaluator');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const parsed = evaluateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid evaluation request',
      });
    }

    const result = await evaluateAnswer(parsed.data);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});

module.exports = router;
