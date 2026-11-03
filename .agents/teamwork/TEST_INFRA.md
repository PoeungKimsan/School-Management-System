# Test Infrastructure & Automated Verification Framework

**Project**: Phone App Mockup (`/phone-mockup`)  
**Document**: Test Infrastructure Architecture & Methodology (`TEST_INFRA.md`)  
**Target Path**: `.agents/teamwork/TEST_INFRA.md`  
**Version**: 1.0.0 (Release-Ready)  

---

## 1. Test Architecture Overview

The Phone App Mockup test infrastructure provides deterministic, repeatable, and automated verification across the entire lifecycle of the mobile application showcase. The architecture is engineered around the project's zero-build-step, zero-external-dependency constraints (Vanilla ES2020 JavaScript, standard CSS, static HTML).

```
+-----------------------------------------------------------------------------------------+
|                               TEST RUNNER ARCHITECTURE                                  |
+-----------------------------------------------------------------------------------------+
|                                    tests/test-all.sh                                    |
|                               (Unified Test Suite Runner)                               |
+----------------------------+-----------------------------+------------------------------+
              |                            |                             |
              v                            v                             v
   +--------------------+       +---------------------+       +----------------------+
   | tests/test-syntax.sh|       | tests/test-routes.sh|       |  tests/test-oracle.js|
   | (Syntax Validation)|       | (Route & MIME Types)|       | (Headless Oracle)    |
   +--------------------+       +---------------------+       +----------------------+
              |                            |                             |
     `node --check`               `curl` HTTP endpoints          Headless DOM Shim
   phone-mockup/*.js             localhost:3000                 Assertion Engine
                                 - 200 vs 404                   - $1,710.00 Balance
                                 - Proper MIME types            - 91.9 & 91.0 Averages
                                 - pmDevice vs sidebarnav       - 96.3% Attendance
                                                                - 4h 20m Gate Duration
+-----------------------------------------------------------------------------------------+
|                                 4-TIER E2E METHODOLOGY                                  |
|  Tier 1: Feature Coverage (R1-R5 Core Requirements, >=5 test cases per requirement)     |
|  Tier 2: Boundary & Corner Cases (Empty inputs, month limits, clamped scale, etc.)      |
|  Tier 3: Cross-Feature State Combinations (Child switcher, payment balance propagation) |
|  Tier 4: Real-World Flows (Student Morning Check-in, Parent Payment & Notification Flow)|
+-----------------------------------------------------------------------------------------+
|                              BROWSER & VIEWPORT PROTOCOL                                |
|  Desktop (1440x900)  |  Laptop/Tablet (1280x720)  |  Mobile Narrow (390x844)           |
+-----------------------------------------------------------------------------------------+
```

### Core Design Principles
1. **Zero External Dependencies**: All automated tests run on native Node.js (v18+) and standard POSIX shell tools (`bash`, `curl`, `grep`, `awk`, `mktemp`). No heavy test runners (Jest, Mocha, Cypress) are needed.
2. **Authoritative Oracle Derivation**: Expected values for financial balances, grade averages, attendance percentages, and campus durations are mathematically derived directly from the source specifications (`ORIGINAL_REQUEST.md`, `implementation_plan.md`, `js/mock-data.js`).
3. **Strict Fallback Detection**: Route verification asserts the presence of mockup DOM markers (`id="pmDevice"`) and explicitly forbids the SPA fallback template (`id="sidebarnav"`).
4. **Isolated Headless Execution**: Headless test oracles run with a lightweight browser shim (`window`, `document`), enabling pure algorithmic unit verification in under 50ms without headless browser overhead.
5. **Progressive Testability**: The test suite can run at any milestone, clearly reporting passes for implemented features and actionable failure diagnostics for pending milestones.

---

## 2. Environment & Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher (supports `--check` and native ES2020 modules/features).
- **Bash / POSIX Shell**: Version 3.2+ (macOS/Linux compatible).
- **curl**: Supporting `-s`, `-w`, `-I`, and `-o` options.
- **grep & awk**: Standard BSD/GNU utilities.

