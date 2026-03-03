/**
 * @module providers/gemini
 * Google Gemini AI provider using the @google/generative-ai SDK.
 * Default model: gemini-1.5-flash
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import BaseProvider from './base.js';
import config from '../config.js';

/** Default Gemini model identifier */
const DEFAULT_MODEL = 'gemini-1.5-flash';

export default class GeminiProvider extends BaseProvider {
  constructor() {
    super('Gemini');
    this.apiKey = config.geminiApiKey;
    this.model = config.geminiModel || DEFAULT_MODEL;

    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Convert standard message array to Gemini content format.
   * @param {Array<{role: string, content: string}>} messages
   * @returns {{ systemInstruction: string|undefined, history: Array, userMessage: string }}
   */
  _prepareMessages(messages) {
    let systemInstruction;
    const history = [];
    let userMessage = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else if (msg.role === 'assistant') {
        history.push({ role: 'model', parts: [{ text: msg.content }] });
      } else if (msg.role === 'user') {
        history.push({ role: 'user', parts: [{ text: msg.content }] });
      }
    }

    /* The last user message is sent separately via sendMessage */
    const lastUserMsg = history.filter(h => h.role === 'user').pop();
    if (lastUserMsg) {
      userMessage = lastUserMsg.parts[0].text;
      /* Remove the last user message from history – Gemini expects it in sendMessage */
      const idx = history.lastIndexOf(lastUserMsg);
      if (idx !== -1) history.splice(idx, 1);
    }

    return { systemInstruction, history, userMessage };
  }

  /** @inheritdoc */
  async chat(messages, options = {}) {
    const { systemInstruction, history, userMessage } = this._prepareMessages(messages);

    const model = this.client.getGenerativeModel({
      model: this.model,
      ...(systemInstruction && { systemInstruction }),
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  }

  /** @inheritdoc */
  async *stream(messages, options = {}) {
    const { systemInstruction, history, userMessage } = this._prepareMessages(messages);

    const model = this.client.getGenerativeModel({
      model: this.model,
      ...(systemInstruction && { systemInstruction }),
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  /** @inheritdoc */
  async isAvailable() {
    try {
      if (!this.apiKey) return false;
      const model = this.client.getGenerativeModel({ model: this.model });
      await model.generateContent('ping');
      return true;
    } catch {
      return false;
    }
  }
}
