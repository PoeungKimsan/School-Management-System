# Empirical Adversarial Challenge Report: Milestone 3 (Student Portal)

**Challenger Agent**: `challenger_m3_1` (teamwork_challenger)  
**Target Milestone**: Milestone 3 — Student Portal Logic, Timetables, Calculations, Pseudo-QR & Live UI  
**Execution Timestamp**: 2026-11-03T07:23:00Z  
**Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Baseline Test Suite Execution
Direct execution of baseline test suites via terminal commands:
- `node tests/test-oracle.js`:
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
- `bash tests/test-syntax.sh`:
  ```
  === [TEST SUITE] JavaScript Syntax Validation (node --check) ===
  Checking phone-mockup/mockup-data.js ... PASS
  Checking phone-mockup/mockup-app.js ... PASS
  ------------------------------------------------------------
  Syntax Checks: 2 total | 2 passed | 0 failed
  >>> Syntax validation PASSED!
  ```
- `bash tests/test-routes.sh`:
  ```
  Route Checks: 8 total | 8 passed | 0 failed
  >>> All Route & Fallback checks PASSED!
  ```
- `./tests/test-all.sh`:
  ```
  Suites Executed: 3 | Suites Passed: 3 | Suites Failed: 0
  OVERALL RESULT: SUCCESS (All test suites passed cleanly)
  ```

