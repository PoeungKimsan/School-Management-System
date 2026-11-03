# Handoff Report: Testing Environment, Automated Verification & 4-Tier E2E Testing Strategy

## 1. Observation

### 1.1 `server.js` Route Resolution Analysis
Direct inspection of `server.js` (lines 25–80) reveals the local static HTTP server mechanics:
```javascript
// server.js lines 26-33
const rawUrl = (req.url || "/").split("?")[0];
let safePath = path.normalize(decodeURIComponent(rawUrl)).replace(/^(\.\.[/\\])+/, "");
if (safePath === "/" || safePath === "\\") {
  safePath = "/index.html";
}
let filePath = path.join(ROOT_DIR, safePath);

// server.js lines 41-45
fs.stat(filePath, (err, stats) => {
  if (!err && stats.isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  // lines 46-68
  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      // SPA fallback for routes without a file extension
      if (!path.extname(safePath)) {
        fs.readFile(path.join(ROOT_DIR, "index.html"), (fallbackErr, fallbackData) => {
          ...
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
          res.end(fallbackData);
        });
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
    res.end(data);
  });
});
```

Key empirical observations from command execution:
1. **Trailing slash vs No trailing slash**:
   - `path.normalize("/phone-mockup/")` yields `"/phone-mockup/"`.
   - `path.normalize("/phone-mockup")` yields `"/phone-mockup"`.
   - In both cases, Node's `fs.statSync(path.join(ROOT_DIR, safePath)).isDirectory()` evaluates to `true` once directory `phone-mockup` exists on disk.
   - In both cases, `path.join(filePath, "index.html")` produces `ROOT_DIR/phone-mockup/index.html`.
2. **Current Baseline Response (before directory exists)**:
   - Running `curl -s http://localhost:3000/phone-mockup | grep -E 'title|id="pmDevice"|sidebarnav'`:
     ```html
     <title>Tele-ICT School Management System</title>
     <div class="min-brand-title" id="sidebarSchoolName">Tele-ICT School</div>
     <nav class="min-nav-scroll" id="sidebarnav" aria-label="Main Navigation">
     ```
     Because `phone-mockup` directory does not yet exist, `safePath` lacks an extension (`path.extname("") === ""`), triggering line 50: `fs.readFile(path.join(ROOT_DIR, "index.html"))` returning the SPA fallback.
3. **MIME Types**:
   - `.html` -> `text/html; charset=utf-8` (line 9).
   - `.css` -> `text/css; charset=utf-8` (line 10).
   - `.js` -> `application/javascript; charset=utf-8` (line 11).
   - `.svg` -> `image/svg+xml` (line 13).
4. **Cloudflare Workers Deployment (`wrangler.json`)**:
   - Lines 5–8 configure `assets: { "directory": ".", "not_found_handling": "single-page-application" }`.
   - Cloudflare Pages / Workers static asset serving automatically honors directory `index.html` with trailing slash normalization, matching local `server.js` behavior without any configuration modification.

### 1.2 Mathematical & Data Model Assertions
Direct calculation and script execution verified the seed data logic:
- **Outstanding Balance**:
  - Invoices: INV-2026-0618 ($45.00, Overdue) + INV-2026-0624 ($360.00, Due) + INV-2026-0631 ($1,305.00, Due) = **`$1,710.00`**.
  - Paid invoices: INV-2026-0501 ($1,852.50) and INV-2026-0506 ($1,665.00) are excluded from outstanding balance.
  - Payment of INV-2026-0618 reduces outstanding to **`$1,665.00`**.
- **Grade Averages**:
  - Child 1 (Sok Chanreaksa): 7 subjects `[95, 91, 89, 90, 94, 88, 96]`, sum = 643, avg = 643 / 7 = **`91.9`** (GPA 3.85, Rank 2 of 31).
  - Child 11 (Sok Chanpanha): 6 subjects `[93, 92, 89, 87, 95, 90]`, sum = 546, avg = 546 / 6 = **`91.0`** (GPA 3.78, Rank 4 of 28).