### Local Server Execution
The route verification suite requires the application server to be running:
```bash
# Start server in background or separate terminal session
node server.js
# Or
npm run dev
```
By default, tests target port `3000` (`http://localhost:3000`). Custom ports or hosts can be provided via the `PORT` or `BASE_URL` environment variables:
```bash
PORT=8080 ./tests/test-all.sh
# or
BASE_URL="http://127.0.0.1:4000" ./tests/test-all.sh
```

---

## 3. Test Runner Execution & Pass/Fail Semantics

### Test Suite Components

| Script | Purpose | Execution Command | Target Artifacts |
|---|---|---|---|
| `tests/test-syntax.sh` | Validates JavaScript syntax via Node.js compiler | `./tests/test-syntax.sh` | `phone-mockup/*.js` |
| `tests/test-routes.sh` | Verifies HTTP status codes, MIME headers, and SPA fallback evasion | `./tests/test-routes.sh` | Server endpoints (`/phone-mockup/`, assets) |
| `tests/test-oracle.js` | Headless execution of mathematical calculations and data models | `node tests/test-oracle.js` | Data structures, calculations, formatters |
| `tests/test-all.sh` | Unified master runner executing all automated test suites | `./tests/test-all.sh` | All test suites |

### Pass / Fail Semantics
- **Exit Code 0 (PASS)**: All assertions succeeded cleanly. Zero errors detected. Ready for merge or deployment.
- **Exit Code 1 (FAIL)**: One or more assertions failed. A concise summary of failed checks is output to `stderr`/`stdout`.
- **Exit Code 2 (ENV ERROR)**: Environment prerequisite unmet (e.g., local server offline on specified port).

---

## 4. 4-Tier Testing Methodology & Detailed Test Catalog

```
+-----------------------------------------------------------------------------------------+
|                                4-TIER SPECIFICATION MATRIX                              |
+-----------------------------------------------------------------------------------------+
| Tier 1: Feature Coverage      | R1 to R5 (>=5 test cases each, 30+ total test cases)    |
| Tier 2: Boundary & Corners    | 10 boundary conditions (empty states, clamping, dates)  |
| Tier 3: Cross-Feature Flows   | 5 cross-module interactions (sync, timers, balance)     |
| Tier 4: Real-World Flows      | 2 end-to-end multi-step user scenarios                  |
+-----------------------------------------------------------------------------------------+
```

### 4.1 Tier 1: Feature Coverage (R1 – R5 Core Specifications)

#### Requirement R1: App Mockup Button in Sidebar
* **T1-R1.1 (DOM Layout Insertion)**: Verify `.min-sidebar-footer` exists between `</nav>` and `</aside>`, strictly outside `#sidebarnav`.
* **T1-R1.2 (Anchor Navigation Contract)**: Verify anchor element has `href="/phone-mockup/"`, class `min-app-mockup-btn`, and does *not* contain `.nav-link` (preventing SPA router interception).
* **T1-R1.3 (Icons and Typography)**: Verify child elements include smartphone icon (`fe fe-smartphone`), text label `"App Mockup"`, and diagonal arrow (`fe fe-arrow-up-right min-app-mockup-arrow`).
* **T1-R1.4 (Hover & Focus Styling)**: Verify CSS applies `--brand-primary-light` background, `--brand-primary` border/color, and arrow translation `translate(1px, -1px)`.
* **T1-R1.5 (Responsive Drawer Pinning)**: Verify on viewport `<992px` (mobile off-canvas sidebar), the footer remains pinned at the bottom of the drawer.
* **T1-R1.6 (Navigation Non-Interference)**: Verify clicking the button triggers direct browser navigation without hash collisions in `js/app.js`.

