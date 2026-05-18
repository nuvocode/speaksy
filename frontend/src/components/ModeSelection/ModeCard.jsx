/**
 * @module components/ModeSelection/ModeCard
 * Individual mode card — Nuvo Code dark design language.
 *
 * @param {{ mode: Object, isSelected: boolean, onSelect: function }} props
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, BookOpen, FileText, Check } from 'lucide-react';

const ICON_MAP = { MessageCircle, BookOpen, FileText };

const styles = {
  card: {
    position: 'relative',
    flex: '1 1 0',
    minHeight: 180,
    maxWidth: 280,
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-xl)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    backgroundColor: 'var(--color-s1)',
    border: '1px solid var(--color-b2)',
    transition: 'all 250ms var(--ease-out)',
    outline: 'none',
    textAlign: 'center',
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--color-t1)',
    lineHeight: 'var(--leading-tight)',
    letterSpacing: '-0.01em',
  },
  description: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-t3)',
    lineHeight: 'var(--leading-normal)',
  },
  check: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default function ModeCard({ mode, isSelected, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const [iconAnimClass, setIconAnimClass] = useState('');

  const IconComponent = ICON_MAP[mode.icon] || MessageCircle;
  const modeColor = `var(${mode.color})`;

  useEffect(() => {
    if (isSelected) {
      setIconAnimClass('animate-icon-pulse');
      const timer = setTimeout(() => setIconAnimClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const cardStyle = {
    ...styles.card,
    borderColor: isSelected
      ? modeColor
      : isHovered
        ? 'var(--color-b3)'
        : 'var(--color-b2)',
    boxShadow: isSelected
      ? `0 0 0 1px ${modeColor}44, 0 0 32px ${modeColor}18, var(--shadow-md)`
      : isHovered
        ? '0 0 0 1px var(--color-b3), var(--shadow-md)'
        : 'none',
    transform: isSelected
      ? 'translateY(-4px)'
      : isHovered
        ? 'translateY(-6px)'
        : 'translateY(0)',
    animation: isSelected ? 'cardSelectBounce 200ms var(--ease-out)' : undefined,
  };

  const iconBgStyle = {
    width: 52,
    height: 52,
    borderRadius: 'var(--radius-md)',
    background: `${modeColor}18`,
    border: `1px solid ${modeColor}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

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
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(mode.id); }
      }}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${mode.label}: ${mode.description}`}
      tabIndex={0}
    >
      {isSelected && (
        <span style={checkStyle}>
          <Check size={12} color="#FFFFFF" />
        </span>
      )}

      <div style={iconBgStyle} className={iconAnimClass}>
        <IconComponent size={24} color={modeColor} />
      </div>

      <span style={styles.label}>{mode.label}</span>
      <span style={styles.description}>{mode.description}</span>
    </button>
  );
}
