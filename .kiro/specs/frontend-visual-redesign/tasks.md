# Tasks

## Task List

- [x] 1. Extend design tokens in `tokens.css`
  - [x] 1.1 Add glass surface tokens: `--color-glass`, `--color-glass-border`, `--blur-glass`, `--shadow-glass`
  - [x] 1.2 Add `--color-accent-soft` token
  - [x] 1.3 Add background gradient tokens: `--gradient-bg-light`, `--gradient-bg-dark`
  - [x] 1.4 Add typography tokens: `--text-4xl`, `--letter-spacing-tight`
  - [x] 1.5 Add spacing tokens: `--space-14`, `--space-20`
  - [x] 1.6 Add `--ease-spring` easing token
  - [x] 1.7 Add dark mode overrides for all new glass and gradient tokens inside `[data-theme="dark"]`

- [x] 2. Update `globals.css` with animated background and motion safety
  - [x] 2.1 Apply `--gradient-bg-light` / `--gradient-bg-dark` to `body` background
  - [x] 2.2 Add `ambientShift` keyframe and apply it to `body` with a 12s cycle
  - [x] 2.3 Add `@media (prefers-reduced-motion: reduce)` block that sets all animation/transition durations to `0.01ms` and disables `backdrop-filter`
  - [x] 2.4 Add global `button` rule enforcing `min-width: 44px; min-height: 44px` for touch targets

- [x] 3. Add new keyframes to `animations.css`
  - [x] 3.1 Add `ambientShift` keyframe (slow gradient drift)
  - [x] 3.2 Add `springPress` keyframe (scale 1→0.94→1) and `.animate-spring-press` utility class
  - [x] 3.3 Add `iconPulse` keyframe (scale 1→1.15→1) and `.animate-icon-pulse` utility class
  - [x] 3.4 Add `checkScaleIn` keyframe (scale 0→1) and `.animate-check-scale-in` utility class
  - [x] 3.5 Add `micSpringIn` keyframe (scale 1→0.92→1.08→1) and `micSpringOut` (scale 1→0.95→1) keyframes with utility classes
  - [x] 3.6 Add `startButtonEnable` keyframe (scale 0.9→1.05→1) and utility class
  - [x] 3.7 Add `viewExitScale` (opacity 1→0, scale 1→0.97) and `viewEnterScale` (opacity 0→1, scale 1.03→1) keyframes with `.view-leaving` and `.view-entering` utility classes
  - [x] 3.8 Add `gradientCursor` keyframe (opacity 1→0.3→1 soft fade) replacing hard blink
  - [x] 3.9 Add `logoBreathe` keyframe (scale 1→1.02→1, 4s) and utility class
  - [x] 3.10 Add `knobScale` keyframe (scale 1→1.2→1) and utility class
  - [x] 3.11 Add `settingsEnter` (translateX 100%→0, opacity 0→1) and `settingsLeave` (translateX 0→100%, opacity 1→0) keyframes with utility classes
  - [x] 3.12 Add `bubbleEnterAI` (opacity 0→1, translateY 8px→0) and `bubbleEnterUser` (opacity 0→1, translateX 16px→0) keyframes

- [x] 4. Apply glassmorphism to both screen headers
  - [x] 4.1 Update `ModeSelection/index.jsx` header styles: set `backgroundColor: 'var(--color-glass)'`, `backdropFilter`, `borderBottom` to `--color-glass-border`, `boxShadow` to `--shadow-glass`, `position: 'sticky'`, `zIndex: 10`
  - [x] 4.2 Update `ConversationScreen/index.jsx` header styles with the same glass properties
  - [x] 4.3 Update icon button styles in both headers: change `borderRadius` to `--radius-md`, add hover background `--color-accent-soft`, add `springPress` animation on `mousedown`

- [x] 5. Redesign ModeCard with glass surface and premium interactions
  - [x] 5.1 Update `ModeCard.jsx` card background to `--color-glass` with `backdropFilter`
  - [x] 5.2 Add icon background circle element (56×56px, mode color at 15% opacity, `border-radius: 50%`) wrapping the icon
  - [x] 5.3 Update hover state: `translateY(-6px)`, `boxShadow: 'var(--shadow-glass)'`
  - [x] 5.4 Update selected state: colored border using mode color, inset glow via `box-shadow`
  - [x] 5.5 Add `iconPulse` animation to icon when card becomes selected (via `useEffect` on `isSelected`)
  - [x] 5.6 Add `checkScaleIn` animation to the check indicator span

