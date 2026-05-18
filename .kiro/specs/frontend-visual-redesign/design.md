# Design Document: Frontend Visual Redesign

## Overview

This document describes the technical design for the Speaksy frontend visual redesign. The goal is to elevate the existing functional UI to a premium "soft but quality flow" aesthetic through glassmorphism surfaces, animated gradients, refined micro-interactions, and a cohesive design token system — without changing any functional behavior.

The redesign touches four layers:

1. **Design tokens** (`tokens.css`) — new CSS custom properties for glass, gradients, spring easing, and typography
2. **Global styles** (`globals.css`) — animated background, reduced-motion safety, accessibility baseline
3. **Animations** (`animations.css`) — new keyframes for spring press, icon pulse, view transitions, and streaming cursor
4. **Components** — targeted style updates to Header, ModeCard, MicButton, WaveAnimation, MessageBubble, Settings, Logo, ThemeToggle, and App view transitions

No new React components are introduced. No store, hook, or WebSocket logic is modified.

---

## Architecture

The redesign follows a **token-first, component-second** approach:

```
tokens.css  ──►  globals.css  ──►  animations.css
     │                │
     ▼                ▼
  Components consume tokens via CSS custom properties
  (inline styles reference var(--token-name))
```

All visual decisions are encoded as tokens. Components reference tokens, never hardcoded values. This ensures dark mode, reduced-motion, and future theme changes require only token-layer edits.

### Rendering Model

The app uses **inline React styles** (JS objects) for component-level styling, with CSS classes from `animations.css` for keyframe animations. The redesign preserves this pattern — new tokens are consumed via `var(--token)` in inline style objects, and new animation classes are added to `animations.css`.

### Glass Effect Strategy

Glassmorphism requires `backdrop-filter: blur()` which only works when the element has a semi-transparent background and sits above other content. The layering order is:

```
body gradient (z: 0)
  └── screen container (z: 1)
        ├── header glass (z: 10, position: sticky)
        ├── message list (z: 1)
        └── bottom section glass (z: 5)
              └── settings panel (z: 101, fixed)
                    └── settings overlay (z: 100, fixed)
```

---

## Components and Interfaces

### 1. `tokens.css` — New and Modified Tokens

**New tokens to add:**

```css
/* Glass surfaces */
--color-glass: rgba(255, 255, 255, 0.72)
--color-glass-border: rgba(255, 255, 255, 0.45)
--blur-glass: 16px
--shadow-glass: 0 8px 32px rgba(26,26,46,0.08), 0 1px 0 rgba(255,255,255,0.6) inset

/* Accent soft tint */
--color-accent-soft: rgba(108, 99, 255, 0.12)

/* Background gradients */
--gradient-bg-light: radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.06) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, rgba(0,200,150,0.05) 0%, transparent 50%),
                     #F8F7FF
--gradient-bg-dark:  radial-gradient(ellipse at 20% 50%, rgba(124,115,255,0.08) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, rgba(0,223,168,0.06) 0%, transparent 50%),
                     #0F0F14

/* Typography */
--text-4xl: 2.5rem
--letter-spacing-tight: -0.02em

/* Spacing */
--space-14: 56px
--space-20: 80px

/* Easing */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Dark mode additions** (inside `[data-theme="dark"]`):

```css
--color-glass: rgba(26, 26, 46, 0.72)
--color-glass-border: rgba(255, 255, 255, 0.08)
--shadow-glass: 0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset
--color-accent-soft: rgba(124, 115, 255, 0.15)
```

---

### 2. `globals.css` — Background and Motion Safety

**Animated background:** Applied to `body` using the gradient tokens. A slow `@keyframes ambientShift` animation (12s cycle) gently shifts the gradient position using `background-size` and `background-position`.

**Reduced-motion block:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Disable backdrop-filter for performance */
  .glass-surface {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
}
```

**Touch target enforcement:** All `button` elements get `min-width: 44px; min-height: 44px` via a global rule.

---

### 3. `animations.css` — New Keyframes

New keyframes to add:

| Name | Purpose |
|---|---|
| `ambientShift` | Slow background gradient drift (12s) |
| `springPress` | Scale 1→0.94→1 for button press feedback |
| `iconPulse` | Scale 1→1.15→1 for selected mode icon |
| `checkScaleIn` | Scale 0→1 for ModeCard check indicator |
| `micSpringIn` | Scale 1→0.92→1.08→1 for mic activate |
| `micSpringOut` | Scale 1→0.95→1 for mic deactivate |
| `startButtonEnable` | Scale 0.9→1.05→1 for start button enable |
| `viewExitScale` | Opacity 1→0, scale 1→0.97 for view exit |
| `viewEnterScale` | Opacity 0→1, scale 1.03→1 for view enter |
| `gradientCursor` | Soft fade for streaming cursor (replaces hard blink) |
| `logoBreathe` | Scale 1→1.02→1 for logo badge (4s) |
| `knobScale` | Scale 1→1.2→1 for ThemeToggle knob |

---

### 4. Header (ModeSelection + ConversationScreen)

**Changes to both `ModeSelection/index.jsx` and `ConversationScreen/index.jsx`:**

```js
header: {
  backgroundColor: 'var(--color-glass)',
  backdropFilter: 'blur(var(--blur-glass))',
  WebkitBackdropFilter: 'blur(var(--blur-glass))',
  borderBottom: '1px solid var(--color-glass-border)',
  boxShadow: 'var(--shadow-glass)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
}
```

Icon buttons (`iconButton`):
- `borderRadius: 'var(--radius-md)'` (was `--radius-sm`)
- `onMouseEnter`: set `backgroundColor: 'var(--color-accent-soft)'`
- `onMouseLeave`: clear background
- `onMouseDown`: add `springPress` animation class
- `onMouseUp`: remove class after 250ms

---

### 5. ModeCard (`ModeSelection/ModeCard.jsx`)

**Glass surface:**
```js
card: {
  backgroundColor: 'var(--color-glass)',
  backdropFilter: 'blur(var(--blur-glass))',
  WebkitBackdropFilter: 'blur(var(--blur-glass))',
}
```

**Icon background circle:**
```js
iconBg: {
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: `${modeColor}26`, // 15% opacity hex
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
```

**Selected state:**
- Border: gradient via `border-image` or a wrapper `::before` pseudo-element approach. Since inline styles don't support `border-image`, implement via a `box-shadow` inset + colored border using the mode color directly.
- Inner glow: `boxShadow: \`inset 0 0 20px ${modeColor}1A, var(--shadow-glass)\``
- Icon animation: add `iconPulse` class on selection

**Check indicator:**
- Add `animation: 'checkScaleIn 200ms var(--ease-spring) both'`

**Hover:**
- `translateY(-6px)` (was `-4px`)
- `boxShadow: 'var(--shadow-glass)'`

---

### 6. MicButton (`ConversationScreen/MicButton.jsx`)

**Listening state:**
```js
buttonListening: {
  background: 'var(--gradient-user)',
  boxShadow: '0 0 24px rgba(255, 107, 107, 0.4), var(--shadow-glass)',
}
```

**Idle state:**
```js
buttonIdle: {
  boxShadow: 'var(--shadow-glass)',
}
```

**Disabled state:**
```js
buttonDisabled: {
  opacity: 0.4,
  filter: 'grayscale(60%)',
}
```

**Pulse rings:** Increase from 2 to 3 rings. Third ring gets `animationDelay: '0.8s'`.

**Transition animations:**
- On `isListening` becoming `true`: apply `micSpringIn` class
- On `isListening` becoming `false`: apply `micSpringOut` class
- Use a `useEffect` watching `isListening` to toggle animation classes via a local `useState`

---

### 7. WaveAnimation (`ConversationScreen/WaveAnimation.jsx`)

**Bar count:** `ACTIVE_BAR_COUNT` increases from 9 to 13.

**Gradient fill per bar:** Replace flat `lerpColor` fill with a vertical `CanvasGradient`:
```js
const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
grad.addColorStop(0, lightenColor(barColor, 0.3)); // lighter top
grad.addColorStop(1, barColor);                    // mode color bottom
ctx.fillStyle = grad;
```

**Glow effect:**
```js
ctx.shadowBlur = isActive ? 8 : 0;
ctx.shadowColor = targetColors.start;
// draw bar
ctx.shadowBlur = 0; // reset after each bar
```

