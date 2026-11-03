# Milestone 2 Review and Adversarial Challenge Report

**Reviewer**: `reviewer_m2_1` (teamwork_reviewer / teamwork_critic)  
**Date**: 2026-11-03T06:31:00Z  
**Target Code**: `phone-mockup/mockup-data.js` and `phone-mockup/mockup-app.js`  
**Verdict**: **APPROVE**  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/reviewer_m2_1/`  
**Recipient**: `f47b3442-f659-46f9-91f4-2d8a9d4c3a60` (orchestrator)  

---

## 1. Observation

### 1.1 Static Code & Architecture Inspection
- **`phone-mockup/mockup-data.js`** (379 lines):
  - Strictly adheres to Vanilla ES2020: wrapped in an IIFE `(function () { "use strict"; ... })();` with zero runtime dependencies.
  - Implements the complete authoritative data schema matching `PROJECT.md`:
    - `demoNow`: `{ iso: "2026-11-03", dayKey: "tue", dateLabel: "Tuesday, 3 November", clock: "11:35", minutes: 695, greeting: "Good morning" }` (lines 15–22).
    - `credentials`: Student (`stu_chanreaksa` / `demo1234`) and Parent (`par_vibol` / `demo1234`) (lines 24–35).
    - `student`: `{ childId: 1 }` (lines 37–39).
    - `parent`: `id: 201`, `nameEn: "Sok Vibol"`, `salutation: "Mr. Vibol"`, `initials: "SV"`, `phone: "012 998 877"`, `childIds: [1, 11]` (lines 41–50).
    - `children`: Child 1 (Sok Chanreaksa, G12-A, `STU-2026-001`, Dr. Sokha Chan) and Child 11 (Sok Chanpanha, G7-IEP, `STU-2026-007`, Ms. Bopha Pich) (lines 52–81).
    - `timetables`: Full Mon–Sat schedules. Child 1 Saturday timetable has 6 periods omitting period 7 `-` (lines 130–137); Child 11 Saturday timetable has 5 entries (P1–P4 + recess) ending at 11:20 AM with no lunch break (lines 195–201).
    - `attendance`: Oct/Nov 2026 logs. Child 1 has late days on Oct 8, 21, holidays on Oct 15, 29, and an excused day on Nov 2 (lines 205–241). Child 11 has 100% attendance.
    - `gateLog`: 19 chronological entries. On 2026-11-03, Child 1 entered at 07:12 AM and exited at 11:32 AM (`note: "Lunch break exit"`, `unread: true`) (lines 243–263).
    - `reports`: Child 1 has 7 subjects summing to 643 (average = 91.9, GPA 3.85, rank "2 of 31"); Child 11 has 6 subjects summing to 546 (average = 91.0, GPA 3.78, rank "4 of 28") (lines 265–308).
    - `invoices`: 5 invoices totaling $1,710.00 initial unpaid ($45.00 overdue, $360.00 due, $1,305.00 due, 2 paid) (lines 310–362).
    - `announcement`: Independence Day holiday notice on Mon 9 Nov (lines 364–368).
    - Dual UMD / Node export pattern (lines 372–377):
      ```javascript
      if (typeof window !== "undefined") {
        window.PM_DATA = PM_DATA;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = PM_DATA;
      }
      ```

- **`phone-mockup/mockup-app.js`** (1810 lines):
  - Strictly Vanilla ES2020 with zero npm dependencies or build requirements.
  - Implements all 15 pure computation helpers under `const PM_HELPERS`:
    1. `esc(str)` (lines 65–72)
    2. `toMin(timeStr)` (lines 77–87)
    3. `fmtMoney(amount)` (lines 92–100)
    4. `fmtDate(isoStr)` (lines 105–115)
    5. `fmtDay(dayKeyOrIso)` (lines 120–143)
    6. `daysBetween(isoA, isoB)` (lines 148–155)
    7. `letter(score)` (lines 160–168)
    8. `calcAverage(subjects)` (lines 173–177)
    9. `attendanceSummary(childId, D)` (lines 182–246)
    10. `attendanceMonth(childId, monthStr, D, demoIso)` (lines 251–302)
    11. `periodStatus(period, dayKey, allPeriods, demoMin)` (lines 307–324)
    12. `childToday(childId, gateLog, demoIso)` (lines 329–354)
    13. `campusDuration(childId, gateLog, demoIso, demoMin)` (lines 359–387)
    14. `outstanding(childId, invoices)` (lines 392–403)
    15. `pseudoQr(seedStr, size, format)` (lines 408–448)
  - Dual export for `PM_HELPERS` (lines 452–457):
    ```javascript
    if (typeof window !== "undefined") {
      window.PM_HELPERS = PM_HELPERS;
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = PM_HELPERS;
    }
    ```
  - In-memory state machine (lines 463–485) deep-cloning `invoices` and `gateLog` on `initState()`.
  - Zero calls to `localStorage` or `sessionStorage` (verified via codebase grep).
  - Login UI and authentication engine (lines 493–606, 1465–1531, 1622–1645):
    - Segmented role toggle updating labels, placeholders, and prefilled username.
    - Password eye toggle button switching between `password` and `text` types without DOM destruction.
    - Inline credential validation applying red border (`.error`) and error text (`#pmUserError` / `#pmPassError`), halting submission when inputs are empty.
    - 700ms simulated network delay with button spinner `<span class="pm-spinner"></span> Signing in…`.
    - Parent push notification banner simulation scheduled 1.5s post-login.
    - Avatar account sheet with "Sign Out" button, preserving the selected role on return to login.

