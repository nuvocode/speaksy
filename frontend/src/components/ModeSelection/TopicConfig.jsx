/**
 * @module components/ModeSelection/TopicConfig
 * Configuration panel for Topic Based mode.
 * Renders a grid of topic pills and an optional subtopic input.
 *
 * @param {{ onConfigChange: function({ topic: string, subtopic?: string }) }} props
 */

import React, { useState } from 'react';
import { TOPICS } from '../../data/topics.js';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  sectionLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-primary)',
  },
  pillGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    transition: 'all 200ms var(--ease-out)',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    outline: 'none',
    transition: 'border-color 200ms var(--ease-out)',
  },
};

/**
 * TopicConfig component.
 * @param {{ onConfigChange: function }} props
 * @returns {React.ReactElement}
 */
export default function TopicConfig({ onConfigChange }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [subtopic, setSubtopic] = useState('');

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic.id);
    onConfigChange({ topic: topic.label, subtopic: subtopic || undefined });
  };

  const handleSubtopicChange = (e) => {
    const value = e.target.value;
    setSubtopic(value);
    if (selectedTopic) {
      const topic = TOPICS.find((t) => t.id === selectedTopic);
      onConfigChange({ topic: topic.label, subtopic: value || undefined });
    }
  };

  return (
    <div style={styles.container}>
      <span style={styles.sectionLabel}>Choose a topic</span>
      <div style={styles.pillGrid} role="radiogroup" aria-label="Topic selection">
        {TOPICS.map((topic) => {
          const isActive = selectedTopic === topic.id;
          return (
            <button
              key={topic.id}
              style={{
                ...styles.pill,
                backgroundColor: isActive ? 'var(--color-ai)' : 'var(--color-surface)',
                color: isActive ? '#FFFFFF' : 'var(--color-primary)',
                borderColor: isActive ? 'var(--color-ai)' : 'var(--color-border)',
                opacity: selectedTopic && !isActive ? 0.6 : 1,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
              onClick={() => handleTopicSelect(topic)}
              role="radio"
              aria-checked={isActive}
              tabIndex={0}
            >
              <span>{topic.emoji}</span>
              <span>{topic.label}</span>
            </button>
          );
        })}
      </div>

      <input
        style={styles.input}
        type="text"
        placeholder="Add a focus area... (optional)"
        value={subtopic}
        onChange={handleSubtopicChange}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border)';
        }}
      />
    </div>
  );
}
