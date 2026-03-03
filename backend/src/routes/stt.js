/**
 * @module routes/stt
 * Speech-to-Text route — proxies audio files to the Whisper ASR service.
 * POST /api/stt  multipart/form-data (audio file) → { text }
 */

import { Router } from 'express';
import multer from 'multer';
import config from '../config.js';

const router = Router();

/** Configure multer for in-memory file uploads (max 10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Proxy audio to Whisper ASR service and return transcript.
 * Whisper endpoint: POST /asr?task=transcribe&output=json
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    const whisperUrl = `${config.whisperUrl}/asr?task=transcribe&output=json`;

    /* Use native FormData + Blob (Node 20) for correct multipart encoding with native fetch */
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    form.append('audio_file', blob, req.file.originalname || 'audio.webm');

    const response = await fetch(whisperUrl, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[stt] Whisper error ${response.status}: ${errorText}`);
      return res.status(502).json({ error: 'STT service returned an error.' });
    }

    const data = await response.json();
    res.json({ text: data.text || '' });
  } catch (error) {
    console.error('[stt] Error:', error.message);
    res.status(500).json({ error: 'Internal STT error.' });
  }
});

export default router;
