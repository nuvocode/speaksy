/**
 * @module providers/lmstudio
 * LMStudio provider — uses the OpenAI-compatible API exposed by LMStudio.
 * Communicates with LMSTUDIO_BASE_URL/v1/chat/completions.
 */

import BaseProvider from './base.js';
import config from '../config.js';

export default class LMStudioProvider extends BaseProvider {
  constructor() {
    super('LMStudio');
    this.baseUrl = config.lmstudioBaseUrl;
    this.model = config.lmstudioModel;
  }

  /** @inheritdoc */
  async chat(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`LMStudio error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /** @inheritdoc */
  async *stream(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`LMStudio error: ${response.status} ${await response.text()}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6);
        if (payload === '[DONE]') return;

        try {
          const parsed = JSON.parse(payload);
          const text = parsed.choices[0]?.delta?.content;
          if (text) yield text;
        } catch {
          /* ignore malformed SSE chunks */
        }
      }
    }
  }

  /** @inheritdoc */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