#### Requirement R2: Mockup Page Shell and Device Frame
* **T1-R2.1 (Return Navigation Pill)**: Verify `.pm-home-btn` has `href="/"`, contains `fe fe-arrow-left` and `"Home"`, positioned fixed at `top: 20px; left: 20px`.
* **T1-R2.2 (iPhone 15 Pro Hardware Frame)**: Verify outer `.pm-device` has dimensions 417×876px, titanium gradient border, radius 68px, and 4 hardware side buttons (Action, Volume Up, Volume Down, Power).
* **T1-R2.3 (Dynamic Island & Status Bar)**: Verify Dynamic Island (126×37px, radius 20px, `#000`), status bar height 54px, fixed clock at `"11:35"`, and inline SVGs for cellular, Wi-Fi, and battery.
* **T1-R2.4 (Home Indicator)**: Verify 134×5px indicator pill centered at `bottom: 8px` with `pointer-events: none`.
* **T1-R2.5 (Dynamic Scaling Calculation)**: Verify `fitDevice()` computes scale `s = Math.max(0.45, Math.min(1, (innerHeight - 80) / 876, (innerWidth - 32) / 425))` and eliminates window scrollbars across 1440×900, 1280×720, and 390×844.

#### Requirement R3: Data and Authentication Model
* **T1-R3.1 (Segmented Role Switcher)**: Verify clicking Student / Parent pills toggles active role, updates input labels, and switches pre-filled credentials (`stu_chanreaksa` vs `par_vibol`).
* **T1-R3.2 (Password Visibility Toggle)**: Verify clicking eye toggle flips input `type` between `"password"` and `"text"` and updates icon `bi-eye` / `bi-eye-slash` without page re-render.
* **T1-R3.3 (Inline Validation Error)**: Verify submitting empty fields triggers red border (`#d92d20`) and inline error message without submitting.
* **T1-R3.4 (Sign-In Loading Simulation)**: Verify submission displays button spinner with text `"Signing in…"`, transitioning to app shell after 700ms.
* **T1-R3.5 (Sign Out & Ephemeral Neutrality)**: Verify header avatar -> Account sheet -> `"Sign out"` returns to login with role preserved; reloading page completely resets state without `localStorage` leakage.

#### Requirement R4: Student Portal (5 Tabs)
* **T1-R4.1 (Home Tab Hero & Overview)**: Verify greeting `"Good morning, Chanreaksa"`, hero card pill `"Lunch break · 11:00 – 13:30"`, checkout line `"Checked out 11:32 AM · Gate 01"`, next class `"Biology"`, stat cards `96.3%` and `91.9`.
* **T1-R4.2 (Schedule Tab Periods & Statuses)**: Verify Mon–Sat weekday selector, Tuesday periods list, `"Now"` highlight on Lunch break row, `"Next"` badge on Biology period.
* **T1-R4.3 (Report Tab Midterm Grades)**: Verify circular progress ring `91.9`, GPA `3.85`, rank `"2 of 31"`, subject progress bars with letter pills (A+, A, B+), recent assessments, and homeroom teacher comment.
* **T1-R4.4 (Attendance Tab Counters & Grid)**: Verify `96.3%` rate ring, 24 present / 2 late / 1 excused / 0 absent counters, November calendar grid with status dots, and non-present records list.
* **T1-R4.5 (Check-in Log & Campus ID QR Sheet)**: Verify today's gate events (07:12 AM In, 11:32 AM Out), duration footer `"Time on campus today: 4h 20m"`, and `"Show my campus ID"` button opening modal sheet with deterministic QR code for `STU-2026-001`.

