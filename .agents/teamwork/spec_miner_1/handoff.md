# Phone App Mockup (`/phone-mockup`): Deep Specification Mining Report

**Agent**: `spec_miner_1` (teamwork_spec_miner)  
**Date**: 2026-11-03  
**Status**: COMPLETE / HARD HANDOFF  
**Target Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/spec_miner_1/`

---

## 1. Observation

Direct observations from the authoritative specifications (`ORIGINAL_REQUEST.md`, `implementation_plan.md`) and the existing codebase:

1. **Routing and Serving Behavior**:
   - `server.js` (lines 41–45): Checks `fs.stat(filePath)`: if it is a directory, it maps to `path.join(filePath, "index.html")`. For missing files without an extension (lines 49–60), it falls back to the SPA `index.html`. Therefore, creating the directory `phone-mockup/index.html` enables both `/phone-mockup` and `/phone-mockup/` to serve `phone-mockup/index.html` with HTTP 200 without touching `server.js`.
   - `wrangler.json` (lines 5–8): Uses `"directory": "."` with `"not_found_handling": "single-page-application"`. Cloudflare Pages serves directory index files automatically at `path/` and redirects `path` to `path/` (or vice-versa).
2. **Existing UI Hooks and Sidebar Structure**:
   - `index.html` (lines 80–86): `<nav id="sidebarnav" class="min-nav-scroll">` closes at line 85 (`</nav>`), followed immediately by line 86 (`</aside>`).
   - Inserting `.min-sidebar-footer` outside `<nav>` avoids interference from `updateSidebarActiveLink()` in `js/app.js` (which targets `#sidebarnav a.nav-link`).
   - `css/custom-demo.css` (lines 162–177): Already declares `.min-sidebar-footer` with `padding: 16px; border-top: 1px solid var(--border-subtle); background: #fcfcfd;`. Modifying it to `padding: 12px 16px;` and adding `.min-app-mockup-btn` creates a pinned sidebar shortcut.
3. **Seed Data Alignment**:
   - `js/mock-data.js` (line 2020): Guardian `id: 201`, `nameEn: "Sok Vibol"`, `phone: "012 998 877"`, `username: "par_vibol"`, with children `["Sok Chanreaksa (G12-A)", "Sok Chanpanha (G7-IEP)"]`.
   - `js/mock-data.js` (lines 669–677): `classTimetable` defines Grade 12-A periods 1 through 7 with Morning Recess (09:35–09:55) and Lunch (11:00–13:30).
   - `js/mock-data.js` (lines 2481, 2482, 2488): `campusScans` shows Chanreaksa (`STU-2026-001`) ENTRY at `07:12:04 AM`, EXIT at `11:32:10 AM`, and Chanpanha (`STU-2026-007`) ENTRY at `07:12:18 AM`.
4. **Active Workspace State**:
   - `git status` reveals 7 unstaged modified files: `css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`. None of these must be reverted, stashed, or overwritten.

---

## 2. Logic Chain

1. **Standalone Architecture**:
   - By creating `phone-mockup/index.html` as an independent entry point, the phone preview operates in complete isolation from the main SPA hash router (`#/smnadm/...`).
   - It references existing design variables via `<link rel="stylesheet" href="/css/custom-demo.css">` and school profiles via `<script src="/js/mock-data.js">`, dynamically reading `SMS_STATE.schoolProfile.primaryColor`.
2. **Fixed "Demo Now" Clock**:
   - Running live timestamps would contradict static gate logs and schedule periods.
   - Fixing demo time at **Tuesday, 3 November 2026, 11:35 AM** aligns with:
     - Gate exit at 11:32 AM (Lunch break exit)
     - Active schedule period: Lunch break (11:00–13:30)
     - Next scheduled period: Biology (13:30–14:45)
     - Gate duration today: 07:12 AM to 11:32 AM = 260 minutes = 4h 20m.
3. **In-Memory Volatility**:
   - The user specified zero persistence across reloads. Therefore, state mutations (e.g. paying invoices, switching tabs, toggling alert read states) must mutate only local in-memory JavaScript objects, never writing to `localStorage` or triggering `saveSmsState()`.

---

## 3. Caveats

1. **No External Libraries**: Do not import QRCode.js, Lucide, or external CDNs. All icons must use existing Bootstrap Icons (`/libs/bootstrap-icons/font/bootstrap-icons.min.css`) and Feather (`/fonts/feather/feather.css`). QR code generation must be purely deterministic SVG/CSS (`pseudoQr`).
2. **No Emoji in UI Text**: Strict instruction from specification: avoid emoji in all copy, buttons, pills, and empty states. Use semantic Bootstrap icons instead (e.g. `bi-check-circle`).
3. **No Reset of Git Working Tree**: Modifying files outside the designated new paths (`phone-mockup/*`) or touching existing uncommitted files risks corrupting in-flight work.

---

## 4. Conclusion

The specification is complete, mathematically validated, and fully reproducible. All requirements R1–R6, component geometries, UI state machines, calculations, and data structures are defined without ambiguity. Implementation can proceed directly following the detailed blueprints below.

---

## 5. Verification Method

1. **Syntax Check**:
   ```bash
   node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
   ```
2. **Data & Math Oracles Assertion**:
   ```bash
   node -e '
   global.window = {};
   require("./phone-mockup/mockup-data.js");
   const D = window.PM_DATA;
   const due = D.invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);
   if (due.toFixed(2) !== "1710.00") throw new Error("Balance mismatch: " + due);
   const avg = a => (a.reduce((s, x) => s + x.score, 0) / a.length).toFixed(1);
   if (avg(D.reports[1].subjects) !== "91.9") throw new Error("Child 1 avg mismatch");
   if (avg(D.reports[11].subjects) !== "91.0") throw new Error("Child 11 avg mismatch");
   console.log("All data oracles passed!");
   '
   ```
