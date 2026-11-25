const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const { createSessionSchema } = require('../utils/validate');
const { buildReport } = require('../services/reportBuilder');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is not connected.' });
    }

    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid session payload',
      });
    }

    const { setup, turns, totalDurationSec } = parsed.data;
    const sanitizedSetup = {
      ...setup,
      resumeText: setup.resumeText.slice(0, 12000),
    };

    const report = buildReport({
      setup: sanitizedSetup,
      turns,
      totalDurationSec,
    });

    const sessionId = crypto.randomUUID();
    await Session.create({
      sessionId,
      setup: sanitizedSetup,
      turns,
      report,
    });

    return res.status(201).json({ sessionId });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is not connected.' });
    }

    const session = await Session.findOne(
      { sessionId: req.params.id },
      { _id: 0, __v: 0 }
    ).lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    return res.json(session);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
