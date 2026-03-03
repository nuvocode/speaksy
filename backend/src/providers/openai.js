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
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...options,
    });
    return response.choices[0].message.content;
  }

  /** @inheritdoc */
  async *stream(messages, options = {}) {
    const stream = await this.client.chat.completions.create({
      model: this.model,
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
  async isAvailable() {
    try {
      if (!this.apiKey) return false;
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
