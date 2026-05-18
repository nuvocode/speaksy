/**
 * @module components/ConversationScreen/WaveAnimation
 * Canvas-based real-time audio wave visualisation.
 *
 * Modes:
 *   - idle: gentle sine wave, muted color
 *   - user: dynamic bars linked to audioLevel, coral gradient
 *   - ai: dynamic bars linked to audioLevel, teal gradient
 *
 * Uses requestAnimationFrame for smooth 60fps rendering.
 * Properly cleans up animation frames and resize observers.
 *
 * @param {{ isActive: boolean, color: string, audioLevel: number, mode: 'user'|'ai'|'idle' }} props
 */

import React, { useRef, useEffect, useCallback } from 'react';

/** Number of bars in each mode */
const IDLE_BAR_COUNT = 5;
const ACTIVE_BAR_COUNT = 13; // Task 7.1: increased from 9 to 13

/** Bar visual settings */
const BAR_WIDTH = 4;
const BAR_GAP = 6;
const BAR_MIN_HEIGHT_RATIO = 0.15;
const BAR_CORNER_RADIUS = 2;

/** Phase speed per frame */
const PHASE_SPEED_IDLE = 0.015;
const PHASE_SPEED_ACTIVE = 0.04;

/** Color config per mode — fallback values, overridden by CSS tokens */
const MODE_COLORS = {
  idle: { start: '#EBEBF0', end: '#D1D1DB' },
  user: { start: '#FF6B6B', end: '#FF8E53' },
  ai: { start: '#00C896', end: '#00E5B0' },
};

/**
 * Read a CSS custom property value from :root.
 * @param {string} prop — e.g. '--color-ai'
 * @returns {string} trimmed value or empty string
 */
function getCSSVar(prop) {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
}

/**
 * Build mode colors from CSS tokens (dynamic — respects dark mode).
 * Falls back to hardcoded MODE_COLORS if CSS vars are unavailable.
 * @returns {Object}
 */
function getDynamicModeColors() {
  const border = getCSSVar('--color-border') || MODE_COLORS.idle.start;
  const muted = getCSSVar('--color-muted') || MODE_COLORS.idle.end;
  const user = getCSSVar('--color-user') || MODE_COLORS.user.start;
  const userEnd = getCSSVar('--color-warning') || MODE_COLORS.user.end;
  const ai = getCSSVar('--color-ai') || MODE_COLORS.ai.start;
  const aiEnd = getCSSVar('--color-success') || MODE_COLORS.ai.end;

  return {
    idle: { start: border, end: muted },
    user: { start: user, end: userEnd },
    ai: { start: ai, end: aiEnd },
  };
}

/**
 * Linearly interpolate between two hex colors.
 * @param {string} colorA — hex color
 * @param {string} colorB — hex color
 * @param {number} t — 0 to 1
 * @returns {string} interpolated hex color
 */
function lerpColor(colorA, colorB, t) {
  const a = parseInt(colorA.slice(1), 16);
  const b = parseInt(colorB.slice(1), 16);

  const rA = (a >> 16) & 0xff, gA = (a >> 8) & 0xff, bA = a & 0xff;
  const rB = (b >> 16) & 0xff, gB = (b >> 8) & 0xff, bB = b & 0xff;

  const r = Math.round(rA + (rB - rA) * t);
  const g = Math.round(gA + (gB - gA) * t);
  const bC = Math.round(bA + (bB - bA) * t);

  return `#${((r << 16) | (g << 8) | bC).toString(16).padStart(6, '0')}`;
}

/**
 * Smoothly interpolate between two values.
 * @param {number} current
 * @param {number} target
 * @param {number} speed — 0 to 1
 * @returns {number}
 */
function lerp(current, target, speed) {
  return current + (target - current) * speed;
}

/**
 * Task 7.2: Lighten a hex color by adding a fixed amount to each channel.
 * @param {string} hex — hex color string (e.g. '#FF6B6B')
 * @param {number} amount — 0 to 1, fraction of 255 to add
 * @returns {string} rgb(...) color string
 */
function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * WaveAnimation component.
 * @param {{ isActive?: boolean, audioLevel?: number, mode?: 'user'|'ai'|'idle' }} props
 * @returns {React.ReactElement}
 */
