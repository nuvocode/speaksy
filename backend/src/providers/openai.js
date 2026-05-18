/**
 * @module providers/openai
 * OpenAI provider using the official openai SDK.
 * Default model: gpt-4o-mini (configurable via env).
 */

import OpenAI from 'openai';
import BaseProvider from './base.js';
import config from '../config.js';

/** Default OpenAI model identifier */
const DEFAULT_MODEL = 'gpt-4o-mini';

export default class OpenAIProvider extends BaseProvider {
  constructor() {
    super('OpenAI');
    this.apiKey = config.openaiApiKey;
    this.model = config.openaiModel || DEFAULT_MODEL;

    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
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
      throw new Error('OpenAI API key is not configured on the backend.');
    }

    const models = await this.client.models.list();
    return models.data
      .map((item) => item.id)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id, label: id }));
  }
}
