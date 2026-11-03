## 2026-11-03T06:49:26Z
You are `worker_m3_1` (teamwork_worker), operating in working directory `/Users/macbookpro/School-Management-System/.agents/teamwork/worker_m3_1/`.
Your orchestrator is conversation ID `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`. You MUST communicate all results back using `send_message` with recipient `f47b3442-f659-46f9-91f4-2d8a9d4c3a60`.

MANDATORY REFERENCE: Read `/Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md` before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mission
Implement Milestone 3: Student Portal (all 5 mobile tabs + Campus ID QR modal sheet) in `phone-mockup/mockup-app.js` and `phone-mockup/phone-mockup.css`.

## Write Ownership
You have exclusive write ownership of:
- `phone-mockup/mockup-app.js`
- `phone-mockup/phone-mockup.css`

DO NOT modify or revert the 7 existing uncommitted modified files in the git workspace (`css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`).
DO NOT modify `phone-mockup/mockup-data.js`.

## Specification & Plan References
Read the detailed Explorer handoff reports before implementing:
1. `explorer_m3_1` (Home & Schedule tabs):
   `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m3_1/handoff.md`
2. `explorer_m3_2` (Report tab):
   `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m3_2/handoff.md`
3. `explorer_m3_3` (Attendance & Check-in Log tabs + QR sheet):
   `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m3_3/handoff.md`
4. Global Project Plan:
   `/Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md`

## Detailed Implementation Requirements

### 1. Student Portal 5 Tabs (`phone-mockup/mockup-app.js`)
Implement high-fidelity rendering for all 5 tabs in Student role:
- **Home Tab**:
  - Header greeting ("Good morning, Sok Chanreaksa", "Tuesday, 3 November · G12-A · High School").
  - Hero Card: Current campus status ("Lunch break · 11:00 – 13:30", "Checked out 11:32 AM · Gate 01"), upcoming class ("Biology · 13:30 – 14:45 · Lab 2").
  - Interactive Stat Overview Cards: 2-column cards linking to Attendance (96.3%) and Report (91.9 Avg) with `data-action="tab" data-tab="attendance"` and `data-action="tab" data-tab="report"`.
  - Today's Schedule Mini-List: Ordered list of periods for Tuesday with Now/Next pills (`PM_HELPERS.periodStatus`), time, subject, teacher, room, and "See all" link.
  - Announcements Card: Independence Day notice (Nov 9).
- **Schedule Tab**:
  - Weekday Selector: Horizontal chips for Mon–Sat (2 Nov – 7 Nov 2026), active day brand highlight, today dot on Tuesday when inactive (`data-action="day" data-day="..."`).
  - Day Timetable: Ordered list of periods with start/end time, subject, teacher, room, recess/lunch break rows with dashed borders, and dynamic Now/Next pills based on demo clock 11:35 AM.
  - Saturday schedule: Omit period 7 `-` (6 periods total).
- **Report Tab**:
  - Header: Term 1 Midterm Evaluation, Class G12-A, Academic Year 2026–2027.
  - GPA & Average Score Overview Card: Circular progress average ring for `91.9` (`conic-gradient(var(--brand-primary) calc(91.9 * 3.6deg), #eaecf0 0deg)`), Term GPA `3.85`, Class Rank `2 of 31` students.
  - Subject Breakdown Cards: 7 subjects with letter grade pills (`.pm-letter-pill`) colored by letter (A+ `#12b76a`, A `#027a48`, B+ `#0077b6`), progress bars (`.pm-score-bar`) showing percentage, teacher name, credit hours, subject code.
  - Recent Assessments List: Quizzes and tests with date tiles, titles, subjects, and grade pills.
  - Homeroom Teacher Evaluation: Quote card from Dr. Sokha Chan with teacher avatar (`SC`), advisor title, blockquote remarks.
  - PDF Download Simulation: "Download report (PDF)" ghost button (`.pm-btn-ghost`) with `data-action="pdf-toast"` triggering toast ("Downloading Midterm_Report_2026_Term1.pdf…").
- **Attendance Tab**:
  - Circular progress ring for Term Attendance Rate `96.3%`.
  - 4-up metric cards: Present `24`, Late `2`, Excused `1`, Absent `0`.
  - Calendar Grid with Month Navigation: Navigation between October 2026 and November 2026 (`data-action="month" data-month="..."`). 7-column calendar grid (Sun–Sat) with status dots (green, orange, blue, red) and holiday "H" badge for school holidays (Oct 15, Oct 29).
  - Non-Present Records List: Detailed list of non-present days (Oct 8 late, Oct 21 late, Nov 2 excused).
- **Check-in Log Tab**:
  - Today Status Card: "Off campus", 07:12 AM In / 11:32 AM Out timeline, calculated "Time on campus today: 4h 20m" (`PM_HELPERS.campusDuration`).
  - "Show my campus ID" button opening modal sheet (`data-action="sheet" data-sheet="qr"`).
  - Campus ID QR Bottom Sheet: Student photo/avatar ("SC"), student name "Sok Chanreaksa", card ID "STU-2026-001", grade "G12-A", and crisp SVG QR code generated deterministically via `PM_HELPERS.pseudoQr("STU-2026-001", 180)`.
  - Recent Days Gate History: Chronological timeline of historical gate scans with entry/exit icons, gates, times, and methods.

### 2. Styling (`phone-mockup/phone-mockup.css`)
Incorporate all scoped styles identified by the explorers for the 5 tabs:
- `.pm-stat-card`, `.pm-day-strip`, `.pm-day-btn`, `.pm-period-row`, `.pm-break-row`, `.pm-letter-pill`, `.pm-score-bar`, `.pm-calendar-grid`, `.pm-calendar-cell`, `.pm-calendar-dot`, `.pm-qr-badge`, etc.
- Preserve all existing M1 and M2 styles.

## Required Verification
Execute and verify that ALL of the following commands succeed with zero errors:
1. `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`
2. `node tests/test-oracle.js`
3. `./tests/test-syntax.sh`
4. `./tests/test-routes.sh`
5. `./tests/test-adversarial-m1.sh`
6. `node tests/test-centering.js`
7. `node tests/test-adversarial-m2-helpers.js`
8. `node tests/test-adversarial-m2-auth.js`


## 2026-11-03T06:59:53Z
**Context**: Milestone 3 Implementation
**Content**: Safety timer reached. Checking in on progress. Please let us know the current status of the Student Portal tabs implementation, test execution, and handoff report.
**Action**: Please complete testing, write `handoff.md`, and reply with completion summary.
