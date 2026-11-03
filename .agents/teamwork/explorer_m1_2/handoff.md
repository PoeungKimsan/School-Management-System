# Milestone 1 CSS Styling Specification Report — explorer_m1_2

**Agent**: `explorer_m1_2` (teamwork_explorer)  
**Date**: 2026-11-03  
**Status**: COMPLETE / HARD HANDOFF  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m1_2/`  
**Target Milestone**: Milestone 1 (Shell & Hardware Frame)

---

## 1. Observation

### 1.1 Existing CSS Architecture & Token Definitions
Direct observation of `/Users/macbookpro/School-Management-System/css/custom-demo.css`:
- **Lines 7–29**: Core design tokens defined on `:root`:
  ```css
  --brand-primary: #2E3192;
  --brand-primary-hover: #232675;
  --brand-primary-light: #f0f2ff;

  --surface-bg: #f9fafb;
  --surface-card: #ffffff;
  --surface-subtle: #f3f4f6;
  --border-subtle: #eaecf0;
  --border-strong: #d0d5dd;

  --text-main: #101828;
  --text-secondary: #475467;
  --text-muted: #667085;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.04);
  --shadow-sm: 0 2px 8px rgba(16, 24, 40, 0.05);
  --shadow-md: 0 8px 24px rgba(16, 24, 40, 0.08);
  ```
- **Lines 162–177**: Existing `.min-sidebar-footer` styles:
  ```css
  /* Sidebar Footer: Subtle White-Label Switcher */
  .min-sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--border-subtle);
    background: #fcfcfd;
  }

  .min-sidebar-footer label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    display: block;
    margin-bottom: 6px;
  }
  ```
- **Line 243–262**: Mobile media query `@media (max-width: 991.98px)` manages `.min-sidebar` off-canvas translation (`transform: translateX(-100%)` to `translateX(0)`).
- **Absence of universal `box-sizing` in `custom-demo.css`**: A search confirmed `custom-demo.css` does not define `box-sizing: border-box;` globally on `*`. On the main dashboard, this was supplied by Bootstrap Reboot.

### 1.2 Standalone Mockup Shell Requirements
Direct observation of `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `implementation_plan.md`:
- `phone-mockup/index.html` loads:
  1. `/fonts/feather/feather.css`
  2. `/libs/bootstrap-icons/font/bootstrap-icons.min.css`
  3. `/css/custom-demo.css`
  4. `/phone-mockup/phone-mockup.css`
- **Crucial architectural directive**: Neither `theme.css` nor Bootstrap JS/CSS is loaded in `phone-mockup/index.html`.
- **Chassis Geometries**:
  - Device chassis: `417px` wide, `876px` high, `border-radius: 68px`, `padding: 4px`.
  - Titanium finish: `linear-gradient(145deg, #5b5e63 0%, #2c2e32 38%, #6a6d72 55%, #2a2c30 100%)`.
  - Elevation box-shadows:
    - `0 0 0 1px #1d1f22` (perimeter rim)
    - `inset 0 0 2px 1px rgba(255, 255, 255, 0.18)` (titanium bevel highlight)
    - `0 50px 100px -30px rgba(16, 24, 40, 0.45)` (ambient drop shadow)
    - `0 30px 60px -30px rgba(16, 24, 40, 0.30)` (directional grounding shadow)
  - Inner bezel: `width: 100%`, `height: 100%`, `border-radius: 64px`, `background: #0b0b0d`, `padding: 8px`.
  - Active screen: `width: 393px`, `height: 852px`, `border-radius: 56px`, `overflow: hidden`, `isolation: isolate`.
  - Hardware buttons (protruding 3px outside chassis):
    - Action button: `left: -3px; top: 150px; height: 32px;`
    - Volume Up: `left: -3px; top: 205px; height: 62px;`
    - Volume Down: `left: -3px; top: 280px; height: 62px;`
    - Power button: `right: -3px; top: 235px; height: 100px;`
  - Dynamic Island: `126px` wide, `37px` high, `border-radius: 20px`, `background: #000`, `top: 11px`, centered, `z-index: 60`.
  - Status bar: `54px` high, font size `17px/600`, padding `4px 30px 0 52px`, `z-index: 55`, `pointer-events: none`.
  - Home indicator: `134px` wide, `5px` high, `border-radius: 3px`, `bottom: 8px`, centered, `z-index: 60`, `pointer-events: none`.

