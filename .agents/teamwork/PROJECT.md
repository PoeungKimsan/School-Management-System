# Project: Phone App Mockup Page (/phone-mockup)

## Architecture
- **Overview**: An interactive, standalone iPhone 15 Pro mobile mockup showcase for the School Management System, providing full-fidelity Student and Parent portals.
- **Entry Points**:
  - Main app sidebar bottom-left footer (`index.html` outside `#sidebarnav`) linking to `/phone-mockup/`.
  - Standalone shell at `/phone-mockup/index.html` with "← Home" return pill linking to `/`.
- **Runtime Environment**:
  - Vanilla ES2020 JavaScript, standard CSS, static HTML (zero build steps, zero external dependencies).
  - Dynamic brand theming inherited at runtime from `SMS_STATE.schoolProfile` (Milky Way School `#0077b6`).
  - In-memory state only (zero `localStorage` pollution or persistence across reloads).
  - Directory serving via `server.js` and Cloudflare Pages (`wrangler.json`).
- **Data Flow**:
  `SMS_STATE.schoolProfile` + `PM_DATA` (seed data) -> `mockup-app.js` (in-memory `state` + pure computation helpers) -> single-pass `render()` DOM reconciliation + delegated action dispatching.

## Code Layout
- `index.html`: Main site shell, sidebar footer insertion between lines 85–86.
- `css/custom-demo.css`: Design tokens and `.min-app-mockup-btn` styling.
- `phone-mockup/index.html`: Mockup shell, device hardware frame, Dynamic Island, status bar, home indicator, app root `#pmApp`.
- `phone-mockup/phone-mockup.css`: All mockup styles scoped with `pm-` prefix, iPhone 15 Pro hardware geometry, animations, reduced motion media queries.
- `phone-mockup/mockup-data.js`: Deterministic demo dataset (`window.PM_DATA`).
- `phone-mockup/mockup-app.js`: Device scaling (`fitDevice()`), state machine, pure calculation helpers, actions dispatcher, and UI screen renderers.
- `tests/`: Automated test suite (syntax, routing curl checks, node oracle assertions, E2E runner).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Sidebar App Mockup Button | Pinned link in main desktop/mobile sidebar footer | M1 | ORIGINAL_REQUEST R1 |
| 2 | Standalone "← Home" Button | Return pill button fixed at top-left of viewport | M1 | ORIGINAL_REQUEST R2 |
| 3 | iPhone 15 Pro Hardware Frame | Titanium finish, hardware buttons, bezel, island, status bar, home indicator | M1 | ORIGINAL_REQUEST R2 |
| 4 | Dynamic Viewport Scaling | JS/CSS scaling fitting device without scrollbars (1440x900, 1280x720, 390x844) | M1 | ORIGINAL_REQUEST R2 |
| 5 | Fixed Demo Clock & Status Bar | Displays 11:35 with signal, Wi-Fi, and battery icons | M1 | implementation_plan §2, §3b |
| 6 | Dynamic Brand Synchronization | Inherits `--brand-primary` from `SMS_STATE.schoolProfile` | M2 | ORIGINAL_REQUEST R6 |
| 7 | Role Segmented Control | Switches between Student and Parent modes | M2 | ORIGINAL_REQUEST R3 |
| 8 | Credential Prefilling | Prefills `stu_chanreaksa` / `par_vibol` and `demo1234` | M2 | ORIGINAL_REQUEST R3 |
| 9 | Password Visibility Toggle | Toggles password field between password and text | M2 | ORIGINAL_REQUEST R3 |
| 10 | Inline Credential Validation | Prevents submission of empty inputs with red border | M2 | ORIGINAL_REQUEST R3 |
| 11 | Sign-In Loading Transition | 700ms simulated network delay with button spinner | M2 | ORIGINAL_REQUEST R3 |
| 12 | Forgot Password Toast | Informs user how to recover credentials via registrar | M2 | implementation_plan §5d |
| 13 | Student Home Hero Card | Status "Lunch break", checkout "11:32 AM", next "Biology" | M3 | ORIGINAL_REQUEST R4 |
| 14 | Quick Stat Overview Cards | Two-column cards linking to Attendance & Report | M3 | ORIGINAL_REQUEST R4 |
| 15 | Today's Schedule Mini-List | Compact list of periods with Now/Next pills | M3 | ORIGINAL_REQUEST R4 |
| 16 | Announcement Card | "Independence Day" notice on Nov 9 | M3 | ORIGINAL_REQUEST R4 |
| 17 | Schedule Weekday Selector | Mon–Sat day selector buttons (2–7 Nov 2026) | M3 | ORIGINAL_REQUEST R4 |
| 18 | Schedule Period Timeline | Periods with times, subject, teacher, room, recess/lunch | M3 | ORIGINAL_REQUEST R4 |
| 19 | Report Average Ring | Circular conic-gradient progress ring for GPA average (91.9) | M3 | ORIGINAL_REQUEST R4 |
| 20 | Subject Breakdown Cards | Subject rows with letter pills (A+, A, B+) and progress bars | M3 | ORIGINAL_REQUEST R4 |
| 21 | Recent Assessments List | List of recent quizzes and tests with scores | M3 | ORIGINAL_REQUEST R4 |
| 22 | Homeroom Teacher Comment | Dr. Sokha Chan's evaluation quote card | M3 | ORIGINAL_REQUEST R4 |
| 23 | PDF Download Simulation | Button to download midterm report PDF with toast | M3 | implementation_plan §5e |
| 24 | Attendance Rate Ring | Circular conic-gradient ring for attendance rate (96.3%) | M3 | ORIGINAL_REQUEST R4 |
| 25 | Attendance Counter Grid | 4-up metric cards: Present 24, Late 2, Excused 1, Absent 0 | M3 | ORIGINAL_REQUEST R4 |
| 26 | Attendance Calendar Grid | 7-column calendar grid with status dots for Oct & Nov | M3 | ORIGINAL_REQUEST R4 |
| 27 | Attendance Records List | Non-present records with late notes and excused reasons | M3 | ORIGINAL_REQUEST R4 |
| 28 | Check-in Gate Timeline | Daily gate events with icons, gates, times, notes | M3 | ORIGINAL_REQUEST R4 |
| 29 | Campus Duration Calculation | Calculates elapsed campus time today ("4h 20m") | M3 | ORIGINAL_REQUEST R4 |
| 30 | Campus ID QR Modal Sheet | Bottom sheet displaying deterministic pseudo-QR code | M3 | ORIGINAL_REQUEST R4 |
| 31 | Child Switcher Sheet | Bottom sheet to toggle between Chanreaksa and Chanpanha | M4 | ORIGINAL_REQUEST R5 |
| 32 | Children Status Cards | Overview cards for both children on Parent Home | M4 | ORIGINAL_REQUEST R5 |
| 33 | Next Payment Due Card | Upcoming family invoice ($1,305.00) & overdue alert ($45.00) | M4 | ORIGINAL_REQUEST R5 |
| 34 | Simulated iOS Push Banner | In-app notification appearing 1.5s post parent login | M4 | ORIGINAL_REQUEST R5 |
| 35 | Push Banner Interaction | Tapping banner navigates to Alerts tab and dismisses | M4 | ORIGINAL_REQUEST R5 |
| 36 | Gate Event Alert Feed | Detailed feed of children's gate entries and exits | M4 | ORIGINAL_REQUEST R5 |
| 37 | Alert Filter Chips | Filters gate feed by All, Chanreaksa, or Chanpanha | M4 | implementation_plan §5e |
| 38 | Child Midterm Scores View | Midterm report card for selected child (91.9 vs 91.0) | M4 | ORIGINAL_REQUEST R5 |
| 39 | Child Timetable Schedule View | Daily schedule for selected child (P1-P7 vs P1-P4) | M4 | ORIGINAL_REQUEST R5 |
| 40 | Family Payments Hero Card | Total family outstanding ($1,710.00), updates on pay | M4 | ORIGINAL_REQUEST R5 |
| 41 | Invoice Filter Segment | Segmented toggle between Due and Paid invoices | M4 | ORIGINAL_REQUEST R5 |
| 42 | Interactive Payment Sheet | 3-step bottom sheet: method choose, processing, receipt | M4 | ORIGINAL_REQUEST R5 |
| 43 | Dynamic Bakong KHQR | Dynamic QR generation for Bakong payment method | M4 | ORIGINAL_REQUEST R5 |
| 44 | Payment Balance Reduction | Real-time balance deduction ($1,710 -> $1,665), dot clears | M4 | ORIGINAL_REQUEST R5 |
| 45 | Account & Sign Out Sheet | Header avatar modal to sign out returning to Login | M2 | ORIGINAL_REQUEST R3 |
| 46 | Reduced Motion Support | Disables all CSS keyframe animations for accessibility | M1 | implementation_plan §3c |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Shell & Hardware Frame | Sidebar footer button in `index.html`, `custom-demo.css`, `phone-mockup/index.html` shell, iPhone 15 Pro hardware frame, dynamic scaling | none | DONE |
| M2 | Data Model & Auth Engine | `mockup-data.js` seed data, `mockup-app.js` boot, state machine, login, validation, eye toggle, sign out | M1 | DONE |
| M3 | Student Portal | 5 Student tabs: Home, Schedule, Report, Attendance, Check-in Log + QR modal sheet | M2 | DONE |
| M4 | Parent Portal | Child switcher, Parent Home, Alerts + push banner, Scores, Schedule, Payments with 3-step checkout flow | M3 | IN_PROGRESS |
| M5 | E2E Pass & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4) published in `TEST_READY.md`, followed by Tier 5 adversarial coverage hardening | M4, E2E-Track | PLANNED |