### 1.2 Dedicated Adversarial Test Harness Execution
Direct execution of `node tests/test-adversarial-m3-student.js`:
```
======================================================================
  EMPIRICAL ADVERSARIAL CHALLENGE: MILESTONE 3 STUDENT PORTAL         
======================================================================
Execution Timestamp: 2026-11-03T07:21:44.486Z
Target Code:         phone-mockup/mockup-app.js, phone-mockup/mockup-data.js

--- Section 1: Timetable Period Status & Boundary Stress Tests ---
  ✓ PASS [01] Tuesday timetable at 11:35 AM (695 min): Lunch='now', Bio='next', P1-P4='past', P6-P7='upcoming' (Lunch: now, Bio: next, Math: past, CS: upcoming)
  ✓ PASS [02] Saturday schedule bounds: Child 1 has exactly 6 entries and strictly omits period 7 ('-') (Entries: 6, Last period end: 14:45)
  ✓ PASS [03] Saturday schedule bounds: Child 11 has exactly 5 entries (ends 11:20 AM, no lunch) (Entries: 5, Ends: 11:20)
  ✓ PASS [04] Demo clock boundary at 10:59 AM (659 min): Mathematics = 'now', Lunch break = 'upcoming' (Math: now, Lunch: upcoming)
  ✓ PASS [05] Demo clock boundary at 11:00 AM (660 min): Mathematics = 'past', Lunch break = 'now' (Math: past, Lunch: now)
  ✓ PASS [06] Demo clock boundary at 13:29 PM (809 min): Lunch break = 'now', Biology = 'next' (Lunch: now, Biology: next)
  ✓ PASS [07] Demo clock boundary at 13:30 PM (810 min): Lunch break = 'past', Biology = 'now' (Lunch: past, Biology: now)
  ✓ PASS [08] Demo clock boundary at 14:45 PM (885 min): Biology = 'past' (ends), CS & AI = 'next' (Biology: past, CS: next)
  ✓ PASS [09] Non-Tuesday schedule dayKey invariant: Returns empty string '' (live highlighting only on Tuesday) (Mon: '', Wed: '', Sat: '')

--- Section 2: Campus Duration & Gate Log State Engine ---
  ✓ PASS [10] Child 1 campus duration today = 260 min = '4h 20m' (07:12 AM In to 11:32 AM Out) (Duration: 4h 20m, Elapsed: 260 min)
  ✓ PASS [11] Edge case: Student currently on campus (07:12 AM In, demo clock 11:35 AM -> '4h 23m', onCampus: true) (Duration: 4h 23m, Status: On campus · In 07:12 AM)
  ✓ PASS [12] Edge case: Student checked out (11:32 AM Out -> onCampus: false, 'Off campus · Out 11:32 AM') (Status: Off campus · Out 11:32 AM)
  ✓ PASS [13] Edge case: Multiple in/out gate events on same day (120m + 60m = 180m = '3h 0m') (Duration: 3h 0m)
  ✓ PASS [14] Edge case: Empty log yields '0h 0m'; null log safely falls back to PM_DATA seed ('4h 20m') (Empty: 0h 0m, Null fallback: 4h 20m)

--- Section 3: Pseudo-QR Generator Integrity & Adversarial Boundary Tests ---
  ✓ PASS [15] Production QR: pseudoQr('STU-2026-001', 25, 'svg') generates valid SVG with 3 finder squares (SVG tag: true, ViewBox: 25x25, Finders: (0,0), (18,0), (0,18))
  ✓ PASS [16] Deterministic pseudo-QR generation across 100 iterations (exact character identity) (100 iterations verified deterministic)
  ✓ PASS [17] Configurable size SVG: pseudoQr('STU-2026-001', 180, 'svg') produces SVG with 180x180 viewBox & finders (ViewBox: 180x180, Finders: (0,0), (173,0), (0,173))
  ✓ PASS [18] Multi-format contract: pseudoQr defaults to HTML grid; yields SVG XML when format='svg' is specified (Default output starts: <div class="pm-qr" style="--n:18...)
  ✓ PASS [19] QR Distinctness: Distinct student card IDs produce distinct matrix outputs (STU-2026-001 !== STU-2026-007 !== STU-2026-999)
  ✓ PASS [20] Adversarial seeds: Empty string, null, and special characters generate valid SVG without error (Empty seed length: 12429 bytes)

--- Section 4: Attendance Summary & Monthly Calendar Calculation ---
  ✓ PASS [21] Child 1 Term Attendance: 96.3% rate (24 Present, 2 Late, 1 Excused, 0 Absent out of 27 school days) (P:24, L:2, E:1, A:0, Days:27, Rate:96.3%)
  ✓ PASS [22] October 2026 grid: 31 days, holidays on 15 & 29, late records on 8 & 21, 4 weekend Sundays (Days: 31, Oct 15/29: holiday, Oct 8/21: late, Sundays: 4)
  ✓ PASS [23] November 2026 grid: 30 days, Nov 1 weekend, Nov 2 excused, Nov 3 today/present, Nov 4-30 future (Nov 2: excused, Nov 3 isToday: true, Future days: 27)
  ✓ PASS [24] Child 11 Term Attendance: 100.0% rate (27 Present / 27 school days, 0 Late, 0 Absent) (Rate: 100%, Present: 27)

--- Section 5: Report Card Scoring, GPA & Letter Scale Bounds ---
  ✓ PASS [25] Child 1 Midterm Report: Average 91.9, GPA 3.85, Rank '2 of 31' across 7 subjects (Avg: 91.9, GPA: 3.85, Rank: 2 of 31, Subjects: 7)
  ✓ PASS [26] Authoritative Letter Grade Scale Boundaries (A+ >=95, A >=90, B+ >=85, B >=80, C >=70, D <70) (95->A+, 94.9->A, 89.9->B+, 84.9->B, 79.9->C, 69.9->D)

--- Section 6: Headless Chrome CDP Live UI Verification ---
  ✓ PASS [27] Live UI Home Tab: Hero card renders Lunch break, checkout 11:32 AM, Next class Biology & Quick stats (Lunch:true, Out:true, Bio:true, Att:true, Avg:true | Hero: "Lunch break · 11:00 – 13:30 Sen Sok HQ Checked out 11:32 AM · Gate 01 NEXT CLASS Biology 13:30 – 14:45 · Room B-201 · Mr. Vannak Keo" | Cards: [ATTENDANCE 96.3% This term (24 Present) | AVERAGE SCORE 91.9 GPA 3.85 · Rank 2 of 31])
  ✓ PASS [28] Live UI Schedule Tab: Mon–Sat strip rendered, Tuesday displays Lunch='Now', Biology='Next' across 7 periods (Active day: tue, Now: Lunch break, Next: Biology, Total periods: 7)
  ✓ PASS [29] Live UI Schedule Tab: Saturday switch renders exactly 6 entries and strictly omits period 7 ('-') (Active day: sat, Entries: 6, Has '-': false)
  ✓ PASS [30] Live UI Report Tab: Circular score ring displays 91.9, GPA 3.85, Rank '2 of 31', and 7 subjects (Score: 91.9 AVERAGE, GPA 3.85 & Rank 2 of 31 confirmed, Subjects: 7)
  ✓ PASS [31] Live UI Attendance Tab: 96.3% rate ring, 4-up metric cards, and Oct month switch with 'H' badges (Rate: 96.3% RATE, Oct header confirmed, Holidays: 2, Late records found: 2)
  ✓ PASS [32] Live UI Checkin Tab & QR Sheet: Campus duration '4h 20m', ID 'STU-2026-001' with SVG QR in 180px box (Duration: 4h 20m, Sheet ID: STU-2026-001, SVG rects: 311, Closed cleanly: true)

======================================================================
                     TEST SUMMARY REPORT                              
======================================================================
Total Checks Executed: 32
Checks Passed:         32
Checks Failed:         0

OVERALL VERDICT: PASS (Milestone 3 Student Portal 100% verified)
```