3. **HTTP Route Check**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phone-mockup/   # 200
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phone-mockup    # 200
   curl -s http://localhost:3000/phone-mockup/ | grep -c 'id="pmDevice"'           # 1
   curl -s http://localhost:3000/ | grep -c 'min-app-mockup-btn'                   # 1
   ```

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Navigation | Sidebar App Mockup Button | Pinned link in main desktop/mobile sidebar footer | User click on `.min-app-mockup-btn` | Navigates to `/phone-mockup/` | Handled via normal anchor href | ORIGINAL_REQUEST R1, implementation_plan §1 |
| 2 | Navigation | Standalone "← Home" Button | Return pill button fixed at top-left of viewport | User click | Navigates to `/` | Standard href link | ORIGINAL_REQUEST R2, implementation_plan §2 |
| 3 | Shell | iPhone 15 Pro Hardware Frame | Realistic titanium border, side buttons, bezel, island, status bar, home indicator | Static markup + CSS styles | 393×852 pt screen within 417×876 px outer frame | Gracefully clips content via `overflow: hidden` | ORIGINAL_REQUEST R2, implementation_plan §3 |
| 4 | Shell | Dynamic Viewport Scaling | JS resize calculation that scales device to fit viewport without scrollbars | `window.innerWidth`, `window.innerHeight` | Sets `#pmDevice` scale and `#pmDeviceWrap` dimensions | Clamped between `0.45` and `1.0` | ORIGINAL_REQUEST R2, implementation_plan §5a |
| 5 | Shell | Fixed Demo Clock & Status Bar | Displays `11:35` with signal, Wi-Fi, and battery icons | None (constant) | Visual status bar at top (54px) | None | implementation_plan §2, §3b |
| 6 | Brand | Dynamic Brand Synchronization | Reads `--brand-primary` from `SMS_STATE.schoolProfile` | `window.SMS_STATE` or preset | Applied to CSS custom properties on `:root` | Fallback to Milky Way `#0077b6` on error | ORIGINAL_REQUEST R6, implementation_plan §5a |
| 7 | Auth | Role Segmented Control | Switches between Student and Parent modes | Click on Student / Parent pill | Re-renders form labels, placeholders, prefilled creds | None | ORIGINAL_REQUEST R3, implementation_plan §5e |
| 8 | Auth | Credential Prefilling | Prefills `stu_chanreaksa` / `par_vibol` and `demo1234` | State role change | Form fields populated | Resets on role switch | ORIGINAL_REQUEST R3, implementation_plan §4 |
| 9 | Auth | Password Visibility Toggle | Toggles password field between `password` and `text` | Click on eye icon | Changes input type & toggles `bi-eye` / `bi-eye-slash` | Updates DOM directly without re-render | ORIGINAL_REQUEST R3, implementation_plan §5d |
| 10 | Auth | Inline Credential Validation | Prevents submission of empty inputs | Form submit with empty value | Red border `#d92d20` and error text | Prevents submission | ORIGINAL_REQUEST R3, implementation_plan §5d |
| 11 | Auth | Sign-In Loading Transition | Shows button spinner and delays sign-in | Form submit with valid inputs | Button displays spinner + "Signing in…", switches view after 700ms | None | ORIGINAL_REQUEST R3, implementation_plan §5d |
| 12 | Auth | Forgot Password Toast | Informs user how to recover credentials | Click "Forgot password?" | Displays `.pm-toast` for 2200ms | Dismisses automatically | implementation_plan §5d |
| 13 | Student | Student Home Hero Card | Shows campus status, checkout info, and next class | Timetable & GateLog derived data | "Lunch break · 11:00 – 13:30", "Checked out 11:32 AM", "Next: Biology" | Computed dynamically | ORIGINAL_REQUEST R4, implementation_plan §5e |
| 14 | Student | Quick Stat Overview Cards | Two-column cards linking to Attendance & Report | Click card | Switches to `attendance` or `report` tab | None | ORIGINAL_REQUEST R4, implementation_plan §5e |
| 15 | Student | Today's Schedule Mini-List | Compact list of periods with Now/Next pills | `timetables[1].tue` | Visual status pills (`Now`, `Next`, past checkmarks) | None | ORIGINAL_REQUEST R4, implementation_plan §5e |
| 16 | Student | Announcement Card | Highlights school events | `PM_DATA.announcement` | Card with icon, title, and date/description | None | ORIGINAL_REQUEST R4, implementation_plan §4, §5e |
| 17 | Student | Schedule Weekday Selector | Mon–Sat day selector buttons (2–7 Nov 2026) | Click weekday button | Updates timetable view for that day | None | ORIGINAL_REQUEST R4, implementation_plan §5e |
| 18 | Student | Schedule Period Timeline | Periods with times, subject, teacher, room, recess/lunch | Selected day timetable | Formatted rows with accent borders and break styling | None | ORIGINAL_REQUEST R4, implementation_plan §4a, §5e |
| 19 | Student | Report Average Ring | Circular conic-gradient progress ring for GPA | Computed score average (91.9) | Renders circular ring with average value centered | Clamped 0-100% | ORIGINAL_REQUEST R4, implementation_plan §3c, §5e |
| 20 | Student | Subject Breakdown Cards | Subject rows with letter grade pills and progress bars | `reports[1].subjects` | Letter pills (A+, A, B+, B, C, D) + progress bar | Formula thresholding | ORIGINAL_REQUEST R4, implementation_plan §4d, §5e |
| 21 | Student | Recent Assessments List | List of recent quizzes and tests with scores | `reports[1].recent` | Shows title, subject, date, and score fraction | None | ORIGINAL_REQUEST R4, implementation_plan §4d, §5e |
| 22 | Student | Homeroom Teacher Comment | Display homeroom teacher's narrative evaluation | `reports[1].comment` | Quote card with homeroom teacher attribution | None | ORIGINAL_REQUEST R4, implementation_plan §4d, §5e |
| 23 | Student | PDF Download Simulation | Button to download midterm report PDF | Click "Download report (PDF)" | Displays toast "Report downloaded" | None | implementation_plan §5e |
| 24 | Student | Attendance Rate Ring | Circular conic-gradient ring for attendance rate | Term school days & presence (96.3%) | Conic-gradient ring showing 96.3% | Formula calculation | ORIGINAL_REQUEST R4, implementation_plan §4b, §5e |
| 25 | Student | Attendance Counter Grid | 4-up metric cards: Present, Late, Excused, Absent | Aggregated counts | Present 24, Late 2, Excused 1, Absent 0 | None | ORIGINAL_REQUEST R4, implementation_plan §4b, §5e |
| 26 | Student | Attendance Calendar Grid | 7-column calendar grid with status dots for Oct & Nov | Selected month state | Calendar days with status dots and today outline | Mon-first alignment | ORIGINAL_REQUEST R4, implementation_plan §4b, §5e |
| 27 | Student | Attendance Records List | List of non-present days with specific notes | Non-present records | Late notes, excused reasons, status pills | Empty state if perfect | ORIGINAL_REQUEST R4, implementation_plan §4b, §5e |
| 28 | Student | Check-in Daily Gate Timeline | Gate entry and exit events for today | Gate log events today | Timeline with icons, gates, times, notes | Empty state if no events | ORIGINAL_REQUEST R4, implementation_plan §4c, §5e |
| 29 | Student | Campus Duration Calculation | Calculates total elapsed campus time today | Today's in/out timestamps | Displays "4h 20m" (07:12 AM to 11:32 AM) | Only counts completed pairs | ORIGINAL_REQUEST R4, implementation_plan §5e |
| 30 | Student | Campus ID QR Modal Sheet | Bottom sheet displaying student barcode / QR | Click "Show my campus ID" | Opens sheet with `pseudoQr("STU-2026-001")` | Closes via Done or backdrop | ORIGINAL_REQUEST R4, implementation_plan §5c, §5e |
| 31 | Parent | Child Switcher Sheet | Bottom sheet to switch active child between 1 & 11 | Click child switcher pill | Displays children list with avatars and active check | Closes on select | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 32 | Parent | Children Status Cards | Overview cards for Chanreaksa & Chanpanha on Home | Gate status, attendance, avg scores | In/out status pills, attendance %, average score | Click navigates to child scores | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 33 | Parent | Next Payment Due Card | Prominent card showing upcoming family invoice | Earliest non-overdue invoice | Amount ($1,305.00), child name, due days, Pay Now | Displays overdue alert if any | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 34 | Parent | Simulated iOS Push Banner | In-app notification appearing 1.5s after parent login | Timer (1500ms post-login) | Animated iOS notification banner sliding down | Dismisses on tap or after 6s | ORIGINAL_REQUEST R5, implementation_plan §5f |
| 35 | Parent | Push Banner Interaction | Tapping banner opens Alerts tab directly | Click push banner | Navigates to Alerts tab and marks unread as read | Banner slides out | ORIGINAL_REQUEST R5, implementation_plan §5f |
| 36 | Parent | Gate Event Alert Feed | Detailed feed of children's gate entries and exits | `gateLog` filtered by child | Timeline rows with gate, method, note, and time | Unread rows highlighted | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 37 | Parent | Alert Filter Chips | Filters gate feed by All, Chanreaksa, or Chanpanha | Click filter chip | Updates visible gate event feed | None | implementation_plan §5d, §5e |
| 38 | Parent | Child Midterm Scores View | Midterm report card for active child | `reports[state.childId]` | Average ring, GPA, rank, subject grades, comment | Switches on child change | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 39 | Parent | Child Timetable Schedule View | Daily schedule for active child | `timetables[state.childId]` | Displays child's specific subjects and timings | Handles P1-P7 vs P1-P4 | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 40 | Parent | Family Payments Hero Card | Card showing total outstanding family balance | Sum of non-Paid invoices | Total ($1,710.00), number of children, next due | Updates on payment | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 41 | Parent | Invoice Filter Segment | Segmented toggle between Due and Paid invoices | Click Due / Paid segment | Filters invoice list | Overdue invoices listed first | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 42 | Parent | Interactive Payment Sheet | 3-step bottom sheet: method choose, process, receipt | Click "Pay" on an invoice | Method selector, processing spinner, success receipt | Prevents duplicate pay | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 43 | Parent | Dynamic Bakong KHQR | Generates KHQR code on selecting Bakong method | Method selection `khqr` | Displays `pseudoQr(invoiceNo)` with instruction | Auto-updates on invoice | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 44 | Parent | Payment Balance Reduction | Real-time balance deduction after invoice payment | Payment completion | Reduces family balance by invoice amount | Tab dot & overdue badge update | ORIGINAL_REQUEST R5, implementation_plan §5e |
| 45 | Shell | Account & Sign Out Sheet | Avatar click opens account modal to sign out | Click header avatar | Bottom sheet with profile info & Sign Out button | Returns to Login view | ORIGINAL_REQUEST R3, implementation_plan §5d |
| 46 | Accessibility | Reduced Motion Support | Disables all CSS keyframe animations | OS `prefers-reduced-motion` | All animations & transitions set to none | Instant view switches | implementation_plan §3c, §8 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Device Scaling | Viewport 1440×900 | Scale `s = (900 - 80) / 876 = 0.936`. Device rendered at 390×820px, fully visible without vertical or horizontal scrollbars. |
| 2 | Device Scaling | Viewport 1280×720 | Scale `s = (720 - 80) / 876 = 0.730`. Device rendered at 304×640px, fits neatly on screen. |
| 3 | Device Scaling | Viewport 390×844 | Scale `s = (390 - 32) / 425 = 0.842`. Device fits within narrow mobile display without horizontal overflow. |
| 4 | Device Scaling | Extremely small viewport (e.g. 320×480) | Scale clamped at minimum `0.45` to maintain legibility. |
| 5 | Login Validation | Empty username or password submitted | Form submission intercepted; input border turns `#d92d20` and inline message "Please enter your credentials" appears. |
| 6 | Login Toggle | Switching from Student to Parent | Username field automatically changes to `par_vibol`, password remains `demo1234`, label updates to "Phone number or username", submit button updates to "Sign in as Parent". |
| 7 | Login Password Visibility | Clicking eye icon | Flips input type from `password` to `text` and icon from `bi-eye` to `bi-eye-slash` directly without page re-render, preserving user typed input. |
| 8 | Timetable Saturday | Saturday selected for Child 1 (G12-A) | Period 7 has subject `"-"` in source data; period 7 is suppressed, showing only periods 1–6 (ending at 14:45). |
| 9 | Timetable Saturday | Saturday selected for Child 11 (G7-IEP) | Timetable ends after Period 4 (11:20 AM); lunch break row and afternoon periods P5–P7 are omitted completely. |
| 10 | Timetable Period Status | Non-Tuesday weekday viewed (e.g. Wednesday) | All periods render without "Now" or "Next" status markers since current demo day is Tuesday. |
| 11 | Timetable Period Status | Tuesday at 11:35 AM (demoNow) | "Lunch break" (11:00–13:30) is marked "Now"; "Biology" (13:30–14:45) is marked "Next"; morning periods are marked "past". |
| 12 | Attendance Calendar Bounds | User clicks Left Arrow on October 2026 | Navigation arrow is disabled; month cannot go earlier than `2026-10`. |
| 13 | Attendance Calendar Bounds | User clicks Right Arrow on November 2026 | Navigation arrow is disabled; month cannot go later than `2026-11`. |
| 14 | Attendance Status | Day after demo date (e.g. Nov 4–30) | Rendered as a future day without attendance dot. |
| 15 | Attendance Sundays | Sunday in calendar (e.g. Oct 4, 11, 18, 25; Nov 1) | Rendered as weekend day; excluded from school day count. |
| 16 | Attendance Holidays | Oct 15 & Oct 29 | Rendered with muted number and "H" label; excluded from school day count and attendance rate denominator. |
| 17 | Campus Duration Today | Open/Unclosed Gate Interval | Only completed in/out pairs are counted (07:12 AM to 11:32 AM). If a student is currently on campus without checkout, open interval is excluded from duration. |
| 18 | Gate Log History | Mon 2 Nov 2026 for Child 1 | No gate scans exist because student was excused; card shows info pill "Excused · Medical". |
| 19 | Alerts Push Banner | User navigates across tabs while banner active | Push banner remains mounted and is not wiped by tab `render()`; tapping banner navigates directly to Alerts. |
| 20 | Alerts Push Banner | Banner timeout | Automatically slides out and unmounts after 6000ms if not clicked. |
| 21 | Alerts Unread Badge | Viewing Alerts tab | Badge on Alerts tab (`.pm-tab-badge`) displaying "1" disappears immediately upon opening Alerts tab. |
| 22 | Payment Flow Step 1 | Method toggle to Bakong KHQR | Instantly displays generated SVG QR code for the invoice and dynamic prompt "Scan with any KHQR banking app". |
| 23 | Payment Flow Step 2 | Clicking "Pay $XX" | Enters `processing` state for 1200ms; button shows spinner and "Processing payment…"; user cannot double-click. |
| 24 | Payment Flow Step 3 | Payment completion | Invoice status changes to "Paid", `paidOn` set to `2026-11-03`, receipt generated (`RCP-2026-0910`), family balance drops by amount paid. |
| 25 | Overdue Payment Resolution | Paying INV-2026-0618 ($45.00 overdue) | Overdue invoice cleared; Payments tab red dot (`.pm-tab-dot`) disappears; Home payment card overdue alert disappears. |
| 26 | Payments Filter Empty State | Switching to "Due" when all paid | Renders clean empty state with `bi-check-circle` icon and text "All caught up · No payments due" (no emojis). |
| 27 | Brand Color Theme | Main site changes schoolProfile brand | Phone mockup loads and inherits new `--brand-primary` color and lighter/hover tints dynamically. |
| 28 | Page Refresh | User refreshes `/phone-mockup/` | State completely resets to initial seed data; no persistence in `localStorage` or session cookies. |