## Interface Contracts
### `index.html` <-> `phone-mockup/`
- Navigation link: `<a class="min-app-mockup-btn" href="/phone-mockup/">`
- Must not have `.nav-link` class so `updateSidebarActiveLink()` in `js/app.js` ignores it.
- Return link: `<a class="pm-home-btn" href="/">` returning to main dashboard.

### `mock-data.js` <-> `mockup-app.js`
- `window.SMS_STATE.schoolProfile`: Optional object containing `primaryColor`, `primaryHover`, `primaryLight`, `shortName`, `nameKh`.
- Fallback: `window.SMS_PRESETS["milky-way"]` with `#0077b6`.

### `mockup-data.js` <-> `mockup-app.js`
- Global dataset: `window.PM_DATA` with properties:
  - `demoNow`: `{ iso: "2026-11-03", dayKey: "tue", dateLabel: "Tuesday, 3 November", clock: "11:35", minutes: 695, greeting: "Good morning" }`
  - `credentials`: `{ student: { username, password, label }, parent: { username, password, label } }`
  - `student`: `{ childId: 1 }`
  - `parent`: `{ id: 201, nameEn, salutation, initials, phone, username, childIds: [1, 11] }`
  - `children`: `{ 1: { ... }, 11: { ... } }`
  - `timetables`: `{ 1: { mon..sat }, 11: { mon..sat } }`
  - `attendance`: `{ 1: { "2026-10": {...}, "2026-11": {...} }, 11: { ... } }`
  - `gateLog`: `[ { childId, date, type, time, gate, method, note?, unread? }, ... ]`
  - `reports`: `{ 1: { term, gpa, rank, teacher, comment, subjects, recent }, 11: { ... } }`
  - `invoices`: `[ { id, childId, invoiceNo, title, amount, dueDate, status, paidOn?, method?, receiptNo? } ]`
  - `announcement`: `{ title, body, icon }`

### `mockup-app.js` Pure Helpers Contract (`window.PM_HELPERS`)
- `toMin(timeStr: string) => number`
- `fmtMoney(amount: number) => string` (e.g. `"$1,710.00"`)
- `letter(score: number) => string` (A+, A, B+, B, C, D)
- `calcAverage(subjects: Array<{score: number}>) => string` (e.g. `"91.9"`)
- `attendanceSummary(childId: number) => { present: number, late: number, excused: number, absent: number, schoolDays: number, rate: number }`
- `periodStatus(period: object, dayKey: string) => "past" | "now" | "next" | "upcoming"`
- `childToday(childId: number) => { onCampus: boolean, label: string, time: string }`
- `outstanding(childId?: number) => number`
- `pseudoQr(seedStr: string, size?: number) => string` (returns SVG/HTML grid)
