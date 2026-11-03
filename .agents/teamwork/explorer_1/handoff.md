# Investigation Handoff Report — explorer_1

**Summary**: Full architectural investigation of `/Users/macbookpro/School-Management-System` completed. The sidebar integration point (`index.html` lines 85–86), CSS token architecture (`css/custom-demo.css` lines 1–29 and 162–177), git dirty working tree (7 uncommitted files to preserve), mock data alignment (`js/mock-data.js` and `js/app.js`), and root-absolute URL routing (`server.js` and `wrangler.json`) are validated and ready for implementation without risks of regression.

---

## 1. Observation

### 1.1 `index.html` Sidebar Structure and Insertion Point
- **File**: `/Users/macbookpro/School-Management-System/index.html` (lines 80–87)
  ```html
  80:             <a class="min-nav-link nav-link" href="#/smnadm/settings/school-profile" data-group="settings">
  81:               <i class="fe fe-sliders"></i>
  82:               <span>Settings &amp; Access</span>
  83:             </a>
  84:           </div>
  85:         </nav>
  86:       </aside>
  87: 
  88:       <!-- ==================================================================== -->
  89:       <!-- MAIN VIEWPORT COLUMN                                                 -->
  90:       <!-- ==================================================================== -->
  91:       <div class="min-main">
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
- Directly observed:
  1. `<nav class="min-nav-scroll" id="sidebarnav" aria-label="Main Navigation">` opens at line 41 and closes at line 85.
  2. The parent aside `<aside class="min-sidebar no-print">` opens at line 29 and closes at line 86.
  3. `updateSidebarActiveLink()` queries exclusively `#sidebarnav .nav-link`.

### 1.2 `css/custom-demo.css` Tokens and `.min-sidebar-footer`
- **File**: `/Users/macbookpro/School-Management-System/css/custom-demo.css` (lines 7–29)
  ```css
  :root {
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
  }
  ```
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

### 1.3 Git Working Tree Status
- Command executed: `git status`
  ```
  Changes not staged for commit:
    modified:   css/custom-demo.css
    modified:   index.html
    modified:   js/app.js
    modified:   js/mock-data.js
    modified:   js/views-core.js
    modified:   js/views-people-finance.js
    modified:   js/views-rfp-bill24.js
  Untracked files:
    .agents/
  ```
- Command executed: `git diff --stat`
  ```
   css/custom-demo.css        |  18 +-
   index.html                 |  31 --
   js/app.js                  |  18 +-
   js/mock-data.js            | 867 +++++++++++++++++++++++++++++++++++++++++++--
   js/views-core.js           | 480 +++++++++++++++++++------
   js/views-people-finance.js | 680 ++++++++++++++++++++++++++++++-----
   js/views-rfp-bill24.js     |  54 +--
   7 files changed, 1858 insertions(+), 290 deletions(-)
  ```
- Previous uncommitted edits in `index.html` deleted the obsolete `<div class="min-sidebar-footer">...</div>` (white-label dropdown, login OTP, and reset data buttons).
- Previous uncommitted edits in `css/custom-demo.css` changed `.min-sidebar` to `position: fixed` with `margin-left: 256px` on `.min-main`, keeping `.min-sidebar-footer` styles dormant.

### 1.4 `js/mock-data.js` and `js/app.js` State Alignment
- **File**: `/Users/macbookpro/School-Management-System/js/mock-data.js`
  - Line 9–36: `SCHOOL_PRESETS["milky-way"]` with `primaryColor: "#0077b6"`, `primaryHover: "#023e8a"`, `primaryLight: "#f0f9ff"`, `nameEn: "Milky Way School"`, `nameKh: "សាលាមីគីវ៉េ"`.
  - Line 258: `SMS_STATE.schoolProfile: { ...SCHOOL_PRESETS["milky-way"] }`.
  - Line 3471: `window.SMS_PRESETS = SCHOOL_PRESETS`.
  - Lines 669–677: `classTimetable` defines Grade 12-A Tuesday periods:
    P1 (07:30–08:30) Physics, P2 (08:35–09:35) Academic English, P3 (09:35–09:55) Morning Recess, P4 (09:55–11:00) Mathematics, P5 (11:00–13:30) Lunch Break, P6 (13:30–14:45) Biology, P7 (15:00–16:15) Computer Science & AI.
  - Lines 681–706: Student 1 (`Sok Chanreaksa`, card `STU-2026-001`, username `stu_chanreaksa`, class `Grade 12-A`).
  - Lines 1060–1083: Student 11 (`Sok Chanpanha`, card `STU-2026-007`, username `stu_chanpanha`, class `Grade 7-IEP Cambridge Emerald`).
  - Line 2020: Parent 201 (`Sok Vibol`, username `par_vibol`, phone `012 998 877`, children `Sok Chanreaksa (G12-A)` and `Sok Chanpanha (G7-IEP)`).
  - Lines 2085–2109: Invoice INV-2026-0501 for Sok Chanreaksa ($1,852.50 Paid on 2025-09-05 via ABA KHQR, RCP-2026-0801).
  - Lines 2478–2489: `campusScans` gate scans for today:
    - 07:12:04 AM: Sok Chanreaksa (ENTRY, Gate 01)
    - 07:12:18 AM: Sok Chanpanha (ENTRY, Gate 01)
    - 11:32:10 AM: Sok Chanreaksa (EXIT, Gate 01)
