const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
    if (!isPdf) {
      const err = new Error('Only PDF files are allowed.');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const parsed = await pdfParse(req.file.buffer);
    const cleanedText = (parsed.text || '').replace(/\s+/g, ' ').trim();

    if (cleanedText.length < 100) {
      return res.status(422).json({
        error:
          'Could not read text from this PDF. It may be a scanned image. Please paste your resume text instead.',
      });
    }

    const truncated = cleanedText.slice(0, 12000);
    return res.json({
      text: truncated,
      chars: truncated.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
