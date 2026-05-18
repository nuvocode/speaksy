/**
 * @module components/ModeSelection
 * Mode selection screen — entry point of the application.
 * Users choose between Free Style, Topic Based, and Script Based modes.
 *
 * Architecture: Data-driven — add new modes by appending to the MODES array.
 * Each mode with hasConfig: true requires a matching configComponent.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import Logo from '../shared/Logo.jsx';
import StatusIndicator from '../shared/StatusIndicator.jsx';
import ThemeToggle from '../shared/ThemeToggle.jsx';
import ModeCard from './ModeCard.jsx';
import TopicConfig from './TopicConfig.jsx';
import ScriptConfig from './ScriptConfig.jsx';

/**
 * Mode definitions — data-driven, extensible array.
 * To add a new mode, append an object here and create its config component.
 */
const MODES = [
  {
    id: 'freestyle',
    label: 'Free Style',
    description: 'Open-ended conversation on any topic',
    icon: 'MessageCircle',
    color: '--color-accent',
    hasConfig: false,
  },
  {
    id: 'topic',
    label: 'Topic Based',
    description: 'Deep dive into a specific subject',
    icon: 'BookOpen',
    color: '--color-ai',
    hasConfig: true,
    configComponent: 'TopicConfig',
  },
  {
    id: 'script',
    label: 'Script Based',
    description: 'Practice with structured dialogues',
    icon: 'FileText',
    color: '--color-user',
    hasConfig: true,
    configComponent: 'ScriptConfig',
  },
];

/** Map config component names to actual components */
const CONFIG_COMPONENTS = {
  TopicConfig,
  ScriptConfig,
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: 'var(--color-bg)',
    overflow: 'hidden',
  },

  /* ── Header ────────────────────────────────── */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-4) var(--space-6)',
    backgroundColor: 'var(--color-glass)',
    backdropFilter: 'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
    borderBottom: '1px solid var(--color-glass-border)',
    boxShadow: 'var(--shadow-glass)',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  headerCenter: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    padding: 0,
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-muted)',
    transition: 'all var(--duration-fast) var(--ease-out)',
  },

  /* ── Content ───────────────────────────────── */
  content: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 'var(--space-14)',
    paddingBottom: 'var(--space-10)',
    paddingLeft: 'var(--space-6)',
    paddingRight: 'var(--space-6)',
    gap: 'var(--space-8)',
  },
  greeting: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  greetingTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--weight-bold)',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: 'var(--letter-spacing-tight)',
    lineHeight: 'var(--leading-tight)',
  },
  greetingSubtitle: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-lg)',
    color: 'var(--color-muted)',
    fontWeight: 'var(--weight-regular)',
  },

  /* ── Cards ─────────────────────────────────── */
  cardsContainer: {
    display: 'flex',
    gap: 'var(--space-4)',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 900,
    width: '100%',
  },

  /* ── Config Panel ──────────────────────────── */
  configPanel: {
    width: '100%',
    maxWidth: 600,
    overflow: 'hidden',
    transition: 'max-height 350ms var(--ease-out), opacity 350ms var(--ease-out)',
  },
  configInner: {
    padding: 'var(--space-6)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  },

  /* ── Start Button ──────────────────────────── */
  startButton: {
    padding: 'var(--space-4) var(--space-8)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--gradient-user)',
    color: '#FFFFFF',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--weight-semibold)',
    cursor: 'pointer',
    transition: 'all 250ms var(--ease-out)',
    boxShadow: 'var(--shadow-sm)',
  },
};

/**
 * ModeSelection screen component.
 * @returns {React.ReactElement}
 */