- **Attendance Statistics**:
  - October 2026: 31 days - 4 Sundays (Oct 4, 11, 18, 25) - 2 Holidays (Oct 15, 29) = 25 school days.
    - Child 1: Late = [8, 21] (2), Excused = 0, Absent = 0, Present = 23.
  - November 2026 (through Demo Date Nov 3): Nov 1 is Sunday. School days = 2 (Nov 2, Nov 3).
    - Child 1: Excused = [2] (1), Late = 0, Absent = 0, Present = 1 (Nov 3).
  - Term Totals (Child 1): Total school days = 25 + 2 = 27 days.
    - Present: 23 + 1 = **24**.
    - Late: 2 + 0 = **2**.
    - Excused: 0 + 1 = **1**.
    - Absent: 0 + 0 = **0**.
    - Rate = `(24 + 2) / 27` = `26 / 27` = **`96.3%`**.
  - Term Totals (Child 11): 27 present, 0 late/excused/absent, Rate = **`100%`**.
- **Campus Duration**:
  - Today (Tue 3 Nov 2026): In at 07:12 AM (432 min), Out at 11:32 AM (692 min).
  - Duration = `692 - 432` = 260 minutes = **`4h 20m`**.

### 1.3 Repository & Working Tree State
- `git status -s` confirms 7 uncommitted modified files in the working tree (`css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`).
- Port 3000 is active and running PID 40241 (`node server.js`).

---

## 2. Logic Chain

1. **Routing and Fallback Distinction**:
   - `server.js` serves files through `fs.stat` and `fs.readFile`. When `phone-mockup/index.html` is introduced, any request to `/phone-mockup` or `/phone-mockup/` detects a directory, targets `ROOT_DIR/phone-mockup/index.html`, and bypasses the line 50 SPA fallback entirely.
   - Crucially, all internal asset references in `phone-mockup/index.html` MUST use root-absolute paths (`/phone-mockup/phone-mockup.css`, `/phone-mockup/mockup-data.js`, `/phone-mockup/mockup-app.js`, `/css/custom-demo.css`, etc.). If relative paths (`phone-mockup.css`) were used, requests to `/phone-mockup` (no trailing slash) would resolve relatively to `/phone-mockup.css` at the web root, failing into 404 or SPA fallback. Root-absolute paths guarantee immunity to trailing-slash discrepancies.
2. **Automated Test Oracle Reliability**:
   - Because `mockup-data.js` and `mockup-app.js` use pure ES2020 JavaScript without compilation, Node.js can directly execute data integrity assertions by defining a minimal `global.window = {}` shim. Exposing pure computation helpers (`attendanceSummary`, `periodStatus`, `childToday`, `outstanding`, `pseudoQr`) on `window.PM_HELPERS` allows automated unit tests to execute headless in milliseconds without browser overhead.
3. **Multi-Tier Testing Coverage**:
   - Simple smoke tests verify static routes, but mobile mockup apps involve complex interaction states (child context switching, push banner timers, modal sheets, multi-step asynchronous payment simulations).
   - Organizing verification across 4 distinct tiers (Tier 1 Feature Coverage, Tier 2 Boundaries, Tier 3 Cross-Feature Integration, Tier 4 Real-World Flows) ensures that zero regressions or edge-case bugs slip into production.

---

## 3. Caveats

1. **Local Server Execution**:
   - While server tests can run against `localhost:3000`, the server must be running. Automated test scripts must check whether port 3000 (or another port) is accessible and report clear setup instructions if the server is offline.
2. **Visual Fidelity Verification**:
   - Headless curl tests verify HTTP status, content types, and DOM strings, but cannot verify CSS visual scaling (`fitDevice()`), titanium gradient rendering, Dynamic Island positioning, or `@media (prefers-reduced-motion)` compliance. Those must be verified via browser agent or manual viewport inspection.
3. **In-Memory State Boundary**:
   - The phone mockup is strictly in-memory. Reloading the page resets all modifications. Automated scripts must verify that `window.localStorage` is never populated with mockup session data or altered school profile state.

---

## 4. Conclusion & Test Harness Specifications

### 4.1 Automated Test Scripts Formulation

#### A. Syntax Validation Harness
```bash
# Validates vanilla JavaScript syntax for all new mockup files
node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
```

