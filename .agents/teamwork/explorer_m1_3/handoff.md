# Dynamic Viewport Scaling, Layout Mechanics & Verification Strategy (Milestone 1)

**Subagent**: `explorer_m1_3` (teamwork_explorer)  
**Milestone**: Milestone 1 (Shell & Hardware Frame)  
**Date**: 2026-11-03  
**Status**: COMPLETE / HARD HANDOFF  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m1_3/`

---

## 1. Observation

### 1.1 Device Geometry & Bounding Box Derivation
Direct inspection of `implementation_plan.md` (§2, §3a, §3b, §5a) and existing style sheets reveals the exact dimensional layout of the iPhone 15 Pro hardware frame:

1. **Screen Dimensions** (`.pm-screen`):
   - Proportions: `width: 393px; height: 852px;` (matching standard iPhone 15 Pro 393×852 pt viewport).
2. **Inner Bezel** (`.pm-bezel`):
   - CSS: `width: 100%; height: 100%; border-radius: 64px; background: #0b0b0d; padding: 8px; box-sizing: border-box;`
   - Content area: 393 × 852 px. Outer bezel footprint: $(393 + 16) \times (852 + 16) = 409 \times 868\text{ px}$.
3. **Outer Chassis** (`.pm-device`):
   - CSS: `width: 417px; height: 876px; border-radius: 68px; padding: 4px; box-sizing: border-box;`
   - Content area: 409 × 868 px (matches `.pm-bezel` outer dimensions).
   - Outer chassis dimensions: $417\text{ px}$ width by $876\text{ px}$ height ($H = 876$).
4. **Hardware Protruding Buttons** (`.pm-hw`):
   - Left side: Action button (`left: -3px; top: 150px; height: 32px; width: 4px;`), Volume Up (`left: -3px; top: 205px; height: 62px;`), Volume Down (`left: -3px; top: 280px; height: 62px;`).
     Each protrudes $3\text{ px}$ outside the chassis left edge.
   - Right side: Power button (`right: -3px; top: 235px; height: 100px; width: 4px;`).
     Protrudes $3\text{ px}$ outside the chassis right edge.
   - Chassis + hardware buttons bounding width: $417 + 3 + 3 = 423\text{ px}$.
   - Chassis outer shadow: `box-shadow: 0 0 0 1px #1d1f22, ...` adds a $1\text{ px}$ perimeter border outline on each side, bringing total bounding width to $423 + 2 = 425\text{ px}$ ($W = 425$).
   - Therefore, the bounding box of the unscaled hardware device is strictly:
     $$\mathbf{W = 425\text{ px}}, \quad \mathbf{H = 876\text{ px}}$$

### 1.2 Stage & Viewport Padding Relationship
Inspection of `implementation_plan.md` (§3a, §5a) demonstrates:
- `.pm-stage` CSS: `min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 40px 16px; box-sizing: border-box;`
- Vertical padding: $40\text{ px}$ top + $40\text{ px}$ bottom = $80\text{ px}$.
  Available height without overflow: $\text{availableHeight} = \text{innerHeight} - 80$.
- Horizontal padding: $16\text{ px}$ left + $16\text{ px}$ right = $32\text{ px}$.
  Available width without overflow: $\text{availableWidth} = \text{innerWidth} - 32$.
- The scaling fractions in `fitDevice()` directly map to these available space dimensions:
  $$s_{\text{height}} = \frac{\text{innerHeight} - 80}{H} = \frac{\text{innerHeight} - 80}{876}$$
  $$s_{\text{width}} = \frac{\text{innerWidth} - 32}{W} = \frac{\text{innerWidth} - 32}{425}$$

