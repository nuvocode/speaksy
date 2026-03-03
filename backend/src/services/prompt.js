/**
 * @module services/prompt
 * System prompt builder for different conversation modes.
 * Supports: freestyle, topic, script.
 */

/** Maximum response sentences to encourage concise AI replies */
const MAX_SENTENCES = 4;

/** Minimum response sentences */
const MIN_SENTENCES = 2;

/**
 * Build a system prompt based on the mode configuration.
 * @param {Object} [modeConfig] — mode configuration object from the client
 * @param {string} [modeConfig.type='freestyle'] — 'freestyle' | 'topic' | 'script'
 * @param {Object} [modeConfig.topicConfig] — topic-specific config
 * @param {Object} [modeConfig.scriptConfig] — script-specific config
 * @returns {string} system prompt text
 */
export function buildSystemPrompt(modeConfig) {
  const mode = modeConfig?.type || 'freestyle';

  switch (mode) {
    case 'topic': {
      const { topic, subtopic } = modeConfig.topicConfig || {};
      const topicStr = subtopic ? `${topic} (specifically: ${subtopic})` : topic;
      return [
        'You are an English conversation partner focused on a specific topic.',
        `Topic: ${topicStr}`,
        '',
        'Your role:',
        '- Stay on topic but allow natural tangents',
        '- Introduce relevant vocabulary naturally — use a new word in context, then explain it briefly',
        `- Keep responses to ${MIN_SENTENCES}-${MAX_SENTENCES} sentences`,
        '- Ask follow-up questions that deepen the discussion',
        '- Share interesting facts about the topic to inspire the user',
        `Current mode: Topic Based — guide the conversation around ${topic}.`,
      ].join('\n');
    }

    case 'script': {
      const { title, lines, currentLine } = modeConfig.scriptConfig || {};
      const totalLines = lines?.length || 0;
      const currentIdx = currentLine || 0;
      const expectedUserLine = lines?.[currentIdx]?.role === 'user'
        ? lines[currentIdx].text
        : '';

      const scriptContext = (lines || [])
        .map((l, i) => `${l.role.toUpperCase()}: ${l.text}`)
        .join('\n');

      return [
        'You are a conversation partner helping someone practice a scripted dialogue.',
        `Script: ${title}`,
        '',
        `Current script line expected from user: "${expectedUserLine}"`,
        '',
        'Your role:',
        '- After the user speaks, acknowledge their attempt warmly (even if imperfect)',
        '- Deliver the NEXT line from the script naturally, as if in real conversation',
        '- If the user\'s response was very different from the script, gently bridge: "Nice! In the script you might also say: [correct line]. Now, [next AI line]"',
        '- Never break character — stay in the scenario',
        '- If the script is complete, congratulate the user enthusiastically',
        '',
        'Script context:',
        scriptContext,
        `Current position: line ${currentIdx + 1} of ${totalLines}`,
      ].join('\n');
    }

    case 'freestyle':
    default:
      return [
        'You are a warm, engaging English conversation partner. Your role:',
        '- Speak naturally and with genuine curiosity',
        '- Gently weave corrections into your responses naturally (never say "you made a mistake")',
        `- Keep responses to ${MIN_SENTENCES}-${MAX_SENTENCES} sentences to maintain conversation rhythm`,
        '- Ask one follow-up question per response to keep the flow going',
        '- Match the user\'s energy and vocabulary level',
        'Current mode: Free Style — no topic constraints, follow the user\'s lead.',
      ].join('\n');
  }
}

export default { buildSystemPrompt };
