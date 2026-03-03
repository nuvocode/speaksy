/**
 * @module services/prompt
 * System prompt builder for different conversation modes.
 * Currently supports "freeStyle" mode.
 */

/** Maximum response sentences to encourage concise AI replies */
const MAX_SENTENCES = 4;

/** Minimum response sentences */
const MIN_SENTENCES = 2;

/**
 * Available conversation modes and their descriptions.
 * @type {Object<string, string>}
 */
const MODES = {
  freeStyle: 'Free Style Conversation',
};

/**
 * Build a system prompt for the given conversation mode.
 * @param {string} [mode='freeStyle'] — conversation mode identifier
 * @returns {string} system prompt text
 */
export function buildSystemPrompt(mode = 'freeStyle') {
  const modeLabel = MODES[mode] || MODES.freeStyle;

  return [
    'You are an English conversation partner. Your role is to:',
    '- Speak naturally and encouragingly',
    '- Gently correct grammar mistakes (don\'t be harsh, embed corrections naturally)',
    `- Keep responses concise (${MIN_SENTENCES}-${MAX_SENTENCES} sentences max) to maintain conversation flow`,
    '- Ask follow-up questions to keep the conversation going',
    '- Adapt your vocabulary to the user\'s apparent level',
    `Current mode: ${modeLabel}`,
  ].join('\n');
}

export default { buildSystemPrompt, MODES };
