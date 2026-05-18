# Requirements Document

## Introduction

This feature covers a comprehensive visual redesign of the Speaksy frontend — a React/Vite voice conversation app. The goal is to elevate the UI from its current functional state to a premium, polished experience with a "soft but quality flow" aesthetic. The redesign introduces glassmorphism surfaces, soft gradients, refined color palettes, fluid micro-interactions, and a cohesive design language across all screens and components. No functional behavior changes are in scope — only visual and motion quality improvements.

## Glossary

- **Design_System**: The collection of CSS tokens, utility classes, and shared component styles that define the visual language of Speaksy.
- **Token**: A CSS custom property (e.g. `--color-bg`) that encodes a single design decision and is consumed by all components.
- **Glassmorphism**: A visual style combining frosted-glass translucency (`backdrop-filter: blur`), subtle borders, and layered depth.
- **Micro-interaction**: A small, purposeful animation triggered by a user action (hover, click, focus, state change) that provides tactile feedback.
- **ModeSelection_Screen**: The entry screen where users choose a conversation mode (Free Style, Topic Based, Script Based).
- **ConversationScreen**: The primary screen where voice conversation takes place, containing the message list, wave animation, and mic button.
- **Settings_Panel**: The slide-in drawer that exposes AI provider and voice configuration.
- **MicButton**: The circular button at the bottom of ConversationScreen used to start and stop speech recording.
- **WaveAnimation**: The canvas-based audio visualisation bar chart rendered during speech.
- **ModeCard**: A selectable card on ModeSelection_Screen representing one conversation mode.
- **MessageBubble**: A chat bubble component rendering a single user or AI message.
- **ThemeToggle**: The pill-shaped switch in the header that toggles between light and dark themes.
- **StatusIndicator**: The connection status dot and label shown in the header.
- **Logo**: The Speaksy brand mark rendered in the header of ModeSelection_Screen.
- **Header**: The top navigation bar present on both screens.
- **BottomSection**: The fixed bottom area of ConversationScreen containing the WaveAnimation and MicButton.

---

## Requirements

### Requirement 1: Refined Design Token System

**User Story:** As a user, I want the app to have a cohesive, premium color palette and spacing system, so that every element feels intentional and visually harmonious.

#### Acceptance Criteria

1. THE Design_System SHALL define a soft, warm-neutral light-mode background (`--color-bg`) using an off-white tone with a subtle warm tint (e.g. `#F8F7FF`) rather than a stark white.
2. THE Design_System SHALL define a glassmorphism surface token (`--color-glass`) as a semi-transparent white (e.g. `rgba(255, 255, 255, 0.72)`) for use on cards and panels in light mode.
3. THE Design_System SHALL define a glass border token (`--color-glass-border`) as a low-opacity white stroke (e.g. `rgba(255, 255, 255, 0.45)`) to delineate glass surfaces.
4. THE Design_System SHALL define a soft ambient shadow token (`--shadow-glass`) using a multi-layer box-shadow that combines a large diffuse blur with a subtle inner highlight.
5. THE Design_System SHALL define a `--color-accent-soft` token as a low-opacity tint of the accent color (e.g. `rgba(108, 99, 255, 0.12)`) for hover states and subtle highlights.
6. WHEN the `data-theme="dark"` attribute is set on the root element, THE Design_System SHALL update `--color-glass` to a semi-transparent dark surface (e.g. `rgba(26, 26, 46, 0.72)`) and `--color-glass-border` to a low-opacity light stroke (e.g. `rgba(255, 255, 255, 0.08)`).
7. THE Design_System SHALL define a `--blur-glass` token (e.g. `16px`) used consistently for all `backdrop-filter: blur()` values.
8. THE Design_System SHALL define gradient tokens for the app background: `--gradient-bg-light` as a soft radial or linear gradient blending the background color with a faint accent tint, and `--gradient-bg-dark` for dark mode.

---

### Requirement 2: Animated Gradient App Background

**User Story:** As a user, I want the app background to feel alive and premium, so that the overall atmosphere is immersive rather than flat.

