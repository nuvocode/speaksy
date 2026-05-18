/**
 * @module providers/ollama
 * Ollama provider — communicates via native fetch with the Ollama REST API.
 * Default model read from OLLAMA_MODEL env variable.
 */

import BaseProvider from './base.js';
import config from '../config.js';

export default class OllamaProvider extends BaseProvider {
  constructor() {
    super('Ollama');
    this.baseUrl = config.ollamaBaseUrl;
    this.model = config.ollamaModel;
  }

  /**
   * Strip system messages into Ollama compatible format.
   * Ollama /api/chat accepts system role directly.
   * @param {Array<{role: string, content: string}>} messages
   * @returns {Array<{role: string, content: string}>}
   */
  _formatMessages(messages) {
    return messages.map(m => ({ role: m.role, content: m.content }));
  }

  /** @inheritdoc */
  async chat(messages, options = {}) {
    const model = this.resolveModel(options);
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: this._formatMessages(messages),
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  /** @inheritdoc */
  async *stream(messages, options = {}) {
    const model = this.resolveModel(options);
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: this._formatMessages(messages),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
        } catch {
          /* ignore malformed chunks */
        }
      }
    }
  }

  /** @inheritdoc */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  async listModels() {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`Ollama models request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return (data.models || [])
      .map((item) => item.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id, label: id }));
  }
}