export default function WaveAnimation({ isActive = false, audioLevel = 0, mode = 'idle' }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);
  const currentColorRef = useRef({ start: MODE_COLORS.idle.start, end: MODE_COLORS.idle.end });
  const smoothLevelRef = useRef(0);
  // Task 7.5: timestamp guard for reduced-motion throttling
  const lastDrawTimeRef = useRef(0);

  /**
   * Main draw loop — called via requestAnimationFrame.
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Task 7.5: prefers-reduced-motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const now = performance.now();
    if (prefersReducedMotion && now - lastDrawTimeRef.current < 1000) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }
    lastDrawTimeRef.current = now;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    /* Resize canvas for retina if needed */
    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    /* Clear */
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    /* Determine current mode */
    const effectiveMode = isActive ? mode : 'idle';
    const barCount = effectiveMode === 'idle' ? IDLE_BAR_COUNT : ACTIVE_BAR_COUNT;
    const phaseSpeed = effectiveMode === 'idle' ? PHASE_SPEED_IDLE : PHASE_SPEED_ACTIVE;

    /* Smooth color transition — read dynamic colors from CSS tokens */
    const dynamicColors = getDynamicModeColors();
    const targetColors = dynamicColors[effectiveMode] || dynamicColors.idle;
    currentColorRef.current.start = lerpColor(currentColorRef.current.start, targetColors.start, 0.08);
    currentColorRef.current.end = lerpColor(currentColorRef.current.end, targetColors.end, 0.08);

    /* Smooth audio level */
    const targetLevel = effectiveMode === 'idle' ? 0.2 : audioLevel;
    smoothLevelRef.current = lerp(smoothLevelRef.current, targetLevel, 0.12);
    const level = smoothLevelRef.current;

    /* Advance phase */
    phaseRef.current += phaseSpeed;

    /* Calculate bar positions */
    const totalWidth = barCount * BAR_WIDTH + (barCount - 1) * BAR_GAP;
    const startX = (displayWidth - totalWidth) / 2;
    const centerY = displayHeight / 2;
    const maxBarHeight = displayHeight * 0.7;

    /* Draw bars */
    for (let i = 0; i < barCount; i++) {
      const x = startX + i * (BAR_WIDTH + BAR_GAP);

      /* Each bar oscillates at a unique phase offset */
      const offset = (i / barCount) * Math.PI * 2;
      const sinVal = Math.sin(phaseRef.current + offset);
      const amplitude = BAR_MIN_HEIGHT_RATIO + (1 - BAR_MIN_HEIGHT_RATIO) * level;

      // Task 7.4: center-peaked sine idle profile
      let barHeight;
      if (effectiveMode === 'idle') {
        const centerOffset = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const idleProfile = 0.3 + 0.4 * (1 - centerOffset); // 0.3–0.7 range
        barHeight = maxBarHeight * amplitude * idleProfile * (0.4 + 0.6 * Math.abs(sinVal));
      } else {
        barHeight = maxBarHeight * amplitude * (0.4 + 0.6 * Math.abs(sinVal));
      }

      /* Color for this bar position */
      const t = i / (barCount - 1 || 1);
      const barColor = lerpColor(currentColorRef.current.start, currentColorRef.current.end, t);

      const y = centerY - barHeight / 2;

      // Task 7.3: glow effect when active
      if (isActive) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = barColor;
      }

      // Task 7.2: vertical gradient fill per bar (guard against zero-height bars)
      if (barHeight > 0) {
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, lightenColor(barColor, 0.3)); // lighter top
        grad.addColorStop(1, barColor);                    // mode color bottom
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = barColor;
      }

      ctx.beginPath();

      /* Rounded rectangle */
      const r = Math.min(BAR_CORNER_RADIUS, BAR_WIDTH / 2, barHeight / 2);

      ctx.moveTo(x + r, y);
      ctx.lineTo(x + BAR_WIDTH - r, y);
      ctx.quadraticCurveTo(x + BAR_WIDTH, y, x + BAR_WIDTH, y + r);
      ctx.lineTo(x + BAR_WIDTH, y + barHeight - r);
      ctx.quadraticCurveTo(x + BAR_WIDTH, y + barHeight, x + BAR_WIDTH - r, y + barHeight);
      ctx.lineTo(x + r, y + barHeight);
      ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);

      ctx.fill();

      // Task 7.3: reset shadow after each bar
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [isActive, mode, audioLevel]);

  /**
   * Start/restart the animation loop.
   */
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  /**
   * Handle canvas resize via ResizeObserver.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      /* Canvas will resize on next draw frame */
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 80,
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
}