#### B. Curl Route & Content-Type Test Harness (`test-routes.sh`)
```bash
#!/usr/bin/env bash
set -e

PORT="${PORT:-3000}"
BASE_URL="http://localhost:${PORT}"
FAILED=0

echo "=== Running Route & Content-Type Tests on ${BASE_URL} ==="

check_url() {
  local url="$1"
  local expected_code="$2"
  local expected_type="$3"
  local must_contain="$4"
  local must_not_contain="$5"

  local response_file
  response_file=$(mktemp)
  local http_code
  http_code=$(curl -s -w "%{http_code}" -o "$response_file" "$url")
  local content_type
  content_type=$(curl -s -I "$url" | grep -i '^Content-Type:' | tr -d '\r' | awk '{print $2}')

  echo -n "Checking $url -> HTTP $http_code (expected $expected_code)... "

  if [ "$http_code" != "$expected_code" ]; then
    echo "FAIL (Expected HTTP $expected_code, got $http_code)"
    FAILED=$((FAILED + 1))
    rm -f "$response_file"
    return
  fi

  if [ -n "$expected_type" ] && [[ "$content_type" != *"$expected_type"* ]]; then
    echo "FAIL (Expected Content-Type $expected_type, got $content_type)"
    FAILED=$((FAILED + 1))
    rm -f "$response_file"
    return
  fi

  if [ -n "$must_contain" ] && ! grep -q "$must_contain" "$response_file"; then
    echo "FAIL (Missing expected pattern: $must_contain)"
    FAILED=$((FAILED + 1))
    rm -f "$response_file"
    return
  fi

  if [ -n "$must_not_contain" ] && grep -q "$must_not_contain" "$response_file"; then
    echo "FAIL (Forbidden pattern present: $must_not_contain)"
    FAILED=$((FAILED + 1))
    rm -f "$response_file"
    return
  fi

  echo "PASS"
  rm -f "$response_file"
}

# 1. Mockup Shell with trailing slash
check_url "${BASE_URL}/phone-mockup/" "200" "text/html" 'id="pmDevice"' "id=\"sidebarnav\""

# 2. Mockup Shell without trailing slash
check_url "${BASE_URL}/phone-mockup" "200" "text/html" 'id="pmDevice"' "id=\"sidebarnav\""

# 3. Static Assets
check_url "${BASE_URL}/phone-mockup/phone-mockup.css" "200" "text/css" ".pm-device" ""
check_url "${BASE_URL}/phone-mockup/mockup-data.js" "200" "application/javascript" "PM_DATA" ""
check_url "${BASE_URL}/phone-mockup/mockup-app.js" "200" "application/javascript" "fitDevice" ""

# 4. Main Site Integration
check_url "${BASE_URL}/" "200" "text/html" "min-app-mockup-btn" ""
check_url "${BASE_URL}/css/custom-demo.css" "200" "text/css" ".min-app-mockup-btn" ""

# 5. Non-existent file 404 test
check_url "${BASE_URL}/phone-mockup/nonexistent-file.css" "404" "text/plain" "404 Not Found" ""

if [ "$FAILED" -eq 0 ]; then
  echo "All Route & Content-Type checks passed successfully!"
  exit 0
else
  echo "$FAILED checks failed!"
  exit 1
fi
```

