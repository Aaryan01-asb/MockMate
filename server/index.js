require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const multer = require('multer');

const healthRoute = require('./routes/health');
const resumeRoute = require('./routes/resume');
const questionsRoute = require('./routes/questions');
const evaluateRoute = require('./routes/evaluate');
const sessionsRoute = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS restricted to CLIENT_URL origins (comma-separated, no trailing slash)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server) or matching allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '1mb' }));

// Rate limiting: 100 requests per 15 minutes per IP on /api
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api', apiLimiter);

// Routes
app.use('/api/health', healthRoute);
app.use('/api/resume', resumeRoute);
app.use('/api/questions', questionsRoute);
app.use('/api/evaluate', evaluateRoute);
app.use('/api/sessions', sessionsRoute);

// Global error handler returning { error: "..." }
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size must be 5 MB or less.' });
    }
    return res.status(400).json({ error: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('<user>')) {
    console.error(
      'ERROR: MONGODB_URI is missing or placeholder in .env. Database routes will return 503 until configured.'
    );
  } else {
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB Atlas');
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`MockMate server listening on port ${PORT}`);
  });
}

startServer();