export default function ModeSelection() {
  const wsStatus = useAppStore((s) => s.wsStatus);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const startSession = useAppStore((s) => s.startSession);

  const [selectedModeId, setSelectedModeId] = useState(null);
  const [modeConfigData, setModeConfigData] = useState(null);
  const [startBtnAnimClass, setStartBtnAnimClass] = useState('');
  const prevCanStart = useRef(false);

  const selectedMode = MODES.find((m) => m.id === selectedModeId);

  /** Whether the start button should be enabled */
  const canStart = (() => {
    if (!selectedMode) return false;
    if (!selectedMode.hasConfig) return true;
    return modeConfigData !== null;
  })();

  useEffect(() => {
    if (canStart && !prevCanStart.current) {
      setStartBtnAnimClass('animate-start-button-enable');
      setTimeout(() => setStartBtnAnimClass(''), 400);
    }
    prevCanStart.current = canStart;
  }, [canStart]);

  const handleModeSelect = useCallback((modeId) => {
    setSelectedModeId(modeId);
    setModeConfigData(null); // reset config when switching modes
  }, []);

  const handleConfigChange = useCallback((config) => {
    setModeConfigData(config);
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedMode || !canStart) return;

    /** @type {ModeConfig} */
    const modeConfig = {
      type: selectedMode.id,
      label: selectedMode.label,
    };

    if (selectedMode.id === 'topic' && modeConfigData) {
      modeConfig.topicConfig = modeConfigData;
    } else if (selectedMode.id === 'script' && modeConfigData) {
      modeConfig.scriptConfig = modeConfigData;
    }

    startSession(modeConfig);
  }, [selectedMode, canStart, modeConfigData, startSession]);

  /** Render the config component for the selected mode */
  const renderConfig = () => {
    if (!selectedMode?.hasConfig || !selectedMode.configComponent) return null;
    const ConfigComponent = CONFIG_COMPONENTS[selectedMode.configComponent];
    if (!ConfigComponent) return null;
    return <ConfigComponent onConfigChange={handleConfigChange} />;
  };

  const showConfig = selectedMode?.hasConfig;

  return (
    <div style={styles.container}>
      {/* ── Header ─────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Logo />
        </div>

        <div style={styles.headerCenter}>
          <StatusIndicator status={wsStatus} />
        </div>

        <div style={styles.headerRight}>
          <ThemeToggle />
          <button
            style={styles.iconButton}
            onClick={toggleSettings}
            aria-label="Open settings"
            title="Settings"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-soft)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            onMouseDown={(e) => {
              e.currentTarget.classList.add('animate-spring-press');
            }}
            onMouseUp={(e) => {
              const btn = e.currentTarget;
              setTimeout(() => btn.classList.remove('animate-spring-press'), 250);
            }}
            onAnimationEnd={(e) => { e.currentTarget.classList.remove('animate-spring-press'); }}
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────── */}
      <div style={styles.content}>
        {/* Greeting */}
        <div style={styles.greeting} className="animate-fade-in-up">
          <h1 style={styles.greetingTitle}>Welcome back.</h1>
          <p style={styles.greetingSubtitle}>What shall we practice today?</p>
        </div>

        {/* Mode Cards */}
        <div style={styles.cardsContainer} role="radiogroup" aria-label="Conversation mode">
          {MODES.map((mode, index) => (
            <div
              key={mode.id}
              className={`animate-fade-in-up stagger-${index}`}
              style={{ flex: '1 1 0', display: 'flex', minWidth: 200, maxWidth: 280 }}
            >
              <ModeCard
                mode={mode}
                isSelected={selectedModeId === mode.id}
                onSelect={handleModeSelect}
              />
            </div>
          ))}
        </div>

        {/* Config Panel (expandable) */}
        <div
          style={{
            ...styles.configPanel,
            maxHeight: showConfig ? 500 : 0,
            opacity: showConfig ? 1 : 0,
            pointerEvents: showConfig ? 'auto' : 'none',
          }}
        >
          <div style={styles.configInner}>
            {renderConfig()}
          </div>
        </div>

        {/* Start Button */}
        {selectedMode && (
          <button
            style={{
              ...styles.startButton,
              opacity: canStart ? 1 : 0.5,
              cursor: canStart ? 'pointer' : 'not-allowed',
              transform: canStart ? 'scale(1)' : 'scale(0.97)',
            }}
            onClick={handleStart}
            disabled={!canStart}
            className={`animate-fade-in-up${startBtnAnimClass ? ` ${startBtnAnimClass}` : ''}`}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,107,107,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            Start Conversation
          </button>
        )}
      </div>
    </div>
  );
}
