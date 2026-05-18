/**
 * @module components/shared/ThemeToggle
 * Minimal icon button for theme switching — dark-first design.
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useAppStore from '../../store/appStore.js';

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    minWidth: 36,
    minHeight: 36,
    padding: 0,
    background: 'var(--color-s2)',
    border: '1px solid var(--color-b2)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-t3)',
    transition: 'all var(--duration-fast) var(--ease-out)',
  },
};

export default function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      style={styles.button}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-b3)';
        e.currentTarget.style.color = 'var(--color-t2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-b2)';
        e.currentTarget.style.color = 'var(--color-t3)';
      }}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
