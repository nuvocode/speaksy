/**
 * @module providers/base
 * Abstract base class that every AI provider must extend.
 * Guarantees a consistent interface across Gemini, OpenAI, Anthropic, Groq,
 * Ollama and LMStudio adapters.
 */

export default class BaseProvider {
  /**
   * @param {string} name — human-readable provider name
   */
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly.');
    }
    this.name = name;
  }

  /**
   * Send messages and receive a complete response.
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} [options]
   * @returns {Promise<string>} full assistant response
   */
  async chat(messages, options = {}) {
    throw new Error(`${this.name}: chat() is not implemented.`);
  }

  /**
   * Send messages and receive a streamed response (async generator).
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} [options]
   * @yields {string} text chunks
   */
  async *stream(messages, options = {}) {
    throw new Error(`${this.name}: stream() is not implemented.`);
  }

  /**
   * Check whether the provider service is reachable.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return false;
  }
}
