/**
 * @module routes/tts
 * Text-to-Speech route — proxies requests to the Kokoro TTS service.
 * POST /api/tts  body: { text, voice }  → returns audio buffer (mp3)
 */

import { Router } from 'express';
import config from '../config.js';

const router = Router();

/**
 * Proxy a TTS request to Kokoro FastAPI service.
 * Kokoro expects: POST /v1/audio/speech
 *   body: { model: "kokoro", input: text, voice: voice, response_format: "mp3" }
 */
router.post('/', async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body.' });
    }

    const selectedVoice = voice || config.kokoroVoice;
    const kokoroUrl = `${config.kokoroUrl}/v1/audio/speech`;

    const response = await fetch(kokoroUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[tts] Kokoro error ${response.status}: ${errorText}`);
      return res.status(502).json({ error: 'TTS service returned an error.' });
    }

    /* Stream the audio response back to the client */
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    });

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error('[tts] Error:', error.message);
    res.status(500).json({ error: 'Internal TTS error.' });
  }
});

export default router;
