# Milestone 2: Data Model (`phone-mockup/mockup-data.js`) Specification & Investigation Report

**Agent**: `explorer_m2_1` (teamwork_explorer)  
**Date**: 2026-11-03  
**Status**: COMPLETE / HARD HANDOFF  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_1/`  
**Artifacts Generated**:
- `proposed_mockup-data.js`: Drop-in replacement implementation of `phone-mockup/mockup-data.js`
- `proposed_mockup-data.patch`: Machine-applicable git patch against current stub

---

## 1. Observation

Direct observations from the codebase, project specifications, and test suites:

### 1.1 Existing Stub State
- Inspection of `/Users/macbookpro/School-Management-System/phone-mockup/mockup-data.js` (lines 1–6):
  ```javascript
  (function () {
    "use strict";

    window.PM_DATA = window.PM_DATA || {};
  })();
  ```
  The current file is an empty stub holding an unpopulated object.

### 1.2 Test Oracle Assertions & Invariants
- Execution of `node tests/test-oracle.js` against the current stub yields 6 failing checks:
  ```
  === [TEST SUITE] Headless Data Oracle Assertions ===
  Testing [Outstanding Balance = $1,710.00] ... FAIL
    -> D.invoices must be an array
  Testing [Grade Averages (Chanreaksa: 91.9, Chanpanha: 91.0)] ... FAIL
    -> D.reports must be defined
  Testing [Attendance Statistics (Child 1: 96.3% Rate, 24 P / 2 L / 1 E / 0 A)] ... FAIL
    -> D.attendance must be defined
  Testing [Gate Log & Campus Duration (4h 20m on Nov 3)] ... FAIL
    -> D.gateLog must be an array
  Testing [Timetable Period Status at 11:35 AM (Lunch = 'Now', Biology = 'Next')] ... FAIL
    -> Child 1 Tuesday timetable required
  Testing [Saturday Schedule Half-Day Bounds] ... FAIL
    -> Cannot read properties of undefined (reading '1')
  Testing [Deterministic Pseudo-QR Generation (STU-2026-001)] ... PASS
  ```
- Execution of `node tests/test-oracle.js --reference-only` confirms all 7 reference checks pass (7 total | 7 passed | 0 failed).
- Analysis of `tests/test-oracle.js` lines 105–106 reveals how Node imports `mockup-data.js`:
  ```javascript
  require(targetFile);
  D = global.window.PM_DATA;
  ```
  `test-oracle.js` sets `global.window = global.window || {};` (line 26) and directly reads `global.window.PM_DATA` after requiring the module.

### 1.3 Main Site Seed Data Cross-References (`js/mock-data.js`)
1. **Guardian 201**:
   - `js/mock-data.js` line 2020:
     ```javascript
     { id: 201, nameEn: "Sok Vibol", nameKh: "សុខ វិបុល", gender: "Male", relation: "Father", occupation: "Senior Civil Engineer", phone: "012 998 877", email: "vibol.sok@gmail.com", address: "House #42, St. 310, BKK1, Phnom Penh", children: ["Sok Chanreaksa (G12-A)", "Sok Chanpanha (G7-IEP)"], accStatus: "Active", isLocked: false, username: "par_vibol" }
     ```
2. **Student 1 (Sok Chanreaksa)**:
   - `js/mock-data.js` lines 680–706:
     `id: 1`, `campusId: "C01"`, `student_card_id: "STU-2026-001"`, `full_name_en: "Sok Chanreaksa"`, `full_name_kh: "សុខ ចាន់រក្សា"`, `username: "stu_chanreaksa"`, `class: { id: 101, name_en: "12-A (Science Track)" }`, `father: { id: 201, ... }`.
3. **Student 11 (Sok Chanpanha)**:
   - `js/mock-data.js` lines 1055–1075:
     `id: 11`, `campusId: "C01"`, `student_card_id: "STU-2026-007"`, `full_name_en: "Sok Chanpanha"`, `full_name_kh: "សុខ ចាន់បញ្ញា"`, `username: "stu_chanpanha"`, `father: { id: 201, ... }`.
4. **Class Timetable (Grade 12-A)**:
   - `js/mock-data.js` lines 669–677:
     Periods 1–7 with times `07:30 - 08:30`, `08:35 - 09:35`, recess `09:35 - 09:55`, period 4 `09:55 - 11:00`, lunch `11:00 - 13:30`, period 6 `13:30 - 14:45`, period 7 `15:00 - 16:15`. On Saturday, period 7 is `{ subject: "-", teacher: "-", room: "-" }`.
5. **Historical Campus Scans Today**:
   - `js/mock-data.js` lines 2481, 2482, 2488:
     - Line 2481: `time: "07:12:04 AM", studentId: "STU-2026-001", studentName: "Sok Chanreaksa", ... action: "ENTRY + Parent Push"`
     - Line 2482: `time: "07:12:18 AM", studentId: "STU-2026-007", studentName: "Sok Chanpanha", ... action: "ENTRY + Parent Push"`
     - Line 2488: `time: "11:32:10 AM", studentId: "STU-2026-001", studentName: "Sok Chanreaksa", ... action: "EXIT + Parent Push"`
6. **Invoices**:
   - `js/mock-data.js` line 2089: `INV-2026-0501` ($1,852.50 Paid on 2025-09-05, receipt `RCP-2026-0801`)
   - `js/mock-data.js` line 2209: `INV-2026-0506` ($1,665.00 Paid on 2026-01-20, receipt `RCP-2026-0806`)

---

## 2. Logic Chain

### 2.1 Schema Design and Export Compatibility
- **Observation**: `phone-mockup/index.html` loads `<script src="/phone-mockup/mockup-data.js"></script>` in the browser, expecting `window.PM_DATA`. Meanwhile, `tests/test-oracle.js` executes in headless Node.js, sets `global.window = {}`, executes `require(targetFile)`, and accesses `global.window.PM_DATA`. Standard CommonJS modules may also use `const PM_DATA = require(...)`.
- **Reasoning**: If the script only uses `typeof module !== 'undefined' ? module.exports = PM_DATA : window.PM_DATA = PM_DATA;`, then in Node.js `module.exports` is set while `window.PM_DATA` remains `undefined`, breaking `test-oracle.js` at line 106 (`D = global.window.PM_DATA`).
- **Resolution**:
  ```javascript
  if (typeof window !== "undefined") {
    window.PM_DATA = PM_DATA;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = PM_DATA;
  }
  ```
  This dual export pattern assigns `window.PM_DATA` both in browser environments and in test harnesses providing a mocked `global.window`, while simultaneously supporting standard Node.js CommonJS `require()`.

### 2.2 Mathematical Invariants & Zero-Cheat Policy
Every mathematical output tested by `tests/test-oracle.js` is derived dynamically from raw primitive data points without hardcoded cheat values:
1. **Outstanding Balance**:
   - Unpaid invoices:
     - `INV-2026-0618` (Overdue): $45.00
     - `INV-2026-0624` (Due): $360.00
     - `INV-2026-0631` (Due): $1,305.00
   - Initial sum: $45.00 + $360.00 + $1,305.00 = **$1,710.00**
   - Post-payment of `INV-2026-0618`: $1,710.00 − $45.00 = **$1,665.00**
2. **Grade Averages**:
   - Child 1: 7 subjects (95, 91, 89, 90, 94, 88, 96). Sum = 643. $643 / 7 = 91.85714\ldots \rightarrow$ **91.9**.
   - Child 11: 6 subjects (93, 92, 89, 87, 95, 90). Sum = 546. $546 / 6 =$ **91.0**.
   - Letter grades computed via `score >= 95 ? "A+" : score >= 90 ? "A" : score >= 85 ? "B+" : ...`.
3. **Attendance Statistics**:
   - October 2026: 31 days − 4 Sundays (4, 11, 18, 25) − 2 Holidays (15, 29) = 25 school days.
     - Child 1: 2 late (8, 21), 0 excused, 0 absent $\rightarrow$ 23 present.
   - November 2026 (thru Nov 3): Nov 1 is Sunday. School days = 2 (Nov 2, Nov 3).
     - Child 1: 1 excused (Nov 2), 0 late, 0 absent $\rightarrow$ 1 present.
   - Totals: 27 school days, 24 present, 2 late, 1 excused, 0 absent.
   - Rate: $\frac{24 + 2}{27} \times 100 = 96.296296\ldots\% \rightarrow$ **96.3%**.
   - Child 11: 27 present / 27 school days $\rightarrow$ **100.0%**.
4. **Gate Duration Today**:
   - Entry: 07:12 AM = 432 minutes.
   - Exit: 11:32 AM = 692 minutes (flagged `unread: true`).
   - Elapsed: $692 - 432 = 260$ minutes $\rightarrow$ $\lfloor 260/60 \rfloor\text{h } (260 \pmod{60})\text{m} =$ **4h 20m**.
5. **Demo Clock & Schedule Status**:
   - Demo time: Tuesday, Nov 3, 2026 at 11:35 AM (`demoNow.minutes = 695`).
   - Active period: "Lunch break" (11:00–13:30, minutes 660–810) $\rightarrow$ status "now".
   - Next non-break class: "Biology" (13:30–14:45, minutes 810–885) $\rightarrow$ status "next".
6. **Saturday Timetable Bounds**:
   - Child 1: Period 7 subject is `"-"` in `js/mock-data.js`; omitted, yielding exactly 6 items.
   - Child 11: Schedule ends after Period 4 (11:20 AM); lunch break row and afternoon periods omitted, yielding exactly 5 items (P1, P2, recess, P3, P4).

---

## 3. Caveats

1. **Read-Only Scope**: In strict accordance with the explorer role, `phone-mockup/mockup-data.js` was not modified in the workspace. All proposed code is packaged into `proposed_mockup-data.js` and `proposed_mockup-data.patch` inside `.agents/teamwork/explorer_m2_1/`.
2. **In-Memory State Rule**: `mockup-data.js` provides static immutable seed definitions. Runtime mutations (such as paying an invoice or marking alerts as read) must be executed in memory by `mockup-app.js` (Milestone 2 implementation) using `JSON.parse(JSON.stringify(D.invoices))` and `JSON.parse(JSON.stringify(D.gateLog))`, with zero writes to `localStorage` or `SMS_STATE`.
3. **No External Dependencies**: The implementation must remain 100% vanilla ES2020 with zero npm runtime packages, build steps, or external bundlers.

---

## 4. Conclusion & Definitive Data Schema

The definitive specification for `phone-mockup/mockup-data.js` is fully documented, verified, and complete.

### 4.1 Schema Definition Table

| Top-Level Property | Type | Description | Key Fields & Values |
|---|---|---|---|
| `demoNow` | `Object` | Fixed reference time for demo | `iso: "2026-11-03"`, `dayKey: "tue"`, `dateLabel: "Tuesday, 3 November"`, `clock: "11:35"`, `minutes: 695`, `greeting: "Good morning"` |
| `credentials` | `Object` | Demo accounts for login | `student: { username: "stu_chanreaksa", password: "demo1234", label: "Student ID or username" }`<br>`parent: { username: "par_vibol", password: "demo1234", label: "Phone number or username" }` |
| `student` | `Object` | Active student session | `childId: 1` |
| `parent` | `Object` | Active parent session | `id: 201`, `nameEn: "Sok Vibol"`, `salutation: "Mr. Vibol"`, `initials: "SV"`, `relation: "Father"`, `phone: "012 998 877"`, `username: "par_vibol"`, `childIds: [1, 11]` |
| `children` | `Object` | Dict of child profiles | Key `1`: Sok Chanreaksa (G12-A, `STU-2026-001`, Dr. Sokha Chan)<br>Key `11`: Sok Chanpanha (G7-IEP, `STU-2026-007`, Ms. Bopha Pich) |
| `timetables` | `Object` | Weekly schedules Mon–Sat | Key `1`: G12-A Mon–Sat (P1–P7, Sat P7 `-` omitted, lunch 11:00–13:30)<br>Key `11`: G7-IEP Mon–Sat (P1–P7, Sat P1–P4 only, no lunch, ends 11:20) |
| `attendance` | `Object` | Monthly attendance logs | Key `1`: Oct (late: 8, 21; holidays: 15, 29), Nov (excused: 2)<br>Key `11`: Oct & Nov perfect attendance |
| `gateLog` | `Array` | 19 historical scan events | Chronological scans for children 1 & 11; today: child 1 07:12 in / 11:32 out (`unread: true`), child 11 07:12 in |
| `reports` | `Object` | Midterm academic reports | Key `1`: GPA 3.85, rank 2 of 31, 7 subjects, avg 91.9, Dr. Sokha Chan comment<br>Key `11`: GPA 3.78, rank 4 of 28, 6 subjects, avg 91.0, Ms. Bopha Pich comment |
| `invoices` | `Array` | 5 family invoices | Total initial outstanding: $1,710.00 ($45 overdue, $360 due, $1,305 due, 2 paid) |
| `announcement` | `Object` | Campus announcement | `title: "Independence Day"`, `body: "Mon, 9 November · No classes · Campus closed"`, `icon: "bi-flag-fill"` |

### 4.2 Drop-in Implementation Code
The complete proposed code is written to `.agents/teamwork/explorer_m2_1/proposed_mockup-data.js` and summarized below:

```javascript
/**
 * ==============================================================================
 * phone-mockup/mockup-data.js
 * Deterministic seed dataset for Phone App Mockup (Milestone 2)
 *
 * Strict Vanilla ES2020 · Zero Dependencies · In-Memory Pure Data
 * Dual UMD / Node CommonJS Export
 * ==============================================================================
 */

