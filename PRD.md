# **PRD: AI Interview Coach name:**MockMate **(Antigravity Build Spec)**

Version 1.0 · Target build time: 3 hours · Audience: Antigravity (AI coding agent)

## **0\. Instructions to the Agent (read first)**

You are building a complete, deployable MVP from this document. Follow these rules strictly:

1. **Plan first.** Before writing code, output a short plan (files to create, build order). Then build in the phases defined in Section 15, stopping at each checkpoint to confirm it runs.  
2. **Do not add features** that are not in this document (no login, no JWT, no Docker, no Postgres, no face tracking, no multi-session dashboard).  
3. **Do not change the stack.** Use exactly the stack in Section 2\.  
4. **Never put the Gemini API key in client code.** It lives only in the server .env.  
5. **Every server route must be wrapped in try/catch** and return JSON errors in the shape { "error": "message" }.  
6. **Every Gemini response must be parsed defensively** (Section 7.4). The app must never crash because the model returned bad JSON.  
7. **Create .env.example files** in both client/ and server/, and a README.md with run and deploy steps.  
8. **Keep prompts in server/prompts/**, separate from route logic.  
9. Write clean, commented, working code. Prefer simple over clever. After each phase, run the app and fix errors before moving on.  
10. If something in this document is ambiguous, choose the simplest option that satisfies the acceptance criteria in Section 16 and note the assumption in the README.

**Execution mode: one go, end to end.** This single document is the whole project: landing page, setup, lobby, meeting, report with transcript, server, database and deployment. Build all of it in one continuous run (Phases 1 to 5 in Section 15\) without waiting for further instructions, and stop only if a required key or account is missing. Total time budget is 3 hours, with deployment done by the 2-hour mark even if the app is rough.

## **1\. Product Overview**

**What:** A website that acts as a virtual interviewer. The user uploads a resume, picks a category, joins a video-call-style meeting, and an AI interviewer named **Aria** asks resume-based questions by voice. The user answers by speaking. At the end the user gets a coaching report.

**Pitch:** *Not just a mock interviewer, but a coach that shows you exactly where and how to improve.*

### **1.1 Differentiators (must be built, in priority order)**

1. **Adaptive follow-up questions** based on what the user actually said.  
2. **Speech analytics:** filler words, words per minute, long pauses, combined Confidence Score.  
3. **Answer rewrite:** the user's answer shown next to an improved version.  
4. **Replay timeline:** timestamped events (long pause, filler burst, strong answer, weak answer).

### **1.2 Non-goals**

No login or accounts. No video upload or storage. No face, eye-contact or emotion analysis. No sentence-transformers or embeddings. No cross-session progress dashboard. No payment. No mobile-specific layout beyond basic responsiveness.

### **1.3 Honest limits (include in README "Limitations")**

Scoring comes from speech and answer content only. The webcam is a visual feel and is never analyzed or uploaded. Evaluation is LLM-based and approximate. Speech recognition accuracy depends on accent, mic and noise. Chrome desktop is the supported browser.

## **2\. Tech Stack (fixed)**

| Layer | Choice |
| :---- | :---- |
| Frontend | React 18 \+ Vite, Tailwind CSS, Recharts, React Router, lucide-react icons |
| Backend | Node.js 18+ with Express, **CommonJS** (require), no TypeScript |
| Database | MongoDB Atlas (free M0) via Mongoose |
| Speech-to-text | Browser Web Speech API (webkitSpeechRecognition) |
| Text-to-speech | Browser window.speechSynthesis |
| LLM | Gemini API using the official @google/genai SDK; model name from env GEMINI\_MODEL (default gemini-2.5-flash) |
| Resume parsing | multer (memory storage) \+ pdf-parse |
| Server extras | cors, dotenv, express-rate-limit, zod for validation |
| Deploy | Vercel (client), Render (server), MongoDB Atlas (DB) |

Notes: The user can swap GEMINI\_MODEL in env if the default is unavailable on their key. No other model-specific code should exist.

## **3\. Repository Structure**

ai-interview-coach/  
├── client/  
│   ├── src/  
│   │   ├── pages/        Setup.jsx, Lobby.jsx, Meeting.jsx, Report.jsx  
│   │   ├── components/   AriaTile, WebcamTile, Timer, Captions, ControlBar,  
│   │   │                 ConfirmDialog, ScoreRadar, ConfidenceGauge, AnswerCard, Timeline  
│   │   ├── hooks/        useSpeechRecognition, useSpeechSynthesis,  
│   │   │                 useCountdown, useSpeechAnalytics, useMediaStream  
│   │   ├── context/      InterviewContext.jsx (setup data shared across pages)  
│   │   ├── services/     api.js  
│   │   ├── utils/        analytics.js (pure functions)  
│   │   ├── App.jsx, main.jsx, index.css  
│   ├── .env.example, index.html, package.json, vite.config.js, tailwind.config.js, vercel.json  
├── server/  
│   ├── routes/           resume.js, questions.js, evaluate.js, sessions.js, health.js  
│   ├── services/         gemini.js, evaluator.js, reportBuilder.js  
│   ├── models/           Session.js  
│   ├── prompts/          questionPrompt.js, evaluationPrompt.js  
│   ├── utils/            safeJson.js, validate.js  
│   ├── index.js, .env.example, package.json  
├── docs/                 architecture notes, screenshots (empty placeholder)  
└── README.md  
client/vercel.json must contain a SPA rewrite so refreshing /report/:id works:

{ "rewrites": \[{ "source": "/(.\*)", "destination": "/" }\] }

## **4\. Environment Variables**

**server/.env.example**

PORT=5000  
GEMINI\_API\_KEY=your\_key\_here  
GEMINI\_MODEL=gemini-2.5-flash  
MONGODB\_URI=mongodb+srv://\<user\>:\<pass\>@\<cluster\>/interview-coach  
CLIENT\_URL=http\://localhost:5173  
**client/.env.example**

VITE\_API\_URL=http\://localhost:5000  
CLIENT\_URL may contain several comma-separated origins. CORS must allow exactly those origins (and no wildcard in production).

## **5\. Data Model (Mongoose: Session)**

{  
  sessionId: String (unique, random 12+ char id, e.g. crypto.randomUUID()),  
  createdAt: Date,  
  setup: {  
    category: String,  
    tags: String,  
    durationMin: Number,   // 5 to 10  
    resumeText: String     // max 12000 chars stored  
  },  
  turns: \[{  
    index: Number,  
    question: String,  
    isFollowUp: Boolean,  
    answer: String,  
    startedAtSec: Number,   // seconds since interview start  
    endedAtSec: Number,  
    scores: { relevance: Number, technical: Number, clarity: Number, communication: Number },  
    strengths: \[String\],  
    weaknesses: \[String\],  
    improvedAnswer: String,  
    evalFailed: Boolean,  
    analytics: { words: Number, fillers: Number, fillerList: \[String\], wpm: Number, longPauses: Number }  
  }\],  
  report: {  
    overall: Number,          // 0 to 100  
    radar: { relevance, technical, clarity, communication },  // each 0 to 10 averages  
    confidenceScore: Number,  // 0 to 100  
    totals: { words, fillers, avgWpm, longPauses },  
    timeline: \[{ tSec: Number, type: String, label: String }\],  
    summary: String           // 2-3 sentence overall coaching summary  
  }  
}  
Only text data is stored. No video, no audio, no PDF file.

## **6\. API Contract**

Base URL: VITE\_API\_URL. All bodies are JSON unless stated. All errors: { "error": "..." } with correct HTTP status.

### **6.1 GET /api/health**

Returns { "ok": true, "time": \<ISO\> }. Used to wake Render.

### **6.2 POST /api/resume (multipart/form-data, field file)**

* Accept PDF only (application/pdf), max 5 MB (multer limit). Memory storage only; never write the file to disk.  
* Extract text with pdf-parse. Trim, collapse whitespace.  
* If extracted text is under 100 characters, return 422 { "error": "Could not read text from this PDF. It may be a scanned image. Please paste your resume text instead." }.  
* Success: { "text": "...", "chars": 1834 }. Truncate to 12000 chars.

### **6.3 POST /api/questions**

Request:

{ "resumeText": "...", "category": "Web Development", "tags": "React, TCS-style", "durationMin": 7 }  
Response: { "question": "Hi, I'm Aria, and I'll be your interviewer today. Let's begin. Tell me about yourself." }. **The opening question is fixed and is never generated by the LLM**, so the call returns instantly and cannot fail. The request body is still validated but only category may be used (for example to vary the greeting wording).

### **6.4 POST /api/evaluate**

Request:

{  
  "resumeText": "...", "category": "...", "tags": "...",  
  "question": "...", "answer": "...", "isFollowUp": false,  
  "followUpAllowed": true,  
  "history": \[{ "question": "...", "answer": "..." }\],  
  "secondsRemaining": 210,  
  "needNextQuestion": true  
}  
Response (always this shape, even on LLM failure):

{  
  "scores": { "relevance": 7, "technical": 6, "clarity": 8, "communication": 7 },  
  "strengths": \["..."\], "weaknesses": \["..."\],  
  "improvedAnswer": "...",  
  "nextQuestion": "...",          // string, or null if none needed  
  "nextIsFollowUp": true,  
  "evalFailed": false  
}

### **6.5 POST /api/sessions**

Request: { setup, turns, totalDurationSec }. The server computes the report (Section 11.2) with reportBuilder.js, saves, and returns { "sessionId": "..." }.

### **6.6 GET /api/sessions/:id**

Returns the full session document (without Mongo \_id and \_\_v). 404 if not found.

### **6.7 Server hardening**

* express.json({ limit: "1mb" }).  
* express-rate-limit: 100 requests per 15 minutes per IP on /api.  
* Validate every request body with zod; return 400 on invalid input.  
* Never log resume text or API keys.

## **7\. LLM Layer (Gemini)**

### **7.1 Client wrapper (server/services/gemini.js)**

Export generateJson({ systemInstruction, userPrompt }) and generateText(...). Use @google/genai with responseMimeType: "application/json" for JSON calls and temperature 0.4 for evaluation, 0.8 for question generation. Add a 20-second timeout and one retry on failure. If it still fails, throw; callers use fallbacks.

### **7.2 Question prompt (prompts/questionPrompt.js)**

System: You are Aria, a friendly but professional interviewer conducting a mock interview. Use the candidate's resume to ask relevant questions. Ask ONE question at a time. Keep questions under 40 words. Speak naturally as if on a call; no markdown, no bullet points, no emojis.

The opening line is **fixed**: a short greeting from Aria followed by exactly the question "Tell me about yourself." No Gemini call is made for it. questionPrompt.js therefore only exports Aria's persona and style rules (above), which the evaluation prompt reuses when it writes follow-up and cross-questions.

### **7.3 Evaluation prompt (prompts/evaluationPrompt.js)**

System: You are a strict but fair interview coach evaluating a spoken answer transcribed by speech recognition. Ignore minor transcription errors and filler words when judging content. Return ONLY valid JSON matching the schema. No markdown fences.

Input to include: resume text (trimmed to 6000 chars), category, tags, the question, the answer, last 4 turns of history, followUpAllowed, needNextQuestion, secondsRemaining.

Required JSON schema:

{  
  "scores": { "relevance": 0-10, "technical": 0-10, "clarity": 0-10, "communication": 0-10 },  
  "strengths": \["max 2 short strings"\],  
  "weaknesses": \["max 2 short strings"\],  
  "improvedAnswer": "a better version of the candidate's answer in first person, 40-90 words, spoken style",  
  "nextQuestion": "string or null",  
  "nextIsFollowUp": true or false  
}  
Rules to state in the prompt:

* Scores are integers from 0 to 10\. Empty or off-topic answers score 0 to 2\.  
* technical is how correct and deep the content is for the category; for HR/Behavioral judge structure (situation, action, result).  
* If needNextQuestion is false, set nextQuestion to null.  
* If followUpAllowed is true AND the answer contained a specific claim, tool, project or decision worth probing, nextQuestion MUST be a specific follow-up referencing the candidate's exact words, and nextIsFollowUp true. Otherwise ask a NEW question from a different resume project/skill and set nextIsFollowUp false.  
* If followUpAllowed is false, nextIsFollowUp must be false.  
* After the answer to "Tell me about yourself" (the first turn), \`nextQuestion\` MUST be a cross-question that ties a specific claim, project or skill from that introduction to the resume (for example "You mentioned \<project\>. What was your exact role and why did you pick \<tool\>?"). Never repeat a question from history. Keep nextQuestion under 40 words and conversational.  
* Respect category and tags (for example "TCS-style" means fundamentals-focused; "Amazon-style" means behavioral/leadership-principle flavored).

### **7.4 Defensive parsing (utils/safeJson.js)**

1. Strip \`\`\`json fences if present.  
2. Try JSON.parse. If it fails, extract the substring from the first { to the last } and retry.  
3. Validate with a zod schema; clamp scores to integers 0 to 10; coerce arrays to max 2 strings.  
4. On any failure return the fallback object:

{ "scores": {"relevance":5,"technical":5,"clarity":5,"communication":5},  
  "strengths": \[\], "weaknesses": \[\], "improvedAnswer": "",  
  "nextQuestion": "\<generic category question\>", "nextIsFollowUp": false, "evalFailed": true }  
Maintain a small hardcoded list of generic questions per category for this fallback and for a failed /api/questions call (return a safe opening question instead of a 500).

## **8\. Frontend Specification**

**Design system:** dark theme for Meeting; clean light/neutral for Setup and Report is acceptable, but keep one accent color (indigo or teal). Rounded cards, subtle shadows, readable text, fully responsive down to tablet width. Use Tailwind only.

**Routing:** / Landing, /setup Setup, /lobby, /meeting, /report/:id. If Lobby or Meeting is opened with no setup data in context, redirect to /setup. Store setup in InterviewContext (and mirror to sessionStorage so a refresh does not lose it).

**Client journey (the flow every screen must support):** Landing (what this is) → Setup (resume, domain, tags, duration) → Lobby (camera and mic check) → Meeting (Aria opens with "Tell me about yourself", then cross-questions based on the answer and the resume until the timer ends) → Report (scores, rewrites, timeline and full transcript).

On app load, fire a silent GET /api/health to wake the Render server.

### **8.0 Page 0: Landing (Home)**

The first page at /. Static, no forms, no login. Its only job is to explain the product and send the client to Setup in one click.

* **Hero:** product name "AI Interview Coach", the one-line pitch ("Not just a mock interviewer, but a coach that shows you exactly where and how to improve"), a 2 to 3 line description, and a primary **Start Interview** button that goes to /setup.  
* **How it works strip (4 steps with icons):** 1\. Upload your resume. 2\. Pick your domain, tags and time. 3\. Interview live with Aria. 4\. Get your score, improved answers and full transcript.  
* **Feature cards (4):** adaptive follow-up questions, speech analytics and Confidence Score, answer rewrite, replay timeline. Add a fifth small card: full transcript at the end.  
* **Footer notes:** "Your video is never recorded or uploaded" and "Best in Google Chrome".  
* Responsive, same accent color as the rest of the app, no images required (icons only).

### **8.1 Page 1: Setup**

* Drag-and-drop zone and click-to-browse for the resume PDF (PDF only, max 5 MB, validated client-side too). On upload call POST /api/resume; show spinner, then a success state with filename and character count, plus a "Remove" button.  
* Toggle/tab: "Paste resume text instead" with a textarea (min 100 chars).  
* Category select: Software Engineering, Web Development, Data Science/Analytics, HR/Behavioral, Core CS (OS, DBMS, CN), Aptitude/General.  
* Optional tags input (placeholder: "e.g. React, DSA, TCS-style, system design").  
* Duration select 5 to 10 minutes, default 7\.  
* **Continue** button disabled until (resume text present) AND (category chosen). Show inline errors from the server (for example the scanned PDF message).

### **8.2 Page 2: Lobby**

* Request camera and mic with getUserMedia({ video: true, audio: true }).  
* Webcam preview (mirrored with CSS scaleX(-1)), live mic level meter using AudioContext \+ AnalyserNode (animated bar).  
* Clear error states: permission denied, no device found, browser not supported. Include instructions to fix (click the lock icon in the address bar).  
* Show a summary card of the setup choices.  
* If webkitSpeechRecognition is undefined, show a visible warning: "Please use Google Chrome for voice features."  
* **Join Interview** button disabled until the media stream is active. Clicking it is a **user gesture**, which is required to allow speech synthesis and recognition to start later. Stop the lobby analyser but keep the media stream and pass it to Meeting (via context ref) to avoid a second permission prompt.

### **8.3 Page 3: Meeting Room**

Layout (dark, bg-neutral-950):

* **Top bar:** title "Mock Interview · \<category\>", a red recording-style pulsing dot, countdown timer mm:ss (turns red and pulses at 60 seconds or less).  
* **Main area:** two tiles side by side (stacked on small screens). Tile 1: "Aria · AI Interviewer" with a large gradient avatar circle and a pulsing ring while she is speaking. Tile 2: user's mirrored webcam labeled "You" with a mic-active indicator that reflects listening state. If camera is off show an avatar placeholder.  
* **Captions bar (bottom):** Aria's current question on top line, user's live transcript (interim in gray, final in white) below. Toggle-able.  
* **Control bar:** mute mic, camera on/off, captions on/off, and a red **End call** button which opens ConfirmDialog ("End the interview now? Your answers so far will still be scored.").  
* **Status chip** showing the current state: Aria speaking, Listening, Thinking, Closing.

### **8.4 Page 4: Report**

Fetch GET /api/sessions/:id. Show a skeleton while loading and a friendly error with retry if it fails. Sections in order:

1. Header: overall readiness score (large number out of 100 with a ring), one-line summary.  
2. Recharts RadarChart with four axes: Relevance, Technical, Clarity, Communication (0 to 10).  
3. Confidence Score gauge (0 to 100\) with three stat tiles: total filler words, average WPM, long pauses.  
4. **Answer cards:** one per turn, showing the question, a two-column "Your answer" vs "Improved answer" layout (stacked on mobile), per-turn score chips, strengths and weaknesses lists. If evalFailed, show a muted note "Scoring unavailable for this answer" and still show the transcript.  
5. **Replay timeline:** vertical list sorted by time with m:ss badges, an icon and color per type (pause, filler, strong, weak).  
6. Buttons: "Start new interview" (to /) and "Copy report link".

**Full transcript (required, shown after the timeline and before the buttons):** a collapsible section titled "Full transcript" listing the whole interview in order, built from turns. Each entry shows the m:ss time, "Aria" with the question, then "You" with the answer (empty answers shown as "(no answer)"). Include a **Copy transcript** button and a **Download .txt** button, both generated client-side from the session data. The buttons "Start new interview" and "Copy report link" come last.

## **9\. Interview Engine (Meeting page state machine)**

Implement in Meeting.jsx using a useReducer or a ref-driven state machine. States:

INIT → FETCH\_FIRST\_Q → ARIA\_SPEAKING → LISTENING → ANSWER\_COMPLETE → (ARIA\_SPEAKING \| CLOSING) → ENDED

### **9.1 Start sequence**

1. On mount, state FETCH\_FIRST\_Q: call POST /api/questions. The opening question is always "Tell me about yourself." (instant, no LLM call, so no failure case).  
2. **Start the countdown only after the first question is received** (not during loading). Record interviewStartMs \= Date.now() at that moment. All startedAtSec/endedAtSec values are relative to it.  
3. Speak the question with speech synthesis, state ARIA\_SPEAKING.

### **9.2 Listening and answer completion**

* Start recognition only after Aria's speech ends (onend), to prevent the mic from transcribing Aria.  
* Recognition config: continuous \= true, interimResults \= true, lang \= "en-IN" (fallback en-US if error language-not-supported).  
* Chrome stops recognition on its own after silence. In onend, if state is still LISTENING and the call has not ended, **restart it** (guard with a flag to avoid restart loops after intentional stop).  
* Maintain finalTranscript and interimTranscript. Record each final result chunk with its timestamp.  
* **Answer is complete** when at least 3 words have been spoken AND no new speech result has arrived for **2500 ms**. Use a timer that resets on every result.  
* If the user says nothing for **12 seconds** after Aria finishes, Aria says a gentle prompt once ("Take your time. Would you like me to repeat the question?"). If still silent for another 10 seconds, record the answer as empty ("") and move on.  
* Muting the mic stops recognition and the silence timer pauses.

### **9.3 After an answer is complete**

1. Stop recognition. Compute analytics for this answer (Section 10).  
2. Compute secondsRemaining and needNextQuestion \= secondsRemaining \> 45.  
3. Call POST /api/evaluate. **Do not await the result before Aria responds visually**: set status Thinking and show a subtle "Aria is thinking..." caption. The next question comes back in the same response, so the wait is only the API latency (target under 3 seconds). While waiting, Aria may speak a short filler such as "Got it." or "Interesting, thanks." (rotate 4 variants) to prevent dead air.  
4. Store the returned scores, strengths, weaknesses, improvedAnswer in the turn record.  
5. If nextQuestion is non-null and time remains (\> 45 s), speak it; set isFollowUp from nextIsFollowUp. Track followUpUsedForCurrentMain: **at most one follow-up per main question**. Compute followUpAllowed for the next call as \!currentQuestionIsFollowUp.  
6. Evaluate requests are sent in the background and must not block the UI. Keep a list of pending promises; at the end, Promise.allSettled them before saving.

### **9.4 Timer and ending rules**

* Countdown counts down from durationMin \* 60 using Date.now() deltas (not a counter that drifts in background tabs).  
* When secondsRemaining \<= 45 and Aria is not mid-answer-capture, move to CLOSING: Aria says "That's all the time we have. Thank you for your answers. I'm preparing your report now." then the call ends.  
* If the user is mid-answer at 45 seconds, let them finish (answer completes normally), then do closing and **do not ask another question**.  
* At 00:00 the call ends immediately: stop speech synthesis and recognition, take any partial finalTranscript \+ interimTranscript as the last answer (if 3+ words), and evaluate it with needNextQuestion \= false.  
* **End call button** (after confirmation) behaves like 00:00.  
* On end: stop all media tracks, stop synthesis (speechSynthesis.cancel()), show a "Generating your report..." full-screen loader, await Promise.allSettled(pendingEvaluations), then POST /api/sessions with all turns, then navigate to /report/:sessionId. If saving fails, show an error screen with a **Retry** button that resends the same payload (keep it in memory).  
* Guard against double-ending (use an endedRef).

### **9.5 Speech synthesis hook (useSpeechSynthesis)**

* speak(text, { onStart, onEnd }). Always call speechSynthesis.cancel() before speaking.  
* Pick an English voice (prefer en-IN, then en-GB, then en-US); wait for voiceschanged event because voices load asynchronously in Chrome.  
* Chrome bug workaround: long utterances may stop around 15 seconds. Split text into sentences and queue them, resolving onEnd after the last one. Keep Aria's lines short anyway.  
* If synthesis is unavailable, fall back to showing the question as captions and start listening immediately.

## **10\. Speech Analytics (client/src/utils/analytics.js, pure functions, unit-test mentally)**

**Inputs per answer:** text, startedAtSec, endedAtSec, and resultTimestamps\[\] (ms timestamp of each final recognition chunk, plus the answer start time).

* **Words:** split on whitespace, filter empty.  
* **Fillers:** count case-insensitive whole-word matches of single-word fillers: um, uh, umm, uhh, er, erm, like, basically, actually, literally, so, right, and phrases: you know, i mean, kind of, sort of. To avoid over-penalizing legitimate use, count like, so, right, actually only when they appear in these positions: sentence start, or after a comma-like pause chunk boundary, or repeated twice. If this is too complex, simply count the strong set um, uh, umm, uhh, er, erm, you know, i mean, basically, kind of, sort of, like and document the choice. Return fillers count and the list of matched filler strings.  
* **WPM:** words / ((endedAtSec \- firstSpeechSec) / 60\), where firstSpeechSec is the time of the first result in that answer. If duration is under 3 seconds, set WPM to 0 and exclude it from averages.  
* **Long pauses:** count gaps greater than **2.0 seconds** between consecutive final result timestamps inside the same answer (ignore the final trailing silence used for end detection and the initial thinking gap before speech starts). Record each pause's start time for the timeline.  
* **Confidence Score (0 to 100), computed over the whole interview:**  
  * fillerRate \= totalFillers / max(totalWords, 1\) per word  
  * Filler penalty: min(40, fillerRate \* 400\) (10 fillers per 100 words gives 40\)  
  * Pace penalty: ideal 110 to 160 WPM. If avg WPM is in range, 0\. Otherwise min(30, abs(distance to nearest bound) \* 0.6)  
  * Pause penalty: min(30, longPausesPerMinute \* 6\)  
  * confidence \= clamp(round(100 \- fillerPenalty \- pacePenalty \- pausePenalty), 0, 100\)  
  * If total words \< 20, return 0 with a flag insufficientData and show "Not enough speech to score" in the report.

## **11\. Report Generation**

### **11.1 Timeline events (built in reportBuilder.js from turns)**

* pause: each long pause with its absolute time, label "Long pause (X.Xs)".  
* filler: if a single answer has 4 or more fillers, one event at the answer's start, label "Filler burst (N fillers)".  
* strong: answer with average score \>= 8, label "Strong answer: \<first 6 words of question\>...".  
* weak: answer with average score \<= 4, label "Needs work: \<first 6 words of question\>...".  
* Sort by tSec ascending. Cap at 30 events.

### **11.2 Aggregates**

* radar \= mean of each score across turns where evalFailed is false (round to 1 decimal). If none, all zeros.  
* overall \= round( (radarAvg/10) \* 70 \+ (confidence/100) \* 30 ) (content 70 percent, delivery 30 percent).  
* summary: a 2 to 3 sentence template-built string (no extra LLM call): strongest dimension, weakest dimension, and one tip based on the highest penalty among fillers, pace or pauses.  
* Because the confidence formula needs per-answer analytics, the client sends analytics inside each turn, and the server recomputes totals from them.

## **12\. Error Handling and Edge Cases (all must be handled)**

| Case | Required behavior |
| :---- | :---- |
| Gemini fails, times out, or returns bad JSON | Fallback object, evalFailed: true, interview continues with a generic question |
| /api/questions fails | Use a hardcoded opening question |
| PDF is scanned or empty | 422 message with instructions to paste text |
| Non-PDF or over 5 MB | Clear client and server error |
| Mic permission denied or no device | Lobby shows how to fix; cannot join |
| Browser lacks speech recognition | Warning in Lobby; Meeting shows a text input box so the user can type answers as a fallback |
| Recognition no-speech or aborted errors | Silently restart; do not surface as errors |
| Recognition not-allowed error | Show a banner and stop |
| User is silent | Gentle prompt once, then record empty answer and continue |
| Network fails mid-interview | Keep answering locally; evaluation failures are marked evalFailed; saving offers Retry |
| Page refresh during Meeting | Lose the interview; show a confirmation via beforeunload while active |
| User navigates away | Stop streams, synthesis and recognition in cleanup effects |
| Double clicks on End/Join | Ignore using refs and disabled states |
| Session ID not found on Report | Friendly 404 state |

All cleanup effects must stop recognition, cancel synthesis, clear timers and stop media tracks. No memory leaks or orphaned timers.

## **13\. Security and Privacy**

* Gemini key only on the server. Never exposed via any VITE\_ variable.  
* CORS restricted to CLIENT\_URL origins.  
* Video and audio never leave the browser; only text transcripts go to the server.  
* No login; sessions are identified by a random unguessable ID.  
* Add a visible privacy note on the Setup page: "Your video is never recorded or uploaded. Only your transcript and scores are saved."

## **14\. Deployment Spec**

Browser (React on Vercel) → Express API (Render) → Gemini API  
                                  ↓  
                           MongoDB Atlas  
**Server (Render web service):** root directory server, build command npm install, start command node index.js. Server must listen on process.env.PORT. Env vars: GEMINI\_API\_KEY, GEMINI\_MODEL, MONGODB\_URI, CLIENT\_URL (the exact Vercel URL, no trailing slash).

**Client (Vercel):** root directory client, framework Vite, build npm run build, output dist. Env var VITE\_API\_URL \= the Render URL (no trailing slash). Redeploy after changing it.

**MongoDB Atlas:** create a database user, and allow network access from 0.0.0.0/0 for the demo.

**README must include:** local setup steps, env var table, deployment steps, the Limitations list from Section 1.3, and a Future Scope section (login, progress dashboard, MediaPipe eye-contact analysis, embeddings-based similarity scoring, company-wise interview modes, Docker).

Known deployment failures to pre-empt: Render free tier sleeps (the health ping on load mitigates it); CORS mismatch from a trailing slash or wrong origin; camera and mic require HTTPS (Vercel provides it); only Chrome is supported.

## **15\. Build Phases (follow in order; verify each checkpoint)**

**Phase 1: Server foundation (target 25 min)** Scaffold server/, install dependencies, Express app with CORS, JSON limits, rate limit, health route, Mongo connection. Implement Session model, safeJson, gemini.js, prompts, and routes resume, questions, evaluate, sessions, plus reportBuilder. *Checkpoint:* curl the health, questions and evaluate endpoints and see valid JSON, including the fallback when the API key is deliberately wrong.

**Phase 2: Client foundation (target 25 min)** Scaffold Vite React app, Tailwind, Router, context, api.js. Build Landing, Setup and Lobby fully. *Checkpoint:* upload a PDF, see extracted text, pass validation, preview webcam with mic meter.

**Phase 3: Meeting room and engine (target 50 min, the hardest part)** Build the hooks (useSpeechSynthesis, useSpeechRecognition, useCountdown), analytics utils, Meeting UI and the state machine from Section 9\. *Checkpoint:* a full 5-minute run in Chrome with at least one follow-up question, a clean 45-second closing, and a clean end at 00:00.

**Phase 4: Report (target 25 min)** Build the Report page, radar chart, gauge, answer cards and timeline. *Checkpoint:* end a real interview and see a complete report with all sections.

**Phase 5: Polish, README, deploy prep (target 20 min)** Responsive fixes, empty and loading states, .env.example files, README, vercel.json.

If time is short, cut in this order: live captions toggle, camera toggle, confidence gauge visuals. **Never cut:** the countdown timer, end-call behavior, follow-up questions, speech analytics numbers, answer rewrite.

## **16\. Acceptance Criteria (definition of done)**

1. Uploading a valid PDF returns text; a scanned or empty PDF shows the paste-text fallback message.  
2. Continue stays disabled until resume text and category are set.  
3. Lobby shows a live webcam preview and a moving mic level meter.  
4. In Meeting, Aria speaks the opening question and the mic starts only after she finishes.  
5. The user's speech appears as live captions; a 2.5-second pause completes the answer.  
6. The next question arrives within about 3 seconds of the answer completing, and at least one follow-up references the user's own words.  
7. No more than one follow-up is asked per main question.  
8. Countdown starts after the first question arrives, turns red at 60 seconds, and Aria gives the closing line at about 45 seconds remaining without asking a new question.  
9. At 00:00 or End call (confirmed), the call ends, the partial answer is still evaluated, and a loader appears.  
10. The Report shows overall score, radar chart (4 axes), Confidence Score with filler, WPM and pause stats, per-answer "Your answer vs Improved answer" cards, and a timestamped timeline.  
11. A report page reloads correctly from its URL (SPA rewrite works) and shows saved data.  
12. Bad Gemini output never crashes the server or the UI.  
13. Gemini API key does not appear anywhere in the client bundle or repository.  
14. App works on the deployed Vercel URL against the Render backend with no CORS errors.  
15. No console errors during a full run; all timers, streams and recognition stop on exit.

**Additional acceptance criteria:**

* The Landing page at / shows the product name, description, how-it-works steps and a Start Interview button that opens Setup.  
* Aria's first question is always "Tell me about yourself.", and the second question is a cross-question that references the user's introduction and resume.  
* The Report includes a full transcript (Aria's questions and the user's answers in order) with Copy and Download .txt buttons.

## **17\. Known Pitfalls to Avoid (apply while coding)**

* **pdf-parse import bug:** require("pdf-parse") can run a test file and crash on some setups. Use require("pdf-parse/lib/pdf-parse.js") instead.  
* **Gemini JSON:** even in JSON mode, strip fences and validate; never trust the shape.  
* **SDK:** use @google/genai (not the deprecated @google/generative-ai). Pass the key from process.env.GEMINI\_API\_KEY only.  
* **Web Speech API:** recognition auto-stops; implement the guarded restart. Do not run recognition while Aria is speaking or it will transcribe her voice.  
* **speechSynthesis** needs a prior user gesture (the Join button) and voices load late; handle voiceschanged.  
* **Stale closures:** timers and recognition callbacks read state; use refs for state, transcripts and flags inside callbacks.  
* **React StrictMode** double-invokes effects in dev; make the start sequence idempotent (guard with a ref) so the first question is not requested or spoken twice.  
* **Timer drift:** compute from Date.now() deltas.  
* **Mongoose:** connect before app.listen; log a clear error if MONGODB\_URI is missing.  
* **CORS:** compare origins exactly; no trailing slashes in env values.  
* **Tailwind:** ensure content globs include ./index.html and ./src/\*\*/\*.{js,jsx}.  
* **Media streams:** stop every track on exit; reuse the Lobby stream in Meeting rather than prompting again.

