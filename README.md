# MockMate · AI Interview Coach

*Not just a mock interviewer, but a coach that shows you exactly where and how to improve.*

MockMate is a voice-first virtual interview coach. Upload your resume, pick a domain and duration, join a video-call-style meeting room with **Aria** (AI interviewer), answer questions aloud, and receive a full coaching report with readiness scores, speech analytics, side-by-side answer rewrites, a replay timeline, and a downloadable transcript.

---

## Local Setup

### Prerequisites
- Node.js 18+
- Google Chrome (desktop) for Web Speech API (`webkitSpeechRecognition` + `speechSynthesis`)
- A Gemini API key and a MongoDB Atlas connection string

### 1. Server
```bash
cd server
npm install
cp .env.example .env
# Edit server/.env with your GEMINI_API_KEY, MONGODB_URI, and CLIENT_URL
node index.js
```

### 2. Client
```bash
cd client
npm install
cp .env.example .env
# Edit client/.env if your server runs on a different port
npm run dev
```

Open `http://localhost:5173` in Google Chrome.

---

## Environment Variables

### `server/.env`
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `GEMINI_API_KEY` | Google Gemini API key (server-only) | `AIza...` |
| `GEMINI_MODEL` | Gemini model ID | `gemini-2.5-flash` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated, no trailing slash | `http://localhost:5173` |

### `client/.env`
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the Express API (no trailing slash) | `http://localhost:5000` |

---

## Deployment

- **MongoDB Atlas:** Create a database user and allow network access (`0.0.0.0/0` for demo).
- **Server (Render Web Service):**
  - Root directory: `server`
  - Build command: `npm install`
  - Start command: `node index.js`
  - Set `GEMINI_API_KEY`, `GEMINI_MODEL`, `MONGODB_URI`, and `CLIENT_URL` (exact Vercel URL, no trailing slash).
- **Client (Vercel):**
  - Root directory: `client`
  - Framework preset: `Vite`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set `VITE_API_URL` to your Render URL (no trailing slash) and redeploy. `client/vercel.json` handles SPA rewrites for `/report/:id`.

---

## Limitations

- Scoring comes from speech and answer content only. The webcam is for a realistic interview feel and is never analyzed, recorded, or uploaded.
- Evaluation is LLM-based and approximate.
- Speech recognition accuracy depends on accent, microphone quality, and background noise.
- Google Chrome desktop is the supported browser for voice features (other browsers fall back to typed input).

## Assumptions

- Pasted resume text in Setup accepts any non-empty text (no 100-character minimum) for quick testing, while PDF uploads enforce the 100-character minimum in `POST /api/resume` to catch scanned/image-only PDFs.
- Filler-word analytics use the strong filler set (`um`, `uh`, `umm`, `uhh`, `er`, `erm`, `you know`, `i mean`, `basically`, `kind of`, `sort of`, `like`).

## Future Scope

- User authentication and cross-session progress dashboard
- PostgreSQL + Dockerized deployment
- MediaPipe client-side eye-contact and posture feedback
- Embeddings-based semantic similarity scoring
- Company-wise interview modes and rubrics