---

## 2. Logic Chain

### 2.1 The Mathematics of iPhone 15 Pro Concentric Radii and Box-Sizing
1. **Mathematical Proof of Outer-to-Inner Proportions**:
   $$\text{Chassis Width} = 417\text{ px}, \quad \text{Chassis Height} = 876\text{ px}, \quad \text{Chassis Radius} = 68\text{ px}$$
   With `padding: 4px` on `.pm-device`:
   $$\text{Bezel Outer Width} = 417 - (2 \times 4) = 409\text{ px}$$
   $$\text{Bezel Outer Height} = 876 - (2 \times 4) = 868\text{ px}$$
   $$\text{Bezel Radius} = 68 - 4 = 64\text{ px}$$
   With `padding: 8px` on `.pm-bezel`:
   $$\text{Screen Width} = 409 - (2 \times 8) = 393\text{ px}$$
   $$\text{Screen Height} = 868 - (2 \times 8) = 852\text{ px}$$
   $$\text{Screen Radius} = 64 - 8 = 56\text{ px}$$
2. **The Box-Sizing Requirement**:
   Because `phone-mockup/index.html` does NOT load Bootstrap reboot, all HTML elements default to standard CSS `box-sizing: content-box` unless overridden. Under `content-box`, `width: 417px; padding: 4px;` would expand the device to $417 + 8 = 425\text{ px}$, causing layout overflow and breaking the 393×852 pt inner viewport alignment.
   **Conclusion**: `phone-mockup.css` must declare `*, *::before, *::after { box-sizing: border-box; }` at its root.

### 2.2 Device Protrusions and Viewport Fit Contract
1. **Side Buttons Optical Protrusion**:
   - The hardware buttons are $4\text{ px}$ wide with `position: absolute`.
   - On the left: `left: -3px` (1px overlaps the chassis border, 3px protrudes).
   - On the right: `right: -3px` (1px overlaps the chassis border, 3px protrudes).
   - Total effective device width: $417 + 3 (\text{left}) + 3 (\text{right}) = 423\text{ px}$ (buffered to $W = 425\text{ px}$ in `fitDevice()`).
   - `.pm-device` must NOT have `overflow: hidden;` so these buttons remain visible.
   - Conversely, `.pm-screen` MUST have `overflow: hidden;` and `isolation: isolate;` to clip all app contents to the 56px curved OLED screen boundary.

2. **Scaling Container Contract (`.pm-device-wrap` & `transform-origin`)**:
   - `fitDevice()` computes $s = \max(0.45, \min(1, (H_{\text{viewport}} - 80) / 876, (W_{\text{viewport}} - 32) / 425))$.
   - `.pm-device` uses `transform: scale(s)` with `transform-origin: top center;`.
   - `.pm-device-wrap` receives explicit inline width and height: `width: ${425 * s}px; height: ${876 * s}px;`.
   - This ensures flexbox centering in `.pm-stage` aligns with the true visual footprint of the scaled phone, eliminating vertical and horizontal page scrollbars across desktop (1440×900), laptop (1280×720), and mobile (390×844) viewports.

### 2.3 Status Bar & Dynamic Island Layering Architecture
1. **Dynamic Island Alignment**:
   - Centered horizontally via `left: 50%; transform: translateX(-50%); translate: -50% 0;` (126×37 px, 20px radius).
   - Positioned `11px` from the top of `.pm-screen`.
   - Layered at `z-index: 60`.
2. **Status Bar Geometry & Asymmetric Padding**:
   - Total height: `54px`.
   - Left side contains `.pm-sb-time` ("11:35").
   - Right side contains `.pm-sb-icons` (cellular, Wi-Fi, battery SVGs).
   - Dynamic Island occupies the center horizontal zone:
     $$\text{Island Left Edge} = \frac{393}{2} - \frac{126}{2} = 196.5 - 63 = 133.5\text{ px}$$
     $$\text{Island Right Edge} = \frac{393}{2} + \frac{126}{2} = 196.5 + 63 = 259.5\text{ px}$$
   - Padding `4px 30px 0 52px` positions the time at $52\text{ px}$ from the left (well clear of the 56px curved corner radius) and the icon group at $30\text{ px}$ from the right, preventing any collision with the island or rounded screen corners.
   - `pointer-events: none` ensures status bar elements never intercept gestures.
