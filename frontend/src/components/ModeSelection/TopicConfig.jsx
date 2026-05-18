/**
 * @module components/ModeSelection/TopicConfig
 * Configuration panel for Topic Based mode.
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
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t4)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
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
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-b2)',
    backgroundColor: 'var(--color-s2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    color: 'var(--color-t2)',
    cursor: 'pointer',
    transition: 'all 200ms var(--ease-out)',
    outline: 'none',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  input: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-b2)',
    backgroundColor: 'var(--color-s2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-t1)',
    outline: 'none',
    transition: 'border-color 200ms var(--ease-out)',
  },
};

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
                backgroundColor: isActive ? 'rgba(168,85,247,.15)' : 'var(--color-s2)',
                color: isActive ? 'var(--color-purple)' : 'var(--color-t2)',
                borderColor: isActive ? 'rgba(168,85,247,.4)' : 'var(--color-b2)',
                opacity: selectedTopic && !isActive ? 0.5 : 1,
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
        onFocus={(e) => { e.target.style.borderColor = 'rgba(168,85,247,.5)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--color-b2)'; }}
      />
    </div>
  );
}