#### Requirement R5: Parent Portal (5 Tabs & Workflows)
* **T1-R5.1 (Child Switcher Bottom Sheet)**: Verify child pill button opens sheet listing Chanreaksa and Chanpanha, selecting updates child context across Scores, Schedule, and Payments tabs.
* **T1-R5.2 (Home Tab Dual Cards & Payment Alert)**: Verify status cards for both children (Chanreaksa `"Off campus · Out 11:32 AM"`, Chanpanha `"On campus · In 07:12 AM"`) and Next Payment Due card (`$1,305.00` for Chanpanha, Due in 7 days).
* **T1-R5.3 (Simulated iOS Push Banner)**: Verify banner slides down ~1500ms post-login showing `"Check-out alert · Sok Chanreaksa left campus at 11:32 AM via Gate 01"`, auto-dismisses after 6s, and tap navigates to Alerts tab.
* **T1-R5.4 (Alerts Tab & Unread Badge)**: Verify tab starts with red badge `"1"`, opening tab marks alert read and removes badge; filter chips filter between All, Chanreaksa, and Chanpanha.
* **T1-R5.5 (Payments Tab & Multi-Method Pay Flow)**: Verify family total outstanding `$1,710.00`, Due/Paid tabs, pay flow on INV-2026-0618 ($45.00) via ABA/Bakong KHQR/ACLEDA with 1200ms processing spinner, receipt `RCP-2026-0910`, and balance decrement to `$1,665.00`.

---

### 4.2 Tier 2: Boundary & Corner Cases

* **T2.1 (Empty/Whitespace Credentials)**: Submitting empty or whitespace credentials produces inline red border (`#d92d20`) and aborts login transition.
* **T2.2 (Attendance Month Bounds)**: In November 2026, next-month navigation arrow is disabled (cannot navigate to Dec); in October 2026, previous-month arrow is disabled (cannot navigate to Sep).
* **T2.3 (Future Date Invalidation)**: Nov 4 through Nov 30 in the calendar grid are styled as `"future"` cells with no status dots or interactive records.
* **T2.4 (Sundays & Public Holidays)**: Sundays (Oct 4, 11, 18, 25; Nov 1) and public holidays (Oct 15, 29) are excluded from school day count; holidays display muted `"H"` indicator.
* **T2.5 (Saturday Half-Day Schedule)**: Child 1 Saturday schedule omits period 7 (`"-"` subject); Child 11 ends at P4 (11:20 AM) with no lunch row.
* **T2.6 (Zero Payments Due Empty State)**: When all due invoices are paid, displays clean empty state text `"All caught up · No payments due"` with `bi-check-circle` icon (zero emojis).
* **T2.7 (Scale Factor Clamping)**: Verifies `fitDevice()` scale factor `s` remains strictly between `0.45` and `1.0` regardless of extreme screen sizes (320px width up to 4K displays).
* **T2.8 (School Profile Fallback)**: If `window.SMS_STATE` is undefined, `applyBrand()` cleanly falls back to default Milky Way School `#0077b6` without JavaScript exceptions.
* **T2.9 (Single-Toast Concurrency)**: Triggering multiple toast notifications in rapid succession removes previous toasts cleanly without DOM leaks.
* **T2.10 (Push Banner Race Conditions)**: Navigating tabs or signing out before the 1500ms push banner timer triggers clears `state.pushTimer` via `clearTimeout`.

---

### 4.3 Tier 3: Cross-Feature State Combinations

* **T3.1 (Child Switcher Synchronization)**: Switching child from Chanreaksa to Chanpanha on the Scores tab persists the selected child when switching between Scores, Schedule, and Payments tabs.
* **T3.2 (Payment State Multi-Component Propagation)**:
  - Paying invoice INV-2026-0618 ($45.00):
    1. Reduces Family Total Outstanding on Payments tab from `$1,710.00` to `$1,665.00`.
    2. Moves invoice from "Due" list to "Paid" list with timestamp `2026-11-03` and receipt number `RCP-2026-0910`.
    3. Clears overdue red dot on Payments tab bar icon.
    4. Clears overdue alert row on Parent Home tab.
* **T3.3 (Gate Log & Alert Badge Synchronization)**:
  - Initial unread check-out alert triggers tab badge `1`.
  - Tapping push notification banner dismisses banner, navigates to Alerts tab, marks alert read, and removes badge from tab bar.
* **T3.4 (Campus Duration & QR Integration)**:
  - Timeline gate events (07:12 AM In, 11:32 AM Out) feed calculation of `"Time on campus today: 4h 20m"`.
  - Campus ID button displays Card ID `STU-2026-001` matching child record and generates valid deterministic pseudo-QR matrix.
