# Empirical Adversarial Challenge Report: Milestone 2 Helpers & Data Model

**Target**: Pure Computation Helpers (`PM_HELPERS`) and Data Model Invariants (`PM_DATA`)  
**Target Code**: `phone-mockup/mockup-data.js` and `phone-mockup/mockup-app.js`  
**Test Scripts**: `tests/test-adversarial-m2-helpers.js`, `tests/test-oracle.js`, `tests/test-syntax.sh`  
**Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Test Suite Executions & Commands

1. **Syntax Validation Suite (`tests/test-syntax.sh`)**:
   - Command: `bash tests/test-syntax.sh`
   - Exit code: `0`
   - Output verbatim:
     ```
     === [TEST SUITE] JavaScript Syntax Validation (node --check) ===
     Checking phone-mockup/mockup-data.js ... PASS
     Checking phone-mockup/mockup-app.js ... PASS
     ------------------------------------------------------------
     Syntax Checks: 2 total | 2 passed | 0 failed
     >>> Syntax validation PASSED!
     ```

2. **Headless Data Oracle Suite (`tests/test-oracle.js`)**:
   - Command: `node tests/test-oracle.js`
   - Exit code: `0`
   - Output verbatim:
     ```
     === [TEST SUITE] Headless Data Oracle Assertions ===
     Testing [Outstanding Balance = $1,710.00] ... PASS
     Testing [Grade Averages (Chanreaksa: 91.9, Chanpanha: 91.0)] ... PASS
     Testing [Attendance Statistics (Child 1: 96.3% Rate, 24 P / 2 L / 1 E / 0 A)] ... PASS
     Testing [Gate Log & Campus Duration (4h 20m on Nov 3)] ... PASS
     Testing [Timetable Period Status at 11:35 AM (Lunch = 'Now', Biology = 'Next')] ... PASS
     Testing [Saturday Schedule Half-Day Bounds] ... PASS
     Testing [Deterministic Pseudo-QR Generation (STU-2026-001)] ... PASS
     ------------------------------------------------------------
     Oracle Checks: 7 total | 7 passed | 0 failed
     >>> All Node Data Oracle assertions PASSED cleanly!
     ```