### 1.3 `fitDevice()` Scale Calculations Across Standard Viewports
Executing headless Node calculations against target viewports produced the following empirical metrics:
- **Desktop (1440 × 900)**:
  - $s_H = (900 - 80) / 876 = 820 / 876 \approx 0.936073$ (~0.936)
  - $s_W = (1440 - 32) / 425 = 1408 / 425 \approx 3.31294$
  - Scale factor: $s = \min(1, 0.936073, 3.31294) = 0.936073$
  - Wrapped container dimensions: $W \times s = 397.83\text{ px}$, $H \times s = 820.00\text{ px}$
  - Stage footprint: Width $397.83 + 32 = 429.83\text{ px} \le 1440\text{ px}$; Height $820.00 + 80 = 900.00\text{ px} \le 900\text{ px}$
  - Result: Zero overflow, zero scrollbars.
- **Laptop / Tablet (1280 × 720)**:
  - $s_H = (720 - 80) / 876 = 640 / 876 \approx 0.730594$ (~0.730 / 0.731)
  - $s_W = (1280 - 32) / 425 = 1248 / 425 \approx 2.93647$
  - Scale factor: $s = \min(1, 0.730594, 2.93647) = 0.730594$
  - Wrapped container dimensions: $W \times s = 310.50\text{ px}$, $H \times s = 640.00\text{ px}$
  - Stage footprint: Width $310.50 + 32 = 342.50\text{ px} \le 1280\text{ px}$; Height $640.00 + 80 = 720.00\text{ px} \le 720\text{ px}$
  - Result: Zero overflow, zero scrollbars.
- **Mobile (390 × 844)**:
  - $s_H = (844 - 80) / 876 = 764 / 876 \approx 0.872146$
  - $s_W = (390 - 32) / 425 = 358 / 425 \approx 0.842353$ (~0.842)
  - Scale factor: $s = \min(1, 0.872146, 0.842353) = 0.842353$ (width is the limiting axis)
  - Wrapped container dimensions: $W \times s = 358.00\text{ px}$, $H \times s = 737.90\text{ px}$
  - Stage footprint: Width $358.00 + 32 = 390.00\text{ px} \le 390\text{ px}$; Height $737.90 + 80 = 817.90\text{ px} \le 844\text{ px}$
  - Result: Zero horizontal overflow, device fits narrow screen without horizontal scroll.
- **Large Monitors (1920 × 1080 / 2560 × 1440 / 4K)**:
  - $s_H > 1.0$, $s_W > 1.0 \implies s$ clamped to upper bound $\mathbf{1.0}$.
- **Ultra-Small Screens (320 × 480 / 240 × 320)**:
  - $s$ clamped to lower bound $\mathbf{0.45}$.

### 1.4 Routing & SPA Navigation State
Direct inspection of `server.js` (lines 41–55) and `js/app.js` (lines 271–305):
- `server.js` serves `phone-mockup/index.html` directly for `/phone-mockup` and `/phone-mockup/` once the directory exists.
- `index.html` line 85–86: `<nav id="sidebarnav">` ends at line 85, `<aside>` ends at line 86.
- Inserting `.min-sidebar-footer` outside `#sidebarnav` with `<a class="min-app-mockup-btn" href="/phone-mockup/">` avoids triggering `updateSidebarActiveLink()` in `js/app.js`.
- In `phone-mockup/index.html`, the top-left return link `<a class="pm-home-btn" href="/">` points to `/`.
- In `js/app.js`, loading `/` evaluates `rawHash = window.location.hash.replace(/^#/, "") || "/smnadm/dashboard"`, automatically rendering the Company Overview dashboard. The browser's native history stack is cleanly preserved (`window.history.pushState` / standard navigation).

---

## 2. Logic Chain

