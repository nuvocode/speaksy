/**
 * @module index
 * Speaksy backend — Express + WebSocket server entry point.
 * Starts the HTTP server, mounts REST routes, and initialises WebSocket handling.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import config, { validateConfig } from './config.js';
import { initWebSocket } from './websocket/handler.js';
import chatRouter from './routes/chat.js';
import ttsRouter from './routes/tts.js';
import sttRouter from './routes/stt.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

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

/* Static frontend (production Docker image) */
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => res.sendFile(join(publicDir, 'index.html')));
}

/* ── HTTP + WebSocket server ─────────────────────────── */
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
initWebSocket(wss);

/* ── Start ───────────────────────────────────────────── */
server.listen(config.port, () => {
  console.log(`
[Speaksy] Backend running
[Speaksy] HTTP: http://localhost:${config.port}
[Speaksy] WS: ws://localhost:${config.port}/ws
[Speaksy] AI provider: ${config.aiProvider}
[Speaksy] STT provider: ${config.sttProvider}
[Speaksy] TTS endpoint: ${config.kokoroUrl}
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