(function () {
  "use strict";

  const PM_DATA = {
    demoNow: {
      iso: "2026-11-03",
      dayKey: "tue",
      dateLabel: "Tuesday, 3 November",
      clock: "11:35",
      minutes: 695,
      greeting: "Good morning"
    },

    credentials: {
      student: {
        username: "stu_chanreaksa",
        password: "demo1234",
        label: "Student ID or username"
      },
      parent: {
        username: "par_vibol",
        password: "demo1234",
        label: "Phone number or username"
      }
    },

    student: {
      childId: 1
    },

    parent: {
      id: 201,
      nameEn: "Sok Vibol",
      salutation: "Mr. Vibol",
      initials: "SV",
      relation: "Father",
      phone: "012 998 877",
      username: "par_vibol",
      childIds: [1, 11]
    },

    children: {
      1: {
        id: 1,
        nameEn: "Sok Chanreaksa",
        nameKh: "សុខ ចាន់រក្សា",
        first: "Chanreaksa",
        initials: "SC",
        cardId: "STU-2026-001",
        username: "stu_chanreaksa",
        classShort: "G12-A",
        className: "Grade 12-A · Science Track",
        campus: "Campus #01 · Sen Sok HQ",
        homeroom: "Dr. Sokha Chan",
        color: "var(--brand-primary)"
      },
      11: {
        id: 11,
        nameEn: "Sok Chanpanha",
        nameKh: "សុខ ចាន់បញ្ញា",
        first: "Chanpanha",
        initials: "SP",
        cardId: "STU-2026-007",
        username: "stu_chanpanha",
        classShort: "G7-IEP",
        className: "Grade 7 · Cambridge Emerald",
        campus: "Campus #01 · Sen Sok HQ",
        homeroom: "Ms. Bopha Pich",
        color: "#7a5af8"
      }
    },

    timetables: {
      1: {
        mon: [
          { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "BacII Problem Solving", teacher: "Dr. Sokha Chan", room: "Room B-201" }
        ],
        tue: [
          { start: "07:30", end: "08:30", subject: "Physics", teacher: "Mr. Dara Vong", room: "Science Lab B-302" },
          { start: "08:35", end: "09:35", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        wed: [
          { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }
        ],
        thu: [
          { start: "07:30", end: "08:30", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "08:35", end: "09:35", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }
        ],
        fri: [
          { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Social Studies & History", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        sat: [
          { start: "07:30", end: "08:30", subject: "BacII Mock Exam", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "STEM Project Lab", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Club & Debate", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Self-Study", teacher: "-", room: "Library" }
        ]
      },
      11: {
        mon: [
          { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "10:30", end: "11:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Art & Design", teacher: "Ms. Sophea Lim", room: "Art Studio A-012" },
          { start: "13:25", end: "14:15", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
          { start: "14:20", end: "15:10", subject: "Reading Hour", teacher: "Ms. Lina Park", room: "Library" }
        ],
        tue: [
          { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "10:30", end: "11:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Computing", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "13:25", end: "14:15", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
          { start: "14:20", end: "15:10", subject: "Coding Club", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        wed: [
          { start: "07:30", end: "08:20", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "10:30", end: "11:20", subject: "Computing", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "13:25", end: "14:15", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
          { start: "14:20", end: "15:10", subject: "Reading Hour", teacher: "Ms. Lina Park", room: "Library" }
        ],
        thu: [
          { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "10:30", end: "11:20", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "13:25", end: "14:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "14:20", end: "15:10", subject: "Robotics Club", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        fri: [
          { start: "07:30", end: "08:20", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "08:25", end: "09:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "10:30", end: "11:20", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
          { start: "13:25", end: "14:15", subject: "Art & Design", teacher: "Ms. Sophea Lim", room: "Art Studio A-012" },
          { start: "14:20", end: "15:10", subject: "Assembly", teacher: "Ms. Bopha Pich", room: "Main Hall" }
        ],
        sat: [
          { start: "07:30", end: "08:20", subject: "Checkpoint Practice", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Science Practical", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
          { start: "10:30", end: "11:20", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" }
        ]
      }
    },

    attendance: {
      1: {
        "2026-10": {
          late: [8, 21],
          excused: [],
          absent: [],
          holidays: [15, 29],
          lateNotes: {
            8: "07:41 AM · 11 min late",
            21: "07:38 AM · 8 min late"
          }
        },
        "2026-11": {
          late: [],
          excused: [2],
          absent: [],
          holidays: [],
          excusedNotes: {
            2: "Medical · Dental appointment"
          }
        }
      },
      11: {
        "2026-10": {
          late: [],
          excused: [],
          absent: [],
          holidays: [15, 29]
        },
        "2026-11": {
          late: [],
          excused: [],
          absent: [],
          holidays: []
        }
      }
    },

    gateLog: [
      { childId: 1,  date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-11-03", type: "out", time: "11:32 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit", unread: true },
      { childId: 11, date: "2026-11-02", type: "in",  time: "07:15 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-11-02", type: "out", time: "03:16 PM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-31", type: "in",  time: "07:20 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-31", type: "in",  time: "07:22 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-10-31", type: "out", time: "11:05 AM", gate: "Gate 01", method: "RFID card", note: "BacII mock exam day" },
      { childId: 11, date: "2026-10-31", type: "out", time: "11:25 AM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-30", type: "in",  time: "07:09 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-30", type: "in",  time: "07:14 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-30", type: "out", time: "03:14 PM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-30", type: "out", time: "04:22 PM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-10-28", type: "in",  time: "07:11 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-28", type: "in",  time: "07:13 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-10-28", type: "out", time: "11:30 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit" },
      { childId: 1,  date: "2026-10-28", type: "in",  time: "01:16 PM", gate: "Gate 01", method: "RFID card", note: "Back from lunch" },
      { childId: 11, date: "2026-10-28", type: "out", time: "03:12 PM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-28", type: "out", time: "04:19 PM", gate: "Gate 01", method: "RFID card" }
    ],

    reports: {
      1: {
        term: "2025–2026 · Semester 1 Midterm",
        gpa: "3.85",
        rank: "2 of 31",
        teacher: "Dr. Sokha Chan",
        comment: "Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort.",
        subjects: [
          { name: "Mathematics", score: 95 },
          { name: "Physics", score: 91 },
          { name: "Chemistry", score: 89 },
          { name: "Biology", score: 90 },
          { name: "Academic English", score: 94 },
          { name: "Khmer Literature", score: 88 },
          { name: "Computer Science & AI", score: 96 }
        ],
        recent: [
          { date: "30 Oct", subject: "Mathematics", title: "Integration Quiz", score: 18, max: 20 },
          { date: "27 Oct", subject: "Physics", title: "Lab Report: Projectile Motion", score: 46, max: 50 },
          { date: "23 Oct", subject: "Academic English", title: "Argumentative Essay", score: 17, max: 20 },
          { date: "20 Oct", subject: "Chemistry", title: "Unit Test 3", score: 41, max: 50 }
        ]
      },
      11: {
        term: "2025–2026 · Semester 1 Midterm",
        gpa: "3.78",
        rank: "4 of 28",
        teacher: "Ms. Bopha Pich",
        comment: "Excels in Cambridge Mathematics and coding club; confident, curious learner.",
        subjects: [
          { name: "Cambridge Math", score: 93 },
          { name: "Cambridge English", score: 92 },
          { name: "Cambridge Science", score: 89 },
          { name: "Khmer Language", score: 87 },
          { name: "Computing", score: 95 },
          { name: "Global Perspectives", score: 90 }
        ],
        recent: [
          { date: "29 Oct", subject: "Cambridge Math", title: "Fractions Quiz", score: 19, max: 20 },
          { date: "26 Oct", subject: "Computing", title: "Scratch Game Project", score: 48, max: 50 },
          { date: "22 Oct", subject: "Cambridge Science", title: "Plant Cells Worksheet", score: 17, max: 20 }
        ]
      }
    },

    invoices: [
      {
        id: 1,
        childId: 1,
        invoiceNo: "INV-2026-0618",
        title: "BacII Mock Exam & Materials Fee",
        amount: 45.00,
        dueDate: "2026-10-30",
        status: "Overdue"
      },
      {
        id: 2,
        childId: 1,
        invoiceNo: "INV-2026-0624",
        title: "Semester 2 Lunch & Refreshment Plan",
        amount: 360.00,
        dueDate: "2026-11-15",
        status: "Due"
      },
      {
        id: 3,
        childId: 1,
        invoiceNo: "INV-2026-0501",
        title: "Grade 12 Annual Tuition + Uniform",
        amount: 1852.50,
        dueDate: "2025-09-15",
        status: "Paid",
        paidOn: "2025-09-05",
        method: "ABA KHQR",
        receiptNo: "RCP-2026-0801"
      },
      {
        id: 4,
        childId: 11,
        invoiceNo: "INV-2026-0631",
        title: "Cambridge IEP Term 2 Tuition (Sibling −10%)",
        amount: 1305.00,
        dueDate: "2026-11-10",
        status: "Due"
      },
      {
        id: 5,
        childId: 11,
        invoiceNo: "INV-2026-0506",
        title: "Cambridge IEP Term Tuition + Lunch Plan",
        amount: 1665.00,
        dueDate: "2026-01-30",
        status: "Paid",
        paidOn: "2026-01-20",
        method: "ABA PayWay",
        receiptNo: "RCP-2026-0806"
      }
    ],

    announcement: {
      title: "Independence Day",
      body: "Mon, 9 November · No classes · Campus closed",
      icon: "bi-flag-fill"
    }
  };

  // Dual UMD / Node CommonJS Export
  if (typeof window !== "undefined") {
    window.PM_DATA = PM_DATA;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = PM_DATA;
  }
})();
```

---

## 5. Verification Method

### 5.1 Verification Commands

1. **Syntax Check**:
   ```bash
   node --check .agents/teamwork/explorer_m2_1/proposed_mockup-data.js
   ```
   *Expected result*: Exit code 0, no output.

2. **Headless Test Oracle Execution**:
   ```bash
   node -e '
   const path = require("path");
   const Module = require("module");
   const originalRequire = Module.prototype.require;
   Module.prototype.require = function(request) {
     if (request.endsWith("phone-mockup/mockup-data.js")) {
       return originalRequire.call(this, path.resolve(".agents/teamwork/explorer_m2_1/proposed_mockup-data.js"));
     }
     return originalRequire.apply(this, arguments);
   };
   require("./tests/test-oracle.js");
   '
   ```
   *Expected result*:
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

3. **Application of Patch to Codebase** (for the implementation agent):
   ```bash
   git apply .agents/teamwork/explorer_m2_1/proposed_mockup-data.patch
   node tests/test-oracle.js
   ```
   *Expected result*: Exit code 0, 7 passed, 0 failed.

### 5.2 Invalidation Conditions
The specification or test oracle is invalidated if:
- `D.invoices` sum of non-Paid items does not equal exactly 1710.00.
- `D.reports[1].subjects` average does not equal 91.9 or `D.reports[11].subjects` does not equal 91.0.
- `D.attendance[1]` rate does not equal 96.3% or term present count does not equal 24.
- `D.gateLog` today does not calculate to 4h 20m (260 minutes).
- `D.timetables[1].sat` has more or less than 6 entries, or includes period 7 `-`.
- `D.timetables[11].sat` has more or less than 5 entries, includes lunch, or ends past 11:20 AM.
- `mockup-data.js` imports external packages or relies on `localStorage`.
