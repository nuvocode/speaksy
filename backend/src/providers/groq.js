/**
 * @module providers/groq
 * Groq provider using the groq-sdk.
 * Default model: llama-3.1-8b-instant
 */

import Groq from 'groq-sdk';
import BaseProvider from './base.js';
import config from '../config.js';

/** Default Groq model identifier */
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export default class GroqProvider extends BaseProvider {
  constructor() {
    super('Groq');
    this.apiKey = config.groqApiKey;
    this.model = config.groqModel || DEFAULT_MODEL;

    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
    }
  }

  /** @inheritdoc */
  async chat(messages, options = {}) {
    const model = this.resolveModel(options);
    const response = await this.client.chat.completions.create({
      model,
      messages,
      ...options,
    });
    return response.choices[0].message.content;
  }

  /** @inheritdoc */
  async *stream(messages, options = {}) {
    const model = this.resolveModel(options);
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      stream: true,
      ...options,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  /** @inheritdoc */
  async isAvailable(options = {}) {
    try {
      if (!this.apiKey) return false;
      const model = this.resolveModel(options);
      const models = await this.client.models.list();
      return models.data.some((item) => item.id === model);
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  async listModels() {
    if (!this.apiKey) {
      throw new Error('Groq API key is not configured on the backend.');
    }

    const models = await this.client.models.list();
    return models.data
      .map((item) => item.id)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id, label: id }));
  }
}
