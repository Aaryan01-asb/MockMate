import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Clock,
  FileText,
  ListChecks,
  MessageSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
} from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: '1. Upload your resume',
    desc: 'Drop a PDF or paste your resume text so Aria tailors questions to your experience.',
  },
  {
    icon: ListChecks,
    title: '2. Pick domain, tags & time',
    desc: 'Choose your target role, focus tags like React or TCS-style, and a 5–10 min duration.',
  },
  {
    icon: Video,
    title: '3. Interview live with Aria',
    desc: 'Join a realistic video-call room where Aria asks questions by voice and listens.',
  },
  {
    icon: BarChart3,
    title: '4. Get your coaching report',
    desc: 'Review your readiness score, improved answer rewrites, timeline, and full transcript.',
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Adaptive follow-up questions',
    desc: 'Aria listens to what you actually say and asks targeted follow-ups probing your projects, tools, and decisions.',
  },
  {
    icon: Mic,
    title: 'Speech analytics & Confidence Score',
    desc: 'Tracks filler words, speaking pace (WPM), and long pauses to calculate an objective delivery Confidence Score.',
  },
  {
    icon: Sparkles,
    title: 'Side-by-side answer rewrite',
    desc: 'Compare your spoken response directly against an improved, concise version tailored to the question.',
  },
  {
    icon: Clock,
    title: 'Replay timeline',
    desc: 'Jump through timestamped moments—long pauses, filler bursts, strong answers, and areas needing work.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              M
            </div>
            <div>
              <span className="font-semibold text-slate-900 tracking-tight">MockMate</span>
              <span className="hidden sm:inline text-xs text-slate-500 ml-2">
                AI Interview Coach
              </span>
            </div>
          </div>
          <Link
            to="/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Interview
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-6 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            Voice-first mock interviews with Aria
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            AI Interview Coach
          </h1>
          <p className="text-lg sm:text-xl font-medium text-indigo-600 mb-4">
            Not just a mock interviewer, but a coach that shows you exactly where and how to improve.
          </p>
          <p className="max-w-2xl mx-auto text-slate-600 text-base leading-relaxed mb-8">
            Upload your resume, step into a live video-call interview with Aria, and practice speaking
            your answers aloud. Get instant follow-up questions, speech delivery metrics, and
            concrete answer rewrites in one clear report.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            Start Interview
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 text-center mb-6">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 text-sm">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 text-center mb-6">
            What you get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{feat.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fifth small card: Full transcript */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Full transcript at the end</h3>
                <p className="text-xs text-slate-600">
                  Every question from Aria and your spoken answers in order, ready to copy or download as a .txt file.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Your video is never recorded or uploaded</span>
          </div>
          <span>Best in Google Chrome</span>
        </div>
      </footer>
    </div>
  );
}