#### C. Node Data Oracle Script (`test-oracle.js`)
```javascript
#!/usr/bin/env node
/**
 * Headless Data Oracle Verification
 * Asserts seed data and pure calculation helpers
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=== Running Node Data Oracle Verification ===");

// 1. Initialize DOM/Browser shim for headless execution
global.window = {};
global.document = {
  documentElement: { style: { setProperty: () => {} } },
  getElementById: () => ({ style: {}, addEventListener: () => {} }),
  addEventListener: () => {}
};

// 2. Load Seed Data & Mockup App
require(path.join(__dirname, "phone-mockup/mockup-data.js"));
const D = global.window.PM_DATA;
assert(D, "window.PM_DATA must be defined");

// 3. Outstanding Balance Oracle Check
const outstanding = D.invoices
  .filter(i => i.status !== "Paid")
  .reduce((sum, inv) => sum + inv.amount, 0);

console.log(`- Outstanding balance: $${outstanding.toFixed(2)} (Expected: $1710.00)`);
assert.strictEqual(outstanding.toFixed(2), "1710.00", "Total family outstanding must equal $1710.00");

// 4. Grade Averages Oracle Check
const calcAvg = subjects => (subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length).toFixed(1);
const avgChild1 = calcAvg(D.reports[1].subjects);
const avgChild11 = calcAvg(D.reports[11].subjects);

console.log(`- Child 1 (Chanreaksa) Grade Average: ${avgChild1} (Expected: 91.9)`);
console.log(`- Child 11 (Chanpanha) Grade Average: ${avgChild11} (Expected: 91.0)`);
assert.strictEqual(avgChild1, "91.9", "Child 1 grade average must equal 91.9");
assert.strictEqual(avgChild11, "91.0", "Child 11 grade average must equal 91.0");

// 5. Attendance Summary Oracle Check
function verifyAttendance(childId, octExpected, novExpected, termExpected) {
  const oct = D.attendance[childId]["2026-10"];
  const nov = D.attendance[childId]["2026-11"];

  // Oct 2026: 31 days, 4 Sundays, 2 Holidays -> 25 school days
  const octSchoolDays = 25;
  const octLate = (oct.late || []).length;
  const octExcused = (oct.excused || []).length;
  const octAbsent = (oct.absent || []).length;
  const octPresent = octSchoolDays - octLate - octExcused - octAbsent;

  // Nov 2026 through Nov 3: Nov 1 Sunday, Nov 2-3 school days -> 2 school days
  const novSchoolDays = 2;
  const novLate = (nov.late || []).length;
  const novExcused = (nov.excused || []).length;
  const novAbsent = (nov.absent || []).length;
  const novPresent = novSchoolDays - novLate - novExcused - novAbsent;

  const totalSchoolDays = octSchoolDays + novSchoolDays;
  const totalPresent = octPresent + novPresent;
  const totalLate = octLate + novLate;
  const totalExcused = octExcused + novExcused;
  const totalAbsent = octAbsent + novAbsent;
  const rate = +(((totalPresent + totalLate) / totalSchoolDays) * 100).toFixed(1);

  return {
    present: totalPresent,
    late: totalLate,
    excused: totalExcused,
    absent: totalAbsent,
    schoolDays: totalSchoolDays,
    rate
  };
}

const c1Stats = verifyAttendance(1);
console.log(`- Child 1 Attendance: Rate ${c1Stats.rate}%, Present ${c1Stats.present}, Late ${c1Stats.late}, Excused ${c1Stats.excused}, Absent ${c1Stats.absent}`);
assert.strictEqual(c1Stats.rate, 96.3, "Child 1 attendance rate must equal 96.3%");
assert.strictEqual(c1Stats.present, 24, "Child 1 present count must equal 24");
assert.strictEqual(c1Stats.late, 2, "Child 1 late count must equal 2");
assert.strictEqual(c1Stats.excused, 1, "Child 1 excused count must equal 1");
assert.strictEqual(c1Stats.absent, 0, "Child 1 absent count must equal 0");

const c11Stats = verifyAttendance(11);
console.log(`- Child 11 Attendance: Rate ${c11Stats.rate}%, Present ${c11Stats.present}, Late ${c11Stats.late}, Excused ${c11Stats.excused}, Absent ${c11Stats.absent}`);
assert.strictEqual(c11Stats.rate, 100.0, "Child 11 attendance rate must equal 100.0%");
assert.strictEqual(c11Stats.present, 27, "Child 11 present count must equal 27");

// 6. Gate Log Campus Duration Check
const c1TodayEvents = D.gateLog.filter(e => e.childId === 1 && e.date === "2026-11-03");
assert.strictEqual(c1TodayEvents.length, 2, "Child 1 must have 2 gate events today");
assert.strictEqual(c1TodayEvents[0].type, "in");
assert.strictEqual(c1TodayEvents[0].time, "07:12 AM");
assert.strictEqual(c1TodayEvents[1].type, "out");
assert.strictEqual(c1TodayEvents[1].time, "11:32 AM");

console.log("All Node Data Oracle assertions PASSED cleanly!\n");
```

---

### 4.2 Comprehensive 4-Tier E2E Testing Strategy

```
+----------------------------------------------------------------------------------+
|                              E2E TESTING MATRIX                                  |
+----------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage (R1-R5 Core Specs, ≥5 tests per requirement)           |
|  Tier 2: Boundary & Corner Cases (Empty inputs, Month bounds, Clamped scale)     |
|  Tier 3: Cross-Feature Combinations (Child switcher, Payment state, Gate alerts) |
|  Tier 4: Real-World User Flows (Student Morning Check-in, Parent Pay Flow)       |
+----------------------------------------------------------------------------------+
```

#### Tier 1: Feature Coverage (≥5 Tests Per Requirement)

