/**
 * @module components/ModeSelection/ModeCard
 * Individual mode card for the selection screen.
 *
 * @param {{ mode: Object, isSelected: boolean, onSelect: function }} props
 */

import React, { useState } from 'react';
import { MessageCircle, BookOpen, FileText, Check } from 'lucide-react';

/** Map icon name strings to lucide-react components */
const ICON_MAP = {
  MessageCircle,
  BookOpen,
  FileText,
};

const styles = {
  card: {
    position: 'relative',
    flex: '1 1 0',
    minHeight: 180,
    maxWidth: 280,
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    border: '2px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 250ms var(--ease-out)',
    outline: 'none',
    textAlign: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    transition: 'color 250ms var(--ease-out)',
  },
  label: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-primary)',
    lineHeight: 'var(--leading-tight)',
  },
  description: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-muted)',
    lineHeight: 'var(--leading-normal)',
  },
  check: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 250ms var(--ease-out)',
  },
};

/**
 * ModeCard component.
 * @param {{ mode: Object, isSelected: boolean, onSelect: function }} props
 * @returns {React.ReactElement}
 */
export default function ModeCard({ mode, isSelected, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = ICON_MAP[mode.icon] || MessageCircle;
  const modeColor = `var(${mode.color})`;

  const cardStyle = {
    ...styles.card,
    borderColor: isSelected ? modeColor : 'var(--color-border)',
    boxShadow: isSelected || isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    transform: isSelected
      ? 'translateY(-4px)'
      : isHovered
        ? 'translateY(-2px)'
        : 'translateY(0)',
    animation: isSelected ? 'cardSelectBounce 200ms var(--ease-out)' : undefined,
  };

  return (
    <button
      style={cardStyle}
      onClick={() => onSelect(mode.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(mode.id);
        }
      }}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${mode.label}: ${mode.description}`}
      tabIndex={0}
    >
      {/* Check mark for selected */}
      {isSelected && (
        <span style={{ ...styles.check, backgroundColor: modeColor }}>
          <Check size={14} color="#FFFFFF" />
        </span>
      )}

      <IconComponent size={32} color={modeColor} style={styles.icon} />
      <span style={styles.label}>{mode.label}</span>
      <span style={styles.description}>{mode.description}</span>
    </button>
  );
}