#### Acceptance Criteria

1. THE Design_System SHALL apply `--gradient-bg-light` (or `--gradient-bg-dark` in dark mode) as the background of the root `body` or `#root` element.
2. WHEN the theme changes, THE Design_System SHALL transition the background gradient smoothly over 400ms using a CSS transition.
3. THE Design_System SHALL define a subtle, slow-moving ambient background animation (e.g. a gentle gradient shift or soft orb pulse) with a cycle duration of no less than 8 seconds to avoid distraction.
4. WHERE the `prefers-reduced-motion` media query is active, THE Design_System SHALL disable all background animations and use a static gradient instead.

---

### Requirement 3: Glassmorphism Header

**User Story:** As a user, I want the header to feel elevated and modern, so that navigation feels premium and the content below it appears to scroll beneath a frosted surface.

#### Acceptance Criteria

1. THE Header SHALL use `--color-glass` as its background color and `backdrop-filter: blur(var(--blur-glass))` to create a frosted-glass effect.
2. THE Header SHALL use `--color-glass-border` as its bottom border color instead of the solid `--color-border`.
3. THE Header SHALL use `--shadow-glass` as its box-shadow to create a soft lifted appearance.
4. WHEN the user scrolls the message list, THE Header SHALL remain visually distinct from the content beneath it via the glass blur effect.
5. THE Header icon buttons (Settings, Clear) SHALL transition background color to `--color-accent-soft` on hover over 150ms.
6. THE Header icon buttons SHALL use `--radius-md` (16px) border radius instead of `--radius-sm` for a softer appearance.

---

### Requirement 4: Premium ModeCard Design

**User Story:** As a user, I want the mode selection cards to feel tactile and inviting, so that choosing a mode feels like a deliberate, satisfying interaction.

#### Acceptance Criteria