* **T3.5 (Dynamic Brand Synchronization)**:
  - When primary color is updated in main application profile, phone mockup dynamically updates `--brand-primary` and derived tokens on page load.

---

### 4.4 Tier 4: Real-World User Flows

#### Flow 1: Student Morning Check-In & Timetable Review
1. Open `/phone-mockup/` on desktop (1440×900).
2. Verify iPhone 15 Pro frame centered with 11:35 clock and titanium styling.
3. Select Student mode on login screen; verify `stu_chanreaksa` / `demo1234` pre-filled.
4. Toggle password visibility eye icon; confirm unmasked and re-masked.
5. Click "Sign in as Student"; observe 700ms loading state; verify transition to Student Home tab.
6. Inspect hero card: "Lunch break · 11:00 – 13:30", "Checked out 11:32 AM · Gate 01", next class "Biology · 13:30 – 14:45".
7. Switch to Schedule tab; verify Tuesday timetable with "Now" badge on Lunch break and "Next" on Biology.
8. Select Saturday on weekday strip; verify half-day timetable without lunch row.
9. Switch to Report tab; inspect 91.9 average ring, GPA 3.85, rank 2 of 31, and subject list.
10. Switch to Attendance tab; verify 96.3% rate, 24 present / 2 late / 1 excused / 0 absent. Navigate to October; verify late dots on Oct 8 & 21, holidays on Oct 15 & 29.
11. Switch to Check-in tab; verify "Time on campus today: 4h 20m". Click "Show my campus ID" -> verify QR sheet opens -> click "Done" -> verify sheet closes.
12. Click header avatar -> open Account sheet -> click "Sign out"; verify return to login screen.

#### Flow 2: Parent Gate Notification, Multi-Child Check & Tuition Payment Flow
1. On login screen, toggle segmented control to "Parent" mode; verify `par_vibol` / `demo1234` pre-filled.
2. Click "Sign in as Parent"; observe 700ms loading state; verify transition to Parent Home tab.
3. Inspect children cards: Chanreaksa "Off campus · Out 11:32 AM" vs Chanpanha "On campus · In 07:12 AM".
4. Wait ~1500ms; observe simulated iOS push banner: "Check-out alert · Sok Chanreaksa left campus at 11:32 AM via Gate 01".
5. Tap push banner; verify banner dismisses and app navigates to Alerts tab.
6. Verify unread badge cleared on Alerts tab icon.
7. Filter alerts by "Chanpanha"; verify list filters to bus/gate events; toggle back to "All".
8. Switch to Scores tab; verify Chanreaksa report card (91.9 avg). Open child switcher sheet -> select Chanpanha -> verify view updates to Chanpanha report card (91.0 avg).
9. Switch to Payments tab; verify Family Total Outstanding `$1,710.00` and overdue alert on BacII fee ($45.00).
10. Click "Pay" on INV-2026-0618 -> Pay bottom sheet opens.
11. Select "Bakong KHQR" method; verify pseudo-QR renders.
12. Click "Pay $45.00"; observe 1200ms processing spinner; verify "Payment successful" screen with receipt `RCP-2026-0910`.
13. Click "Done"; verify pay sheet closes.
14. Verify Payments tab: outstanding drops to `$1,665.00`, overdue tab dot cleared, invoice moved to "Paid" tab.
15. Switch to Home tab; verify payment summary card reflects updated balance.
16. Click top-left "← Home" button outside phone; verify seamless return to main dashboard (`/`).

---

## 5. Authoritative Data Oracle Formulations

### Mathematical Formulas & Expected Outputs

1. **Outstanding Family Balance**:
   $$\text{Outstanding} = \sum_{\text{invoice} \in \text{invoices}, \text{status} \neq \text{'Paid'}} \text{amount}$$
   $$\text{Initial} = 45.00 (\text{Overdue}) + 360.00 (\text{Due}) + 1305.00 (\text{Due}) = \mathbf{\$1,710.00}$$
   $$\text{Post-Payment of INV-2026-0618} = 1710.00 - 45.00 = \mathbf{\$1,665.00}$$