3. **Adversarial Stress Test Suite (`tests/test-adversarial-m2-helpers.js`)**:
   - Command: `node tests/test-adversarial-m2-helpers.js`
   - Exit code: `0`
   - Output verbatim:
     ```
     === [ADVERSARIAL STRESS TEST] Milestone 2: PM_HELPERS & PM_DATA ===

     --- Section 1: letter(score) Boundary Stress Testing ---
       [01] letter: Upper boundary 100.0 => A+........................ PASS
       [02] letter: Critical boundary 95.0 => A+ vs 94.999 => A....... PASS
       [03] letter: Critical boundary 90.0 => A vs 89.999 => B+....... PASS
       [04] letter: Critical boundary 85.0 => B+ vs 84.999 => B....... PASS
       [05] letter: Critical boundary 80.0 => B vs 79.999 => C........ PASS
       [06] letter: Critical boundary 70.0 => C vs 69.999 => D........ PASS
       [07] letter: Lower boundary 0.0 and negative scores => D....... PASS
       [08] letter: Type coercion & non-number edge inputs............ PASS

     --- Section 2: fmtMoney(amount) Formatting Stress Testing ---
       [09] fmtMoney: Zero boundary 0 => '$0.00'...................... PASS
       [10] fmtMoney: Fractional amount 0.5 => '$0.50'................ PASS
       [11] fmtMoney: Thousands separator 1710 => '$1,710.00'......... PASS
       [12] fmtMoney: Negative values -45 => '-$45.00'................ PASS
       [13] fmtMoney: Large amounts 1000000 => '$1,000,000.00'........ PASS
       [14] fmtMoney: Degenerate inputs null/undefined/string......... PASS

     --- Section 3: toMin(timeStr) Time Parsing Stress Testing ---
       [15] toMin: Midnight boundaries 00:00 (0) and 12:00 AM (0)..... PASS
       [16] toMin: End of day 23:59 => 1439 and 11:59 PM => 1439...... PASS
       [17] toMin: Noon 12:00 PM => 720 and 12:30 PM => 750........... PASS
       [18] toMin: Demo clock 11:35 AM => 695 and 11:35 PM => 1415.... PASS
       [19] toMin: Gate check times 07:12 AM (432) and 11:32 AM (692). PASS
       [20] toMin: Whitespace tolerance and single-digit hours........ PASS
       [21] toMin: Malformed and empty inputs return 0 gracefully..... PASS

     --- Section 4: calcAverage(subjects) Precision Stress Testing ---
       [22] calcAverage: Child 1 (643 / 7 = 91.857... => '91.9')...... PASS
       [23] calcAverage: Child 11 (546 / 6 = 91.0 => '91.0').......... PASS
       [24] calcAverage: Rounding behavior on boundaries.............. PASS
       [25] calcAverage: Degenerate, empty, and missing score inputs.. PASS

     --- Section 5: attendanceSummary(childId) Counting Stress Testing ---
       [26] attendanceSummary: Child 1 (96.3% Rate, 24 P / 2 L / 1 E / 0 A in 27 Days) PASS
       [27] attendanceSummary: Child 11 (100.0% Rate, 27 P / 0 L / 0 E / 0 A in 27 Days) PASS
       [28] attendanceSummary: Global fallback and non-existent childId PASS

     --- Section 6: campusDuration(childId) Gate Duration Stress Testing ---
       [29] campusDuration: Child 1 on 2026-11-03 (07:12 AM to 11:32 AM => 4h 20m) PASS
       [30] campusDuration: Child 11 on 2026-11-03 (In 07:12 AM, still on campus at 11:35 AM => 4h 23m) PASS
       [31] campusDuration: Child 1 on 2026-10-28 (Multi-session in/out => 7h 22m) PASS
       [32] campusDuration: Chronological reordering tolerance........ PASS
       [33] campusDuration: Degenerate logs and fallback behavior..... PASS

     --- Section 7: periodStatus(period, dayKey) Status Stress Testing ---
       [34] periodStatus: Tuesday 11:35 AM demo clock highlights...... PASS
       [35] periodStatus: Non-Tuesday dayKey suppression.............. PASS
       [36] periodStatus: Degenerate input handling................... PASS

     --- Section 8: pseudoQr(seedStr, size) Stress Testing ---
       [37] pseudoQr: Determinism across 100 iterations for STU-2026-001 PASS
       [38] pseudoQr: Determinism across 100 iterations for STU-2026-007 PASS
       [39] pseudoQr: Distinctness across distinct student seeds...... PASS
       [40] pseudoQr: Finder patterns presence and structure.......... PASS

     --- Section 9: Additional Pure Helpers Stress Testing ---
       [41] esc: Escapes HTML injection vectors....................... PASS
       [42] fmtDate: Formats ISO dates to D Mon YYYY.................. PASS
       [43] fmtDay: Converts day keys and ISO dates to weekday name... PASS
       [44] daysBetween: Calculates calendar day difference........... PASS
       [45] outstanding: Family and individual unpaid balance......... PASS
       [46] childToday: Current campus presence derived from gate log. PASS
       [47] attendanceMonth: Monthly calendar status array structure.. PASS

     --- Section 10: Adversarial Tamper & Immutability Checks ---
       [48] Immutability: All helpers execute against deeply-frozen PM_DATA without error or mutation PASS
       [49] Immutability: Helper functions do not mutate their arguments PASS
       [50] Integrity: Global and prototype state unpolluted.......... PASS

     ------------------------------------------------------------
     Adversarial Checks: 50 total | 50 passed | 0 failed
     >>> All Adversarial Challenge Tests PASSED cleanly!
     ```

### 1.2 Code Inspection Observations
- `phone-mockup/mockup-data.js` (lines 14-369): Exports `PM_DATA` with Dual UMD/Node CommonJS export (lines 372-377).
- `phone-mockup/mockup-app.js` (lines 61-450): Exports `PM_HELPERS` with 15 methods via Dual UMD/Node CommonJS export (lines 452-457).
- In `mockup-app.js` (lines 333-336, lines 363-366): Array arguments `gateLog` are sliced (`.filter(...).slice().sort(...)`) before in-place sorting, preventing mutation of original datasets.

