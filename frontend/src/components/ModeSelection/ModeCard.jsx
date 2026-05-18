/**
 * @module components/ModeSelection/ModeCard
 * Individual mode card for the selection screen.
 *
 * @param {{ mode: Object, isSelected: boolean, onSelect: function }} props
 */

import React, { useState, useEffect } from 'react';
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
    // 5.1: glass surface
    backgroundColor: 'var(--color-glass)',
    backdropFilter: 'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
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
  // 5.5: icon pulse animation class
  const [iconAnimClass, setIconAnimClass] = useState('');

  const IconComponent = ICON_MAP[mode.icon] || MessageCircle;
  const modeColor = `var(${mode.color})`;

  // 5.5: trigger iconPulse when card becomes selected
  useEffect(() => {
    if (isSelected) {
      setIconAnimClass('animate-icon-pulse');
      const timer = setTimeout(() => setIconAnimClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  // 5.3: hover → translateY(-6px) + shadow-glass
  // 5.4: selected → colored border + inset glow
  const cardStyle = {
    ...styles.card,
    borderColor: isSelected ? modeColor : 'var(--color-border)',
    // 5.4: selected border and inset glow
    border: isSelected
      ? `2px solid ${modeColor}`
      : '2px solid var(--color-border)',
    boxShadow: isSelected
      ? `inset 0 0 20px color-mix(in srgb, ${modeColor} 10%, transparent), var(--shadow-glass)`
      : isHovered
        ? 'var(--shadow-glass)'
        : 'var(--shadow-sm)',
    // 5.3: hover lift increased to -6px
    transform: isSelected
      ? 'translateY(-4px)'
      : isHovered
        ? 'translateY(-6px)'
        : 'translateY(0)',
    animation: isSelected ? 'cardSelectBounce 200ms var(--ease-out)' : undefined,
  };

  // 5.2: icon background circle — 56×56px, mode color at 15% opacity
  const iconBgStyle = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: `color-mix(in srgb, ${modeColor} 15%, transparent)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // 5.6: check indicator animation
  const checkStyle = {
    ...styles.check,
    backgroundColor: modeColor,
    animation: 'checkScaleIn 200ms var(--ease-spring) both',
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
      {/* 5.6: Check mark for selected with checkScaleIn animation */}
      {isSelected && (
        <span style={checkStyle}>
          <Check size={14} color="#FFFFFF" />
        </span>
      )}

      {/* 5.2: Icon wrapped in background circle */}
      <div style={iconBgStyle} className={iconAnimClass}>
        <IconComponent size={32} color={modeColor} style={styles.icon} />
      </div>

      <span style={styles.label}>{mode.label}</span>
      <span style={styles.description}>{mode.description}</span>
    </button>
  );
}