## **18\. Final Instruction to the Agent**

Start with the plan, then Phase 1\. After each phase, run the code, fix all errors, and report what was verified before starting the next phase. When all phases are complete, run through the Section 16 checklist and list any item that is not yet satisfied.

## **19\. Demo-Day Checklist and Viva Notes**

* Test one full run on the **live URL**, not only localhost, an hour before presenting.  
* Open the site a few minutes early so the Render free server wakes up (first request can take 30 to 60 seconds).  
* Use Chrome, allow camera and mic, and test the microphone first.  
* Keep a **backup screen recording** of a full run in case Wi-Fi or voice recognition fails.  
* Know the 30-second pitch, the architecture diagram and the four differentiators (follow-ups, speech analytics, answer rewrite, replay timeline).  
* Be ready to explain every technology choice from Section 2\.  
* Be honest about limits: scoring comes from speech and answer content, not video; evaluation is LLM-based; speech recognition depends on accent and mic quality.  
* For evaluation day, ask 2 or 3 friends to rate the same answers manually and compare with the app's scores to get a real accuracy figure for the report.  
* Keep the 10-week bigger plan (login, PostgreSQL, Docker, MediaPipe face tracking, progress dashboard, company-wise modes, embeddings similarity) as "Future Scope" in the report and viva.