---

## 2. Logic Chain

1. **Boundary Conformance of `letter(score)`**:
   - Tested thresholds in `mockup-app.js` (lines 160-168): `>=95 -> 'A+'`, `>=90 -> 'A'`, `>=85 -> 'B+'`, `>=80 -> 'B'`, `>=70 -> 'C'`, `<70 -> 'D'`.
   - Empirically verified exact boundary points: 100.0 (A+), 95.0 (A+), 94.999 (A), 94.9 (A), 90.0 (A), 89.999 (B+), 89.9 (B+), 85.0 (B+), 84.999 (B), 84.9 (B), 80.0 (B), 79.999 (C), 79.9 (C), 70.0 (C), 69.999 (D), 69.9 (D), 0.0 (D), and -15.5 (D).
   - Coercion tests confirmed that string numbers `"95.0"` and `"89.9"` resolve to `'A+'` and `'B+'` respectively, while non-numeric values (`null`, `undefined`, `NaN`, `"not-a-number"`) safely evaluate to `'D'`.

2. **Currency Formatting of `fmtMoney(amount)`**:
   - In `mockup-app.js` (lines 92-100), `fmtMoney` uses `toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })` and prepends `-$` or `$`.
   - Empirically verified: `0` -> `"$0.00"`, `0.5` -> `"$0.50"`, `1710` -> `"$1,710.00"`, `-45` -> `"-$45.00"`, `1000000` -> `"$1,000,000.00"`.
   - Edge cases `-0` -> `"$0.00"`, `0.004` -> `"$0.00"`, and `0.005` -> `"$0.01"` confirmed expected rounding and zero-sign normalization.

3. **Time Parsing and Arithmetic with `toMin(timeStr)`**:
   - In `mockup-app.js` (lines 77-87), regex `^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$` parses both 12-hour and 24-hour formats.
   - 12:00 AM (midnight) converts to 0; 12:00 PM (noon) converts to 720; 23:59 and 11:59 PM convert to 1439.
   - Demo clock `11:35 AM` converts to 695; gate check times `07:12 AM` (432) and `11:32 AM` (692) convert correctly.
   - Malformed/empty strings gracefully return 0 without throwing.

4. **Grade Average Precision with `calcAverage(subjects)`**:
   - In `mockup-app.js` (lines 173-177), `calcAverage` sums `s.score` and calls `.toFixed(1)`.
   - Child 1 (Sok Chanreaksa, 7 subjects, sum = 643): `643 / 7 = 91.85714...` -> `"91.9"`.
   - Child 11 (Sok Chanpanha, 6 subjects, sum = 546): `546 / 6 = 91.0` -> `"91.0"`.
   - Degenerate inputs (`[]`, `null`, `undefined`, `"not-array"`) return `"0.0"`.

5. **Attendance Statistics & Calendar Math with `attendanceSummary(childId)`**:
   - In `mockup-app.js` (lines 182-246), calendar loops enumerate every calendar day in Oct and Nov up to the demo date (Nov 3).
   - Sundays (`dow === 0`) and declared holidays (`holSet.has(day)`) are subtracted from school days.
   - October 2026: 31 days - 4 Sundays (Oct 4, 11, 18, 25) - 2 holidays (Oct 15, 29) = 25 school days.
   - November 2026 thru Nov 3: Nov 1 is Sunday. School days = 2 (Nov 2, Nov 3).
   - Term school days = 27.
   - Child 1: 2 late (Oct 8, 21), 1 excused (Nov 2), 0 absent, 24 present.
     Rate: `((24 + 2) / 27) * 100 = 96.296%` -> `96.3%`.
   - Child 11: 0 late, 0 excused, 0 absent, 27 present.
     Rate: `(27 / 27) * 100 = 100.0%`.
   - All assertions pass with strict mathematical equality.