1. THE ModeCard SHALL use `--color-glass` as its background and `backdrop-filter: blur(var(--blur-glass))` to render as a glass surface.
2. THE ModeCard SHALL display a soft gradient icon background circle (using the mode's accent color at 15% opacity) behind the mode icon.
3. WHEN a ModeCard is hovered, THE ModeCard SHALL elevate via `translateY(-6px)` and increase box-shadow to `--shadow-glass` over 250ms.
4. WHEN a ModeCard is selected, THE ModeCard SHALL display a gradient border using the mode's accent color and apply a subtle inner glow using `box-shadow` inset.
5. WHEN a ModeCard is selected, THE ModeCard SHALL animate the icon with a gentle scale pulse (scale 1 → 1.15 → 1) over 300ms.
6. THE ModeCard check indicator SHALL use a filled circle with the mode's accent color and a smooth scale-in animation (scale 0 → 1) over 200ms when it appears.

---

### Requirement 5: Fluid MicButton with Layered Pulse

**User Story:** As a user, I want the microphone button to feel alive and responsive, so that I have clear, satisfying feedback when I start and stop speaking.

#### Acceptance Criteria

1. THE MicButton SHALL use a soft gradient background (`--gradient-user`) when in the listening state, replacing the flat coral fill.
2. THE MicButton SHALL render 3 concentric pulse rings when in the listening state, each with staggered animation delays of 0ms, 400ms, and 800ms respectively.
3. WHEN the MicButton transitions from idle to listening, THE MicButton SHALL animate with a scale spring effect (scale 1 → 0.92 → 1.08 → 1) over 350ms.
4. WHEN the MicButton transitions from listening to idle, THE MicButton SHALL animate with a gentle scale-down (scale 1 → 0.95 → 1) over 250ms.
5. THE MicButton SHALL display a soft ambient glow (`box-shadow` using the listening color at 40% opacity, 0 0 24px spread) when in the listening state.
6. WHEN the MicButton is in the disabled state, THE MicButton SHALL render with 40% opacity and a `grayscale(60%)` CSS filter rather than a flat opacity reduction alone.
7. THE MicButton idle state SHALL use `--shadow-glass` as its box-shadow to appear softly elevated from the surface.

---

### Requirement 6: Enhanced WaveAnimation

**User Story:** As a user, I want the audio wave visualisation to feel organic and beautiful, so that the act of speaking and listening feels immersive.

#### Acceptance Criteria

1. THE WaveAnimation SHALL increase the active bar count from 9 to 13 bars for a richer visual texture.
2. THE WaveAnimation SHALL render bars with a gradient fill per bar using a vertical linear gradient (top color lighter, bottom color the mode color) rather than a flat interpolated color.
3. THE WaveAnimation SHALL apply a soft glow effect to each bar by drawing a blurred shadow beneath each bar using `ctx.shadowBlur` and `ctx.shadowColor` when in active mode.
4. WHEN transitioning between idle and active modes, THE WaveAnimation SHALL smoothly interpolate bar count by fading in/out extra bars over 400ms rather than snapping.
5. THE WaveAnimation idle state SHALL render a gentle sine-wave-shaped height profile across bars (center bars taller, edge bars shorter) rather than uniform low bars.
6. WHERE the `prefers-reduced-motion` media query is active, THE WaveAnimation SHALL render static bars at a fixed mid-height without animation.

---

### Requirement 7: Polished MessageBubble Design

**User Story:** As a user, I want conversation messages to feel premium and easy to read, so that the chat experience feels high-quality.

#### Acceptance Criteria

1. THE MessageBubble for AI messages SHALL use `--color-glass` as its background with `backdrop-filter: blur(var(--blur-glass))` and replace the hard left border accent with a soft left-side gradient glow.
2. THE MessageBubble for user messages SHALL use `--gradient-user` as its background with a subtle inner highlight (a thin `rgba(255,255,255,0.2)` top border) for depth.
3. WHEN a MessageBubble enters the viewport, THE MessageBubble SHALL animate with a combined fade + slide (opacity 0→1, translateY 8px→0 for AI, translateX 16px→0 for user) over 350ms using `--ease-out`.
4. THE MessageBubble SHALL use `--radius-lg` (24px) for the primary corners and `--radius-sm` (8px) for the "tail" corner, replacing the current mixed radius values.
5. WHEN a MessageBubble is hovered, THE MessageBubble SHALL subtly increase box-shadow from `--shadow-sm` to `--shadow-md` over 200ms.
6. THE streaming cursor in AI MessageBubble SHALL use a soft gradient color matching `--color-ai` with a gentle fade animation rather than a hard blink.

---

### Requirement 8: Refined Settings Panel

**User Story:** As a user, I want the settings panel to feel like a premium drawer, so that configuring the app feels polished and intentional.

#### Acceptance Criteria

1. THE Settings_Panel SHALL use `--color-glass` as its background with `backdrop-filter: blur(var(--blur-glass))` instead of the solid `--color-bg`.
2. THE Settings_Panel SHALL use `--shadow-glass` as its left-edge box-shadow for a soft lifted appearance.
3. WHEN the Settings_Panel opens, THE Settings_Panel SHALL animate with a combined slide-in (translateX from +100% to 0) and fade-in (opacity 0→1) over 350ms using `--ease-out`.
4. WHEN the Settings_Panel closes, THE Settings_Panel SHALL animate with a combined slide-out and fade-out over 250ms.
5. THE Settings_Panel backdrop overlay SHALL use a soft gradient blur overlay (`backdrop-filter: blur(8px)`) rather than a flat semi-transparent color.
6. THE Settings_Panel close button SHALL use `--radius-md` and transition to `--color-accent-soft` background on hover.

---

### Requirement 9: Smooth View Transitions

**User Story:** As a user, I want navigating between the mode selection and conversation screens to feel seamless, so that the app feels like a cohesive, fluid experience.

#### Acceptance Criteria

1. WHEN the user starts a session (ModeSelection_Screen → ConversationScreen), THE App SHALL animate the outgoing view with a fade-out + scale-down (opacity 1→0, scale 1→0.97) over 250ms before mounting the incoming view.
2. WHEN the incoming ConversationScreen mounts, THE App SHALL animate it with a fade-in + scale-up (opacity 0→1, scale 1.03→1) over 350ms using `--ease-out`.
3. WHEN the user navigates back (ConversationScreen → ModeSelection_Screen), THE App SHALL apply the reverse transition: outgoing fades out + slides down, incoming fades in + slides up.
4. WHERE the `prefers-reduced-motion` media query is active, THE App SHALL use a simple opacity-only crossfade over 150ms instead of scale/translate transitions.
5. THE App SHALL ensure no layout shift or scroll position jump occurs during view transitions.

---

### Requirement 10: Micro-interaction Polish

**User Story:** As a user, I want every interactive element to respond to my actions with subtle, satisfying feedback, so that the app feels alive and high-quality.

#### Acceptance Criteria

1. THE Design_System SHALL define a `--ease-spring` cubic-bezier token (e.g. `cubic-bezier(0.34, 1.56, 0.64, 1)`) for use in bouncy micro-interactions.
2. WHEN any button (icon button, back button, start button) is pressed, THE Design_System SHALL apply a scale-down press effect (scale 1 → 0.94) over 100ms using `--ease-spring`, then release to scale 1 over 150ms.
3. THE Start_Button on ModeSelection_Screen SHALL use a gradient background (`--gradient-user` or a custom accent gradient) and display a soft glow on hover.
4. WHEN the Start_Button becomes enabled (canStart transitions false → true), THE Start_Button SHALL animate in with a scale spring (scale 0.9 → 1.05 → 1) over 400ms.
5. THE ThemeToggle knob SHALL use `--ease-spring` for its translate transition to give the toggle a satisfying snap feel.
6. WHEN the ThemeToggle is activated, THE ThemeToggle SHALL briefly scale the knob (scale 1 → 1.2 → 1) over 300ms as it slides across.
7. THE Logo SHALL apply a gentle `breathe` animation (scale 1 → 1.02 → 1, 4s cycle) on the accent badge to give the brand mark a subtle living quality.

---

### Requirement 11: Typography and Spacing Refinements

**User Story:** As a user, I want the text and layout to feel airy and well-proportioned, so that the app is comfortable to read and use.

#### Acceptance Criteria

1. THE Design_System SHALL add a `--text-4xl` token (e.g. `2.5rem` / 40px) for use in large display headings.
2. THE ModeSelection_Screen greeting title SHALL use `--text-4xl` and a soft gradient text fill (using `background-clip: text`) blending `--color-primary` to `--color-accent`.
3. THE Design_System SHALL add a `--space-14` token (56px) and `--space-20` token (80px) for generous vertical rhythm on the ModeSelection_Screen.
4. THE ModeSelection_Screen content area SHALL use `--space-14` as the top padding to give the greeting more breathing room.
5. THE MessageBubble text SHALL use `--leading-relaxed` (1.7) line-height for comfortable reading of longer AI responses.
6. THE Design_System SHALL add a `--letter-spacing-tight` token (`-0.02em`) for use on large display headings to improve visual density at large sizes.

---

### Requirement 12: Accessibility and Motion Safety

**User Story:** As a user with motion sensitivity, I want the app to respect my system preferences, so that I can use it comfortably without triggering discomfort.

#### Acceptance Criteria

1. THE Design_System SHALL include a `@media (prefers-reduced-motion: reduce)` block that sets all animation durations to `0.01ms` and disables `backdrop-filter` blur effects.
2. WHEN `prefers-reduced-motion` is active, THE WaveAnimation SHALL render static bars without the `requestAnimationFrame` loop running at full speed — it SHALL throttle redraws to once per second.
3. THE Design_System SHALL ensure all interactive elements maintain a minimum touch target size of 44×44px.
4. THE Design_System SHALL ensure color contrast ratios meet WCAG AA standards: text on glass surfaces SHALL have a contrast ratio of at least 4.5:1 against the effective background color.
5. IF a glass surface renders over a background that reduces text contrast below 4.5:1, THEN THE Design_System SHALL apply a fallback solid background color for that surface.
6. THE Design_System SHALL preserve all existing `aria-label`, `role`, and `aria-live` attributes on interactive and status elements without modification.