- [x] 6. Upgrade MicButton with layered pulse and spring animations
  - [x] 6.1 Update listening state style: use `background: 'var(--gradient-user)'`, add ambient glow `boxShadow`
  - [x] 6.2 Update idle state style: add `boxShadow: 'var(--shadow-glass)'`
  - [x] 6.3 Update disabled state style: `opacity: 0.4`, `filter: 'grayscale(60%)'`
  - [x] 6.4 Increase pulse ring count from 2 to 3, add third ring with `animationDelay: '0.8s'`
  - [x] 6.5 Add `useEffect` watching `isListening` to apply `micSpringIn` class on activate and `micSpringOut` on deactivate via local `animClass` state

- [x] 7. Enhance WaveAnimation with gradient bars, glow, and idle sine profile
  - [x] 7.1 Increase `ACTIVE_BAR_COUNT` constant from 9 to 13
  - [x] 7.2 Replace flat `lerpColor` fill with a vertical `CanvasGradient` per bar (lighter top, mode color bottom)
  - [x] 7.3 Add `ctx.shadowBlur` / `ctx.shadowColor` glow effect per bar when `isActive`, reset after each bar
  - [x] 7.4 Implement center-peaked sine idle profile: compute `idleProfile` based on bar index distance from center
  - [x] 7.5 Add `prefers-reduced-motion` check in draw loop: if active, throttle `requestAnimationFrame` to once per second using a timestamp guard

- [x] 8. Redesign MessageBubble with glass AI surface and premium user bubble
  - [x] 8.1 Update AI bubble: set `backgroundColor: 'var(--color-glass)'`, `backdropFilter`, remove `borderLeft`, add left-side gradient glow via `boxShadow`, update border radius to `--radius-lg` / `--radius-sm`
  - [x] 8.2 Update user bubble: add `borderTop: '1px solid rgba(255,255,255,0.2)'` inner highlight, update border radius to `--radius-lg` / `--radius-sm`
  - [x] 8.3 Replace `slideInLeft`/`slideInRight` animation references with `bubbleEnterAI`/`bubbleEnterUser`
  - [x] 8.4 Add hover `boxShadow` transition from `--shadow-sm` to `--shadow-md` via `onMouseEnter`/`onMouseLeave`
  - [x] 8.5 Replace `blinkCursor` animation on the streaming cursor with `gradientCursor`

- [x] 9. Upgrade Settings panel with glass surface and animated open/close
  - [x] 9.1 Update panel background to `--color-glass` with `backdropFilter` and `--shadow-glass`
  - [x] 9.2 Update overlay to use `backdropFilter: 'blur(8px)'` and reduced opacity background
  - [x] 9.3 Replace inline `transform` open/close with `settingsEnter`/`settingsLeave` CSS animation classes; add local `isVisible` state with 250ms delayed unmount on close
  - [x] 9.4 Update close button: `borderRadius: 'var(--radius-md)'`, hover background `--color-accent-soft`

- [x] 10. Implement smooth view transitions in `App.jsx`
  - [x] 10.1 Add `transitionState` (`'entering' | 'visible' | 'leaving'`) and `displayedView` local state
  - [x] 10.2 Add `useEffect` watching `currentView`: on change, set `leaving` → after 250ms swap `displayedView` and set `entering` → after 350ms set `visible`
  - [x] 10.3 Apply `.view-leaving`, `.view-entering`, or no class based on `transitionState`
  - [x] 10.4 Add `prefers-reduced-motion` detection: if active, use 150ms opacity-only crossfade instead of scale transitions

- [x] 11. Apply typography and spacing refinements to ModeSelection screen
  - [x] 11.1 Update greeting title style: `fontSize: 'var(--text-4xl)'`, gradient text fill via `background-clip: text`, `letterSpacing: 'var(--letter-spacing-tight)'`
  - [x] 11.2 Update content area `paddingTop` to `'var(--space-14)'`
  - [x] 11.3 Update Start button: `background: 'var(--gradient-user)'`, hover glow, `startButtonEnable` animation when `canStart` transitions to `true` (via `useEffect`)

- [x] 12. Polish Logo and ThemeToggle micro-interactions
  - [x] 12.1 Add `logoBreathe` animation to the badge span in `Logo.jsx`
  - [x] 12.2 Update ThemeToggle knob transition to use `--ease-spring`
  - [x] 12.3 Add `knobScale` animation on toggle activation via local `isAnimating` state in `ThemeToggle.jsx`