2. **Grade Averages & Letter Grades**:
   $$\text{Average} = \frac{1}{N} \sum_{i=1}^N \text{score}_i$$
   - **Child 1 (Chanreaksa, Grade 12-A)**:
     - Scores: $[95, 91, 89, 90, 94, 88, 96]$
     - $\text{Sum} = 643, N = 7$
     - $\text{Average} = \frac{643}{7} = \mathbf{91.9}$ (GPA $3.85$, Class Rank $2\text{ of }31$)
   - **Child 11 (Chanpanha, Grade 7-IEP)**:
     - Scores: $[93, 92, 89, 87, 95, 90]$
     - $\text{Sum} = 546, N = 6$
     - $\text{Average} = \frac{546}{6} = \mathbf{91.0}$ (GPA $3.78$, Class Rank $4\text{ of }28$)

3. **Attendance Rate & Day Counters (Child 1)**:
   $$\text{School Days} = \text{Total Days} - \text{Sundays} - \text{Public Holidays}$$
   - **October 2026**: $31 - 4 (\text{Sundays}) - 2 (\text{Oct 15, 29}) = 25\text{ days}$.
     - Late: $[8, 21] = 2$
     - Excused: $0$
     - Absent: $0$
     - Present: $25 - 2 = 23$
   - **November 2026 (thru Nov 3)**: $3 - 1 (\text{Sunday Nov 1}) = 2\text{ days}$.
     - Excused: $[2] = 1$
     - Late: $0$
     - Absent: $0$
     - Present: $2 - 1 = 1$
   - **Term Totals**:
     - $\text{Total School Days} = 25 + 2 = \mathbf{27}$
     - $\text{Present} = 23 + 1 = \mathbf{24}$
     - $\text{Late} = 2 + 0 = \mathbf{2}$
     - $\text{Excused} = 0 + 1 = \mathbf{1}$
     - $\text{Absent} = 0 + 0 = \mathbf{0}$
     - $\text{Rate} = \frac{\text{Present} + \text{Late}}{\text{School Days}} = \frac{24 + 2}{27} = \frac{26}{27} \times 100\% = \mathbf{96.3\%}$

4. **Campus Duration Calculation**:
   $$\text{Duration} = \text{Exit Time} - \text{Entry Time}$$
   $$\text{Entry: 07:12 AM} = 7 \times 60 + 12 = 432\text{ min}$$
   $$\text{Exit: 11:32 AM} = 11 \times 60 + 32 = 692\text{ min}$$
   $$\Delta t = 692 - 432 = 260\text{ min} = \mathbf{4\text{h }20\text{m}}$$

---

## 6. Browser Agent & Viewport Verification Protocol

In addition to headless shell and Node.js checks, visual rendering must be verified across three canonical viewport sizes:

| Viewport Preset | Dimensions | Target Device / Profile | Verification Criteria |
|---|---|---|---|
| **Desktop High-Res** | 1440 × 900 px | Standard Laptop / External Display | Device centered, scale $s \approx 0.936$, no outer page scrollbars |
| **Tablet / Small Laptop** | 1280 × 720 px | 720p Display / Tablet Landscape | Device scaled down ($s \approx 0.730$), fully visible |
| **Mobile Narrow** | 390 × 844 px | Mobile Portrait Viewport | Device scaled ($s \approx 0.842$), no horizontal scrollbars |

### Visual Checklist
- Titanium frame gradient rendered smoothly with rounded corners (`border-radius: 68px`).
- Dynamic Island pill centered at `top: 11px`.
- Status bar displays fixed `"11:35"` clock and all 3 battery/cellular/Wi-Fi SVGs.
- Home indicator bar positioned at `bottom: 8px`.
- Modal bottom sheets slide up smoothly with grabber handles and dark backdrops.
- When `@media (prefers-reduced-motion: reduce)` is simulated, all transitions and animations are bypassed.