3. **App Host Element (`.pm-app`)**:
   - Sits at `position: absolute; inset: 0; padding-top: 54px;`.
   - Top padding of `54px` prevents any screen view from rendering underneath the status bar / island.

### 2.4 Accessibility and Reduced Motion Discipline
1. **`:focus-visible`**:
   - All interactive controls (`.min-app-mockup-btn`, `.pm-home-btn`, buttons, inputs, tabs) must show an accessible 2px ring using `var(--brand-primary)` with `outline-offset: 2px`.
2. **`prefers-reduced-motion`**:
   - Users with vestibular disorders must not encounter sliding sheets or push banners.
   - Under `@media (prefers-reduced-motion: reduce)`, all transitions and animations are set to `none !important` and `duration: 0.01ms !important`, enabling immediate rendering without motion.

---

## 3. Caveats

1. **Root-Absolute Pathing for CSS Assets**:
   All font, SVG, and stylesheet references in `phone-mockup/index.html` must be root-absolute (`/css/custom-demo.css`, `/phone-mockup/phone-mockup.css`).
2. **Preservation of Uncommitted Changes in `css/custom-demo.css`**:
   The working tree contains existing modifications in `css/custom-demo.css`. The edits for `.min-sidebar-footer` and `.min-app-mockup-btn` must be strictly additive and placed right after line 177, avoiding any git reset or overwrite of earlier modifications.
3. **No External CDNs or Libraries**:
   Do not import Tailwind, external reset stylesheets, or Bootstrap CSS into `phone-mockup/`. All styles must be fully encapsulated in `phone-mockup.css`.

---

## 4. Conclusion & Verbatim Specifications

### 4.1 Changes for `css/custom-demo.css`

Insert immediately after line 177 (`.min-sidebar-footer label { ... }`):

```css
/* Sidebar footer: compact App Mockup shortcut */
.min-sidebar-footer {
  padding: 12px 16px;
}

.min-app-mockup-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  text-decoration: none;
  box-shadow: var(--shadow-xs);
  transition: all 0.15s ease;
  cursor: pointer;
}

.min-app-mockup-btn i {
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: color 0.15s ease, transform 0.15s ease;
}

.min-app-mockup-btn .min-app-mockup-arrow {
  font-size: 0.75rem;
}

.min-app-mockup-btn:hover,
.min-app-mockup-btn:focus-visible {
  background: var(--brand-primary-light);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  outline: none;
}

.min-app-mockup-btn:hover i,
.min-app-mockup-btn:focus-visible i {
  color: var(--brand-primary);
}

.min-app-mockup-btn:hover .min-app-mockup-arrow {
  transform: translate(1px, -1px);
}
```

---

### 4.2 Complete Specification for `phone-mockup/phone-mockup.css`

The implementer should write this exact content into `/Users/macbookpro/School-Management-System/phone-mockup/phone-mockup.css`:

