# Speaksy

Speaksy is a local-first, open-source speaking practice app. It lets you talk to an AI partner with your microphone, hear spoken responses back, and practice fluency without depending on a cloud-only setup.

The project was built around one idea: make speaking practice possible with local tools such as Ollama or LM Studio, while keeping the setup approachable for regular development and open-source contributions.

## What Speaksy does

- Voice-first speaking practice in the browser
- Local LLM support with Ollama and LM Studio
- Optional cloud providers: Gemini, OpenAI, Anthropic, Groq
- Text-to-speech replies through Kokoro
- Browser STT by default, optional Whisper STT
- Freestyle, topic, and script-based practice modes
- Docker support for the app services

## Default port map

| Service | Port | Notes |
| --- | --- | --- |
| Frontend | `3000` | Main app UI |
| Backend | `3001` | REST + WebSocket API |
| Ollama | `11434` | Runs on your host machine |
| LM Studio | `1234` | Local server in Developer mode |
| Kokoro | `8880` | Dockerized TTS service |
| Whisper | `9000` | Optional Dockerized STT service |

## Prerequisites

- Node.js `20+`
- npm `9+`
- Docker Desktop or Docker Engine with Compose
- One AI provider:
  - Ollama for the recommended local-first setup
  - LM Studio for a local GUI-based setup
  - Or a supported cloud API key

## Install local providers

### Ollama

1. Install Ollama from the official download page: [ollama.com/download](https://ollama.com/download)
2. Pull a model:

```bash
ollama pull llama3.2
```

3. Make sure the Ollama service is running. On some systems the desktop app starts it automatically; otherwise run:

```bash
ollama serve
```

### LM Studio

1. Install LM Studio from the official download page: [LM Studio Downloads](https://beta.lmstudio.ai/home)
2. Download a chat model inside the app
3. Open the `Developer` tab and start the local server, or run:

```bash
lms server start
```

4. By default Speaksy expects the LM Studio server at `http://localhost:1234`

Reference:
- [LM Studio local server docs](https://lmstudio.ai/docs/developer/core/server)

## Quick start with Docker

Docker starts the app services and Kokoro for you. Ollama and LM Studio are expected to run on your machine, not inside this compose stack.

```bash
git clone https://github.com/your-org/speaksy.git
cd speaksy
cp .env.example .env
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

### Choose your AI provider

Edit `.env` before starting if needed:

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

For LM Studio:

```env
AI_PROVIDER=lmstudio
LMSTUDIO_MODEL=local-model
```

Replace `local-model` with the identifier of the model you loaded in LM Studio.

For cloud providers:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

Notes:
- In Docker mode, the backend already points to `host.docker.internal` for Ollama and LM Studio.
- The compose file also adds the host gateway mapping so this works on Linux setups that support `host-gateway`.
- Browser STT is the default, so you can start without Whisper.

## Optional Whisper STT

If you want speech-to-text to run outside the browser, start the override stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

This enables:

```env
STT_PROVIDER=whisper
```

## Run without Docker

### 1. Configure environment

```bash
cp .env.example .env
```

When running the backend locally, use local service URLs:

```env
KOKORO_URL=http://localhost:8880
WHISPER_URL=http://localhost:9000
OLLAMA_BASE_URL=http://localhost:11434
LMSTUDIO_BASE_URL=http://localhost:1234
```

### 2. Start Kokoro

```bash
docker compose up kokoro
```

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

Backend endpoints:

- Health: [http://localhost:3001/health](http://localhost:3001/health)
- WebSocket: `ws://localhost:3001/ws`

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Backend port |
| `AI_PROVIDER` | `ollama` | Active LLM provider |
| `STT_PROVIDER` | `webspeech` | Browser STT or Whisper |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model name |
| `LMSTUDIO_BASE_URL` | `http://localhost:1234` | LM Studio API base URL |
| `LMSTUDIO_MODEL` | `local-model` | LM Studio model identifier; replace with your loaded model id |
| `KOKORO_URL` | `http://localhost:8880` | Kokoro TTS endpoint |
| `KOKORO_VOICE` | `af_heart` | Default voice |
| `WHISPER_URL` | `http://localhost:9000` | Whisper endpoint |
| `GEMINI_API_KEY` | empty | Gemini API key |
| `OPENAI_API_KEY` | empty | OpenAI API key |
| `ANTHROPIC_API_KEY` | empty | Anthropic API key |
| `GROQ_API_KEY` | empty | Groq API key |

## Project structure

```text
.
├── backend/
│   └── src/
│       ├── providers/
│       ├── routes/
│       ├── services/
│       └── websocket/
├── frontend/
│   └── src/
│       ├── components/
│       ├── data/
│       ├── hooks/
│       ├── lib/
│       ├── store/
│       └── styles/
├── docker-compose.yml
├── docker-compose.override.yml
└── .env.example
```

## Contributing

Speaksy is being prepared for open-source release, so small focused pull requests are preferred.

- Keep changes scoped
- Preserve the local-first workflow
- Test at least one provider before opening a PR
- Reuse existing design tokens and project conventions

## License

MIT