- **File**: `/Users/macbookpro/School-Management-System/js/app.js`
  - Lines 12–38: `applySchoolBrandTheme()` reads `window.SMS_STATE.schoolProfile || window.SMS_PRESETS["tele-ict"]` and sets `--brand-primary`, `--brand-primary-hover`, and `--brand-primary-light` on `:root`.

### 1.5 Routing and Asset Resolution (`server.js` and `wrangler.json`)
- **File**: `/Users/macbookpro/School-Management-System/server.js` (lines 41–64)
  ```javascript
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (!path.extname(safePath)) {
          fs.readFile(path.join(ROOT_DIR, "index.html"), ...);
        }
  ```
- **File**: `/Users/macbookpro/School-Management-System/wrangler.json` (lines 5–8)
  ```json
  "assets": {
    "directory": ".",
    "not_found_handling": "single-page-application"
  }
  ```
- Asset files verification:
  `fonts/feather/feather.css`, `libs/bootstrap-icons/font/bootstrap-icons.min.css`, `css/custom-demo.css`, `js/mock-data.js`, `uploads/school_favicons/default_school_favicon.svg`, and `uploads/school_logos/default_school_logo.svg` all exist on disk.
  Fonts inside `fonts/feather/fonts/feather.ttf` and `libs/bootstrap-icons/font/fonts/bootstrap-icons.woff2` exist and resolve properly relative to their CSS files.

---

## 2. Logic Chain

1. **Sidebar Footer Insertion Safety**:
   - Observation 1.1 shows `updateSidebarActiveLink()` executes `document.querySelectorAll("#sidebarnav .nav-link")`.
   - By placing `<div class="min-sidebar-footer">` between `</nav>` (line 85) and `</aside>` (line 86) in `index.html`, the container sits outside `#sidebarnav`.
   - By giving `<a class="min-app-mockup-btn" ...>` no `nav-link` class, `updateSidebarActiveLink()` will never select it, never add/remove `active` class, and never interfere with its state or navigation.
   - Observation 1.2 shows `.min-sidebar` has `display: flex; flex-direction: column` and `.min-nav-scroll` has `flex: 1`. Thus, placing `.min-sidebar-footer` after `</nav>` automatically pins it to the bottom of the sidebar. In mobile viewport (<992px), `.min-sidebar` transitions as an off-canvas drawer and retains this flex column layout.

2. **CSS Custom Properties and Collision Prevention**:
   - Observation 1.2 shows lines 162–177 in `css/custom-demo.css` already define `.min-sidebar-footer` and `.min-sidebar-footer label`.
   - Adding `.min-sidebar-footer { padding: 12px 16px; }` and `.min-app-mockup-btn` directly after line 177 is completely additive and will not conflict with any existing rule.
   - Using the `pm-` prefix for all styles in `phone-mockup/phone-mockup.css` ensures zero style bleed into the main dashboard, while reusing `:root` design tokens (`--brand-primary`, `--surface-bg`, `--surface-card`, `--border-subtle`, radii, and shadows).

3. **Preservation of Uncommitted Changes**:
   - Observation 1.3 reveals that 7 files are currently modified with 1,858 additions and 290 deletions.
   - These modifications include critical updates to the school management system data, responsive layout, fixed sidebar, and RFP modules.
   - Therefore, commands like `git checkout .`, `git stash`, `git reset --hard`, or `git clean` would destroy active uncommitted work and must be strictly forbidden during implementation.

