/**
 * @module components/ModeSelection
 * Mode selection screen — entry point of the application.
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

const MODES = [
  {
    id: 'freestyle',
    label: 'Free Style',
    description: 'Open-ended conversation on any topic',
    icon: 'MessageCircle',
    color: '--color-purple',
    hasConfig: false,
  },
  {
    id: 'topic',
    label: 'Topic Based',
    description: 'Deep dive into a specific subject',
    icon: 'BookOpen',
    color: '--color-green',
    hasConfig: true,
    configComponent: 'TopicConfig',
  },
  {
    id: 'script',
    label: 'Script Based',
    description: 'Practice with structured dialogues',
    icon: 'FileText',
    color: '--color-blue',
    hasConfig: true,
    configComponent: 'ScriptConfig',
  },
];

const CONFIG_COMPONENTS = { TopicConfig, ScriptConfig };

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: 'var(--color-bg)',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-8)',
    height: 54,
    backgroundColor: 'rgba(9,9,11,.85)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid var(--color-b1)',
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

  content: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 'var(--space-16)',
    paddingBottom: 'var(--space-10)',
    paddingLeft: 'var(--space-6)',
    paddingRight: 'var(--space-6)',
    gap: 'var(--space-8)',
  },

  greeting: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '5px 12px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--grad-dim)',
    border: '1px solid rgba(168,85,247,.2)',
    marginBottom: 'var(--space-2)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--color-purple)',
    boxShadow: '0 0 7px rgba(168,85,247,.55)',
    animation: 'pulseO2 2.5s ease-in-out infinite',
  },
  badgeText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '.1em',
    color: 'var(--color-purple)',
  },
  greetingTitle: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--weight-extrabold)',
    letterSpacing: '-0.04em',
    lineHeight: 1,
    background: 'var(--grad)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  greetingSubtitle: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-t3)',
    fontWeight: 'var(--weight-regular)',
    letterSpacing: '-0.01em',
  },

  cardsContainer: {
    display: 'flex',
    gap: 'var(--space-4)',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 900,
    width: '100%',
  },

  configPanel: {
    width: '100%',
    maxWidth: 600,
    overflow: 'hidden',
    transition: 'max-height 350ms var(--ease-out), opacity 350ms var(--ease-out)',
  },
  configInner: {
    padding: 'var(--space-6)',
    backgroundColor: 'var(--color-s1)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-b2)',
    boxShadow: 'var(--shadow-md)',
  },

  startButton: {
    padding: 'var(--space-3) var(--space-10)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--grad)',
    color: '#FFFFFF',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    cursor: 'pointer',
    transition: 'all var(--duration-normal) var(--ease-out)',
    letterSpacing: '-0.01em',
  },
};

export default function ModeSelection() {
  const wsStatus = useAppStore((s) => s.wsStatus);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const startSession = useAppStore((s) => s.startSession);

  const [selectedModeId, setSelectedModeId] = useState(null);
  const [modeConfigData, setModeConfigData] = useState(null);
  const [startBtnAnimClass, setStartBtnAnimClass] = useState('');
  const prevCanStart = useRef(false);

  const selectedMode = MODES.find((m) => m.id === selectedModeId);

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
    setModeConfigData(null);
  }, []);

  const handleConfigChange = useCallback((config) => {
    setModeConfigData(config);
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedMode || !canStart) return;
    const modeConfig = { type: selectedMode.id, label: selectedMode.label };
    if (selectedMode.id === 'topic' && modeConfigData) modeConfig.topicConfig = modeConfigData;
    else if (selectedMode.id === 'script' && modeConfigData) modeConfig.scriptConfig = modeConfigData;
    startSession(modeConfig);
  }, [selectedMode, canStart, modeConfigData, startSession]);

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
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-b3)';
              e.currentTarget.style.color = 'var(--color-t2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-b2)';
              e.currentTarget.style.color = 'var(--color-t3)';
            }}
            onMouseDown={(e) => e.currentTarget.classList.add('animate-spring-press')}
            onMouseUp={(e) => {
              const btn = e.currentTarget;
              setTimeout(() => btn.classList.remove('animate-spring-press'), 250);
            }}
            onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-spring-press')}
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────── */}
      <div style={styles.content}>
        {/* Greeting */}
        <div style={styles.greeting} className="animate-fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              <span style={styles.badgeText}>AI SPEAKING PRACTICE</span>
            </div>
          </div>
          <h1 style={styles.greetingTitle}>What shall we practice?</h1>
          <p style={styles.greetingSubtitle}>Choose a conversation mode to begin your session.</p>
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

        {/* Config Panel */}
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
              opacity: canStart ? 1 : 0.4,
              cursor: canStart ? 'pointer' : 'not-allowed',
              transform: canStart ? 'scale(1)' : 'scale(0.97)',
              boxShadow: canStart ? '0 0 24px rgba(168,85,247,.3)' : 'none',
            }}
            onClick={handleStart}
            disabled={!canStart}
            className={`animate-fade-in-up${startBtnAnimClass ? ` ${startBtnAnimClass}` : ''}`}
            onMouseEnter={(e) => {
              if (canStart) e.currentTarget.style.boxShadow = '0 0 40px rgba(168,85,247,.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = canStart ? '0 0 24px rgba(168,85,247,.3)' : 'none';
            }}
          >
            Start Conversation
          </button>
        )}
      </div>
    </div>
  );
}