### 1.3 Key Source Inspections & Architectural Invariants
1. `phone-mockup/mockup-app.js` lines 408–448:
   `pseudoQr: function (seedStr, size = 25, format = "html")`
   - Production usage in line 728: `const qrSvg = PM_HELPERS.pseudoQr(child.cardId, 25, "svg");`
   - Rendered in line 763: `<div style="width: 180px; height: 180px; ...">${qrSvg}</div>`
   - Verified that SVG format outputs crisp `<svg class="pm-qr-svg" viewBox="0 0 25 25">` with 3 finder squares at `(0,0)`, `(18,0)`, and `(0,18)`, scaling losslessly into the 180px device sheet frame.
2. `phone-mockup/mockup-app.js` lines 307–324:
   `periodStatus: function (period, dayKey, allPeriods, demoMin = 695)`
   - Verified strictly bounds period evaluation to `dayKey === "tue"`. Non-Tuesday days return `""` to isolate live status markers to the active demo day.
3. `phone-mockup/mockup-app.js` lines 359–387:
   `campusDuration: function (childId, gateLog, demoIso = "2026-11-03", demoMin = 695)`
   - Computes closed segments `outMin - inMin` (432 to 692 = 260 min = "4h 20m") and correctly calculates open entry segments using `demoMin - inMin` (432 to 695 = 263 min = "4h 23m").

---

## 2. Logic Chain

1. **Timetable Period Highlighting Precision**:
   - At demo clock 11:35 AM (695 min), Mathematics (09:55–11:00, 595–660 min) has ended (`695 >= 660`), evaluating to `"past"`.
   - Lunch break (11:00–13:30, 660–810 min) encloses 695 min (`660 <= 695 < 810`), evaluating to `"now"`.
   - The first non-break period starting after 695 min is Biology (13:30–14:45, starting at 810 min), evaluating to `"next"`.
   - Computer Science & AI (15:00–16:15) starts after Biology, evaluating to `"upcoming"`.
   - Testing minute boundaries confirms exact half-open intervals: 10:59 AM is `"now"` for Math; 11:00 AM transitions Math to `"past"` and Lunch to `"now"`; 13:29 PM is `"now"` for Lunch; 13:30 PM transitions Lunch to `"past"` and Biology to `"now"`; 14:45 PM transitions Biology to `"past"`.
   - Saturday timetables correctly truncate: Child 1 has 6 entries ending at 14:45 with period 7 (`-`) strictly suppressed; Child 11 ends at 11:20 AM with lunch strictly suppressed.

2. **Campus Duration & Gate Log State Machine**:
   - Seed gate log contains Child 1 Entry at 07:12 AM (432 min) and Exit at 11:32 AM (692 min) with note `"Lunch break exit"`.
   - Elapsed time is `692 - 432 = 260 min`, converting to `Math.floor(260 / 60) = 4` hours and `260 % 60 = 20` minutes, yielding exactly `"4h 20m"`.
   - In the hypothetical scenario where the exit scan is removed (student currently on campus), `currentInMin` is 432 and `demoMin` is 695, calculating `695 - 432 = 263 min = "4h 23m"` and `onCampus: true`, `"On campus · In 07:12 AM"`.
   - Multiple in/out segments accumulate additively across cycles without state leakage.

3. **Pseudo-QR Generator Integrity & Multi-Format Contract**:
   - Deterministic FNV-1a hash algorithm with 32-bit PRNG shift guarantees bitwise reproducibility. Across 100 iterations of seed `"STU-2026-001"`, output is 100% identical.
   - For seed `"STU-2026-001"` vs `"STU-2026-007"`, outputs diverge completely, providing distinct pseudo-QR codes per student.
   - Calling `pseudoQr(seed, 25, "svg")` produces `<svg class="pm-qr-svg" viewBox="0 0 25 25">` with finder squares at `(0,0)`, `(18,0)`, and `(0,18)`.
   - The UI screen (`renderQrSheet`) renders this SVG inside a 180×180px container (`width: 180px; height: 180px`), achieving crisp vector presentation matching physical student IDs.

4. **Attendance Calculation Rigor**:
   - October 2026 has 31 calendar days: 4 Sundays (Oct 4, 11, 18, 25) + 2 public holidays (Oct 15, 29) are excluded from school days, leaving `31 - 6 = 25` school days. Late records on Oct 8 and Oct 21 leave `25 - 2 = 23` present days.
   - November 2026 up to Nov 3 demo clock has 2 school days (Nov 2 Excused, Nov 3 Present; Nov 1 is Sunday).
   - Term totals: `25 + 2 = 27` school days; `23 + 1 = 24` present; `2 + 0 = 2` late; `0 + 1 = 1` excused; `0` absent.
   - Official attendance rate: `(24 + 2) / 27 * 100 = 96.296%`, rounded to 1 decimal place = `96.3%`.