---

## Detailed Specification Mining

### 1. Requirements Enumeration (R1 – R6)

#### Requirement R1: App Mockup Button in Sidebar
- **File to Edit**: `index.html` and `css/custom-demo.css`.
- **DOM Placement**: Inside `<aside class="min-sidebar">`, between the closing `</nav>` tag of `<nav id="sidebarnav" class="min-nav-scroll">` and the closing `</aside>` tag.
- **Markup Specification**:
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
- **CSS Styling (`css/custom-demo.css`)**:
  - `.min-sidebar-footer`: Adjust padding to `12px 16px;`.
  - `.min-app-mockup-btn`: `display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-card); color: var(--text-secondary); font-size: 0.78rem; font-weight: 500; text-decoration: none; box-shadow: var(--shadow-xs); transition: all 0.15s ease;`
  - Hover / Focus-visible: `background: var(--brand-primary-light); border-color: var(--brand-primary); color: var(--brand-primary); outline: none;`
  - Icon hover: `color: var(--brand-primary);`
  - Arrow hover: `transform: translate(1px, -1px);`
- **Responsive Requirement**: Works on desktop fixed sidebar and inside off-canvas mobile drawer (<992px).

#### Requirement R2: Mockup Page Shell and Device Frame
- **Files to Create**: `phone-mockup/index.html` and `phone-mockup/phone-mockup.css`.
- **Viewport Layout**: Full viewport flex stage (`.pm-stage`) centered vertically and horizontally. Page background has radial gradient using `--brand-primary-light` and `--surface-bg`.
- **Top-left Navigation**:
  ```html
  <a class="pm-home-btn" href="/" aria-label="Return to home dashboard">
    <i class="fe fe-arrow-left"></i><span>Home</span>
  </a>
  ```