```css
/**
 * Phone App Mockup Stylesheet
 * Scoped Prefix: pm-
 * Design System: Inherits CSS Custom Properties from custom-demo.css
 * Hardware Geometry: iPhone 15 Pro (393x852 pt screen inside 417x876 px titanium frame)
 */

/* ============================================================================
   1. GLOBAL RESET & BASE SETTINGS FOR STANDALONE MOCKUP
   ============================================================================ */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.pm-page {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: radial-gradient(1200px 600px at 50% 0%, var(--brand-primary-light), transparent 70%), var(--surface-bg);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Noto Sans Khmer", sans-serif;
  color: var(--text-main);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================================================
   2. TOP NAVIGATION: "← HOME" RETURN PILL
   ============================================================================ */
.pm-home-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px 7px 10px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  box-shadow: var(--shadow-xs);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  text-decoration: none;
  line-height: 1.2;
  transition: all 0.15s ease;
  user-select: none;
}

.pm-home-btn i {
  font-size: 0.95rem;
  color: var(--text-muted);
  transition: color 0.15s ease, transform 0.15s ease;
}

.pm-home-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-main);
  background: var(--surface-card);
  box-shadow: var(--shadow-sm);
}

.pm-home-btn:hover i {
  color: var(--text-main);
  transform: translateX(-2px);
}

.pm-home-btn:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
  border-color: var(--brand-primary);
  color: var(--text-main);
}

/* ============================================================================
   3. STAGE & DEVICE WRAPPER (DYNAMIC SCALING HOST)
   ============================================================================ */
.pm-stage {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  overflow: hidden;
}

.pm-device-wrap {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex: none;
  /* width and height are dynamically updated by fitDevice() in JS */
}

/* ============================================================================
   4. IPHONE 15 PRO HARDWARE FRAME
   ============================================================================ */
/* Titanium outer chassis (417x876 px) */
.pm-device {
  position: relative;
  flex: none;
  width: 417px;
  height: 876px;
  border-radius: 68px;
  padding: 4px;
  transform-origin: top center;
  background: linear-gradient(145deg, #5b5e63 0%, #2c2e32 38%, #6a6d72 55%, #2a2c30 100%);
  box-shadow:
    0 0 0 1px #1d1f22,
    inset 0 0 2px 1px rgba(255, 255, 255, 0.18),
    0 50px 100px -30px rgba(16, 24, 40, 0.45),
    0 30px 60px -30px rgba(16, 24, 40, 0.30);
  user-select: none;
}

/* Inner black display bezel */
.pm-bezel {
  width: 100%;
  height: 100%;
  border-radius: 64px;
  background: #0b0b0d;
  padding: 8px;
}

/* Active OLED screen viewport (393x852 pt) */
.pm-screen {
  position: relative;
  width: 393px;
  height: 852px;
  border-radius: 56px;
  overflow: hidden;
  background: var(--surface-bg);
  color: var(--text-main);
  isolation: isolate;
}

/* Physical side buttons protruding outside chassis */
.pm-hw {
  position: absolute;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #3a3c40, #6a6d72, #3a3c40);
  z-index: 0;
  pointer-events: none;
}

.pm-hw-action {
  left: -3px;
  top: 150px;
  height: 32px;
}

.pm-hw-vol-up {
  left: -3px;
  top: 205px;
  height: 62px;
}

.pm-hw-vol-down {
  left: -3px;
  top: 280px;
  height: 62px;
}

.pm-hw-power {
  right: -3px;
  top: 235px;
  height: 100px;
}

/* Dynamic Island (126x37 px) */
.pm-island {
  position: absolute;
  top: 11px;
  left: 50%;
  transform: translateX(-50%);
  translate: -50% 0;
  width: 126px;
  height: 37px;
  border-radius: 20px;
  background: #000000;
  z-index: 60;
  pointer-events: none;
}

/* iOS Status Bar (height: 54px) */
.pm-statusbar {
  position: absolute;
  inset: 0 0 auto 0;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 30px 0 52px;
  z-index: 55;
  color: var(--text-main);
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}

.pm-sb-time {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1;
}

.pm-sb-icons {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-main);
}

.pm-sb-icons svg {
  display: block;
}

/* Home Indicator Pill */
.pm-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  translate: -50% 0;
  width: 134px;
  height: 5px;
  border-radius: 3px;
  background: var(--text-main);
  z-index: 60;
  pointer-events: none;
  opacity: 0.85;
}

/* App Root inside Screen */
.pm-app {
  position: absolute;
  inset: 0;
  padding-top: 54px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ============================================================================
   5. IN-APP COMPONENT FOUNDATION (FOR MILESTONES 2–4 INTEGRATION)
   ============================================================================ */
/* Scrollable Body Container */
.pm-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding: 8px 20px 110px;
  animation: pmFadeIn 0.22s ease;
}

.pm-body::-webkit-scrollbar {
  display: none;
}

/* Headers & Titles */
.pm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 6px 0 18px;
}

.pm-eyebrow {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 2px;
}

.pm-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin: 0;
}

.pm-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 22px 4px 8px;
}

/* Profile / Child Avatars */
.pm-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--brand-primary);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: grid;
  place-items: center;
  border: 0;
  cursor: pointer;
  flex-shrink: 0;
}

/* Cards & Elevated Containers */
.pm-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-xs);
  margin-bottom: 12px;
}

.pm-card-hero {
  background: var(--brand-primary);
  color: #ffffff;
  border: 0;
  border-radius: var(--radius-lg);
  padding: 18px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;
}

.pm-card-hero .text-muted,
.pm-card-hero .pm-eyebrow {
  color: rgba(255, 255, 255, 0.75);
}

/* Grouped List Rows */
.pm-list {
  padding: 0 !important;
  overflow: hidden;
}

.pm-row {
  padding: 13px 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #f2f4f7;
}

.pm-row:last-child {
  border-bottom: none;
}

/* Soft Status Pills */
.pm-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
}

.pm-pill.success {
  background: #ecfdf3;
  color: #027a48;
}

.pm-pill.warning {
  background: #fffaeb;
  color: #b54708;
}

.pm-pill.danger {
  background: #fef3f2;
  color: #b42318;
}

.pm-pill.info {
  background: #f0f9ff;
  color: #026aa2;
}

.pm-pill.neutral {
  background: #f2f4f7;
  color: #344054;
}

.pm-pill.brand {
  background: var(--brand-primary-light);
  color: var(--brand-primary);
}

/* Segmented Control */
.pm-seg {
  background: #eef1f5;
  padding: 3px;
  border-radius: 10px;
  display: flex;
  gap: 2px;
  margin-bottom: 16px;
}

.pm-seg-btn {
  flex: 1;
  border: 0;
  background: transparent;
  padding: 7px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.pm-seg-btn.active {
  background: #ffffff;
  color: var(--text-main);
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}

/* Filter Chips (Horizontal Scroll) */
.pm-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
  margin-bottom: 14px;
}

.pm-chips::-webkit-scrollbar {
  display: none;
}

.pm-chip {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.pm-chip.active {
  background: var(--brand-primary-light);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  font-weight: 600;
}

/* Buttons */
.pm-btn-primary {
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 12px;
  background: var(--brand-primary);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.pm-btn-primary:active {
  background: var(--brand-primary-hover);
  transform: scale(0.99);
}

.pm-btn-ghost {
  width: 100%;
  height: 50px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-main);
  font-size: 15px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pm-btn-ghost:hover {
  background: var(--surface-subtle);
}

/* Inputs */
.pm-input-wrap {
  position: relative;
  margin-bottom: 14px;
}

.pm-input-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}

.pm-input {
  width: 100%;
  height: 50px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 0 14px;
  font-size: 16px;
  background: #ffffff;
  color: var(--text-main);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pm-input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px var(--brand-primary-light);
}

.pm-input.error {
  border-color: #d92d20;
}

.pm-input-error-text {
  font-size: 12px;
  color: #d92d20;
  margin-top: 4px;
}

/* Tab Bar Navigation (Pinned Bottom) */
.pm-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 84px;
  padding: 6px 6px 30px;
  display: flex;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid var(--border-subtle);
  z-index: 40;
}

.pm-tab {
  flex: 1;
  border: 0;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 500;
  position: relative;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s ease;
}

.pm-tab i {
  font-size: 22px;
  line-height: 1;
}

.pm-tab.active {
  color: var(--brand-primary);
}

.pm-tab-badge {
  position: absolute;
  top: 0px;
  left: calc(50% + 6px);
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border-radius: 9px;
  background: #f04438;
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  line-height: 17px;
  text-align: center;
}

.pm-tab-dot {
  position: absolute;
  top: 2px;
  left: calc(50% + 8px);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f04438;
}

/* Bottom Sheet Modal */
.pm-sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(16, 24, 40, 0.35);
  z-index: 70;
  animation: pmFade 0.2s ease;
}

.pm-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 71;
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  padding: 10px 20px 40px;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 -10px 30px rgba(16, 24, 40, 0.15);
  animation: pmSheetUp 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}

.pm-sheet::before {
  content: "";
  display: block;
  width: 36px;
  height: 5px;
  border-radius: 3px;
  background: #d0d5dd;
  margin: 0 auto 16px;
}

/* Simulated iOS Push Notification Banner */
.pm-push {
  position: absolute;
  top: 58px;
  left: 10px;
  right: 10px;
  z-index: 65;
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  animation: pmPushIn 0.45s cubic-bezier(0.32, 0.72, 0, 1);
}

.pm-push-icon {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: var(--brand-primary);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* In-App Toast Notification */
.pm-toast {
  position: absolute;
  left: 50%;
  bottom: 100px;
  transform: translateX(-50%);
  translate: -50% 0;
  z-index: 80;
  background: rgba(16, 24, 40, 0.92);
  color: #ffffff;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  animation: pmFade 0.2s ease;
  pointer-events: none;
}

/* Pure CSS Pseudo-QR Code Grid */
.pm-qr {
  display: grid;
  grid-template-columns: repeat(var(--n), 1fr);
  width: 180px;
  aspect-ratio: 1;
  padding: 10px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  margin: 0 auto;
}

.pm-qr i {
  display: block;
  background: #ffffff;
}

.pm-qr i.on {
  background: #101828;
}

/* Progress & Circular Ring Charts */
.pm-progress {
  height: 6px;
  background: #f2f4f7;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 6px;
}

.pm-progress-bar {
  height: 100%;
  background: var(--brand-primary);
  border-radius: 3px;
}

.pm-ring {
  background: conic-gradient(var(--brand-primary) calc(var(--p) * 1%), #eef1f5 0);
  border-radius: 50%;
  width: 84px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  position: relative;
}

.pm-ring::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: #ffffff;
  border-radius: 50%;
}

.pm-ring-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

/* 7-Column Attendance Calendar Grid */
.pm-cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  text-align: center;
}

.pm-cal-cell {
  aspect-ratio: 1;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  position: relative;
}

.pm-cal-cell.today {
  outline: 1.5px solid var(--brand-primary);
}

.pm-cal-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-top: 2px;
}

/* Spinner */
.pm-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: pmSpin 0.7s linear infinite;
  display: inline-block;
}

/* ============================================================================
   6. KEYFRAME ANIMATIONS & ACCESSIBILITY
   ============================================================================ */
@keyframes pmFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pmFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pmSheetUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes pmPushIn {
  from {
    transform: translateY(-120%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes pmSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pmPop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Focus Visibility Ring */
.pm-app :focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

/* Prefers-Reduced-Motion Media Query */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .pm-app *,
  .pm-app *::before,
  .pm-app *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 5. Verification Method

### 5.1 Syntax and Lint Verification
Run CSS validation in Node (or postcss/css-validator if available):
```bash
node -e '
const fs = require("fs");
const css = fs.readFileSync("css/custom-demo.css", "utf8");
if (!css.includes(".min-sidebar-footer")) throw new Error("Missing .min-sidebar-footer");
if (!css.includes(".min-app-mockup-btn")) throw new Error("Missing .min-app-mockup-btn");
console.log("custom-demo.css checks passed");
'
```

### 5.2 Responsive Geometry Assertions
To verify that the CSS dimensions correctly yield the iPhone 15 Pro hardware proportions:
```bash
node -e '
const chassisW = 417, chassisP = 4;
const bezelW = chassisW - 2 * chassisP; // 409
const bezelP = 8;
const screenW = bezelW - 2 * bezelP; // 393
const chassisH = 876;
const bezelH = chassisH - 2 * chassisP; // 868
const screenH = bezelH - 2 * bezelP; // 852

if (screenW !== 393 || screenH !== 852) {
  throw new Error("Geometry calculation failed");
}
console.log(`Chassis: ${chassisW}x${chassisH} -> Bezel: ${bezelW}x${bezelH} -> Screen: ${screenW}x${screenH} [EXACT MATCH]`);
'
```

### 5.3 Invalidation Conditions
- Any removal of `*, *::before, *::after { box-sizing: border-box; }` in `phone-mockup.css`.
- Any addition of `overflow: hidden` to `.pm-device`, which would clip the 3px protruding hardware buttons.
- Any alteration of `isolation: isolate` on `.pm-screen`, which would cause dynamic stacking contexts to leak into the parent DOM.
- Modifying `custom-demo.css` using `git checkout` or `git reset` rather than additive changes.
