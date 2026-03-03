# LinguaAI

> Open-source English conversation practice app powered by AI. Speak naturally, get real-time feedback, and improve your fluency.

![LinguaAI Screenshot](https://via.placeholder.com/800x450?text=LinguaAI+Screenshot)

---

## Features

- 🎙️ **Voice-first conversation** — speak naturally using your microphone
- 🤖 **Multi-provider AI** — Gemini, OpenAI, Claude, Groq, Ollama, LM Studio
- 🔊 **Natural TTS** — AI speaks back via Kokoro text-to-speech
- 📝 **Gentle corrections** — grammar fixes embedded naturally in conversation
- 🌐 **Browser STT** — zero-setup speech recognition via Web Speech API
- 🐳 **Docker ready** — one command to run everything
- 🔒 **Privacy-first** — run fully local with Ollama + Whisper + Kokoro

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/your-org/linguaai.git
cd linguaai
cp .env.example .env
```

### 2. Edit `.env` — add your API key

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

### 3. Run

```bash
docker compose up
```

Open [http://localhost:3000](http://localhost:3000) and start speaking!

---

## Provider Configuration

| Provider   | Env Variable(s)       | Model Default            | Type    |
| ---------- | --------------------- | ------------------------ | ------- |
| Gemini     | `GEMINI_API_KEY`      | `gemini-1.5-flash`       | Cloud   |
| OpenAI     | `OPENAI_API_KEY`      | `gpt-4o-mini`            | Cloud   |
| Anthropic  | `ANTHROPIC_API_KEY`   | `claude-3-haiku-20240307`| Cloud   |
| Groq       | `GROQ_API_KEY`        | `llama-3.1-8b-instant`   | Cloud   |
| Ollama     | `OLLAMA_BASE_URL`     | `llama3.2`               | Local   |
| LM Studio  | `LMSTUDIO_BASE_URL`   | `local-model`            | Local   |

### Fully Local Setup (No API Keys)

```bash
# Start Ollama on your machine
ollama run llama3.2

# Update .env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Optional: use Whisper for STT (instead of browser)
docker compose -f docker-compose.yml -f docker-compose.override.yml up
```

---

## Development (Without Docker)

### Prerequisites

- Node.js 20+
- npm 9+

### Backend

```bash
cd backend
npm install
cp ../.env.example ../.env   # edit with your keys

npm run dev
# → http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install

npm run dev
# → http://localhost:3000 (proxies API to :3001)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Frontend (Vite)         http://localhost:3000   │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐             │  │
│  │  │ Zustand  │ │ useSTT   │ │ useAudio   │             │  │
│  │  │  Store   │ │ (WebSP.) │ │ (AudioCtx) │             │  │
│  │  └────┬─────┘ └─────┬────┘ └──────┬─────┘             │  │
│  │       │              │             │                    │  │
│  │       └──────────────┴─────────────┘                    │  │
│  │                      │                                  │  │
│  │              WebSocket Client                           │  │
│  └──────────────────────┼────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ ws://localhost:3001/ws
┌─────────────────────────┼───────────────────────────────────┐
│  Express Backend        │                  :3001            │
│  ┌──────────────────────┴──────────────────────────────┐    │
│  │  WebSocket Handler                                  │    │
│  │  ┌──────────────┐  ┌─────────────┐  ┌───────────┐  │    │
│  │  │ Conversation  │  │  Provider    │  │  Prompt   │  │    │
│  │  │  Service      │  │  (Gemini/   │  │  Builder  │  │    │
│  │  │  (history)    │  │   OpenAI/…) │  │           │  │    │
│  │  └──────────────┘  └──────┬──────┘  └───────────┘  │    │
│  └───────────────────────────┼─────────────────────────┘    │
│                              │                               │
│  ┌────── REST Routes ────────┤                               │
│  │ POST /api/tts ──────────────────→ Kokoro (:8880)         │
│  │ POST /api/stt ──────────────────→ Whisper (:9000)        │
│  │ GET  /api/chat/health      │                              │
│  └────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Docker Services

| Service    | Port  | Description                        |
| ---------- | ----- | ---------------------------------- |
| `frontend` | 3000  | Vite React development server      |
| `backend`  | 3001  | Express + WebSocket API server     |
| `kokoro`   | 8880  | Kokoro FastAPI TTS engine          |
| `whisper`  | 9000  | Whisper ASR (optional, override)   |

---

## v2 Roadmap

- [ ] **Scenario Mode** — role-playing scenarios (job interview, ordering food, etc.)
- [ ] **Pronunciation Score** — phoneme-level pronunciation analysis
- [ ] **Grammar Report** — end-of-session grammar improvement report
- [ ] **Vocabulary Tracker** — track new words learned per session
- [ ] **Multi-language** — extend beyond English (Spanish, French, etc.)
- [ ] **Mobile App** — React Native version with native audio handling
- [ ] **User Accounts** — progress tracking across sessions
- [ ] **Spaced Repetition** — revisit corrected phrases automatically
- [ ] **CEFR Level Detection** — automatically detect and adapt to user level

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feat/my-feature`
3. **Make changes** and ensure all existing functionality works
4. **Commit** with clear messages: `git commit -m "feat: add scenario mode"`
5. **Push** and open a **Pull Request**

### Guidelines

- Follow the existing code style (ESM imports, JSDoc comments, no TypeScript)
- Use design tokens from `tokens.css` — no hardcoded colors/values
- Every `useEffect` must have a cleanup function where applicable
- Test with at least one AI provider before submitting
- Keep PRs focused — one feature per PR

### Project Structure

```
├── backend/           Node.js Express + WebSocket server
│   └── src/
│       ├── providers/ AI provider adapters (Gemini, OpenAI, etc.)
│       ├── services/  Conversation history, prompt building
│       ├── routes/    REST API (TTS, STT, chat)
│       └── websocket/ WebSocket message handling
│
└── frontend/          React + Vite SPA
    └── src/
        ├── components/ UI components
        ├── hooks/      Custom React hooks (STT, audio, conversation)
        ├── store/      Zustand global state
        ├── lib/        WebSocket client
        └── styles/     CSS tokens, animations, globals
```

---

## License

MIT © LinguaAI Contributors
