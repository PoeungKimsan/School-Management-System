## 2026-11-03T07:08:22Z

You are `challenger_m3_1` (teamwork_challenger), operating in working directory `/Users/macbookpro/School-Management-System/.agents/teamwork/challenger_m3_1/`.
Your orchestrator is conversation ID `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`. You MUST communicate all results back using `send_message` with recipient `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.

MANDATORY REFERENCE: Read `/Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md` before starting work.

## Mission
Conduct code-executing empirical stress-testing and adversarial boundary verification of Milestone 3: Student Portal logic, timetables, calculations, and pseudo-QR generation.

## Context & Inputs
- Project Scope: `/Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md`
- Target Code: `phone-mockup/mockup-app.js`, `phone-mockup/mockup-data.js`
- Test Oracle: `tests/test-oracle.js`

## Scope of Challenge
1. Write and execute an automated adversarial test script (e.g. `tests/test-adversarial-m3-student.js`):
   - Timetable & Period Highlighting:
     - Verify Tuesday timetable period status at fixed demo clock 11:35 AM (695 min): Lunch break is "now", Biology is "next", P1–P4 are "past", P6–P7 are "upcoming".
     - Verify Saturday schedule bounds: Child 1 has exactly 6 entries (period 7 `-` is strictly omitted).
     - Test changing demo clock boundaries: 10:59 AM (P4 = now), 11:00 AM (Lunch = now), 13:29 PM (Lunch = now), 13:30 PM (Biology = now), 14:45 PM (Biology ends).
   - Campus Duration & Gate Log:
     - Verify Child 1 today duration = 260 minutes = "4h 20m" from 07:12 AM In to 11:32 AM Out.
     - Test edge cases: student currently on campus vs checked out.
   - Pseudo-QR Generator Integrity:
     - Verify `PM_HELPERS.pseudoQr("STU-2026-001", 180)` produces valid SVG XML containing `<svg`, finder corner squares at top-left, top-right, bottom-left, and deterministic module count across 100 iterations.
     - Verify distinctness: `pseudoQr("STU-2026-001")` vs `pseudoQr("STU-2026-007")`.
   - Attendance Summary & Month Calculation:
     - Verify Child 1 term rate = 96.3% (24 present, 2 late, 1 excused, 0 absent out of 27 school days).
     - Verify October 2026 grid (31 days, holidays on 15 & 29) and November 2026 grid (excused on 2).
2. Verify baseline suites:
   - `node tests/test-oracle.js` (7/7 PASS)
   - `bash tests/test-syntax.sh` (2/2 PASS)

## Deliverable
Write your empirical challenge report with explicit **Verdict: APPROVE** or **REQUEST_CHANGES** to `/Users/macbookpro/School-Management-System/.agents/teamwork/challenger_m3_1/handoff.md`.
Then send a summary message to `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.