**Idle sine profile:** Replace uniform low bars with a center-peaked sine profile:
```js
// idle mode: center bars taller
const centerOffset = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
const idleProfile = 0.3 + 0.4 * (1 - centerOffset); // 0.3–0.7 range
```

**Reduced-motion:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in the draw loop. If true, throttle `requestAnimationFrame` to once per second using a timestamp check.

---

### 8. MessageBubble (`ConversationScreen/MessageBubble.jsx`)

**AI bubble:**
```js
bubbleAI: {
  backgroundColor: 'var(--color-glass)',
  backdropFilter: 'blur(var(--blur-glass))',
  WebkitBackdropFilter: 'blur(var(--blur-glass))',
  borderLeft: 'none',
  boxShadow: '-3px 0 12px rgba(0,200,150,0.15), var(--shadow-sm)',
  borderRadius: 'var(--radius-lg)',
  borderTopLeftRadius: 'var(--radius-sm)',
}
```

**User bubble:**
```js
bubbleUser: {
  background: 'var(--gradient-user)',
  borderTop: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 'var(--radius-lg)',
  borderTopRightRadius: 'var(--radius-sm)',
}
```

**Entry animations:**
- AI: `animation: 'bubbleEnterAI 350ms var(--ease-out) both'` — fade + `translateY(8px→0)`
- User: `animation: 'bubbleEnterUser 350ms var(--ease-out) both'` — fade + `translateX(16px→0)`

**Hover:** `onMouseEnter`/`onMouseLeave` toggle `boxShadow` between `--shadow-sm` and `--shadow-md`.

**Streaming cursor:** Replace `blinkCursor` with `gradientCursor` animation — a soft opacity fade (1→0.3→1) using the `--color-ai` color.