- **Hardware Proportions**:
  - Screen dimensions: 393 × 852 pt.
  - Device frame: 417 × 876 px, outer corner radius `68px`.
  - Outer border gradient: `linear-gradient(145deg, #5b5e63 0%, #2c2e32 38%, #6a6d72 55%, #2a2c30 100%)`.
  - Inner bezel: `width: 100%; height: 100%; border-radius: 64px; background: #0b0b0d; padding: 8px;`.
  - Hardware buttons (protruding outside outer frame):
    - Action button: `left: -3px; top: 150px; height: 32px;`
    - Volume Up button: `left: -3px; top: 205px; height: 62px;`
    - Volume Down button: `left: -3px; top: 280px; height: 62px;`
    - Power button: `right: -3px; top: 235px; height: 100px;`
  - Dynamic Island: `position: absolute; top: 11px; left: 50%; translate: -50% 0; width: 126px; height: 37px; border-radius: 20px; background: #000; z-index: 60;`.
  - Status Bar: `position: absolute; inset: 0 0 auto 0; height: 54px; padding: 4px 30px 0 52px; z-index: 55;` with fixed time `11:35` and inline SVG icons for signal, Wi-Fi, and battery.
  - Home Indicator: `position: absolute; bottom: 8px; left: 50%; translate: -50% 0; width: 134px; height: 5px; border-radius: 3px; background: var(--text-main); z-index: 60;`.
- **Dynamic Fit Logic**:
  - Computes `scale = Math.max(0.45, Math.min(1, (innerHeight - 80) / 876, (innerWidth - 32) / 425))`.
  - Sets `transform = scale(${scale})` on `#pmDevice` and wraps with `#pmDeviceWrap` dimensioned to `425 * scale` by `876 * scale`.

#### Requirement R3: Data and Authentication Model
- **File**: `phone-mockup/mockup-data.js` and `phone-mockup/mockup-app.js`.
- **Seed State**: Declared as `window.PM_DATA` (pure plain JavaScript object, zero functions).
- **Authentication Modes**:
  - Segmented toggle: Student (`<i class="bi bi-mortarboard-fill"></i> Student`) vs Parent (`<i class="bi bi-people-fill"></i> Parent`).
  - Student credentials: Username `stu_chanreaksa`, Password `demo1234`, Label `Student ID or username`.
  - Parent credentials: Username `par_vibol`, Password `demo1234`, Label `Phone number or username`.
  - Password eye toggle: Flips input type without re-rendering.
  - Inline error: Submitting empty username or password highlights input border in `#d92d20` with validation text.
  - Loading animation: Submitting triggers 700ms simulated network delay with button spinner and text "Signing in…".
- **Persistence Rule**: Entire state lives in memory within `state` variable; strictly no writing to `localStorage` or calling `window.saveSmsState()`.

#### Requirement R4: Student Portal (5 Tabs)
- **Profile**: Sok Chanreaksa (G12-A).
- **Tab 1: Home**:
  - Header: Eyebrow "Tuesday, 3 November", Title "Good morning, Chanreaksa", Avatar "SC".
  - Hero Card: Status "Lunch break · 11:00 – 13:30", gate exit "Checked out 11:32 AM · Gate 01", divider, next class "Biology" ("13:30 – 14:45 · Room B-201 · Mr. Vannak Keo").
  - Stat Cards: Attendance "96.3%" ("This term"), Average score "91.9" ("GPA 3.85").
  - Today's Classes List: Periods with status pills ("Now", "Next", past checkmarks).
  - Announcements Card: "Independence Day", "Mon, 9 November · No classes · Campus closed".
- **Tab 2: Schedule**:
  - Weekday strip: Mon–Sat buttons (2–7 Nov 2026), active day highlighted.
  - Period List: Period time, subject name, teacher and room, recess and lunch breaks with dashed rows.
  - Status Indicators: Lunch break highlighted with "Now" pill; Biology highlighted with "Next" pill.
- **Tab 3: Report**:
  - Summary Card: Conic-gradient ring showing 91.9%, GPA 3.85, Class rank "2 of 31", "Midterm published" pill.
  - Subjects List: Grade letter pills (A+, A, B+), score fractions (e.g. 95/100), and progress bars.
  - Recent Assessments: List of recent test scores.
  - Homeroom Comment: Dr. Sokha Chan's evaluation quote card.
  - Download Button: Ghost button triggering toast "Report downloaded".
- **Tab 4: Attendance**:
  - Summary: 96.3% attendance rate conic ring; 4 counters (Present: 24, Late: 2, Excused: 1, Absent: 0).
  - Calendar Card: Navigation between Oct and Nov 2026; status dots (green, orange, blue, red, holiday H).
  - Record List: Non-present days with specific notes (Oct 8 late 11m, Oct 21 late 8m, Nov 2 dental excused).
- **Tab 5: Check-in Log**:
  - Today Card: "Off campus" status; Gate 01 Entry (07:12 AM) and Exit (11:32 AM); campus duration "4h 20m".
  - QR Code Action: Button "Show my campus ID" opening bottom sheet with deterministic `pseudoQr` and student ID.
  - History Feed: Previous scans (Sat 31 Oct, Fri 30 Oct, Wed 28 Oct) and excused note for Mon 2 Nov.

#### Requirement R5: Parent Portal (5 Tabs)
- **Profile**: Sok Vibol (Parent ID 201).
- **Child Switcher**: Bottom sheet selector toggling between Child 1 (Sok Chanreaksa, G12-A) and Child 11 (Sok Chanpanha, G7-IEP).
- **Tab 1: Home**:
  - Header: Eyebrow date, Title "Good morning, Mr. Vibol", Avatar "SV".
  - Children Cards: Chanreaksa (Off campus · Out 11:32 AM, Att 96.3%, Avg 91.9), Chanpanha (On campus · In 07:12 AM, Att 100%, Avg 91.0). Clicking a card navigates to Scores for that child.
  - Payment Due Card: Next due "$1,305.00" (Cambridge IEP Term 2 Tuition · Chanpanha, Due in 7 days, "Pay now" button) + overdue alert banner ("1 overdue invoice · $45.00").
  - Latest Alerts: Top 3 gate scan events.
- **Tab 2: Alerts**:
  - Setting toggle banner: "Instant gate notifications enabled".
  - Timeline of gate entries/exits with filter chips: All, Chanreaksa, Chanpanha.
  - Unread count badge ("1") on Alerts tab clears upon viewing.
  - Simulated iOS push banner: Injected 1.5s post-login, auto-dismisses after 6s or switches to Alerts on tap.
