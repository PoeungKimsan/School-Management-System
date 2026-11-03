# Milestone 1 (Shell & Hardware Frame) Investigation & HTML Markup Specification

**Agent**: `explorer_m1_1` (teamwork_explorer)  
**Date**: 2026-11-03  
**Status**: COMPLETE / HARD HANDOFF  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m1_1/`

---

## 1. Observation

Direct observations from `/Users/macbookpro/School-Management-System` codebase and authoritative specifications (`implementation_plan.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`):

### 1.1 `index.html` Sidebar Structure & Insertion Point
- **File**: `/Users/macbookpro/School-Management-System/index.html` (lines 80–87)
  ```html
  80:             <a class="min-nav-link nav-link" href="#/smnadm/settings/school-profile" data-group="settings">
  81:               <i class="fe fe-sliders"></i>
  82:               <span>Settings &amp; Access</span>
  83:             </a>
  84:           </div>
  85:         </nav>
  86:       </aside>
  ```
- **File**: `/Users/macbookpro/School-Management-System/js/app.js` (lines 271–282)
  ```javascript
  271:   function updateSidebarActiveLink(path) {
  272:     const targetHref = resolveSidebarGroup(path);
  273:     document.querySelectorAll("#sidebarnav .nav-link").forEach((a) => {
  274:       const href = (a.getAttribute("href") || "").replace(/^#/, "");
  275:       if (href === targetHref) {
  276:         a.classList.add("active");
  277:       } else {
  278:         a.classList.remove("active");
  279:       }
  280:     });
  281:     document.getElementById("db-wrapper")?.classList.remove("sidebar-open");
  282:   }
  ```
- **Direct observation**:
  - `<nav class="min-nav-scroll" id="sidebarnav" aria-label="Main Navigation">` starts at line 41 and closes at line 85 (`</nav>`).
  - `<aside class="min-sidebar no-print">` starts at line 29 and closes at line 86 (`</aside>`).
  - Placing `.min-sidebar-footer` between line 85 (`</nav>`) and line 86 (`</aside>`) puts it strictly outside `#sidebarnav`.
  - Omitting the `nav-link` class from `<a class="min-app-mockup-btn" ...>` guarantees that `updateSidebarActiveLink()` (which queries `#sidebarnav .nav-link`) will never select, mutate, or conflict with this link.

### 1.2 Layout & Flex Stacking in `css/custom-demo.css`
- **File**: `/Users/macbookpro/School-Management-System/css/custom-demo.css` (lines 60–75, 105–111, 162–177)
  ```css
  .min-sidebar {
    width: 256px;
    flex-shrink: 0;
    background: var(--surface-card);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    height: 100dvh;
    z-index: 1020;
    transition: transform 0.2s ease;
  }

  .min-nav-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 20px 14px;
  }

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
- **Direct observation**:
  - `.min-sidebar` is a vertical flex container (`display: flex; flex-direction: column`).
  - `.min-nav-scroll` (`#sidebarnav`) has `flex: 1` and takes up all available vertical space.
  - Therefore, any element placed after `</nav>` inside `.min-sidebar` is automatically pinned to the bottom of the sidebar.
  - This flex column behavior is identical in both desktop view and the mobile off-canvas drawer (`max-width: 991.98px`).

### 1.3 Static Routing & Asset Resolution
- **File**: `/Users/macbookpro/School-Management-System/server.js` (lines 41–64)
  ```javascript
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (!path.extname(safePath)) {
          fs.readFile(path.join(ROOT_DIR, "index.html"), (fallbackErr, fallbackData) => {
            ...
          });
          return;
        }
        res.writeHead(404, ...);
        return;
      }
      res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
      res.end(data);
    });
  });
  ```
- **File**: `/Users/macbookpro/School-Management-System/wrangler.json` (lines 5–8)
  ```json
  "assets": {
    "directory": ".",
    "not_found_handling": "single-page-application"
  }
  ```
- **Direct observation**:
  - `server.js` explicitly checks `stats.isDirectory()`. When `phone-mockup/` exists, both `/phone-mockup` and `/phone-mockup/` map directly to `phone-mockup/index.html` and return HTTP 200 with `text/html; charset=utf-8`.
  - Cloudflare Pages (`wrangler.json`) automatically serves directory index files at `path/`.
  - All static asset dependencies exist on disk:
    - `/fonts/feather/feather.css` (12,429 bytes)
    - `/libs/bootstrap-icons/font/bootstrap-icons.min.css` (85,875 bytes)
    - `/css/custom-demo.css` (15,159 bytes)
    - `/uploads/school_favicons/default_school_favicon.svg` (8,622 bytes)
    - `/js/mock-data.js` (232,497 bytes)

---

## 2. Logic Chain

1. **Isolation of the Sidebar Button (`index.html`)**:
   - Observation 1.1 reveals that `updateSidebarActiveLink()` in `js/app.js` selects `#sidebarnav .nav-link`.
   - By inserting the button inside `<div class="min-sidebar-footer">` between `</nav>` (line 85) and `</aside>` (line 86), the button is placed outside `#sidebarnav`.
   - By naming the anchor class `min-app-mockup-btn` without `nav-link`, the routing active-state logic will completely ignore it, preventing inadvertent `.active` highlighting or navigation resets.
   - Observation 1.2 shows that `.min-sidebar` uses `display: flex; flex-direction: column` and `.min-nav-scroll` uses `flex: 1`. Placing `.min-sidebar-footer` after `</nav>` pins it to the bottom-left of the viewport automatically across all screen sizes.

2. **Root-Absolute Asset Inclusions in `phone-mockup/index.html`**:
   - Because `phone-mockup/index.html` is served at `/phone-mockup/` or `/phone-mockup`, relative URLs like `css/custom-demo.css` would resolve to `/phone-mockup/css/custom-demo.css` (causing 404s).
   - Therefore, all asset paths must be root-absolute (`/fonts/...`, `/libs/...`, `/css/...`, `/uploads/...`, `/js/...`, `/phone-mockup/...`).
   - Bootstrap JS and `theme.css` must NOT be loaded on the mockup page to avoid framework CSS conflicts with `.pm-*` classes and prevent global styles from interfering with the mobile frame.

3. **Standalone Shell & Frame Hierarchy**:
   - Top-left navigation: `<a class="pm-home-btn" href="/">` fixed at `top: 20px; left: 20px;` returns directly to the main dashboard.
   - Stage wrapper: `<main class="pm-stage">` centers `<div class="pm-device-wrap" id="pmDeviceWrap">`.
   - Device frame: `<div class="pm-device" id="pmDevice">` contains:
     - 4 hardware buttons as sibling spans: `.pm-hw-action`, `.pm-hw-vol-up`, `.pm-hw-vol-down`, `.pm-hw-power`.
     - `.pm-bezel` containing `.pm-screen` (`#pmScreen`).
     - Inside `.pm-screen`:
       - `.pm-island` (Dynamic Island: 126×37px, centered at top: 11px).
       - `.pm-statusbar` (Status bar: 54px height, with clock `11:35` and inline SVGs for signal, Wi-Fi, battery).
       - `.pm-app` (`#pmApp`: application container with `padding-top: 54px`).
       - `.pm-home-indicator` (iOS home indicator bar: 134×5px, centered at bottom: 8px).

4. **Script Execution Sequence**:
   - Script 1: `/js/mock-data.js` executes first to initialize `window.SMS_STATE` and `window.SMS_PRESETS`.
   - Script 2: `/phone-mockup/mockup-data.js` executes second to initialize `window.PM_DATA` (deterministic seed data).
   - Script 3: `/phone-mockup/mockup-app.js` executes third to bind `fitDevice()`, apply brand theme colors, initialize state, and render `#pmApp`.

---

## 3. Caveats

1. **No Source Code Modifications Made During This Turn**:
   - Per the teamwork explorer role, no code files have been altered. The markup specifications documented here are ready for the implementer agent (`developer_m1_1`).
2. **Existing Dirty Working Tree**:
   - The 7 unstaged modified files in git (`css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`) must never be reverted or stashed. All changes must be strictly additive.
3. **Domain Root Host Assumption**:
   - Root-absolute asset paths (`/fonts/...`, `/css/...`) require the app to be served from the domain root (`/`). Both local development (`http://localhost:3000/`) and Cloudflare Pages satisfy this requirement.

---

## 4. Conclusion

The exact HTML markup and DOM structure for Milestone 1 are defined below with zero ambiguity.

### 4.1 Exact Markup for `index.html` (Lines 84–87)

Insert between line 85 (`</nav>`) and line 86 (`</aside>`):

```html
        <!-- App Mockup shortcut (pinned to sidebar bottom) -->
        <div class="min-sidebar-footer">
          <a
            class="min-app-mockup-btn"
            href="/phone-mockup/"
            title="Preview the Student & Parent mobile app"
          >
            <i class="fe fe-smartphone"></i>
            <span>App Mockup</span>
            <i class="fe fe-arrow-up-right min-app-mockup-arrow"></i>
          </a>
        </div>
```

**Context snippet after modification**:
```html
            <a class="min-nav-link nav-link" href="#/smnadm/settings/school-profile" data-group="settings">
              <i class="fe fe-sliders"></i>
              <span>Settings &amp; Access</span>
            </a>
          </div>
        </nav>

        <!-- App Mockup shortcut (pinned to sidebar bottom) -->
        <div class="min-sidebar-footer">
          <a
            class="min-app-mockup-btn"
            href="/phone-mockup/"
            title="Preview the Student & Parent mobile app"
          >
            <i class="fe fe-smartphone"></i>
            <span>App Mockup</span>
            <i class="fe fe-arrow-up-right min-app-mockup-arrow"></i>
          </a>
        </div>
      </aside>
```

### 4.2 Exact Markup for `css/custom-demo.css` (Milestone 1 Additions)

Append directly after line 177:

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

### 4.3 Exact Complete Markup for `phone-mockup/index.html`

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
    <!-- Shared design tokens (:root vars, typography). Do NOT load theme.css or Bootstrap JS/CSS. -->
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
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .6 10.2 10.2 0 0 0 .8 3.5L2 4.8a8.4 8.4 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.6 6.6 0 0 0 8 4.2 6.6 6.6 0 0 0 3.4 6l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c.4 0 .8.2 1.1.4L8 11.4 6.9 10c.3-.2.7-.4 1.1-.4Z"/></svg>
                  <svg width="27" height="13" viewBox="0 0 27 13" fill="currentColor" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".35"/><rect x="2" y="2" width="17" height="9" rx="2"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" opacity=".4"/></svg>
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

### 4.4 Exact DOM Hierarchy Tree

```
html
└── head
│   ├── meta[charset="utf-8"]
│   ├── meta[name="viewport"]
│   ├── title ("App Mockup · School Management System")
│   ├── link[rel="icon"][href="/uploads/school_favicons/default_school_favicon.svg"]
│   ├── link[rel="stylesheet"][href="/fonts/feather/feather.css"]
│   ├── link[rel="stylesheet"][href="/libs/bootstrap-icons/font/bootstrap-icons.min.css"]
│   ├── link[rel="stylesheet"][href="/css/custom-demo.css"]
│   └── link[rel="stylesheet"][href="/phone-mockup/phone-mockup.css"]
└── body.pm-page
    ├── a.pm-home-btn[href="/"][aria-label="Return to home dashboard"]
    │   ├── i.fe.fe-arrow-left
    │   └── span ("Home")
    ├── main.pm-stage
    │   └── div.pm-device-wrap#pmDeviceWrap
    │       └── div.pm-device#pmDevice[role="region"][aria-label="Mobile app mockup"]
    │           ├── span.pm-hw.pm-hw-action[aria-hidden="true"]
    │           ├── span.pm-hw.pm-hw-vol-up[aria-hidden="true"]
    │           ├── span.pm-hw.pm-hw-vol-down[aria-hidden="true"]
    │           ├── span.pm-hw.pm-hw-power[aria-hidden="true"]
    │           └── div.pm-bezel
    │               └── div.pm-screen#pmScreen
    │                   ├── div.pm-island[aria-hidden="true"]
    │                   ├── div.pm-statusbar[aria-hidden="true"]
    │                   │   ├── span.pm-sb-time#pmSbTime ("11:35")
    │                   │   └── span.pm-sb-icons
    │                   │       ├── svg (Cellular signal 4-bar)
    │                   │       ├── svg (Wi-Fi 3-arc)
    │                   │       └── svg (Battery outline + fill + cap)
    │                   ├── div.pm-app#pmApp
    │                   └── div.pm-home-indicator[aria-hidden="true"]
    ├── script[src="/js/mock-data.js"]
    ├── script[src="/phone-mockup/mockup-data.js"]
    └── script[src="/phone-mockup/mockup-app.js"]
```

---

## 5. Verification Method

Once implemented, independently verify using the following tests:

1. **DOM Structure Verification on `index.html`**:
   ```bash
   grep -n -C 3 'min-app-mockup-btn' index.html
   ```
   *Expected*: Shows `.min-sidebar-footer` directly between `</nav>` and `</aside>`, with no `.nav-link` class present on the anchor tag.

2. **DOM Hierarchy Verification on `phone-mockup/index.html`**:
   ```bash
   test -f phone-mockup/index.html && echo "File exists"
   grep -c 'class="pm-stage"' phone-mockup/index.html          # Expected: 1
   grep -c 'id="pmDeviceWrap"' phone-mockup/index.html         # Expected: 1
   grep -c 'id="pmDevice"' phone-mockup/index.html             # Expected: 1
   grep -c 'class="pm-hw pm-hw-action"' phone-mockup/index.html # Expected: 1
   grep -c 'class="pm-hw pm-hw-vol-up"' phone-mockup/index.html # Expected: 1
   grep -c 'class="pm-hw pm-hw-vol-down"' phone-mockup/index.html # Expected: 1
   grep -c 'class="pm-hw pm-hw-power"' phone-mockup/index.html  # Expected: 1
   grep -c 'class="pm-island"' phone-mockup/index.html         # Expected: 1
   grep -c 'class="pm-statusbar"' phone-mockup/index.html      # Expected: 1
   grep -c 'id="pmSbTime"' phone-mockup/index.html             # Expected: 1
   grep -c 'id="pmApp"' phone-mockup/index.html                # Expected: 1
   grep -c 'class="pm-home-indicator"' phone-mockup/index.html # Expected: 1
   ```

3. **Routing Verification (Local HTTP Server)**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phone-mockup/
   # Expected: 200
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phone-mockup
   # Expected: 200
   curl -s http://localhost:3000/phone-mockup/ | grep '<title>App Mockup'
   # Expected: <title>App Mockup · School Management System</title>
   ```

4. **Root-Absolute Asset Link Verification**:
   ```bash
   grep -E '<(link|script)' phone-mockup/index.html
   ```
   *Expected*: All `href` and `src` attributes begin with `/`. No relative paths like `css/...` or `../...`.

5. **Invalidation Conditions**:
   - If `.nav-link` is added to `.min-app-mockup-btn`.
   - If `.min-sidebar-footer` is placed inside `#sidebarnav` (before `</nav>`).
   - If asset URLs in `phone-mockup/index.html` lack leading `/`.
   - If `theme.css` or Bootstrap JavaScript is loaded into `phone-mockup/index.html`.
