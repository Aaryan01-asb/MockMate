import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { uploadResume } from '../services/api';

const CATEGORIES = [
  'Software Engineering',
  'Web Development',
  'Data Science/Analytics',
  'HR/Behavioral',
  'Core CS (OS, DBMS, CN)',
  'Aptitude/General',
];

const DURATIONS = [5, 6, 7, 8, 9, 10];
const MAX_PDF_BYTES = 5 * 1024 * 1024;

export default function Setup() {
  const navigate = useNavigate();
  const { setup, updateSetup } = useInterview();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState(
    setup.resumeText && !setup.resumeFileName ? 'paste' : 'upload'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const trimmedResumeLen = setup.resumeText ? setup.resumeText.trim().length : 0;
  const isReady = trimmedResumeLen > 0 && Boolean(setup.category);

  async function handleFile(file) {
    setError('');
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Please upload a PDF file (.pdf only).');
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setError('File size must be 5 MB or less.');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadResume(file);
      updateSetup({
        resumeText: data.text,
        resumeFileName: file.name,
        resumeChars: data.chars ?? data.text.length,
      });
    } catch (err) {
      setError(err.message || 'Failed to parse PDF. Please paste your resume text instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemoveResume() {
    setError('');
    updateSetup({
      resumeText: '',
      resumeFileName: '',
      resumeChars: 0,
    });
  }

  function handleContinue(e) {
    e.preventDefault();
    if (!isReady) return;
    navigate('/lobby');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Step 1 of 2 · Setup
          </span>
        </div>

        <form
          onSubmit={handleContinue}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configure your interview</h1>
            <p className="text-sm text-slate-600 mt-1">
              Add your resume and choose the interview focus so Aria can tailor her questions.
            </p>
          </div>

          {/* Resume section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-800">
                Resume <span className="text-rose-500">*</span>
              </label>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('upload');
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    mode === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('paste');
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    mode === 'paste'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste resume text instead
                </button>
              </div>
            </div>

            {mode === 'upload' ? (
              setup.resumeText && setup.resumeFileName ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {setup.resumeFileName}
                      </p>
                      <p className="text-xs text-slate-600">
                        {setup.resumeChars || setup.resumeText.length} characters extracted
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/70'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="text-sm font-medium">Extracting text from PDF...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        Drag and drop your PDF here, or{' '}
                        <span className="text-indigo-600 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-500">PDF only · Max 5 MB</p>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div>
                <textarea
                  rows={7}
                  value={setup.resumeText}
                  onChange={(e) =>
                    updateSetup({
                      resumeText: e.target.value,
                      resumeFileName: '',
                      resumeChars: e.target.value.length,
                    })
                  }
                  placeholder="Paste your resume text here..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex items-center justify-between mt-1.5 text-xs">
                  <span
                    className={
                      trimmedResumeLen > 0
                        ? 'text-emerald-600 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    {trimmedResumeLen} characters
                  </span>
                  {setup.resumeText && (
                    <button
                      type="button"
                      onClick={handleRemoveResume}
                      className="text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2.5 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category-select"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Interview category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category-select"
                value={setup.category}
                onChange={(e) => updateSetup({ category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="duration-select"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Duration
              </label>
              <select
                id="duration-select"
                value={setup.durationMin}
                onChange={(e) => updateSetup({ durationMin: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {DURATIONS.map((min) => (
                  <option key={min} value={min}>
                    {min} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags-input"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Focus tags <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="tags-input"
              type="text"
              value={setup.tags}
              onChange={(e) => updateSetup({ tags: e.target.value })}
              placeholder="e.g. React, DSA, TCS-style, system design"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Privacy note */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Your video is never recorded or uploaded. Only your transcript and scores are saved.
            </span>
          </div>

          {/* Continue */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              disabled={!isReady || uploading}
              onClick={handleContinue}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Lobby
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