- **Tab 3: Scores**:
  - Child switcher header.
  - Midterm report card for selected child (Chanreaksa avg 91.9, GPA 3.85 / Chanpanha avg 91.0, GPA 3.78).
- **Tab 4: Schedule**:
  - Child switcher header.
  - Complete daily timetable for selected child (Chanreaksa G12-A or Chanpanha G7-IEP).
- **Tab 5: Payments**:
  - Family Card: Total outstanding "$1,710.00", "2 children · next due 10 Nov".
  - Child switcher & Due / Paid segmented filter.
  - Invoices List: Overdue items sorted first, then by due date.
  - Interactive Payment Sheet:
    - Step 1: Method selection (ABA PayWay, Bakong KHQR with dynamic QR, ACLEDA Mobile), amount, child name.
    - Step 2: 1200ms processing animation with spinner.
    - Step 3: Success checkmark animation (`pmPop`), receipt number generation (`RCP-2026-0910`), invoice marked Paid.
    - Real-time balance reduction: Outstanding drops by paid amount (e.g. from $1,710.00 to $1,665.00) and tab red dot clears.

#### Requirement R6: Technical Constraints and Integrations
- **Zero Build Tools**: 100% vanilla ES2020 JavaScript, standard CSS, static HTML.
- **Runtime Styling**: Brand color inherited dynamically via `SMS_STATE.schoolProfile`.
- **Codebase Integrity**: No modifications to `js/mock-data.js`, `js/app.js`, `js/views-*.js`, `server.js`, or `wrangler.json`.
- **Git Safety**: Never execute `git reset`, `git stash`, or `git checkout`.
- **Accessibility & UX**: All interactive elements keyboard focusable (`:focus-visible`), reduced motion support (`prefers-reduced-motion`), and strict omission of emoji in UI strings.

---

### 2. Exact Data Schema for `mockup-data.js`

The file must define `window.PM_DATA` with the exact schema below:

```javascript
window.PM_DATA = {
  demoNow: {
    iso: "2026-11-03",
    dayKey: "tue",
    dateLabel: "Tuesday, 3 November",
    clock: "11:35",
    minutes: 695,
    greeting: "Good morning"
  },
  credentials: {
    student: {
      username: "stu_chanreaksa",
      password: "demo1234",
      label: "Student ID or username"
    },
    parent: {
      username: "par_vibol",
      password: "demo1234",
      label: "Phone number or username"
    }
  },
  student: {
    childId: 1
  },
  parent: {
    id: 201,
    nameEn: "Sok Vibol",
    salutation: "Mr. Vibol",
    initials: "SV",
    relation: "Father",
    phone: "012 998 877",
    username: "par_vibol",
    childIds: [1, 11]
  },
  children: {
    1: {
      id: 1,
      nameEn: "Sok Chanreaksa",
      nameKh: "សុខ ចាន់រក្សា",
      first: "Chanreaksa",
      initials: "SC",
      cardId: "STU-2026-001",
      username: "stu_chanreaksa",
      classShort: "G12-A",
      className: "Grade 12-A · Science Track",
      campus: "Campus #01 · Sen Sok HQ",
      homeroom: "Dr. Sokha Chan",
      color: "var(--brand-primary)"
    },
    11: {
      id: 11,
      nameEn: "Sok Chanpanha",
      nameKh: "សុខ ចាន់បញ្ញា",
      first: "Chanpanha",
      initials: "SP",
      cardId: "STU-2026-007",
      username: "stu_chanpanha",
      classShort: "G7-IEP",
      className: "Grade 7 · Cambridge Emerald",
      campus: "Campus #01 · Sen Sok HQ",
      homeroom: "Ms. Bopha Pich",
      color: "#7a5af8"
    }
  },
  timetables: {
    1: {
      mon: [
        { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
        { start: "08:35", end: "09:35", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
        { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
        { start: "09:55", end: "11:00", subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
        { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
        { start: "13:30", end: "14:45", subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" },
        { start: "15:00", end: "16:15", subject: "BacII Problem Solving", teacher: "Dr. Sokha Chan", room: "Room B-201" }
      ],
      tue: [
        { start: "07:30", end: "08:30", subject: "Physics", teacher: "Mr. Dara Vong", room: "Science Lab B-302" },
        { start: "08:35", end: "09:35", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
        { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
        { start: "09:55", end: "11:00", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
        { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
        { start: "13:30", end: "14:45", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" },
        { start: "15:00", end: "16:15", subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
      ],
      wed: [
        { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
        { start: "08:35", end: "09:35", subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" },
        { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
        { start: "09:55", end: "11:00", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
        { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
        { start: "13:30", end: "14:45", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Room B-201" },
        { start: "15:00", end: "16:15", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }
      ],
      thu: [
        { start: "07:30", end: "08:30", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "08:35", end: "09:35", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
        { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
        { start: "09:55", end: "11:00", subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
        { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
        { start: "13:30", end: "14:45", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
        { start: "15:00", end: "16:15", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }
      ],
      fri: [
        { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
        { start: "08:35", end: "09:35", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" },
        { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
        { start: "09:55", end: "11:00", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
        { start: "13:30", end: "14:45", subject: "Social Studies & History", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
        { start: "15:00", end: "16:15", subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
      ],
      sat: [
        { start: "07:30", end: "08:30", subject: "BacII Mock Exam", teacher: "Dr. Sokha Chan", room: "Room B-201" },
        { start: "08:35", end: "09:35", subject: "STEM Project Lab", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
        { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
        { start: "09:55", end: "11:00", subject: "Club & Debate", teacher: "Ms. Bopha Pich", room: "Room B-201" },
        { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
        { start: "13:30", end: "14:45", subject: "Self-Study", teacher: "-", room: "Library" }
      ]
    },
    11: {
      mon: [
        { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "08:25", end: "09:15", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
        { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
        { start: "09:35", end: "10:25", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "10:30", end: "11:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
        { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
        { start: "12:30", end: "13:20", subject: "Art & Design", teacher: "Ms. Sophea Lim", room: "Art Studio A-012" },
        { start: "13:25", end: "14:15", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
        { start: "14:20", end: "15:10", subject: "Reading Hour", teacher: "Ms. Lina Park", room: "Library" }
      ],
      tue: [
        { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "08:25", end: "09:15", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
        { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
        { start: "09:35", end: "10:25", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "10:30", end: "11:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
        { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
        { start: "12:30", end: "13:20", subject: "Computing", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
        { start: "13:25", end: "14:15", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
        { start: "14:20", end: "15:10", subject: "Coding Club", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
      ],
      wed: [
        { start: "07:30", end: "08:20", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
        { start: "08:25", end: "09:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
        { start: "09:35", end: "10:25", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
        { start: "10:30", end: "11:20", subject: "Computing", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
        { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
        { start: "12:30", end: "13:20", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "13:25", end: "14:15", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
        { start: "14:20", end: "15:10", subject: "Reading Hour", teacher: "Ms. Lina Park", room: "Library" }
      ],
      thu: [
        { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "08:25", end: "09:15", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
        { start: "09:35", end: "10:25", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
        { start: "10:30", end: "11:20", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
        { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
        { start: "12:30", end: "13:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
        { start: "13:25", end: "14:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "14:20", end: "15:10", subject: "Robotics Club", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
      ],
      fri: [
        { start: "07:30", end: "08:20", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "08:25", end: "09:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
        { start: "09:35", end: "10:25", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
        { start: "10:30", end: "11:20", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
        { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
        { start: "12:30", end: "13:20", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
        { start: "13:25", end: "14:15", subject: "Art & Design", teacher: "Ms. Sophea Lim", room: "Art Studio A-012" },
        { start: "14:20", end: "15:10", subject: "Assembly", teacher: "Ms. Bopha Pich", room: "Main Hall" }
      ],
      sat: [
        { start: "07:30", end: "08:20", subject: "Checkpoint Practice", teacher: "Mr. James Carter", room: "Room A-105" },
        { start: "08:25", end: "09:15", subject: "Science Practical", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
        { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
        { start: "09:35", end: "10:25", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
        { start: "10:30", end: "11:20", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" }
      ]
    }
  },
  attendance: {
    1: {
      "2026-10": {
        late: [8, 21],
        excused: [],
        absent: [],
        holidays: [15, 29],
        lateNotes: {
          8: "07:41 AM · 11 min late",
          21: "07:38 AM · 8 min late"
        }
      },
      "2026-11": {
        late: [],
        excused: [2],
        absent: [],
        holidays: [],
        excusedNotes: {
          2: "Medical · Dental appointment"
        }
      }
    },
    11: {
      "2026-10": {
        late: [],
        excused: [],
        absent: [],
        holidays: [15, 29]
      },
      "2026-11": {
        late: [],
        excused: [],
        absent: [],
        holidays: []
      }
    }
  },
  gateLog: [
    { childId: 1,  date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 11, date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 1,  date: "2026-11-03", type: "out", time: "11:32 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit", unread: true },
    { childId: 11, date: "2026-11-02", type: "in",  time: "07:15 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 11, date: "2026-11-02", type: "out", time: "03:16 PM", gate: "Gate 02", method: "School Bus Route B" },
    { childId: 1,  date: "2026-10-31", type: "in",  time: "07:20 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 11, date: "2026-10-31", type: "in",  time: "07:22 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 1,  date: "2026-10-31", type: "out", time: "11:05 AM", gate: "Gate 01", method: "RFID card", note: "BacII mock exam day" },
    { childId: 11, date: "2026-10-31", type: "out", time: "11:25 AM", gate: "Gate 02", method: "School Bus Route B" },
    { childId: 1,  date: "2026-10-30", type: "in",  time: "07:09 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 11, date: "2026-10-30", type: "in",  time: "07:14 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 11, date: "2026-10-30", type: "out", time: "03:14 PM", gate: "Gate 02", method: "School Bus Route B" },
    { childId: 1,  date: "2026-10-30", type: "out", time: "04:22 PM", gate: "Gate 01", method: "RFID card" },
    { childId: 1,  date: "2026-10-28", type: "in",  time: "07:11 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 11, date: "2026-10-28", type: "in",  time: "07:13 AM", gate: "Gate 01", method: "RFID card" },
    { childId: 1,  date: "2026-10-28", type: "out", time: "11:30 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit" },
    { childId: 1,  date: "2026-10-28", type: "in",  time: "01:16 PM", gate: "Gate 01", method: "RFID card", note: "Back from lunch" },
    { childId: 11, date: "2026-10-28", type: "out", time: "03:12 PM", gate: "Gate 02", method: "School Bus Route B" },
    { childId: 1,  date: "2026-10-28", type: "out", time: "04:19 PM", gate: "Gate 01", method: "RFID card" }
  ],
  reports: {
    1: {
      term: "2025–2026 · Semester 1 Midterm",
      gpa: "3.85",
      rank: "2 of 31",
      teacher: "Dr. Sokha Chan",
      comment: "Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort.",
      subjects: [
        { name: "Mathematics", score: 95 },
        { name: "Physics", score: 91 },
        { name: "Chemistry", score: 89 },
        { name: "Biology", score: 90 },
        { name: "Academic English", score: 94 },
        { name: "Khmer Literature", score: 88 },
        { name: "Computer Science & AI", score: 96 }
      ],
      recent: [
        { date: "30 Oct", subject: "Mathematics", title: "Integration Quiz", score: 18, max: 20 },
        { date: "27 Oct", subject: "Physics", title: "Lab Report: Projectile Motion", score: 46, max: 50 },
        { date: "23 Oct", subject: "Academic English", title: "Argumentative Essay", score: 17, max: 20 },
        { date: "20 Oct", subject: "Chemistry", title: "Unit Test 3", score: 41, max: 50 }
      ]
    },
    11: {
      term: "2025–2026 · Semester 1 Midterm",
      gpa: "3.78",
      rank: "4 of 28",
      teacher: "Ms. Bopha Pich",
      comment: "Excels in Cambridge Mathematics and coding club; confident, curious learner.",
      subjects: [
        { name: "Cambridge Math", score: 93 },
        { name: "Cambridge English", score: 92 },
        { name: "Cambridge Science", score: 89 },
        { name: "Khmer Language", score: 87 },
        { name: "Computing", score: 95 },
        { name: "Global Perspectives", score: 90 }
      ],
      recent: [
        { date: "29 Oct", subject: "Cambridge Math", title: "Fractions Quiz", score: 19, max: 20 },
        { date: "26 Oct", subject: "Computing", title: "Scratch Game Project", score: 48, max: 50 },
        { date: "22 Oct", subject: "Cambridge Science", title: "Plant Cells Worksheet", score: 17, max: 20 }
      ]
    }
  },
  invoices: [
    {
      id: 1,
      childId: 1,
      invoiceNo: "INV-2026-0618",
      title: "BacII Mock Exam & Materials Fee",
      amount: 45.00,
      dueDate: "2026-10-30",
      status: "Overdue"
    },
    {
      id: 2,
      childId: 1,
      invoiceNo: "INV-2026-0624",
      title: "Semester 2 Lunch & Refreshment Plan",
      amount: 360.00,
      dueDate: "2026-11-15",
      status: "Due"
    },
    {
      id: 3,
      childId: 1,
      invoiceNo: "INV-2026-0501",
      title: "Grade 12 Annual Tuition + Uniform",
      amount: 1852.50,
      dueDate: "2025-09-15",
      status: "Paid",
      paidOn: "2025-09-05",
      method: "ABA KHQR",
      receiptNo: "RCP-2026-0801"
    },
    {
      id: 4,
      childId: 11,
      invoiceNo: "INV-2026-0631",
      title: "Cambridge IEP Term 2 Tuition (Sibling −10%)",
      amount: 1305.00,
      dueDate: "2026-11-10",
      status: "Due"
    },
    {
      id: 5,
      childId: 11,
      invoiceNo: "INV-2026-0506",
      title: "Cambridge IEP Term Tuition + Lunch Plan",
      amount: 1665.00,
      dueDate: "2026-01-30",
      status: "Paid",
      paidOn: "2026-01-20",
      method: "ABA PayWay",
      receiptNo: "RCP-2026-0806"
    }
  ],
  announcement: {
    title: "Independence Day",
    body: "Mon, 9 November · No classes · Campus closed",
    icon: "bi-flag-fill"
  }
};
```

---

### 3. Exact Mathematical Formulas and Calculation Oracles

#### 3.1 Attendance Rate Formula
- **Definition**:
  $$\text{School Days} = \text{All Mon–Sat days up to demoNow} - \text{Holidays}$$
  $$\text{Attendance Rate} = \frac{\text{Present} + \text{Late}}{\text{School Days}} \times 100$$
