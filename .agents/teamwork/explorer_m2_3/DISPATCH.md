## 2026-11-03T05:54:35Z

You are `explorer_m2_3` (teamwork_explorer), operating in working directory `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_3/`.
Your orchestrator is conversation ID `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`. You MUST communicate all results back using `send_message` with recipient `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.

MANDATORY REFERENCE: Read `/Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md` before starting work.

## Mission
Investigate and specify the Pure Computation Helpers (`window.PM_HELPERS`), Mathematical Oracles, and Unit Verification Strategy for Milestone 2.

## Context & Inputs
- Project Scope: `/Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md`
- Implementation Plan reference: `/Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md` §4
- Existing oracle test: `tests/test-oracle.js`
- Test runner: `tests/test-all.sh`

## Scope of Investigation
1. Define pure helper functions to be implemented in `phone-mockup/mockup-app.js` and exposed on `window.PM_HELPERS` (and dual Node export):
   - `esc(str)`: Escapes `&`, `<`, `>`, `"`, `'` for safe HTML template injection.
   - `toMin(timeStr)`: Converts `"HH:MM"` (24h) to integer minutes from midnight (e.g. `"11:35"` -> 695).
   - `fmtMoney(amount)`: Formats numbers into currency format (e.g. `1710` -> `"$1,710.00"`).
   - `fmtDate(isoStr)`: Converts `"YYYY-MM-DD"` to readable format (e.g. `"2026-11-03"` -> `"3 Nov 2026"`).
   - `fmtDay(dayKey)`: Converts `"mon"`..`"sat"` to full day name (`"Monday"`..`"Saturday"`).
   - `letter(score)`: Maps numeric grade to letter: $\ge 90 \to \text{"A+"}$, $\ge 80 \to \text{"A"}$, $\ge 70 \to \text{"B+"}$, $\ge 60 \to \text{"B"}$, $\ge 50 \to \text{"C"}$, $< 50 \to \text{"D"}$.
   - `calcAverage(subjects)`: Computes mean of subject scores rounded to 1 decimal place. Must return `"91.9"` for Child 1 (643 / 7) and `"91.0"` for Child 11 (546 / 6).
   - `attendanceSummary(childId)`: Analyzes Oct & Nov attendance records for childId. For Child 1: Present 24, Late 2, Excused 1, Absent 0, School Days 27, Rate 96.3%.
   - `periodStatus(period, dayKey)`: Compares period start/end against fixed demo clock 11:35 (695 min). On Tuesday: returns `"now"` for Lunch break (11:00–13:30), `"next"` for Biology (13:30–14:45), `"past"` for P1–P4, `"upcoming"` for P6–P7.
   - `childToday(childId)`: Computes campus status:
     - Child 1: Checked out at 11:32 AM -> `{ onCampus: false, label: "Off campus · Out 11:32 AM", time: "11:32 AM" }`
     - Child 11: Checked in at 07:12 AM -> `{ onCampus: true, label: "On campus · In 07:12 AM", time: "07:12 AM" }`
   - `outstanding(childId)`: Calculates total unpaid balance. If childId provided, sums that child's unpaid invoices; if omitted, sums all unpaid invoices across family ($1,710.00).
   - `pseudoQr(seedStr, size)`: Deterministic pseudo-QR SVG generator that renders a crisp 21x21 or 25x25 grid of square modules based on hash of `seedStr` with finder corners at top-left, top-right, bottom-left.
2. Verification Strategy:
   - How `tests/test-oracle.js` will verify these calculations.
   - Additional unit tests to verify boundary conditions (e.g. score 89.9 -> A, 90.0 -> A+, negative/zero money, empty subjects, etc.).
   - Ensure pure helpers have zero side effects and zero external dependencies.

## Deliverable
Write your detailed algorithm specifications, edge case analyses, and verification assertions to `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_3/handoff.md`.
Then send a summary message to `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.