```
[Chassis 417x876 + Buttons 423x876 + Outline] ──> Bounding Box W=425, H=876
                                                            │
[.pm-stage padding: 40px 16px] ──> Available space: (innerHeight - 80) x (innerWidth - 32)
                                                            │
[fitDevice() formula] ──> s = Math.max(0.45, Math.min(1, (innerHeight - 80) / H, (innerWidth - 32) / W))
                                                            │
                                  ┌─────────────────────────┴────────────────────────┐
                                  ▼                                                  ▼
          #pmDevice.style.transform = scale(s)               #pmDeviceWrap.style.width  = (W * s)px
          transform-origin: top center                       #pmDeviceWrap.style.height = (H * s)px
                                  │                                                  │
                                  └─────────────────────────┬────────────────────────┘
                                                            │
                                                            ▼
                                   [Explicit Wrap Dimensions Collapse Untransformed Box]
                                                            │
                                                            ▼
                                        Zero Page Scrollbars at 1440x900, 1280x720
                                        Zero Horizontal Overflow at 390x844
```

1. **Phantom Scrollbar Elimination via `#pmDeviceWrap`**:
   - In CSS standard layout, applying `transform: scale(s)` changes visual rendering, but does **not** alter the element's layout footprint in the flow. If an element is defined as $417\text{ px} \times 876\text{ px}$, the browser allocates that full space in the document flow.
   - On a screen with 720px height, an uncontained 876px element generates a 156px vertical scrollbar even if scaled visually to 0.730.
   - By nesting `#pmDevice` inside `#pmDeviceWrap` (`display: flex; justify-content: center; align-items: flex-start; flex: none;`), and explicitly setting `wrap.style.width = `${W * s}px`` and `wrap.style.height = `${H * s}px``, the container's layout footprint collapses to the exact scaled dimensions.
   - Combined with `.pm-page { margin: 0; min-height: 100dvh; overflow: hidden; }` and `.pm-stage { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 40px 16px; box-sizing: border-box; }`, the total stage content height is $(876 \times s) + 80 \le \text{innerHeight}$.
   - Phantom scrollbars are eliminated with mathematical certainty.

2. **Alignment via `transform-origin: top center`**:
   - Setting `transform-origin: top center` anchors the top edge of `#pmDevice` at $y = 0$ inside `#pmDeviceWrap`.
   - The device expands downward to $y = 876 \times s$, which exactly matches `wrap.style.height = `${H * s}px``.
   - Horizontally, because `transform-origin` is `center` and `#pmDeviceWrap` has `justify-content: center`, `#pmDevice` scales symmetrically around the center axis, aligning with `wrap.style.width = `${W * s}px``.

3. **Clamping Bounds Rationale**:
   - Upper bound ($1.0$): On high-resolution displays (1080p, 1440p, 4K), scaling above 1.0 would stretch the device frame beyond its physical 1:1 pt scale, causing blurry edges and exaggerated UI elements. Clamping at 1.0 preserves 1:1 physical fidelity.
   - Lower bound ($0.45$): On ultra-narrow screens or resized devtools windows (<360px), scaling below 0.45 reduces 13px–16px UI typography to sub-5px microscopic text, rendering labels unreadable and touch targets unclickable. Clamping at 0.45 ensures readability.

4. **Event Listener Registration & Boot Synchronization**:
   - In `phone-mockup/mockup-app.js`, `fitDevice()` must be called **synchronously on script boot** before or immediately after initial `render()`.
   - Registering `window.addEventListener("resize", fitDevice)` ensures seamless recalculation when the browser window is resized, developer tools are toggled, or mobile orientation changes.

5. **"← Home" Navigation Integrity**:
   - The button `<a class="pm-home-btn" href="/">` is fixed at `top: 20px; left: 20px; z-index: 10;` outside `#pmDeviceWrap`.
   - Clicking it triggers standard browser navigation to `/`.
   - It does not modify `window.location.hash`, preventing collisions with the SPA hash router in `js/app.js`.
   - It maintains standard browser history (Back button navigates back to `/phone-mockup/`, Forward navigates to `/`).

---

## 3. Caveats

