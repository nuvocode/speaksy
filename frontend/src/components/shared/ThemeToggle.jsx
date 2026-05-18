/**
 * @module components/shared/ThemeToggle
 * Pill-shaped toggle switch for dark/light theme.
 * Placed in the header alongside the settings icon.
 *
 * Uses data-theme attribute on <html> for CSS-driven theming.
 */

import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import useAppStore from '../../store/appStore.js';

const TOGGLE_W = 48;
const TOGGLE_H = 26;
const KNOB_SIZE = 20;
const KNOB_OFFSET = 3;

const styles = {
  toggle: {
    position: 'relative',
    width: TOGGLE_W,
    height: TOGGLE_H,
    borderRadius: TOGGLE_H / 2,
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'background 300ms var(--ease-out), box-shadow 300ms var(--ease-out)',
    flexShrink: 0,
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 300ms var(--ease-spring)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  icon: {
    transition: 'transform 300ms var(--ease-out), opacity 300ms var(--ease-out)',
  },
};

/**
 * ThemeToggle component.
 * @returns {React.ReactElement}
 */
export default function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    toggleTheme();
  };

  const toggleBg = isDark
    ? 'linear-gradient(135deg, #2D2D5E, #1A1A3E)'
    : 'linear-gradient(135deg, #FFB347, #FF8C00)';

  const knobTranslate = isDark
    ? `translateX(${TOGGLE_W - KNOB_SIZE - KNOB_OFFSET}px)`
    : `translateX(${KNOB_OFFSET}px)`;

  return (
    <button
      style={{
        ...styles.toggle,
        background: toggleBg,
      }}
      onClick={handleToggle}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        style={{
          ...styles.knob,
          transform: knobTranslate,
          ...(isAnimating && { animation: 'knobScale 300ms var(--ease-spring) both' }),
        }}
      >
        {isDark ? (
          <Moon
            size={12}
            color="#2D2D5E"
            style={{
              ...styles.icon,
              transform: 'rotate(0deg) scale(1)',
            }}
          />
        ) : (
          <Sun
            size={12}
            color="#FF8C00"
            style={{
              ...styles.icon,
              transform: 'rotate(0deg) scale(1)',
            }}
          />
        )}
      </span>
    </button>
  );
}
