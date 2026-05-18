/**
 * @module providers/anthropic
 * Anthropic Claude provider using the @anthropic-ai/sdk.
 * Default model: claude-3-haiku-20240307
 */

import Anthropic from '@anthropic-ai/sdk';
import BaseProvider from './base.js';
import config from '../config.js';

/** Default Anthropic model identifier */
const DEFAULT_MODEL = 'claude-3-haiku-20240307';

/** Max tokens for the response */
const MAX_TOKENS = 1024;

export default class AnthropicProvider extends BaseProvider {
  constructor() {
    super('Anthropic');
    this.apiKey = config.anthropicApiKey;
    this.model = config.anthropicModel || DEFAULT_MODEL;

    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  /**
   * Extract system message and convert to Anthropic format.
   * Anthropic expects system as a top-level param, not in messages array.
   * @param {Array<{role: string, content: string}>} messages
   * @returns {{ system: string|undefined, messages: Array }}
   */
  _prepareMessages(messages) {
    let system;
    const filtered = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
      } else {
        filtered.push({ role: msg.role, content: msg.content });
      }
    }

    return { system, messages: filtered };
  }

  /** @inheritdoc */
  async chat(messages, options = {}) {
    const { system, messages: formatted } = this._prepareMessages(messages);
    const model = this.resolveModel(options);

    const response = await this.client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      ...(system && { system }),
      messages: formatted,
      ...options,
    });

    return response.content[0].text;
  }

  /** @inheritdoc */
  async *stream(messages, options = {}) {
    const { system, messages: formatted } = this._prepareMessages(messages);
    const model = this.resolveModel(options);

    const stream = this.client.messages.stream({
      model,
      max_tokens: MAX_TOKENS,
      ...(system && { system }),
      messages: formatted,
      ...options,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        yield event.delta.text;
      }
    }
  }

  /** @inheritdoc */
  async isAvailable(options = {}) {
    try {
      if (!this.apiKey) return false;
      const model = this.resolveModel(options);
      await this.client.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  async listModels() {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured on the backend.');
    }

    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      throw new Error(`Anthropic models request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return (data.data || [])
      .map((item) => item.id)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id, label: id }));
  }
}