- **Breakdown for Child 1 (Sok Chanreaksa)**:
  - October 2026: 31 days total. 4 Sundays (Oct 4, 11, 18, 25). 2 Holidays (Oct 15, Oct 29).  
    School Days in Oct = $31 - 4 - 2 = 25$ days.  
    Late = 2 days (Oct 8, Oct 21).  
    Present in Oct = $25 - 2 = 23$ days.
  - November 2026 (up to Nov 3): Nov 1 is Sunday. Nov 2 is Monday (Excused). Nov 3 is Tuesday (Present).  
    School Days in Nov = 2 days.  
    Present in Nov = 1 day. Excused in Nov = 1 day.
  - Term Totals:  
    Total School Days = $25 + 2 = 27$ days.  
    Present = $23 + 1 = 24$.  
    Late = 2.  
    Excused = 1.  
    Absent = 0.  
    $$\text{Rate} = \frac{24 + 2}{27} \times 100 = \frac{26}{27} \times 100 = 96.296296\ldots\% \xrightarrow{\text{round to 1 dec}} \mathbf{96.3\%}$$
- **Breakdown for Child 11 (Sok Chanpanha)**:
  - October: 25 school days, 25 present.
  - November: 2 school days, 2 present.
  - Totals: 27 present / 27 school days = $\mathbf{100.0\%}$.

#### 3.2 Grade Average Calculation
- **Child 1 (Sok Chanreaksa)**:
  - Subjects: Math (95) + Physics (91) + Chem (89) + Bio (90) + Acad Eng (94) + Khmer Lit (88) + CS & AI (96) = 643 total.
  - Subject count: 7.
  - Average: $\frac{643}{7} = 91.85714\ldots \xrightarrow{\text{round to 1 dec}} \mathbf{91.9}$.
- **Child 11 (Sok Chanpanha)**:
  - Subjects: Cambridge Math (93) + Cambridge Eng (92) + Cambridge Science (89) + Khmer Lang (87) + Computing (95) + Global Persp (90) = 546 total.
  - Subject count: 6.
  - Average: $\frac{546}{6} = 91.0 \xrightarrow{\text{round to 1 dec}} \mathbf{91.0}$.

#### 3.3 Letter Grade Scale Thresholds
```javascript
function letter(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}
```

#### 3.4 Family Outstanding Balance Formula
- **Definition**:
  $$\text{Outstanding Balance} = \sum_{i \in \text{invoices}, i.\text{status} \neq \text{"Paid"}} i.\text{amount}$$
- **Calculation**:
  - INV-2026-0618: $45.00 (Overdue)
  - INV-2026-0624: $360.00 (Due)
  - INV-2026-0631: $1,305.00 (Due)
  - Sum: $45.00 + 360.00 + 1305.00 = \mathbf{\$1,710.00}$.
- **Post-Payment Outcome** (paying INV-2026-0618):
  - Paid: $45.00.
  - New Outstanding: $\$1,710.00 - \$45.00 = \mathbf{\$1,665.00}$.

#### 3.5 Campus Duration Today Formula
- **Definition**: Sum of all closed duration pairs $(\text{exitTime} - \text{entryTime})$ on demoNow (`2026-11-03`).
- **Events for Child 1**:
  - Entry: `07:12 AM` $\rightarrow 7 \times 60 + 12 = 432$ minutes.
  - Exit: `11:32 AM` $\rightarrow 11 \times 60 + 32 = 692$ minutes.
  - Duration: $692 - 432 = 260$ minutes.
  - Format: $\lfloor 260 / 60 \rfloor\text{h } (260 \pmod{60})\text{m} = \mathbf{\text{4h 20m}}$.

---

### 4. UI Screens, Tabs, Sheets, and Component Details

#### 4.1 Shell and Device Styling Specifications
- **Container Classes**:
  - `.pm-page`: Viewport reset, `min-height: 100dvh`, background gradient, `overflow: hidden`.
  - `.pm-home-btn`: Fixed pill top-left (`top: 20px; left: 20px`), icon + "Home", subtle border and shadow.
  - `.pm-stage`: Flex center stage.
  - `.pm-device-wrap`: Sizing container styled by JS (`width: W * s; height: H * s`).
  - `.pm-device`: Outer chassis (`width: 417px; height: 876px; border-radius: 68px; padding: 4px; background: linear-gradient(145deg, #5b5e63 0%, #2c2e32 38%, #6a6d72 55%, #2a2c30 100%); transform-origin: top center;`).
  - `.pm-bezel`: Inner bezel (`width: 100%; height: 100%; border-radius: 64px; background: #0b0b0d; padding: 8px;`).
  - `.pm-screen`: Viewport (`width: 393px; height: 852px; border-radius: 56px; overflow: hidden; background: var(--surface-bg); color: var(--text-main); position: relative;`).
  - `.pm-island`: Dynamic Island pill (`width: 126px; height: 37px; border-radius: 20px; background: #000; top: 11px; z-index: 60;`).
  - `.pm-statusbar`: Height 54px, padding `4px 30px 0 52px`, clock `11:35`, 3 inline SVGs (cellular, Wi-Fi, battery).
  - `.pm-home-indicator`: Width 134px, height 5px, radius 3px, bottom 8px.
  - `.pm-app`: Absolutely positioned inside screen, `inset: 0; padding-top: 54px; display: flex; flex-direction: column;`.

#### 4.2 Login Screen Specification
- **Layout**: Centered flex column, padding 28px.
- **Components**:
  1. School Logo tile (72×72 white rounded tile, 18px radius) with `/uploads/school_logos/default_school_logo.svg` (44px wide).
  2. School title: English name (`brand.name`, 22px bold) + Khmer name (`brand.nameKh`, 13px muted).
  3. Header greeting: "Welcome back" (26px/700) + "Sign in to continue" (14px muted).
  4. Segmented Switch: `.pm-seg` with Student and Parent toggle buttons (`data-action="role"`).
  5. Form:
     - Username label ("Student ID or username" or "Phone number or username") + `.pm-input` prefilled with `stu_chanreaksa` or `par_vibol`.
     - Password label ("Password") + `.pm-input[type="password"]` prefilled with `demo1234` + absolute eye toggle button (`data-action="toggle-pass"`).
     - "Forgot password?" right-aligned link (`data-action="forgot"`).
     - Sign-in button: `.pm-btn-primary` ("Sign in as Student" / "Sign in as Parent") (`type="submit"`).
     - Demo caption: "Demo account · credentials pre-filled".
     - Footer tag: "Powered by Tele-ICT · v2.4".

#### 4.3 Student Portal (5 Tabs)
- **Tab Bar**: 5 items (`home`, `schedule`, `report`, `attendance`, `gate`).
- **Tab 1: Home**:
  - Header with eyebrow "Tuesday, 3 November", greeting "Good morning, Chanreaksa", avatar "SC".
  - Hero card with lunch status, checkout time 11:32 AM, and upcoming Biology class at 13:30.
  - 2-up stat cards: Attendance 96.3% and Average 91.9.
  - "Today's classes" list showing period status indicators.
  - "Announcements" card.
- **Tab 2: Schedule**:
  - Header: eyebrow "Grade 12-A · Science Track", title "Schedule".
  - Day strip: 6 weekday buttons (Mon–Sat, 2–7 Nov 2026).
  - Periods list: Start/end times, vertical colored bar, subject title, teacher & room.
  - Active highlights: Lunch break highlighted with "Now" pill; Biology highlighted with "Next" pill.
