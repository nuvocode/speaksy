/**
 * @module components/ConversationScreen/MessageBubble
 * Chat message bubble — Nuvo Code dark design language.
 *   - AI messages: left-aligned, dark glass surface, green left-border accent
 *   - User messages: right-aligned, purple-pink gradient
 *
 * @param {{ message: { id, role, text, timestamp, isStreaming } }} props
 */

import React, { useState } from 'react';

const styles = {
  wrapper: {
    display: 'flex',
    width: '100%',
    marginBottom: 'var(--space-3)',
  },
  wrapperUser: { justifyContent: 'flex-end' },
  wrapperAI: { justifyContent: 'flex-start' },

  bubble: {
    position: 'relative',
    maxWidth: '80%',
    padding: 'var(--space-3) var(--space-4)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
    wordBreak: 'break-word',
  },
  bubbleAI: {
    backgroundColor: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    borderLeft: '3px solid var(--color-green)',
    color: 'var(--color-t1)',
    borderRadius: 'var(--radius-md)',
    borderTopLeftRadius: 'var(--radius-sm)',
    boxShadow: '-4px 0 16px rgba(74,222,128,.08)',
    animation: 'bubbleEnterAI 350ms var(--ease-out) both',
  },
  bubbleUser: {
    background: 'var(--grad)',
    color: '#FFFFFF',
    borderRadius: 'var(--radius-md)',
    borderTopRightRadius: 'var(--radius-sm)',
    boxShadow: '0 4px 20px rgba(168,85,247,.25)',
    animation: 'bubbleEnterUser 350ms var(--ease-out) both',
  },
  cursor: {
    display: 'inline-block',
    width: 2,
    height: '1em',
    backgroundColor: 'var(--color-green)',
    marginLeft: 2,
    verticalAlign: 'text-bottom',
    animation: 'gradientCursor 1.2s ease-in-out infinite',
  },
  timestamp: {
    position: 'absolute',
    bottom: -20,
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-t4)',
    whiteSpace: 'nowrap',
    opacity: 0,
    transition: 'opacity var(--duration-fast) var(--ease-out)',
    pointerEvents: 'none',
    letterSpacing: '0.04em',
  },
  timestampAI: { left: 0 },
  timestampUser: { right: 0 },
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.role === 'user';

  const hoverShadow = isUser
    ? '0 4px 28px rgba(168,85,247,.4)'
    : '-4px 0 20px rgba(74,222,128,.12)';

  const baseShadow = isUser
    ? '0 4px 20px rgba(168,85,247,.25)'
    : '-4px 0 16px rgba(74,222,128,.08)';

  return (
    <div style={{ ...styles.wrapper, ...(isUser ? styles.wrapperUser : styles.wrapperAI) }}>
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.bubbleUser : styles.bubbleAI),
          boxShadow: isHovered ? hoverShadow : baseShadow,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="article"
        aria-label={`${isUser ? 'Your' : 'AI'} message`}
      >
        {message.text}
        {message.isStreaming && <span style={styles.cursor} aria-hidden="true" />}

        <span
          style={{
            ...styles.timestamp,
            ...(isUser ? styles.timestampUser : styles.timestampAI),
            opacity: isHovered ? 1 : 0,
          }}
          aria-hidden="true"
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