1. **Mandatory `box-sizing: border-box` in `phone-mockup.css`**:
   - `phone-mockup/index.html` intentionally does **NOT** load `theme.css` (Bootstrap) to avoid style contamination.
   - `css/custom-demo.css` does not declare a global `* { box-sizing: border-box; }`.
   - **Crucial Rule**: Worker 1 **must** include `*, *::before, *::after { box-sizing: border-box; }` at the top of `phone-mockup.css`. If omitted, `.pm-stage` with `min-height: 100dvh; padding: 40px 16px;` will default to `content-box`, computing a total height of `100dvh + 80px` and causing an immediate vertical overflow!
2. **Rounded Value Representation**:
   - For Laptop/Tablet (1280×720): $s_H = 640 / 876 \approx 0.7305936...$
   - Formatted to 3 decimal places via `toFixed(3)` yields `"0.731"`, while truncated yields `"0.730"`. Both refer to the exact fraction $640 / 876$. Test assertions should verify both rounding tolerance and exact fraction inequality ($0.730 \le s \le 0.731$).
3. **No Dynamic Island Overlap on Content**:
   - `.pm-screen` has `.pm-app` with `padding-top: 54px;`. The Dynamic Island is positioned at `top: 11px; height: 37px;` (extends to $11 + 37 = 48\text{ px}$). The 54px top padding on `#pmApp` guarantees that app content never collides with or hides beneath the Dynamic Island or status bar.
4. **Touch Target Sizing at Mobile Scale**:
   - When scaled down at mobile viewports ($s \approx 0.842$), interactive buttons with 50px height render at $42.1\text{ px}$, maintaining compliant touch targets ($>40\text{ px}$).

---

## 4. Conclusion

The dynamic viewport scaling and layout mechanics for Milestone 1 are mathematically validated, fully specified, and ready for immediate implementation by Worker 1.

### 4.1 Structural Markup Template (`phone-mockup/index.html`)
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>App Mockup · School Management System</title>
    <link rel="icon" type="image/svg+xml" href="/uploads/school_favicons/default_school_favicon.svg" />
    <link rel="stylesheet" href="/fonts/feather/feather.css" />
    <link rel="stylesheet" href="/libs/bootstrap-icons/font/bootstrap-icons.min.css" />
    <link rel="stylesheet" href="/css/custom-demo.css" />
    <link rel="stylesheet" href="/phone-mockup/phone-mockup.css" />
  </head>
  <body class="pm-page">
    <a class="pm-home-btn" href="/" aria-label="Return to home dashboard">
      <i class="fe fe-arrow-left"></i><span>Home</span>
    </a>

    <main class="pm-stage">
      <div class="pm-device-wrap" id="pmDeviceWrap">
        <div class="pm-device" id="pmDevice" role="region" aria-label="Mobile app mockup">
          <span class="pm-hw pm-hw-action" aria-hidden="true"></span>
          <span class="pm-hw pm-hw-vol-up" aria-hidden="true"></span>
          <span class="pm-hw pm-hw-vol-down" aria-hidden="true"></span>
          <span class="pm-hw pm-hw-power" aria-hidden="true"></span>
          <div class="pm-bezel">
            <div class="pm-screen" id="pmScreen">
              <div class="pm-island" aria-hidden="true"></div>
              <div class="pm-statusbar" aria-hidden="true">
                <span class="pm-sb-time" id="pmSbTime">11:35</span>
                <span class="pm-sb-icons">
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .6 10.2 10.2 0 0 0 .8 3.5L2 4.8a8.4 8.4 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.6 6.6 0 0 0 8 4.2 6.6 6.6 0 0 0 3.4 6l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c.4 0 .8.2 1.1.4L8 11.4 6.9 10c.3-.2.7-.4 1.1-.4Z"/></svg>
                  <svg width="27" height="13" viewBox="0 0 27 13" fill="currentColor"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".35"/><rect x="2" y="2" width="17" height="9" rx="2"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" opacity=".4"/></svg>
                </span>
              </div>
              <div class="pm-app" id="pmApp"></div>
              <div class="pm-home-indicator" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <script src="/js/mock-data.js"></script>
    <script src="/phone-mockup/mockup-data.js"></script>
    <script src="/phone-mockup/mockup-app.js"></script>
  </body>