**Line height:** `lineHeight: 'var(--leading-relaxed)'` (already set in current code — verify it's `1.7`).

---

### 9. Settings Panel (`Settings/index.jsx`)

**Panel background:**
```js
panel: {
  backgroundColor: 'var(--color-glass)',
  backdropFilter: 'blur(var(--blur-glass))',
  WebkitBackdropFilter: 'blur(var(--blur-glass))',
  boxShadow: '-8px 0 32px rgba(26,26,46,0.12), var(--shadow-glass)',
}
```

**Open/close animation:** Use CSS classes instead of inline transform:
- Mount with class `settings-entering` → `translateX(100%)→0, opacity 0→1` over 350ms
- Unmount with class `settings-leaving` → `translateX(0→100%), opacity 1→0` over 250ms
- Implement via a local `isVisible` state with a delayed unmount (250ms after close signal)

**Backdrop overlay:**
```js
overlay: {
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(26, 26, 46, 0.2)',
}
```

**Close button:**
- `borderRadius: 'var(--radius-md)'`
- Hover: `backgroundColor: 'var(--color-accent-soft)'`

---

### 10. App View Transitions (`App.jsx`)

Replace the current static `view-entering` class with a proper enter/exit transition system:

```jsx
// State: 'entering' | 'visible' | 'leaving'
const [transitionState, setTransitionState] = useState('visible');
const [displayedView, setDisplayedView] = useState(currentView);

useEffect(() => {
  if (currentView !== displayedView) {
    setTransitionState('leaving');
    setTimeout(() => {
      setDisplayedView(currentView);
      setTransitionState('entering');
      setTimeout(() => setTransitionState('visible'), 350);
    }, 250);
  }
}, [currentView]);
```

CSS classes:
- `view-leaving`: `opacity 1→0, scale 1→0.97` over 250ms
- `view-entering`: `opacity 0→1, scale 1.03→1` over 350ms
- `view-visible`: no animation

Reduced-motion fallback: detect `prefers-reduced-motion` and use `opacity-only` crossfade at 150ms.

---

### 11. Logo (`shared/Logo.jsx`)

Add `logoBreathe` animation to the badge:
```js
badge: {
  animation: 'logoBreathe 4s var(--ease-in-out) infinite',
}
```

---

### 12. ThemeToggle (`shared/ThemeToggle.jsx`)

- Knob transition: change from `var(--ease-out)` to `var(--ease-spring)`
- Add `knobScale` animation on toggle activation via a local `isAnimating` state

---

### 13. ModeSelection Screen (`ModeSelection/index.jsx`)

**Greeting title:**
```js
greetingTitle: {
  fontSize: 'var(--text-4xl)',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: 'var(--letter-spacing-tight)',
}
```

**Content padding:** `paddingTop: 'var(--space-14)'`

**Start button:**
```js
startButton: {
  background: 'var(--gradient-user)',
  boxShadow: '0 4px 16px rgba(255,107,107,0.3)',
}
// hover: increase glow
// enable transition: startButtonEnable animation
```

---

## Data Models

No new data models are introduced. All changes are purely presentational:

- CSS custom properties (tokens) are the only "data" added
- Component state additions are limited to:
  - `transitionState: 'entering' | 'visible' | 'leaving'` in `App.jsx`
  - `displayedView: string` in `App.jsx`
  - `isAnimating: boolean` in `ThemeToggle.jsx` (for knob scale)
  - `animClass: string` in `MicButton.jsx` (for spring in/out)

---

## Correctness Properties

This feature is a **pure visual/CSS/animation redesign** with no business logic, data transformation, parsing, or algorithmic computation. All changes are:

- CSS token additions (declarative configuration)
- Inline style object updates (UI rendering)
- Canvas drawing enhancements (visual output only)
- CSS animation keyframe additions

Property-based testing is **not applicable** to this feature. The acceptance criteria describe visual appearance, animation behavior, and CSS property values — none of which are amenable to universal quantification over input spaces. There are no pure functions with meaningful input/output relationships to test with 100+ iterations.

Appropriate testing strategies for this feature are:

- **Visual regression tests** (e.g. Storybook + Chromatic, or Percy) to catch unintended rendering changes
- **Snapshot tests** for component render output
- **Manual accessibility audit** for contrast ratios and touch target sizes
- **Browser DevTools inspection** to verify CSS token values and `backdrop-filter` application

---

## Error Handling

Since this is a visual-only change, error handling concerns are minimal:

**`backdrop-filter` browser support:** Safari requires `-webkit-backdrop-filter`. All glass surfaces must include both `backdropFilter` and `WebkitBackdropFilter` in inline styles. Browsers that don't support it will fall back to the semi-transparent background color, which remains readable.

**Gradient text (`background-clip: text`):** Requires `-webkit-background-clip` and `-webkit-text-fill-color` for Safari. Both are included in the greeting title styles. Fallback: `color: var(--color-primary)` via the standard `color` property (overridden by `-webkit-text-fill-color` where supported).

**`prefers-reduced-motion`:** All animations must be gated. The global CSS block handles keyframe animations. The `WaveAnimation` canvas loop must additionally check `window.matchMedia` at runtime to throttle redraws.

**Canvas gradient on zero-height bars:** Guard against `barHeight === 0` before creating a `LinearGradient` to avoid a degenerate gradient that throws in some browsers.

**View transition timing:** The `setTimeout`-based transition in `App.jsx` must be cleaned up on unmount via `useEffect` cleanup to prevent state updates on unmounted components.

---

## Testing Strategy

Since PBT does not apply to this feature, testing focuses on:

### Visual Regression Tests
- Capture screenshots of ModeSelection and ConversationScreen in both light and dark themes
- Compare against baseline after each change
- Tools: Storybook + Chromatic, or Playwright visual comparisons

### Snapshot Tests
- Render each modified component with React Testing Library
- Assert that key CSS class names and `style` prop values are present
- Verify `aria-label`, `role`, and `aria-live` attributes are unchanged

### Manual Checks
- Verify `backdrop-filter` renders correctly in Chrome, Firefox, and Safari
- Verify gradient text renders in Chrome and Safari
- Verify `prefers-reduced-motion` disables animations (use DevTools emulation)
- Verify dark mode token overrides apply correctly
- Verify touch targets are ≥ 44×44px using DevTools accessibility inspector

### Accessibility Checks
- Use browser DevTools color contrast checker on glass surfaces
- Verify all existing `aria-label`, `role`, and `aria-live` attributes are preserved
- Keyboard navigation: tab through all interactive elements and confirm focus rings are visible