6. **Gate Duration Calculation with `campusDuration(childId)`**:
   - For Child 1 on 2026-11-03: In at 07:12 AM (432), Out at 11:32 AM (692) -> elapsed = 260 min -> `"4h 20m"`.
   - For Child 11 on 2026-11-03: In at 07:12 AM (432), still on campus at demo clock 11:35 AM (695) -> elapsed = 263 min -> `"4h 23m"`.
   - Shuffled out-of-order logs are properly sorted by `PM_HELPERS.toMin(time)` before calculation, ensuring chronological robustness.

7. **Timetable Period Status with `periodStatus(period, dayKey, allPeriods)`**:
   - At demo clock 11:35 AM on Tuesday:
     - Lunch break (11:00-13:30) evaluates to `"now"`.
     - Biology (13:30-14:45) evaluates to `"next"`.
     - Physics, Academic English, Morning recess, Mathematics evaluate to `"past"`.
     - Computer Science & AI (15:00-16:15) evaluates to `"upcoming"`.
   - Non-Tuesday day keys ("mon", "wed", "sat") suppress active markers and return `""`.

8. **Deterministic Pseudo-QR Generation with `pseudoQr(seedStr, size)`**:
   - 100 repeated executions of `pseudoQr("STU-2026-001", 25)` produced byte-for-byte identical output strings.
   - Seeds "STU-2026-001" (countOn: 311) and "STU-2026-007" (countOn: 303) produced distinct module counts and patterns.
   - Finder patterns at (0,0), (0,18), and (18,0) are preserved with outer borders, center squares, and separator rings.

9. **Tamper Freedom & Immutability**:
   - `deepFreeze()` applied across the entire `PM_DATA` tree produced zero mutation errors during execution of all 15 pure helpers.
   - Argument mutation checks verified that arrays passed to `calcAverage`, `campusDuration`, `childToday`, and `outstanding` retained identical JSON serialized representations before and after execution.
   - Global prototype checks confirmed `Object.prototype` and `Array.prototype` remained clean.

---

## 3. Caveats

1. **IEEE-754 Floating-Point Representation in `calcAverage`**:
   - `calcAverage` uses `(sum / subjects.length).toFixed(1)`. Standard IEEE-754 double precision representation of decimal fractions ending in `.05` (e.g. `91.85` represented as `91.8499999999999943...`) rounds down to `91.8` under native `toFixed(1)`. For all project datasets (Child 1: 643/7 = 91.857... and Child 11: 546/6 = 91.0), the precision remains exact and compliant with specifications.
2. **`periodStatus` Signature Requirement**:
   - To distinguish the immediate next non-break period (`"next"`) from later periods (`"upcoming"`), `allPeriods` must be supplied as the 3rd argument (as `mockup-app.js` does in `renderScheduleScreen`). If `allPeriods` is omitted, periods after the demo clock default to `"upcoming"`.
3. **Out-of-Scope Milestone Areas**:
   - Milestone 3 UI screen rendering (Student 5 tabs) and Milestone 4 (Parent portal interactions) were not evaluated for UI layout fidelity, as they belong to Milestones 3 and 4.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 Pure Computation Helpers (`PM_HELPERS`) and Data Model Invariants (`PM_DATA`) strictly satisfy all functional, mathematical, adversarial, and immutability requirements. All 7 Oracle checks and all 50 adversarial stress tests pass cleanly with exit code 0.

---

## 5. Verification Method

To independently verify all findings and assertions:

1. **Run Syntax Validation**:
   ```bash
   bash tests/test-syntax.sh
   ```
   *Expected result*: 2 files checked, 2 passed, exit code 0.

2. **Run Authoritative Data Oracle**:
   ```bash
   node tests/test-oracle.js
   ```
   *Expected result*: 7 oracle checks passed, exit code 0.

3. **Run Adversarial Stress Test Suite**:
   ```bash
   node tests/test-adversarial-m2-helpers.js
   ```
   *Expected result*: 50 adversarial checks passed, 0 failed, exit code 0.

4. **Inspect Files**:
   - Target helpers: `/Users/macbookpro/School-Management-System/phone-mockup/mockup-app.js` (lines 61-450)
   - Target dataset: `/Users/macbookpro/School-Management-System/phone-mockup/mockup-data.js`
   - Test harness: `/Users/macbookpro/School-Management-System/tests/test-adversarial-m2-helpers.js`
