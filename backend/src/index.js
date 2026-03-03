/**
 * @module index
 * LinguaAI Backend — Express + WebSocket server entry point.
 * Starts the HTTP server, mounts REST routes, and initialises WebSocket handling.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import config, { validateConfig } from './config.js';
import { initWebSocket } from './websocket/handler.js';
import chatRouter from './routes/chat.js';
import ttsRouter from './routes/tts.js';
import sttRouter from './routes/stt.js';

/* ── Validate configuration ─────────────────────────── */
validateConfig();

/* ── Express app ─────────────────────────────────────── */
const app = express();
app.use(cors());
app.use(express.json());

/* Health check */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', provider: config.aiProvider, stt: config.sttProvider });
});

/* REST routes */
app.use('/api/chat', chatRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/stt', sttRouter);

/* ── HTTP + WebSocket server ─────────────────────────── */
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
initWebSocket(wss);

/* ── Start ───────────────────────────────────────────── */
server.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║          LinguaAI Backend v1.0           ║
║──────────────────────────────────────────║
║  HTTP  → http://localhost:${config.port}          ║
║  WS    → ws://localhost:${config.port}/ws         ║
║  AI    → ${config.aiProvider.padEnd(30)}║
║  STT   → ${config.sttProvider.padEnd(30)}║
║  TTS   → Kokoro @ ${config.kokoroUrl.padEnd(21)}║
╚══════════════════════════════════════════╝
  `);
});

/* Graceful shutdown */
const shutdown = () => {
  console.log('\n[server] Shutting down...');
  wss.close();
  server.close(() => {
    console.log('[server] Closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
