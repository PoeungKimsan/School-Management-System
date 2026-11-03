# Challenger M3-1 Plan: Student Timetable & Check-in Empirical Challenge

## Plan & Execution Steps
1. **Baseline Suite Verification**:
   - Run `node tests/test-oracle.js` (7/7 PASS)
   - Run `bash tests/test-syntax.sh` (2/2 PASS)
   - Run `bash tests/test-routes.sh` (8/8 PASS)
   - Run `./tests/test-all.sh` (3/3 PASS)

2. **Automated Adversarial Test Script Authoring**:
   - Create `tests/test-adversarial-m3-student.js`
   - Section 1: Timetable Period Status & Boundary Stress Tests (fixed clock 11:35 AM, boundary checks at 10:59, 11:00, 13:29, 13:30, 14:45, Saturday bounds)
   - Section 2: Campus Duration & Gate Log State Engine (260 min today, currently on campus edge case, multiple segments, empty/null fallbacks)
   - Section 3: Pseudo-QR Generator Integrity & Multi-format Verification (25x25 SVG production, 180x180 SVG, HTML grid default, determinism, distinctness, adversarial seeds)
   - Section 4: Attendance Summary & Monthly Calendar Calculation (Child 1 96.3%, October 31 days with 2 holidays and 2 late notes, November 30 days, Child 11 100%)
   - Section 5: Report Card Scoring, GPA & Letter Scale Bounds (Child 1 91.9, GPA 3.85, rank 2 of 31, letter grade boundaries)
   - Section 6: Headless Chrome CDP Live UI Verification (Student login, Home hero card & quick stats, Schedule weekday strip & Saturday switch, Report score ring & subjects, Attendance calendar navigation, Check-in duration & Campus ID QR sheet)

3. **Execution & Evaluation**:
   - Execute `node tests/test-adversarial-m3-student.js` -> 32/32 PASS (100%)

4. **Reporting & Communication**:
   - Record findings in `BRIEFING.md` and `progress.md`
   - Write comprehensive report to `handoff.md` with explicit Verdict: APPROVE
   - Send handoff summary message to orchestrator `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`