5. **Report Card & Grade Scale Correctness**:
   - Child 1 subject scores: Math 95, Physics 91, Chem 89, Bio 90, Eng 94, Khmer 88, CS 96. Total sum = 643 across 7 subjects -> `643 / 7 = 91.857...` -> `"91.9"`.
   - Grade boundaries: 95->A+, 94.9->A, 90->A, 89.9->B+, 85->B+, 84.9->B, 79.9->C, 69.9->D.

6. **Live Chromium CDP Interaction**:
   - Headless Chrome connected via WebSocket CDP verified that all 5 Student Portal tabs (`home`, `schedule`, `report`, `attendance`, `checkin`) mount and transition without JavaScript exceptions.
   - Schedule tab allows interactive switching between days (Tue -> Wed -> Sat).
   - Attendance tab allows interactive month navigation (Nov 2026 <-> Oct 2026), updating calendar cells and non-present record list.
   - Checkin tab allows opening the Campus Digital ID sheet, displaying the student's name, class, card ID, and interactive SVG QR code, which dismisses cleanly upon clicking Done.

---

## 3. Caveats

1. **`pseudoQr` Format Parameter Default**:
   `PM_HELPERS.pseudoQr(seedStr, size = 25, format = "html")` defaults `format` to `"html"`. Calling `pseudoQr("STU-2026-001", 180)` without the third parameter returns an HTML grid `<div class="pm-qr" ...>` rather than `<svg>`. When called as `pseudoQr("STU-2026-001", 180, "svg")` or in production as `pseudoQr(cardId, 25, "svg")`, it produces valid SVG XML. This dual-format behavior was verified and confirmed to work correctly in the application UI.
2. **Fixed Demo Clock Assumption**:
   All schedule, status, and duration assertions rely on the project specification's fixed demo clock of Tuesday, 3 November 2026 at 11:35 AM (`demoMin = 695`).
3. **Milestone 4 Parent Portal Scope**:
   Parent Portal features (KHQR payments, invoice settlement, alerts push banner) were out of scope for Milestone 3 and will be validated in Milestone 4.

---

## 4. Conclusion

Milestone 3 (Student Portal) satisfies 100% of functional requirements, mathematical oracle models, boundary edge cases, and live browser user interactions:
- Fixed demo clock period highlighting ("Lunch break" = Now, "Biology" = Next) is mathematically exact.
- Minute boundary transitions across all periods are verified without off-by-one errors.
- Saturday half-day schedule truncation for both children is verified.
- Campus duration calculation ("4h 20m") and on-campus vs off-campus state machines operate correctly.
- Deterministic pseudo-QR generation produces valid SVG with 3 finder patterns and verified distinctness.
- Attendance summary (96.3% rate, 24 P / 2 L / 1 E / 0 A) and monthly calendar grids (Oct/Nov 2026) calculate accurately.
- Report card GPA (3.85), rank ("2 of 31"), average score ("91.9"), and letter grades are verified.
- All 32 automated checks in `tests/test-adversarial-m3-student.js` PASS (100%).
- All 7 baseline oracle checks in `tests/test-oracle.js` PASS (100%).
- All 2 syntax checks in `tests/test-syntax.sh` PASS (100%).
- Master test suite `./tests/test-all.sh` exits 0 cleanly.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Execute Milestone 3 Adversarial Test Harness**:
   ```bash
   node tests/test-adversarial-m3-student.js
   ```
   *Expected output*: `Checks Executed: 32 | Checks Passed: 32 | Checks Failed: 0`, exit code 0.

2. **Execute Headless Data Oracle Assertions**:
   ```bash
   node tests/test-oracle.js
   ```
   *Expected output*: `Oracle Checks: 7 total | 7 passed | 0 failed`, exit code 0.

3. **Execute Master Test Runner**:
   ```bash
   ./tests/test-all.sh
   ```
   *Expected output*: 3 suites executed, 3 passed, 0 failed, exit code 0.

4. **Invalidation Conditions**:
   - Any failure in `tests/test-adversarial-m3-student.js` or `tests/test-oracle.js`.
   - Modifying Child 1 attendance or grade records altering 96.3% or 91.9.
   - Any unhandled exception during Chrome CDP tab switching or QR modal sheet presentation.