</html>
```

### 4.2 Essential Layout Stylesheet (`phone-mockup/phone-mockup.css`)
```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

.pm-page {
  margin: 0;
  min-height: 100dvh;
  overflow: hidden;
  background: radial-gradient(1200px 600px at 50% 0%, var(--brand-primary-light), transparent 70%), var(--surface-bg);
}

.pm-home-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px 7px 10px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  box-shadow: var(--shadow-xs);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}

.pm-home-btn:hover,
.pm-home-btn:focus-visible {
  border-color: var(--border-strong);
  color: var(--text-main);
  outline: none;
}

.pm-stage {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  box-sizing: border-box;
}

.pm-device-wrap {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex: none;
}

.pm-device {
  position: relative;
  flex: none;
  width: 417px;
  height: 876px;
  border-radius: 68px;
  padding: 4px;
  transform-origin: top center;
  background: linear-gradient(145deg, #5b5e63 0%, #2c2e32 38%, #6a6d72 55%, #2a2c30 100%);
  box-shadow: 0 0 0 1px #1d1f22,
              inset 0 0 2px 1px rgba(255, 255, 255, 0.18),
              0 50px 100px -30px rgba(16, 24, 40, 0.45),
              0 30px 60px -30px rgba(16, 24, 40, 0.30);
}

.pm-bezel {
  width: 100%;
  height: 100%;
  border-radius: 64px;
  background: #0b0b0d;
  padding: 8px;
}

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

.pm-hw {
  position: absolute;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #3a3c40, #6a6d72, #3a3c40);
}
.pm-hw-action   { left: -3px; top: 150px; height: 32px; }
.pm-hw-vol-up   { left: -3px; top: 205px; height: 62px; }
.pm-hw-vol-down { left: -3px; top: 280px; height: 62px; }
.pm-hw-power    { right: -3px; top: 235px; height: 100px; }

.pm-island {
  position: absolute;
  top: 11px;
  left: 50%;
  translate: -50% 0;
  width: 126px;
  height: 37px;
  border-radius: 20px;
  background: #000;
  z-index: 60;
}

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
}

.pm-sb-time {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.pm-sb-icons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pm-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  translate: -50% 0;
  width: 134px;
  height: 5px;
  border-radius: 3px;
  background: var(--text-main);
  z-index: 60;
  pointer-events: none;
}

.pm-app {
  position: absolute;
  inset: 0;
  padding-top: 54px;
  display: flex;
  flex-direction: column;
}
```

### 4.3 Scaling Implementation (`phone-mockup/mockup-app.js`)
```javascript
(function () {
  "use strict";

  function fitDevice() {
    const W = 425, H = 876;
    const s = Math.max(0.45, Math.min(1, (innerHeight - 80) / H, (innerWidth - 32) / W));
    const dev = document.getElementById("pmDevice");
    const wrap = document.getElementById("pmDeviceWrap");
    if (!dev || !wrap) return;
    dev.style.transform = `scale(${s})`;
    wrap.style.width = `${W * s}px`;
    wrap.style.height = `${H * s}px`;
  }

  // Boot sequence:
  window.addEventListener("resize", fitDevice);
  fitDevice();
})();
```

---

## 5. Verification Method

Worker 1 can run the following concrete test suite immediately upon completing Milestone 1.

### 5.1 Verification Script Suite for Worker 1

#### 1. JavaScript Syntax Validation
```bash
node --check phone-mockup/mockup-app.js
```
*Expected*: Exit code 0, no syntax errors.

#### 2. HTTP Routing & MIME Type Checks
```bash
# Verify phone-mockup returns 200 with and without trailing slash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phone-mockup/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phone-mockup

