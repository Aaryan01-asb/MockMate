const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    question: { type: String, required: true },
    isFollowUp: { type: Boolean, default: false },
    answer: { type: String, default: '' },
    startedAtSec: { type: Number, default: 0 },
    endedAtSec: { type: Number, default: 0 },
    scores: {
      relevance: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvedAnswer: { type: String, default: '' },
    evalFailed: { type: Boolean, default: false },
    analytics: {
      words: { type: Number, default: 0 },
      fillers: { type: Number, default: 0 },
      fillerList: { type: [String], default: [] },
      wpm: { type: Number, default: 0 },
      longPauses: { type: Number, default: 0 },
      pauseEvents: {
        type: [
          {
            tSec: Number,
            durationSec: Number,
          },
        ],
        default: [],
      },
    },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    tSec: { type: Number, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  setup: {
    category: { type: String, required: true },
    tags: { type: String, default: '' },
    durationMin: { type: Number, required: true },
    resumeText: { type: String, required: true, maxlength: 12000 },
  },
  turns: { type: [turnSchema], default: [] },
  report: {
    overall: { type: Number, default: 0 },
    radar: {
      relevance: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
    },
    confidenceScore: { type: Number, default: 0 },
    totals: {
      words: { type: Number, default: 0 },
      fillers: { type: Number, default: 0 },
      avgWpm: { type: Number, default: 0 },
      longPauses: { type: Number, default: 0 },
    },
    timeline: { type: [timelineEventSchema], default: [] },
    summary: { type: String, default: '' },
  },
});

module.exports = mongoose.model('Session', sessionSchema);