- **Non-regression Check**:
  - `git status` confirms the 7 original repository files (`css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`) are 100% untouched and preserved.

### 1.2 Automated Tool Commands & Results
1. `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`
   - Result: Exit code 0, clean syntax.
2. `node tests/test-oracle.js`
   - Result: 7 total | 7 passed | 0 failed | Exit code 0.
3. `./tests/test-syntax.sh`
   - Result: 2 total | 2 passed | 0 failed | Exit code 0.
4. `./tests/test-routes.sh`
   - Result: 8 total | 8 passed | 0 failed | Exit code 0.
5. `./tests/test-adversarial-m1.sh`
   - Result: 21 total | 21 passed | 0 failed | Exit code 0.
6. `node tests/test-centering.js`
   - Result: 27 total | 27 passed | 0 failed | Exit code 0.
7. Custom Headless Chromium CDP Interactive Test (`node -e '...'`):
   - Result: Verified live browser `window.PM_DATA` and `window.PM_HELPERS`, interactive password visibility toggle, role switching, inline validation error on empty submission, loading transition spinner, and avatar account sheet sign-out.

---

## 2. Logic Chain

1. **Integrity & Zero-Cheat Verification**:
   - Every single helper implementation was inspected to verify genuine programmatic derivation:
     - `calcAverage` uses `reduce` to sum scores and divides by `length` with `.toFixed(1)`. It does not hardcode `"91.9"` or `"91.0"`.
     - `attendanceSummary` iterates through calendar days, excludes Sundays (`getUTCDay() === 0`) and declared holidays (`holSet.has(day)`), increments school days, and calculates `((totalPresent + totalLate) / totalSchoolDays) * 100`.
     - `campusDuration` iterates over sorted gate log entries, tracking entry/exit times in minutes, computing elapsed intervals, and handling in-progress campus stays against `demoMin`.
     - `outstanding` filters unpaid invoices and sums `amount`.
     - `periodStatus` parses start/end via `toMin` and compares against `demoMin = 695`.
     - `pseudoQr` implements FNV-1a hash and Xorshift PRNG with 7x7 corner finder squares and quiet zones.
   - Conclusion: ZERO dummy implementations, ZERO facade logic, ZERO hardcoded outputs. The work is mathematically genuine and structurally sound.

2. **Letter Grade Threshold Consistency**:
   - The authoritative threshold scale is:
     $\ge 95 \text{ A+}$, $\ge 90 \text{ A}$, $\ge 85 \text{ B+}$, $\ge 80 \text{ B}$, $\ge 70 \text{ C}$, $< 70 \text{ D}$.
   - This aligns with `tests/test-oracle.js` lines 269–275 and `implementation_plan.md` §4d.
   - Child 1's subject scores (95, 91, 89, 90, 94, 88, 96) yield pills `{A+, A, B+}` satisfying `PROJECT.md` line 47.

