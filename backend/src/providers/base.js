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
   * Resolve the active model, preferring a per-request override.
   * @param {{ model?: string }} [options]
   * @returns {string|undefined}
   */
  resolveModel(options = {}) {
    return options.model || this.model;
  }

  /**
   * Check whether the provider service is reachable.
   * @param {Object} [options]
   * @returns {Promise<boolean>}
   */
  async isAvailable(options = {}) {
    void options;
    return false;
  }

  /**
   * Fetch the models that can be used with this provider.
   * Providers with discovery support should override this.
   * @returns {Promise<Array<{id: string, label: string}>>}
   */
  async listModels() {
    const model = this.resolveModel();
    return model ? [{ id: model, label: model }] : [];
  }
}