- **R1: App Mockup Button in Sidebar**
  - **T1-R1.1 (DOM Structure)**: Verify `.min-sidebar-footer` exists between `</nav>` and `</aside>`, strictly outside `#sidebarnav`.
  - **T1-R1.2 (Anchor Target)**: Verify anchor has `href="/phone-mockup/"`, class `min-app-mockup-btn`, and title `"Preview the Student & Parent mobile app"`.
  - **T1-R1.3 (Icons and Label)**: Verify child elements include `<i class="fe fe-smartphone"></i>`, `<span>App Mockup</span>`, and `<i class="fe fe-arrow-up-right min-app-mockup-arrow"></i>`.
  - **T1-R1.4 (Hover & Focus States)**: Verify CSS applies `background: var(--brand-primary-light)`, `border-color: var(--brand-primary)`, `color: var(--brand-primary)`, and arrow transform `translate(1px, -1px)`.
  - **T1-R1.5 (Mobile Drawer Pinning)**: Verify that when viewport <992px and hamburger opens `#sidebar`, the footer remains pinned at the bottom of the drawer.
  - **T1-R1.6 (Router Isolation)**: Verify clicking the button performs direct standard navigation to `/phone-mockup/` without hash collisions or invoking `app.js` routing logic.

- **R2: Mockup Page Shell and Device Frame**
  - **T1-R2.1 ("← Home" Pill)**: Verify top-left button has `href="/"`, class `pm-home-btn`, contains `fe-arrow-left` and "Home", positioned `top: 20px, left: 20px`.
  - **T1-R2.2 (iPhone 15 Pro Hardware Frame)**: Verify outer `.pm-device` has dimensions 417×876pt, titanium gradient border, radius 68px, hardware side buttons (Action, Vol Up, Vol Down, Power).
  - **T1-R2.3 (Dynamic Island & Status Bar)**: Verify island (126×37pt, radius 20px, `#000`), status bar height 54px, clock "11:35", and 3 inline SVGs (cellular, Wi-Fi, battery).
  - **T1-R2.4 (Home Indicator)**: Verify 134×5pt pill centered at `bottom: 8px` with `pointer-events: none`.
  - **T1-R2.5 (Dynamic Scaling Across Viewports)**: Verify `fitDevice()` computes scale factor `s = Math.max(0.45, Math.min(1, (innerHeight - 80) / 876, (innerWidth - 32) / 425))` and eliminates window scrollbars at 1440×900, 1280×720, and 390×844.

- **R3: Data and Authentication Model**
  - **T1-R3.1 (Segmented Role Switcher)**: Verify switching between Student and Parent toggles active state, updates label ("Student ID or username" vs "Phone number or username"), and swaps pre-filled credentials.
  - **T1-R3.2 (Password Visibility Toggle)**: Verify clicking eye toggle flips input `type` between `"password"` and `"text"` and updates icon `bi-eye` / `bi-eye-slash` without re-rendering form.
  - **T1-R3.3 (Inline Validation Error)**: Verify clearing fields and submitting triggers red border (`#d92d20`) and inline error message without advancing.
  - **T1-R3.4 (700ms Sign-in Loading State)**: Verify submit initiates button spinner with text "Signing in...", transitioning to app after 700ms.
  - **T1-R3.5 (Sign Out & Ephemeral State)**: Verify header avatar -> Account sheet -> "Sign out" returns to login screen with role preserved; reloading page completely resets state without localStorage persistence.

- **R4: Student Portal (5 Tabs)**
  - **T1-R4.1 (Home Tab Hero & Overview)**: Verify greeting "Good morning, Chanreaksa", hero card pill "Lunch break · 11:00 – 13:30", checkout note "Checked out 11:32 AM · Gate 01", next class "Biology", stat cards 96.3% attendance and 91.9 average score.
  - **T1-R4.2 (Schedule Tab Periods & Statuses)**: Verify Mon–Sat day selector, Tuesday periods list, "Now" highlight on Lunch break row, "Next" badge on Biology period.
  - **T1-R4.3 (Report Tab Midterm Grades)**: Verify circular progress ring 91.9, GPA 3.85, class rank "2 of 31", subject progress bars with letter pills (Math 95 A+, Physics 91 A, Biology 90 A, CS&AI 96 A+), recent assessments, and homeroom comment.
  - **T1-R4.4 (Attendance Tab Counters & Grid)**: Verify 96.3% rate ring, 24 present / 2 late / 1 excused / 0 absent counters, November calendar grid with status dots, and non-present records list.
  - **T1-R4.5 (Check-in Log & Campus ID QR Sheet)**: Verify today's gate events (07:12 AM In, 11:32 AM Out), duration footer "Time on campus today: 4h 20m", and "Show my campus ID" button opening modal sheet with deterministic QR code for `STU-2026-001`.