3. **Timezone Shift Protection**:
   - Helper functions parsing dates (`fmtDate`, `attendanceMonth`, `daysBetween`) split ISO strings (`"YYYY-MM-DD"`) manually and use UTC dates (`Date.UTC(...)` and `getUTCDate()`).
   - This eliminates local timezone drift where UTC midnight in Western Hemisphere timezones could shift dates backward by one calendar day.

4. **In-Memory State Machine Isolation**:
   - State reset and session lifecycle operate strictly in memory.
   - Search for `localStorage` and `sessionStorage` in `phone-mockup/` returned zero matches.
   - Reloading the page or signing out cleanly returns to the pristine demo state.

---

## 3. Caveats

- **Milestone 3 & 4 Scope Boundary**: `mockup-app.js` contains preliminary functional renderers for Student and Parent tabs (Schedule, Reports, Attendance, Check-in, Alerts, Scores, Payments) enabling end-to-end smoke testing. Further specialized refinements, such as the full 3-step checkout simulation and SVG circular average rings, will be finalized during Milestone 3 and Milestone 4 as planned in `PROJECT.md`.
- No caveats regarding Milestone 2 deliverables.

---

## 4. Conclusion

Milestone 2: Data Model (`phone-mockup/mockup-data.js`) and Pure Computation Helpers / Auth Engine (`phone-mockup/mockup-app.js`) satisfies 100% of architectural, mathematical, and functional requirements.

- **Quality Review Verdict**: **APPROVE**
- **Adversarial Challenge Risk Assessment**: **LOW**
- Integrity check: **PASS** (zero integrity violations detected).

---

## 5. Verification Method

To independently verify this evaluation, execute the following commands in the workspace root:

```bash
# 1. JavaScript syntax validation
node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js

# 2. Headless Data Oracle test suite
node tests/test-oracle.js

# 3. Test syntax shell script
./tests/test-syntax.sh

# 4. Route and asset verification
./tests/test-routes.sh

# 5. Milestone 1 regression harness
./tests/test-adversarial-m1.sh

# 6. Centering defect test suite
node tests/test-centering.js

# 7. Adversarial edge-case unit test runner
node -e '
const assert = require("assert");
const data = require("./phone-mockup/mockup-data.js");
const app = require("./phone-mockup/mockup-app.js");
const H = app;

// Boundary letter checks
assert.strictEqual(H.letter(95.0), "A+");
assert.strictEqual(H.letter(94.9), "A");
assert.strictEqual(H.letter(90.0), "A");
assert.strictEqual(H.letter(89.9), "B+");
assert.strictEqual(H.letter(85.0), "B+");
assert.strictEqual(H.letter(84.9), "B");
assert.strictEqual(H.letter(80.0), "B");
assert.strictEqual(H.letter(79.9), "C");
assert.strictEqual(H.letter(70.0), "C");
assert.strictEqual(H.letter(69.9), "D");

// Averages and financial math
assert.strictEqual(H.calcAverage(data.reports[1].subjects), "91.9");
assert.strictEqual(H.calcAverage(data.reports[11].subjects), "91.0");
assert.strictEqual(H.outstanding(null, data.invoices), 1710);
assert.strictEqual(H.outstanding(1, data.invoices), 405);
assert.strictEqual(H.outstanding(11, data.invoices), 1305);

// Gate duration and attendance
assert.strictEqual(H.campusDuration(1, data.gateLog, "2026-11-03", 695), "4h 20m");
assert.strictEqual(H.attendanceSummary(1, data).rate, 96.3);
assert.strictEqual(H.attendanceSummary(11, data).rate, 100.0);

console.log(">>> All standalone adversarial checks PASSED!");
'
```

### Invalidation Conditions
The milestone approval shall be invalidated if:
1. Any assertion in `tests/test-oracle.js` fails.
2. `PM_DATA` or `PM_HELPERS` fails to export on either browser `window` or Node `module.exports`.
3. Any helper function is found to return hardcoded values rather than calculating dynamically.
4. Any writes to `localStorage` or `sessionStorage` occur.
5. Any of the 7 uncommitted repository files are modified or reverted.
