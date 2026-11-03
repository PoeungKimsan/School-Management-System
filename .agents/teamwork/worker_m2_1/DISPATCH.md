## 2026-11-03T06:10:34Z
You are `worker_m2_1` (teamwork_worker), operating in working directory `/Users/macbookpro/School-Management-System/.agents/teamwork/worker_m2_1/`.
Your orchestrator is conversation ID `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`. You MUST communicate all results back using `send_message` with recipient `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.

MANDATORY REFERENCE: Read `/Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md` before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mission
Implement Milestone 2: Data Model & Auth Engine for the Phone App Mockup.

## Write Ownership
You have exclusive write ownership of:
- `phone-mockup/mockup-data.js`
- `phone-mockup/mockup-app.js`
- `phone-mockup/phone-mockup.css` (only for any needed login styling additions, preserving all M1 styles)

DO NOT modify or revert the 7 existing uncommitted modified files in the git workspace (`css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`).

## Specification & Plan References
Read the detailed Explorer handoff reports before implementing:
1. `explorer_m2_1` Data Model specification:
   - `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_1/handoff.md`
   - Pre-computed drop-in: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_1/proposed_mockup-data.js`
2. `explorer_m2_2` Auth & State Machine architecture:
   - `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_2/handoff.md`
3. `explorer_m2_3` Pure Computation Helpers specification:
   - `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_3/handoff.md`
4. Global Project Plan:
   - `/Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md`
5. Test Oracle:
   - `/Users/macbookpro/School-Management-System/tests/test-oracle.js`

## Detailed Implementation Requirements

### 1. `phone-mockup/mockup-data.js`
Populate `window.PM_DATA` with the complete authoritative dataset:
- `demoNow`: ISO `"2026-11-03"`, dayKey `"tue"`, dateLabel `"Tuesday, 3 November"`, clock `"11:35"`, minutes `695`, greeting `"Good morning"`.
- `credentials`: Student (`stu_chanreaksa` / `demo1234`), Parent (`par_vibol` / `demo1234`), label strings.
- `student`: `{ childId: 1 }`
- `parent`: Sok Vibol (id 201), `childIds: [1, 11]`, initials `"SV"`, etc.
- `children`: Child 1 (Sok Chanreaksa, G12-A, STU-2026-001) and Child 11 (Sok Chanpanha, G7-IEP, STU-2026-007).
- `timetables`: Full Mon–Sat schedules for child 1 (omitting Sat P7 `-`) and child 11 (Sat P1–P4, no lunch).
- `attendance`: Oct/Nov 2026 for child 1 (Oct: late 8, 21, holidays 15, 29; Nov: excused 2) and child 11.
- `gateLog`: All 19 historical scan events (today child 1 07:12 in / 11:32 out with `unread: true`).
- `reports`: Child 1 (GPA 3.85, rank 2 of 31, average 91.9, subjects, recent assessment scores, Dr. Sokha Chan comment) and Child 11 (GPA 3.78, rank 4 of 28, average 91.0, Ms. Bopha Pich comment).
- `invoices`: 5 family invoices totaling $1,710.00 outstanding ($45 overdue, $360 due, $1,305 due, 2 paid).
- `announcement`: Independence Day Mon 9 Nov notice.
- Dual export for browser (`window.PM_DATA`) and Node (`module.exports`).

### 2. `phone-mockup/mockup-app.js`
Implement:
- Retain existing `applyBrand()` and `fitDevice()` logic from M1.
- Implement and expose `window.PM_HELPERS` (and dual Node export `typeof module !== 'undefined' ? module.exports = ... : ...`):
  - `esc`, `toMin`, `fmtMoney`, `fmtDate`, `fmtDay`, `daysBetween`, `letter`, `calcAverage`, `attendanceSummary`, `attendanceMonth`, `periodStatus`, `childToday`, `campusDuration`, `outstanding`, `pseudoQr`.
  - Authoritative letter grade thresholds: $\ge 95 \to \text{"A+"}$, $\ge 90 \to \text{"A"}$, $\ge 85 \to \text{"B+"}$, $\ge 80 \to \text{"B"}$, $\ge 70 \to \text{"C"}$, $< 70 \to \text{"D"}$.
- In-memory state machine:
  `state = { view: "login", role: "student", tab: "home", childId: 1, day: "tue", month: "2026-11", alertFilter: "all", payFilter: "due", sheet: null, pay: null, toast: null, pushBanner: null, invoices: clone(PM_DATA.invoices), gateLog: clone(PM_DATA.gateLog) }`
  ZERO `localStorage` reads/writes.
- Login Screen renderer & actions:
  - Header: Logo tile, school name & Khmer name from `applyBrand()`
  - Segmented control (`.pm-seg`): Student vs Parent. Toggling switches prefilled credentials (`stu_chanreaksa` vs `par_vibol`), preserves password `demo1234`, updates input label/placeholder.
  - Password eye toggle (`bi-eye` / `bi-eye-slash`)
  - "Forgot password?" toast link
  - Inline error validation (empty inputs marked with error styling, halts submission)
  - 700ms simulated network loading transition with button spinner, then transitions to `state.view = "app"`
- App Shell Header & Avatar / Account sheet:
  - Header avatar button ("SC" / "SV") opening Account bottom sheet
  - Account sheet displays profile details and "Sign Out" button
  - "Sign Out" action returns to `view = "login"` with current `role` preserved
- Event delegation `onAction(e)` on `#pmApp` handling `data-action`.

## Required Verification
Execute and verify that ALL of the following commands succeed with zero errors:
1. `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`
2. `node tests/test-oracle.js` (ALL 7 checks must pass!)
3. `./tests/test-syntax.sh`
4. `./tests/test-routes.sh`
5. `./tests/test-adversarial-m1.sh`
6. `node tests/test-centering.js`

## Deliverable
Document your implementation, verification results, and diffs in `/Users/macbookpro/School-Management-System/.agents/teamwork/worker_m2_1/handoff.md`.
Then send a completion message with summary to `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.