- **R5: Parent Portal (5 Tabs & Workflows)**
  - **T1-R5.1 (Child Switcher Bottom Sheet)**: Verify child pill button opens sheet listing Chanreaksa and Chanpanha, selecting updates child context across Scores, Schedule, and Payments tabs.
  - **T1-R5.2 (Home Tab Dual Cards & Payment Alert)**: Verify status cards for both children (Chanreaksa "Off campus · Out 11:32 AM", Chanpanha "On campus · In 07:12 AM") and Next Payment Due card ($1,305.00 for Chanpanha, Due in 7 days).
  - **T1-R5.3 (Simulated iOS Push Banner)**: Verify banner slides down ~1500ms post-login showing "Check-out alert · Sok Chanreaksa left campus at 11:32 AM via Gate 01", auto-dismisses after 6s, and tap navigates to Alerts tab.
  - **T1-R5.4 (Alerts Tab & Unread Badge)**: Verify tab starts with red badge "1", opening tab marks alert read and removes badge; filter chips filter between All, Chanreaksa, and Chanpanha.
  - **T1-R5.5 (Payments Tab & Multi-Method Pay Flow)**: Verify family total outstanding `$1,710.00`, Due/Paid tabs, pay flow on INV-2026-0618 ($45.00) via ABA/Bakong KHQR/ACLEDA with 1200ms processing spinner, receipt `RCP-2026-0910`, and balance decrement to `$1,665.00`.

---

#### Tier 2: Boundary & Corner Cases

- **T2.1 (Empty/Whitespace Credentials)**: Submitting empty fields or whitespace produces inline error styling and prevents sign-in.
- **T2.2 (Attendance Month Boundaries)**: In November 2026, next-month arrow is disabled (cannot go to Dec); in October 2026, previous-month arrow is disabled (cannot go to Sep).
- **T2.3 (Future Date Invalidation)**: Nov 4 through Nov 30 in the calendar grid are styled as "future" cells with no status dots or interactive records.
- **T2.4 (Sundays & Public Holidays)**: Sundays (Oct 4, 11, 18, 25; Nov 1) and public holidays (Oct 15, 29) are excluded from school day count; holidays display muted "H" indicator.
- **T2.5 (Saturday Half-Day Schedule)**: Child 1 Saturday schedule omits subject `"-"` (P7); Child 11 ends at P4 with no lunch row.
- **T2.6 (Zero Payments Due Empty State)**: Paying all due invoices displays clean empty state text "All caught up · No payments due" with `bi-check-circle` icon (zero emojis permitted).
- **T2.7 (Scale Factor Clamping)**: Verifies `fitDevice()` scale factor `s` remains strictly between `0.45` and `1.0` regardless of extreme screen sizes (320px width up to 4K displays).
- **T2.8 (School Profile Fallback)**: If `window.SMS_STATE` is undefined, `applyBrand()` cleanly falls back to default Milky Way School `#0077b6` without JavaScript exceptions.
- **T2.9 (Single-Toast Concurrency)**: Triggering multiple toast notifications in rapid succession removes previous toasts cleanly without DOM leaks.
- **T2.10 (Push Banner Race Conditions)**: Navigating tabs or signing out before the 1500ms push banner timer triggers clears `state.pushTimer` via `clearTimeout`.

---

#### Tier 3: Cross-Feature State Combinations

- **T3.1 (Child Switcher Synchronization)**: Switching child from Chanreaksa to Chanpanha on the Scores tab persists the selected child when switching between Scores, Schedule, and Payments tabs.
- **T3.2 (Payment State Multi-Component Propagation)**:
  - Paying invoice INV-2026-0618 ($45.00):
    1. Reduces Family Total Outstanding on Payments tab from `$1,710.00` to `$1,665.00`.
    2. Moves invoice from "Due" list to "Paid" list with timestamp `2026-11-03` and receipt number.
    3. Clears overdue red dot on Payments tab bar icon.
    4. Clears overdue alert row on Parent Home tab.