# Verify static CSS and JS MIME types
curl -s -I http://localhost:3000/phone-mockup/phone-mockup.css | grep -E 'HTTP/|Content-Type'
curl -s -I http://localhost:3000/phone-mockup/mockup-app.js | grep -E 'HTTP/|Content-Type'
```
*Expected*: All return HTTP `200`, `text/css`, and `application/javascript`.

#### 3. DOM Integrity & SPA Non-Fallback Assertions
```bash
# Verify phone-mockup serves the mockup shell and does NOT fall back to SPA index.html
curl -s http://localhost:3000/phone-mockup/ | grep -c 'id="pmDevice"'       # Expected: >= 1
curl -s http://localhost:3000/phone-mockup/ | grep -c 'id="sidebarnav"'     # Expected: 0
curl -s http://localhost:3000/phone-mockup/ | grep -c 'class="pm-home-btn"' # Expected: >= 1
curl -s http://localhost:3000/phone-mockup/ | grep -c 'id="pmSbTime"'       # Expected: >= 1

# Verify main site sidebar contains mockup link
curl -s http://localhost:3000/ | grep -c 'min-app-mockup-btn'               # Expected: >= 1
curl -s http://localhost:3000/ | grep -c 'href="/phone-mockup/"'            # Expected: >= 1
```

#### 4. Automated Viewport Mathematical Scaling Test
```bash
node -e '
const assert = require("assert");
const W = 425, H = 876;
function calcScale(innerWidth, innerHeight) {
  return Math.max(0.45, Math.min(1, (innerHeight - 80) / H, (innerWidth - 32) / W));
}

// Desktop (1440x900)
const sDesktop = calcScale(1440, 900);
assert.strictEqual(sDesktop.toFixed(3), "0.936", "Desktop scale must be ~0.936");
assert(W * sDesktop + 32 <= 1440, "Desktop width must not overflow");
assert(H * sDesktop + 80 <= 900, "Desktop height must not overflow");

// Laptop/Tablet (1280x720)
const sLaptop = calcScale(1280, 720);
assert(sLaptop >= 0.730 && sLaptop <= 0.731, "Laptop scale must be ~0.730-0.731");
assert(W * sLaptop + 32 <= 1280, "Laptop width must not overflow");
assert(H * sLaptop + 80 <= 720, "Laptop height must not overflow");

// Mobile (390x844)
const sMobile = calcScale(390, 844);
assert.strictEqual(sMobile.toFixed(3), "0.842", "Mobile scale must be ~0.842");
assert(W * sMobile + 32 <= 390, "Mobile width must not overflow");
assert(H * sMobile + 80 <= 844, "Mobile height must not overflow");

// Upper Bound (Large display clamp)
const s4K = calcScale(2560, 1440);
assert.strictEqual(s4K, 1.0, "Scale on 1440p+ display must clamp at 1.0");

// Lower Bound (Tiny screen clamp)
const sTiny = calcScale(240, 320);
assert.strictEqual(sTiny, 0.45, "Scale on tiny screen must clamp at 0.45");

console.log("All fitDevice scale assertions PASSED cleanly!");
'
```

#### 5. Working Tree Non-Regression Check
```bash
git diff --name-only
```
*Expected*: Only `index.html` and `css/custom-demo.css` have tracked changes, both purely additive.

### 5.2 Invalidation Conditions
- Removing explicit width/height updates on `#pmDeviceWrap` in `fitDevice()` will cause phantom scrollbars due to untransformed CSS layout bounding boxes.
- Omitting `*, *::before, *::after { box-sizing: border-box; }` in `phone-mockup.css` will cause `.pm-stage` to overflow `100dvh` by $80\text{ px}$.
- Changing `transform-origin: top center` to `center center` will misalign the device vertically inside `#pmDeviceWrap`.
- Modifying `server.js` directory resolution will break trailing-slash neutrality.