- **Tab 3: Report**:
  - Header: eyebrow "2025–2026 · Semester 1 Midterm", title "Report".
  - Average ring card: 91.9 circular conic ring, GPA 3.85, Class rank "2 of 31", "Midterm published" pill.
  - Subjects card list: Letter grade pills (A+, A, B+), score fractions (95/100), progress bars.
  - Recent assessments list: Quizzes and tests.
  - Homeroom teacher comment card.
  - Ghost action: "Download report (PDF)".
- **Tab 4: Attendance**:
  - Summary card: 96.3% circular ring, 4 counters (Present 24, Late 2, Excused 1, Absent 0).
  - Calendar card: Month navigator ("November 2026"), 7-column day grid with status dots.
  - Records section: Detailed list of late/excused days with notes.
- **Tab 5: Check-in Log**:
  - Today card: Status pill "Off campus", Gate 01 entry/exit timeline, "Time on campus today: 4h 20m".
  - Action button: "Show my campus ID" opening QR sheet.
  - Recent days timeline: Previous gate events (31 Oct, 30 Oct, 28 Oct, 2 Nov excused).
  - **Campus ID QR Sheet**: Bottom sheet with centered `pseudoQr("STU-2026-001")`, student card ID, and "Done" button.

#### 4.4 Parent Portal (5 Tabs)
- **Tab Bar**: 5 items (`home`, `alerts`, `scores`, `schedule`, `payments`).
- **Child Switcher**: Bottom sheet switcher triggered from pill button under header. Shows both children with avatars, classes, campuses, and checkmark on active child.
- **Tab 1: Home**:
  - Header: Eyebrow date, title "Good morning, Mr. Vibol", avatar "SV".
  - "My children" section: 2 stacked cards for Chanreaksa (Off campus · Out 11:32 AM, Att 96.3%, Avg 91.9) and Chanpanha (On campus · In 07:12 AM, Att 100%, Avg 91.0). Clicking either opens Scores for that child.
  - "Next payment due" card: $1,305.00 due in 7 days with "Pay now" action, plus overdue banner if any overdue invoice exists ($45.00).
  - "Latest alerts" section: 3 most recent gate events.
- **Tab 2: Alerts**:
  - Filter chips: All, Chanreaksa, Chanpanha.
  - Timeline of gate events with gate names, methods (RFID / School Bus), timestamps, and notes.
  - Unread badge on tab clears upon navigating to this view.
  - **Simulated Push Banner**:
    - Trigger: Injected 1500ms after parent login.
    - Content: Icon tile with mortarboard, title "Check-out alert", body "Sok Chanreaksa left campus at 11:32 AM via Gate 01 · Lunch break exit".
    - Action: Tapping dismisses banner and switches to Alerts tab. Auto-dismisses after 6000ms.
- **Tab 3: Scores**:
  - Child switcher header.
  - Reuses report renderer for `state.childId`.
- **Tab 4: Schedule**:
  - Child switcher header.
  - Reuses schedule renderer for `state.childId`.
- **Tab 5: Payments**:
  - Family Card (`.pm-card-hero`): Total outstanding "$1,710.00", "2 children · next due 10 Nov".
  - Filter segmented control: "Due" vs "Paid".
  - Invoices list: Overdue invoices with red danger pill, Due invoices with orange warning pill, Paid invoices with green success pill.
  - Due rows have trailing "Pay" button.
  - **Payment Bottom Sheet Flow**:
    - Step 1 (`choose`): Title "Pay invoice", invoice details, amount, radio cards for ABA PayWay, Bakong KHQR (renders dynamic QR code), and ACLEDA Mobile. Buttons: "Pay $XX.XX" and "Cancel".
    - Step 2 (`processing`): Spinner and "Processing payment…".
    - Step 3 (`success`): Success check animation, "Payment successful", receipt number, amount, and "Done" button.
    - Results: Balance reduced, tab dot cleared, invoice moved to Paid.

---

### 5. Deterministic QR Code Generator Algorithm

Deterministic pure JS/CSS QR implementation:

```javascript
function pseudoQr(seedStr, size = 25) {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  const finder = (r, c) => {
    for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      const y = r - fr, x = c - fc;
      if (y >= 0 && y < 7 && x >= 0 && x < 7) {
        return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
      }
      if (y >= -1 && y <= 7 && x >= -1 && x <= 7) return false;
    }
    return null;
  };
  let cells = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const f = finder(r, c);
      cells += `<i class="${(f === null ? rand() > 0.5 : f) ? "on" : ""}"></i>`;
    }
  }
  return `<div class="pm-qr" style="--n:${size}" aria-label="QR code">${cells}</div>`;
}
```

---

### 6. File Layout and Technical Constraints Summary

| Target Path | Action | Description |
|-------------|--------|-------------|
| `index.html` | Edit | Add `.min-sidebar-footer` outside `#sidebarnav` with App Mockup button (lines 85–86) |
| `css/custom-demo.css` | Edit | Add `.min-sidebar-footer` (padding 12px 16px) and `.min-app-mockup-btn` styles |
| `phone-mockup/index.html` | Create | Mockup page HTML shell with root-absolute asset paths |
| `phone-mockup/phone-mockup.css` | Create | iPhone 15 Pro hardware frame, dynamic island, status bar, and in-app styles |
| `phone-mockup/mockup-data.js` | Create | Deterministic seed data object assigned to `window.PM_DATA` |
| `phone-mockup/mockup-app.js` | Create | IIFE application logic, reactive state, event delegation, dynamic scaling |

---

### 7. Acceptance Criteria Checklist

- [x] **R1 Navigation**: Sidebar bottom-left button navigates to `/phone-mockup/`.
- [x] **R2 Route**: `/phone-mockup/` and `/phone-mockup` return HTTP 200 without SPA fallback.
- [x] **R2 Return**: "← Home" navigates back to `/`.
- [x] **R2 Presentation**: iPhone 15 Pro frame with titanium finish, buttons, Dynamic Island, fixed 11:35 status bar, and home indicator.
- [x] **R2 Responsiveness**: Scales dynamically without page scrollbars at 1440×900, 1280×720, and 390×844.
- [x] **R3 Auth**: Login toggles Student / Parent with prefilled credentials, inline validation, and eye toggle.
- [x] **R3 Persistence**: Pure in-memory state; reload resets completely without `localStorage` leakage.
- [x] **R4 Student Home**: Lunch break status, 11:32 checkout info, next Biology class, stat overview, and announcement.
- [x] **R4 Student Schedule**: Mon–Sat day selector, period breakdown, "Now" and "Next" status pills.
- [x] **R4 Student Report**: Circular average ring (91.9%), GPA 3.85, subject breakdown with letter pills, recent assessment scores, and homeroom comment.
- [x] **R4 Student Attendance**: 96.3% rate, 24 Present / 2 Late / 1 Excused / 0 Absent counters, Oct/Nov calendar grid with dots, and non-present records.
- [x] **R4 Student Check-in**: Today gate timeline, calculated 4h 20m duration, and campus ID QR modal sheet.
- [x] **R5 Parent Switcher**: Bottom sheet switches between Sok Chanreaksa and Sok Chanpanha across Scores, Schedule, and Payments.
- [x] **R5 Parent Home**: Summary cards for both children and next payment due ($1,305.00).
- [x] **R5 Parent Alerts**: Gate event feed, unread badge clearing, and simulated push banner after 1.5s.
- [x] **R5 Parent Payments**: Initial family balance of $1,710.00; interactive payment sheet with ABA / Bakong KHQR / ACLEDA; simulated processing; receipt generation; balance reduction.
- [x] **R6 Code Quality**: Zero external build dependencies, vanilla ES2020, brand color sync, uncommitted files preserved, no emoji in UI copy.