- **T3.3 (Gate Log & Alert Badge Synchronization)**:
  - Initial unread check-out alert triggers tab badge `1`.
  - Tapping push notification banner dismisses banner, navigates to Alerts tab, marks alert read, and removes badge from tab bar.
- **T3.4 (Campus Duration & QR Integration)**:
  - Timeline gate events (07:12 AM In, 11:32 AM Out) feed calculation of "Time on campus today: 4h 20m".
  - Campus ID button displays Card ID `STU-2026-001` matching child record and generates valid deterministic pseudo-QR matrix.
- **T3.5 (Dynamic Brand Synchronization)**:
  - When primary color is updated in main application profile, phone mockup dynamically updates `--brand-primary` and derived tokens on page load.

---

#### Tier 4: Real-World User Flows

- **Flow 1: Student Morning Check-In & Timetable Review Flow**
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

- **Flow 2: Parent Gate Notification, Multi-Child Check, & Tuition Payment Flow**
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

### 4.3 Proposed Structure for `TEST_INFRA.md`

We recommend organizing `TEST_INFRA.md` into the following 6 standard sections:

1. **Test Infrastructure Overview**:
   - Scope: Syntax checks, HTTP routing & content-type verification, headless data oracles, and 4-tier E2E testing.
   - Design Philosophy: Zero external npm dependencies, pure ES2020 validation, deterministic seed assertions, and browser agent visual inspection.
2. **Environment & Prerequisites**:
   - Node.js runtime (v18+).
   - Local development server: `npm run dev` running on port 3000.
   - Curl and Bash utility requirements.
3. **Automated Test Runners**:
   - Complete copy and usage instructions for `test-syntax.sh`, `test-routes.sh`, `test-oracle.js`, and `test-all.sh`.
4. **4-Tier E2E Test Catalog**:
   - Tabulated test case specifications across Tier 1 (Features), Tier 2 (Boundaries), Tier 3 (Cross-Feature), and Tier 4 (Real-World Journeys).
5. **Browser Agent & Manual Viewport Verification Protocol**:
   - Detailed instructions for viewports: 1440×900 (Desktop), 1280×720 (Laptop/Tablet), and 390×844 (Mobile).
   - Visual inspection checklist: titanium finish, Dynamic Island, status bar clock, home indicator, modal sheets, and reduced motion behavior.
6. **Continuous Deployment & Production Readiness**:
   - Pre-push verification steps.
   - Cloudflare Pages / Workers asset verification steps.

---

## 5. Verification Method

To independently reproduce and verify this investigation:

1. **Verify `server.js` route resolution and fallback**:
   ```bash
   # Check directory routing without phone-mockup/index.html (falls back to main index.html)
   curl -s http://localhost:3000/phone-mockup | grep -c 'Tele-ICT School Management System'
   # Output must be 1

   # Verify path normalization and directory stat behavior in Node
   node -e 'const path=require("path"); console.log(path.normalize("/phone-mockup/"), path.normalize("/phone-mockup"));'
   ```
2. **Execute Headless Data Oracle Assertions**:
   ```bash
   node -e '
   const D = {
     reports: {
       1:  { subjects: [{score:95},{score:91},{score:89},{score:90},{score:94},{score:88},{score:96}] },
       11: { subjects: [{score:93},{score:92},{score:89},{score:87},{score:95},{score:90}] }
     },
     invoices: [
       { amount: 45.00, status: "Overdue" },
       { amount: 360.00, status: "Due" },
       { amount: 1852.50, status: "Paid" },
       { amount: 1305.00, status: "Due" },
       { amount: 1665.00, status: "Paid" }
     ]
   };
   const due = D.invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.amount,0);
   console.log("Outstanding:", due.toFixed(2));
   const avg = s => (s.reduce((a,b)=>a+b.score,0)/s.length).toFixed(1);
   console.log("Avg1:", avg(D.reports[1].subjects), "Avg11:", avg(D.reports[11].subjects));
   '
   ```
   - Must output: `Outstanding: 1710.00`, `Avg1: 91.9`, `Avg11: 91.0`.
3. **Invalidation Conditions**:
   - If `server.js` is modified to remove `fs.stat` directory checking, directory resolution would break.
   - If relative asset paths (`href="phone-mockup.css"`) are introduced in `phone-mockup/index.html`, requests to `/phone-mockup` (no trailing slash) would fail.
   - If `localStorage` write operations are added to `mockup-app.js`, reload state neutrality would be invalidated.
