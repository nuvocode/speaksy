/**
 * @module components/ConversationScreen/MessageBubble
 * Chat message bubble component.
 *   - AI messages: left-aligned, surface bg, green accent border
 *   - User messages: right-aligned, accent bg, white text
 *   - Streaming mode: blinking cursor at end
 *   - Timestamp visible on hover
 *
 * @param {{ message: { id: string, role: 'user'|'ai', text: string, timestamp: number, isStreaming: boolean } }} props
 */

import React, { useState } from 'react';

const styles = {
  wrapper: {
    display: 'flex',
    width: '100%',
    marginBottom: 'var(--space-3)',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperAI: {
    justifyContent: 'flex-start',
  },
  bubble: {
    position: 'relative',
    maxWidth: '80%',
    padding: 'var(--space-4) var(--space-5)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--leading-relaxed)',
    wordBreak: 'break-word',
  },
  bubbleAI: {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-md)',
    borderTopLeftRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-sm)',
    borderLeft: '3px solid var(--color-ai)',
    animation: 'slideInLeft var(--duration-slow) var(--ease-out) both',
  },
  bubbleUser: {
    background: 'var(--gradient-user)',
    color: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
    borderTopRightRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-sm)',
    animation: 'slideInRight var(--duration-slow) var(--ease-out) both',
  },
  cursor: {
    display: 'inline-block',
    width: 2,
    height: '1em',
    backgroundColor: 'var(--color-ai)',
    marginLeft: 2,
    verticalAlign: 'text-bottom',
    animation: 'blinkCursor 500ms step-end infinite',
  },
  timestamp: {
    position: 'absolute',
    bottom: -20,
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-muted)',
    whiteSpace: 'nowrap',
    opacity: 0,
    transition: `opacity var(--duration-fast) var(--ease-out)`,
    pointerEvents: 'none',
  },
  timestampAI: {
    left: 0,
  },
  timestampUser: {
    right: 0,
  },
};

/**
 * Format timestamp to a readable time string.
 * @param {number} ts — Unix timestamp in ms
 * @returns {string}
 */
function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * MessageBubble component.
 * @param {{ message: { id: string, role: 'user'|'ai', text: string, timestamp: number, isStreaming: boolean } }} props
 * @returns {React.ReactElement}
 */
export default function MessageBubble({ message }) {
  const [hovered, setHovered] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        ...styles.wrapper,
        ...(isUser ? styles.wrapperUser : styles.wrapperAI),
      }}
    >
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.bubbleUser : styles.bubbleAI),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="article"
        aria-label={`${isUser ? 'Your' : 'AI'} message`}
      >
        {message.text}
        {message.isStreaming && <span style={styles.cursor} aria-hidden="true" />}

        <span
          style={{
            ...styles.timestamp,
            ...(isUser ? styles.timestampUser : styles.timestampAI),
            opacity: hovered ? 1 : 0,
          }}
          aria-hidden="true"
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