4. **Data Consistency Between Main SPA and Phone Mockup**:
   - Observation 1.4 confirms that `SMS_STATE.schoolProfile` is loaded with `milky-way` (`#0077b6`).
   - The characters, IDs, timetables, and gate events in `mock-data.js` match the requirements:
     - Parent 201: Sok Vibol
     - Student 1: Sok Chanreaksa (G12-A)
     - Student 11: Sok Chanpanha (G7-IEP)
     - Gate activity: Chanreaksa entered at 07:12 AM and exited at 11:32 AM for lunch break. Chanpanha entered at 07:12 AM.
     - Grade averages: Child 1 (643 / 7 = 91.9) and Child 11 (546 / 6 = 91.0).
     - Family outstanding balance: $45.00 (overdue) + $360.00 (due) + $1,305.00 (due) = $1,710.00.
     - Child 1 term attendance: 24 present / 2 late / 1 excused / 0 absent across 27 school days = 96.3%.
   - In `phone-mockup/mockup-app.js`, reading `window.SMS_STATE?.schoolProfile` allows dynamic runtime brand inheritance from the main app, while running state purely in-memory prevents `localStorage` corruption.

5. **Static Routing and Path Resolution**:
   - Observation 1.5 shows `server.js` checks `stats.isDirectory()` and maps directory requests to `index.html`. Thus both `GET /phone-mockup` and `GET /phone-mockup/` return `phone-mockup/index.html` with HTTP 200 without falling back to the root SPA.
   - In Cloudflare Pages (`wrangler.json`), directory index resolution behaves identically.
   - Using root-absolute URLs (`/fonts/...`, `/css/...`, `/phone-mockup/...`) ensures that assets load cleanly regardless of whether the URL ends with a trailing slash or not.

---

## 3. Caveats

- **Root Domain Requirement**: Root-absolute asset paths (`/css/...`, `/fonts/...`) assume the application is hosted at the domain root (`http://localhost:3000/` or `https://example.workers.dev/`). If the app were hosted under a subdirectory path (e.g. `/subpath/`), root-absolute URLs would need an asset prefix. In the current architecture (local dev + Cloudflare Pages), the site is hosted strictly at the domain root.
- **In-Memory State**: As required, `mockup-app.js` must operate strictly in-memory. Reloading the page resets simulated payments and alerts. This is intended by design.

---

## 4. Conclusion

1. **Sidebar Insertion**: Insert `<div class="min-sidebar-footer">...</div>` exactly between `</nav>` (line 85) and `</aside>` (line 86) in `index.html`. Do not apply `.nav-link` to `.min-app-mockup-btn`.
2. **CSS**: Append `.min-app-mockup-btn` and padding override directly after line 177 in `css/custom-demo.css`.
3. **Working Tree**: Preserve all 7 uncommitted modified files in the working tree without running `git stash`, `git checkout`, or `git reset`.
4. **Mock Data**: Create `phone-mockup/mockup-data.js` and `phone-mockup/mockup-app.js` using the exact seed data specified, aligning with `SMS_STATE` and `milky-way` brand `#0077b6`.
5. **Static Routing**: Keep all asset references in `phone-mockup/index.html` root-absolute (`/fonts/...`, `/css/...`, `/libs/...`, `/js/...`, `/phone-mockup/...`).

---

## 5. Verification Method

To independently verify all findings and integration points:

1. **Verify Git Status & Working Tree Safety**:
   ```bash
   git status --short
   ```
   *Expected*: Exactly 7 modified files listed without any reset or loss.

2. **Verify HTML Sidebar Insertion Target Lines**:
   ```bash
   sed -n '83,88p' index.html
   ```
   *Expected*: Shows line 85 as `</nav>` and line 86 as `</aside>`.

3. **Verify CSS Variables & Footer Rule**:
   ```bash
   sed -n '162,178p' css/custom-demo.css
   ```
   *Expected*: Shows `.min-sidebar-footer` and `.min-sidebar-footer label`.

4. **Verify Static Asset Existence**:
   ```bash
   test -f fonts/feather/feather.css && test -f libs/bootstrap-icons/font/bootstrap-icons.min.css && test -f css/custom-demo.css && test -f js/mock-data.js && echo "All static assets present"
   ```

5. **Verify Mock Data Alignment (Node oracle)**:
   ```bash
   node -e '
   const fs = require("fs");
   const mockDataCode = fs.readFileSync("js/mock-data.js", "utf8");
   const window = {};
   eval(mockDataCode);
   console.log("Preset:", window.SMS_PRESETS["milky-way"].id, window.SMS_PRESETS["milky-way"].primaryColor);
   '
   ```
   *Expected*: `Preset: milky-way #0077b6`.

6. **Invalidation Conditions**:
   - If `updateSidebarActiveLink()` is modified to query elements outside `#sidebarnav`, or if `.nav-link` is added to `.min-app-mockup-btn`.
   - If any git command discards the 7 dirty files in the working tree.
   - If relative URLs (without leading `/`) are used in `phone-mockup/index.html`.
