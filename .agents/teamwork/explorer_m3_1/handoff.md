# Architectural Specification: Student Portal Home & Schedule Tabs (Milestone 3)

**Author**: `explorer_m3_1` (teamwork_explorer)  
**Date**: 2026-11-03  
**Target Files**: `phone-mockup/mockup-app.js`, `phone-mockup/phone-mockup.css`  
**Reference Document**: [implementation_plan.md §5e](file:///Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md#L551-L560)  

---

## 1. Observation

Direct examination of existing code and test suites reveals:

1. **Current Codebase State**:
   - `phone-mockup/mockup-app.js` lines 914–960 currently contain a preliminary stub for `state.tab === "home"`:
     - The Hero card has hardcoded strings (`"Lunch Break"`, `"Checkout at 11:32 AM · Gate 01"`, `"Upcoming: Biology 1:30 PM (B-201)"`) and does not compute dynamic values from `timetables` and `gateLog`.
     - The two stat cards ("Term GPA 3.85" and "Attendance 96.3%") lack `data-action="tab"` attributes; clicking them does not navigate to `report` or `attendance`.
     - **Today's Schedule Mini-List is completely missing** from the Home tab.
     - The header eyebrow/title in `renderAppShell()` (lines 1390–1394) sets `eyebrow = "Tuesday, 3 November"` and `title = "Good morning, Chanreaksa!"`, omitting the explicit student full name (`"Sok Chanreaksa"`) and high school grade (`"G12-A · High School"`).
   - `phone-mockup/mockup-app.js` lines 963–1008 contain a preliminary stub for `state.tab === "schedule"`:
     - The weekday selector only renders 3-letter strings (`Mon`, `Tue`, etc.) without date numbers (`2`, `3`, `4`, `5`, `6`, `7`) and lacks the today indicator dot.
     - Period rows use generic `pm-card` containers with basic inline left borders; they lack the specified left time column (bold start time 14px, muted end time 12px), 3px vertical accent bar, and distinctive dashed-border break rows.
     - The eyebrow in `renderAppShell()` line 1395 is hardcoded as `"Weekly Timetable"` rather than reflecting the student's enrolled grade (`"Grade 12-A · Science Track"`).

2. **Seed Data Invariants (`phone-mockup/mockup-data.js`)**:
   - Student ID 1: Sok Chanreaksa (`nameEn: "Sok Chanreaksa"`, `first: "Chanreaksa"`, `classShort: "G12-A"`, `className: "Grade 12-A · Science Track"`).
   - Tuesday Timetable:
     - P1: 07:30–08:30 (Physics, Mr. Dara Vong, Science Lab B-302)
     - P2: 08:35–09:35 (Academic English, Ms. Bopha Pich, Room B-201)
     - Morning recess: 09:35–09:55 (`isBreak: true, label: "Morning recess"`)
     - P3: 09:55–11:00 (Mathematics, Dr. Sokha Chan, Room B-201)
     - Lunch break: 11:00–13:30 (`isBreak: true, label: "Lunch break"`)
     - P4: 13:30–14:45 (Biology, Mr. Vannak Keo, Room B-201)
     - P5: 15:00–16:15 (Computer Science & AI, Mr. Dara Vong, STEM Lab 301)
   - Saturday Timetable: Period 7 (`"-"`) is omitted; exactly 6 entries are present (ending with P4 Self-Study 13:30–14:45).
   - Gate Log (Nov 3): Entry at 07:12 AM (Gate 01, RFID); Exit at 11:32 AM (Gate 01, RFID, "Lunch break exit", `unread: true`).

3. **Pure Helpers State (`PM_HELPERS`)**:
   - `periodStatus(period, "tue", periods)` evaluates cleanly against demo clock 11:35 AM (695 min):
     - Periods 1–4: `"past"`
     - Lunch break (11:00–13:30): `"now"`
     - Biology (13:30–14:45): `"next"`
     - Computer Science & AI (15:00–16:15): `"upcoming"`
     - Non-Tuesday days: returns `""` (empty string).
   - `childToday(1, state.gateLog)` returns `{ onCampus: false, label: "Off campus · Out 11:32 AM", time: "11:32 AM" }`.
   - `calcAverage(D.reports[1].subjects)` returns `"91.9"`.
   - `attendanceSummary(1, D)` returns `{ present: 24, late: 2, excused: 1, absent: 0, schoolDays: 27, rate: 96.3 }`.

4. **Test Suite Status**:
   - `tests/test-oracle.js` passes 7/7 checks.
   - `tests/test-all.sh` passes 3/3 suites (syntax, routes, oracle).
   - `tests/test-adversarial-m2.js` passes 34/34 checks.

---

## 2. Logic Chain

1. **Header Greeting Logic**:
   - In `renderAppShell()`, for `state.tab === "home"`, user requirements state:
     Greeting: "Good morning", Student name: "Sok Chanreaksa", Grade: "G12-A · High School".
   - Constructing the header with:
     - Eyebrow: `${dateLabel} · ${child.classShort} · High School` (e.g., `"Tuesday, 3 November · G12-A · High School"`)
     - Title: `Good morning, ${child.nameEn}` (e.g., `"Good morning, Sok Chanreaksa"`)
     - Avatar button: `${child.initials}` (SC) with `data-action="sheet" data-sheet="account"`
   - This directly fulfills the greeting, name, and grade hierarchy without overcrowding the 393px viewport.

2. **Home Hero Card Dynamic Derivation**:
   - From `periods = D.timetables[1].tue`:
     - Current period/break: `const nowPeriod = periods.find(p => PM_HELPERS.periodStatus(p, "tue", periods) === "now");`
       Evaluates to `nowPeriod = { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" }`.
       Hero pill display: `Lunch break · 11:00 – 13:30`.
     - Gate checkout line:
       Today's last gate event `todayEvents[todayEvents.length - 1]` has `time: "11:32 AM"`, `gate: "Gate 01"`.
       Hero gate display: `Checked out 11:32 AM · Gate 01`.
     - Next class:
       `const nextPeriod = periods.find(p => PM_HELPERS.periodStatus(p, "tue", periods) === "next");`
       Evaluates to `nextPeriod = { start: "13:30", end: "14:45", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" }`.
       Hero next class display: `Biology` (18px/600), `13:30 – 14:45 · Room B-201 · Mr. Vannak Keo`.
   - Applying `.pm-card-hero` gives Milky Way primary brand background (`--brand-primary`), white text, and clean internal spacing.

3. **Quick Stat Cards with Navigation Action**:
   - Card 1 (Attendance):
     - Metric: `96.3%` (`att.rate%`)
     - Subtitle: `This term` (or `24 Present · 2 Late`)
     - Action: `data-action="tab" data-tab="attendance" role="button" tabindex="0"`
   - Card 2 (Average Score):
     - Metric: `91.9` (`PM_HELPERS.calcAverage(rep.subjects)`)
     - Subtitle: `GPA 3.85`
     - Action: `data-action="tab" data-tab="report" role="button" tabindex="0"`
   - Delegated click handler in `mockup-app.js` already supports `case "tab": state.tab = nextTab; render();`. Clicking either card immediately transitions to the respective tab and scrolls the body to top.

4. **Today's Schedule Mini-List Component**:
   - Positioned between Quick Stat Cards and Announcements.
   - Header row contains:
     - Section label: `Today's classes`
     - Action link: `<button type="button" data-action="tab" data-tab="schedule">See all <i class="bi bi-chevron-right"></i></button>`
   - Period list wrapped in `<div class="pm-card pm-list">`:
     - Breaks (Morning recess, Lunch break): thin dashed row with cutlery/clock icon, label, times (`09:35 – 09:55` / `11:00 – 13:30`). Lunch break gets `"Now"` pill.
     - Classes: Start and End times in left 52px column; 3px vertical accent bar; Subject and Room · Teacher in middle; trailing status marker on right (`bi-check-circle-fill` for past, `"Now"` pill for lunch, `"Next"` pill for Biology).

5. **Announcements Card**:
   - Section label: `Announcements`.
   - Card displays `D.announcement`:
     - Icon: `bi-flag-fill` inside a 40×40 rounded circle with `var(--brand-primary-light)` background and `var(--brand-primary)` icon color.
     - Title: `Independence Day`.
     - Subtitle: `Mon, 9 November · No classes · Campus closed`.

6. **Schedule Tab Weekday Selector (Day Strip)**:
   - Week of Mon 2 Nov – Sat 7 Nov 2026:
     - Mon: 2 Nov
     - Tue: 3 Nov (Today)
     - Wed: 4 Nov
     - Thu: 5 Nov
     - Fri: 6 Nov
     - Sat: 7 Nov
   - Styled as 6 equal buttons in a grid (`grid-template-columns: repeat(6, 1fr); gap: 6px;`).
   - Active day: `var(--brand-primary)` background, white text, bold font.
   - Inactive today (`tue`): subtle white card background with a 4px brand dot at the bottom center.
   - Each button has `data-action="day" data-day="${d.key}"`.

7. **Schedule Tab Period Timetable & Breaks**:
   - Evaluates `periods = D.timetables[childId][state.day]`.
   - Each row presents:
     - Left time column: Start time (bold 14px), End time (muted 12px).
     - 3px vertical accent bar: color-coded by status (`var(--brand-primary)` for now, `#027a48` for next, `#d0d5dd` for past, `var(--border-subtle)` for upcoming).
     - Middle column: Subject (15px/600), Teacher · Room (13px muted).
     - Right column: Status pills (`<span class="pm-pill brand">Now</span>`, `<span class="pm-pill neutral">Next</span>`, or past checkmark).
     - Break rows: dashed border `border: 1px dashed var(--border-strong)`, break icon (`bi-cup-hot` / `bi-pause-circle`), label and times.
   - On Saturday, periods 1–4 + recess + lunch are rendered (6 entries total); period 7 is omitted cleanly.

---

## 3. Caveats

1. **Parent Portal Code Sharing**:
   - The Schedule tab design is intentionally parameterized by `childId` (`renderScheduleTabContent(childId)`). While Milestone 3 targets the Student Portal (`childId: 1`), keeping this function parameterized allows Milestone 4 (Parent Portal Schedule tab) to call the exact same renderer with `state.childId` (Sok Chanreaksa or Sok Chanpanha).
2. **Dynamic Period Status**:
   - `PM_HELPERS.periodStatus` only activates when `dayKey === "tue"` because the demo clock is locked to Tuesday 11:35 AM. When the user switches to Mon, Wed, Thu, Fri, or Sat, all rows are rendered in neutral state without "Now" or "Next" pills, which is the expected behavior specified in §5c and §5e.
3. **Reduced Motion & Accessibility**:
   - All interactive card elements (`data-action="tab"`, `data-action="day"`) must include visible `:focus-visible` outlines matching `.pm-app :focus-visible` to satisfy accessibility requirements.

---

## 4. Conclusion & Complete Implementation Blueprints

Below are the complete, drop-in replacement templates and styling specifications for the implementer agent:

### 4.1 CSS Extensions for `phone-mockup/phone-mockup.css`

Append these targeted utility classes before the `@keyframes` section in `phone-mockup/phone-mockup.css`:

```css
/* ============================================================================
   7. STUDENT PORTAL: HOME & SCHEDULE COMPONENTS (M3)
   ============================================================================ */

/* Stat Overview Cards (2-column clickable cards) */
.pm-stat-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.pm-stat-card:hover {
  border-color: var(--brand-primary);
  background: var(--surface-subtle);
  transform: translateY(-1px);
}

.pm-stat-card:active {
  transform: scale(0.98);
}

/* Day Strip Selector (6-day Mon-Sat horizontal grid) */
.pm-day-strip {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}

.pm-day-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 2px 7px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  user-select: none;
}

.pm-day-btn:hover:not(.active) {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
}

.pm-day-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: #ffffff;
  box-shadow: var(--shadow-xs);
}

.pm-day-btn .pm-day-name {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
}

.pm-day-btn.active .pm-day-name {
  opacity: 0.9;
  font-weight: 600;
}

.pm-day-btn .pm-day-num {
  font-size: 15px;
  font-weight: 700;
  margin-top: 3px;
  line-height: 1.1;
}

.pm-day-btn .pm-day-dot {
  position: absolute;
  bottom: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--brand-primary);
}

/* Schedule Period Row */
.pm-period-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f4f7;
  transition: background 0.15s ease;
}

.pm-period-row:last-child {
  border-bottom: none;
}

.pm-period-row.now {
  background: var(--brand-primary-light);
}

.pm-period-time {
  width: 52px;
  flex-shrink: 0;
}

.pm-period-time .start {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.15;
}

.pm-period-time .end {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.15;
  margin-top: 2px;
}

.pm-period-row.past .pm-period-time .start,
.pm-period-row.past .pm-period-title {
  color: var(--text-muted);
}

.pm-period-bar {
  width: 3px;
  height: 32px;
  border-radius: 2px;
  margin: 0 12px 0 8px;
  flex-shrink: 0;
  background: var(--border-subtle);
}

.pm-period-bar.now {
  background: var(--brand-primary);
}

.pm-period-bar.next {
  background: #027a48;
}

.pm-period-bar.past {
  background: #d0d5dd;
}

.pm-period-content {
  flex: 1;
  min-width: 0;
}

.pm-period-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pm-period-meta {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Schedule Break Row */
.pm-break-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #fcfcfd;
  border-top: 1px dashed var(--border-subtle);
  border-bottom: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

.pm-break-row.now {
  background: var(--brand-primary-light);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  font-weight: 600;
}
```

---

### 4.2 Drop-in Template: `renderHomeTabContent()`

In `phone-mockup/mockup-app.js`, replace the `if (state.tab === "home") { ... }` block inside `renderStudentTabContent()` with:

```javascript
    if (state.tab === "home") {
      const periods = (D.timetables && D.timetables[1] && D.timetables[1].tue) || [];
      const nowPeriod = periods.find((p) => PM_HELPERS.periodStatus(p, "tue", periods) === "now");
      const nextPeriod = periods.find((p) => PM_HELPERS.periodStatus(p, "tue", periods) === "next");
      const lastGate = state.gateLog
        .filter((e) => e.childId === 1 && e.date === "2026-11-03")
        .slice()
        .sort((a, b) => PM_HELPERS.toMin(a.time) - PM_HELPERS.toMin(b.time))
        .pop();

      const heroStatus = nowPeriod
        ? `${nowPeriod.label || nowPeriod.subject} · ${nowPeriod.start} – ${nowPeriod.end}`
        : "Lunch break · 11:00 – 13:30";

      const heroGate = lastGate
        ? `${lastGate.type === "out" ? "Checked out" : "Checked in"} ${lastGate.time} · ${lastGate.gate}`
        : "Checked out 11:32 AM · Gate 01";

      const avgScore = PM_HELPERS.calcAverage(rep.subjects);

      return `
        <!-- Hero Card -->
        <div class="pm-card-hero" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="pm-pill" style="background: rgba(255, 255, 255, 0.2); color: #ffffff; border: 0; font-weight: 600;">
              <i class="bi bi-clock" style="margin-right: 4px;"></i> ${esc(heroStatus)}
            </span>
            <span style="font-size: 11.5px; opacity: 0.85;">Sen Sok HQ</span>
          </div>

          <div style="font-size: 14px; opacity: 0.95; display: flex; align-items: center; gap: 6px; margin-bottom: 14px;">
            <i class="bi bi-box-arrow-right"></i> ${esc(heroGate)}
          </div>

          <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 12px 0 10px;">

          <div>
            <div style="font-size: 11.5px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
              Next class
            </div>
            <div style="font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 2px;">
              ${esc(nextPeriod ? nextPeriod.subject : "Biology")}
            </div>
            <div style="font-size: 13px; opacity: 0.88;">
              ${nextPeriod ? `${esc(nextPeriod.start)} – ${esc(nextPeriod.end)} · ${esc(nextPeriod.room)} · ${esc(nextPeriod.teacher)}` : "13:30 – 14:45 · Room B-201 · Mr. Vannak Keo"}
            </div>
          </div>
        </div>

        <!-- Quick Stat Overview Cards (2-column grid linking to tabs) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px;">
          <div class="pm-stat-card" data-action="tab" data-tab="attendance" role="button" tabindex="0" aria-label="Go to Attendance">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Attendance</span>
              <i class="bi bi-chevron-right" style="font-size: 11px; color: var(--text-muted);"></i>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: #027a48; margin: 4px 0 2px;">
              ${att.rate}%
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              This term (${att.present} Present)
            </div>
          </div>

          <div class="pm-stat-card" data-action="tab" data-tab="report" role="button" tabindex="0" aria-label="Go to Report">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Average score</span>
              <i class="bi bi-chevron-right" style="font-size: 11px; color: var(--text-muted);"></i>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: var(--brand-primary); margin: 4px 0 2px;">
              ${avgScore}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              GPA ${esc(rep.gpa)} · Rank ${esc(rep.rank)}
            </div>
          </div>
        </div>

        <!-- Today's Schedule Mini-List -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 18px 4px 8px;">
          <span class="pm-section-label" style="margin: 0;">Today's classes</span>
          <button
            type="button"
            data-action="tab"
            data-tab="schedule"
            style="background: none; border: 0; color: var(--brand-primary); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: 2px;"
          >
            See all <i class="bi bi-chevron-right" style="font-size: 11px;"></i>
          </button>
        </div>

        <div class="pm-card pm-list" style="margin-bottom: 20px;">
          ${periods.map((p) => {
            const status = PM_HELPERS.periodStatus(p, "tue", periods);
            const isBreak = p.isBreak;

            if (isBreak) {
              return `
                <div class="pm-break-row ${status === 'now' ? 'now' : ''}">
                  <i class="bi ${p.label.toLowerCase().includes('lunch') ? 'bi-cup-hot' : 'bi-pause-circle'}" style="margin-right: 6px; font-size: 13px;"></i>
                  <span style="flex: 1;">${esc(p.label)} · ${esc(p.start)} – ${esc(p.end)}</span>
                  ${status === 'now' ? '<span class="pm-pill brand">Now</span>' : ''}
                </div>
              `;
            }

            return `
              <div class="pm-period-row ${status === 'now' ? 'now' : status === 'past' ? 'past' : ''}">
                <div class="pm-period-time">
                  <div class="start">${esc(p.start)}</div>
                  <div class="end">${esc(p.end)}</div>
                </div>
                <div class="pm-period-bar ${status === 'now' ? 'now' : status === 'next' ? 'next' : status === 'past' ? 'past' : ''}"></div>
                <div class="pm-period-content">
                  <div class="pm-period-title">${esc(p.subject)}</div>
                  <div class="pm-period-meta">${esc(p.room)} · ${esc(p.teacher)}</div>
                </div>
                <div style="flex-shrink: 0; margin-left: 8px;">
                  ${status === 'now'
                    ? '<span class="pm-pill brand">Now</span>'
                    : status === 'next'
                      ? '<span class="pm-pill neutral">Next</span>'
                      : status === 'past'
                        ? '<i class="bi bi-check-circle-fill" style="color: #12b76a; font-size: 16px;"></i>'
                        : ''}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Announcements Card -->
        <div class="pm-section-label" style="margin-top: 16px;">Announcements</div>
        ${D.announcement ? `
          <div class="pm-card" style="padding: 14px 16px; margin-bottom: 16px; display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: var(--brand-primary-light); color: var(--brand-primary); display: grid; place-items: center; font-size: 18px; flex-shrink: 0;">
              <i class="bi ${esc(D.announcement.icon || 'bi-flag-fill')}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 14.5px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                ${esc(D.announcement.title)}
              </div>
              <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.35;">
                ${esc(D.announcement.body)}
              </div>
            </div>
          </div>
        ` : ''}
      `;
    }
```

---

### 4.3 Drop-in Template: `renderScheduleTabContent()`

In `phone-mockup/mockup-app.js`, replace the `if (state.tab === "schedule") { ... }` block inside `renderStudentTabContent()` with:

```javascript
    if (state.tab === "schedule") {
      const weekDays = [
        { key: "mon", label: "Mon", date: 2, isToday: false },
        { key: "tue", label: "Tue", date: 3, isToday: true },
        { key: "wed", label: "Wed", date: 4, isToday: false },
        { key: "thu", label: "Thu", date: 5, isToday: false },
        { key: "fri", label: "Fri", date: 6, isToday: false },
        { key: "sat", label: "Sat", date: 7, isToday: false },
      ];

      const periods = (D.timetables && D.timetables[1] && D.timetables[1][state.day]) || [];

      return `
        <!-- Weekday Selector Day Strip (Mon–Sat, 2–7 Nov 2026) -->
        <div class="pm-day-strip" role="tablist" aria-label="Schedule Weekday Selector">
          ${weekDays.map((d) => {
            const isActive = state.day === d.key;
            return `
              <button
                type="button"
                class="pm-day-btn ${isActive ? 'active' : ''}"
                data-action="day"
                data-day="${d.key}"
                role="tab"
                aria-selected="${isActive}"
                aria-label="${d.label}, ${d.date} November 2026"
              >
                <span class="pm-day-name">${d.label}</span>
                <span class="pm-day-num">${d.date}</span>
                ${!isActive && d.isToday ? '<span class="pm-day-dot" aria-label="Today"></span>' : ''}
              </button>
            `;
          }).join("")}
        </div>

        <!-- Day Timetable Period List -->
        <div class="pm-card pm-list" style="margin-bottom: 20px;">
          ${periods.length > 0 ? periods.map((p) => {
            const status = PM_HELPERS.periodStatus(p, state.day, periods);
            const isBreak = p.isBreak;

            if (isBreak) {
              return `
                <div class="pm-break-row ${status === 'now' ? 'now' : ''}">
                  <i class="bi ${p.label.toLowerCase().includes('lunch') ? 'bi-cup-hot' : 'bi-pause-circle'}" style="margin-right: 6px; font-size: 13px;"></i>
                  <span style="flex: 1;">${esc(p.label)} · ${esc(p.start)} – ${esc(p.end)}</span>
                  ${status === 'now' ? '<span class="pm-pill brand">Now</span>' : ''}
                </div>
              `;
            }

            return `
              <div class="pm-period-row ${status === 'now' ? 'now' : status === 'past' ? 'past' : ''}">
                <div class="pm-period-time">
                  <div class="start">${esc(p.start)}</div>
                  <div class="end">${esc(p.end)}</div>
                </div>
                <div class="pm-period-bar ${status === 'now' ? 'now' : status === 'next' ? 'next' : status === 'past' ? 'past' : ''}"></div>
                <div class="pm-period-content">
                  <div class="pm-period-title">${esc(p.subject)}</div>
                  <div class="pm-period-meta">${esc(p.teacher)} · ${esc(p.room)}</div>
                </div>
                <div style="flex-shrink: 0; margin-left: 8px;">
                  ${status === 'now'
                    ? '<span class="pm-pill brand">Now</span>'
                    : status === 'next'
                      ? '<span class="pm-pill neutral">Next</span>'
                      : status === 'past'
                        ? '<i class="bi bi-check-circle-fill" style="color: #12b76a; font-size: 16px;"></i>'
                        : ''}
                </div>
              </div>
            `;
          }).join("") : `
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
              No classes scheduled for this day.
            </div>
          `}
        </div>
      `;
    }
```

---

### 4.4 App Shell Header Alignment (`renderAppShell()`)

In `phone-mockup/mockup-app.js`, lines 1390–1397 should align to:

```javascript
    if (isStudent) {
      const child = (D.children && D.children[1]) || { first: "Chanreaksa", nameEn: "Sok Chanreaksa", classShort: "G12-A", className: "Grade 12-A · Science Track" };
      if (state.tab === "home") {
        eyebrow = `${(D.demoNow && D.demoNow.dateLabel) || 'Tuesday, 3 November'} · ${child.classShort} · High School`;
        title = `${(D.demoNow && D.demoNow.greeting) || 'Good morning'}, ${esc(child.first)}`;
      } else if (state.tab === "schedule") {
        eyebrow = esc(child.className || "Grade 12-A · Science Track");
        title = "Schedule";
      } else if (state.tab === "report") { ... }
```

---

## 5. Verification Method

1. **Syntax Integrity**:
   ```bash
   node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
   ```
   *Expected*: Exit code 0, no syntax errors.

2. **Automated Data Oracle Execution**:
   ```bash
   node tests/test-oracle.js
   ```
   *Expected*: All 7 checks pass, verifying:
   - Lunch break as `"Now"` at 11:35 AM demo clock.
   - Biology as `"Next"` at 13:30.
   - Saturday timetable contains exactly 6 periods (period 7 omitted).
   - Grade averages (91.9) and attendance rates (96.3%).

3. **Master Suite Run**:
   ```bash
   ./tests/test-all.sh
   ```
   *Expected*: Exit code 0 across Syntax, Route, and Oracle suites.

4. **DOM Assertions (Post-Implementation Verification)**:
   - `document.querySelector(".pm-card-hero")`: contains text "Lunch break · 11:00 – 13:30", "Checked out 11:32 AM · Gate 01", and "Biology".
   - `document.querySelectorAll("[data-action='tab'][data-tab='attendance']")`: exists on the Attendance stat card.
   - `document.querySelectorAll("[data-action='tab'][data-tab='report']")`: exists on the Average score stat card.
   - `document.querySelectorAll(".pm-day-btn")`: length equals 6 (Mon–Sat with numbers 2–7).
   - `document.querySelector(".pm-day-btn.active")`: active day matches `state.day`.
   - `document.querySelector(".pm-day-btn[data-day='tue'] .pm-day-dot")`: present when non-active, hidden when active.
   - On Saturday (`data-day="sat"`): `document.querySelectorAll(".pm-period-row, .pm-break-row")` length equals 6.

5. **Invalidation Conditions**:
   - Hardcoded strings in hero card that do not reflect timetable breaks or gate log events.
   - Stat cards lacking `data-action="tab"` event delegation.
   - Any period 7 row appearing on Saturday.
   - Weekday strip lacking dates 2–7 or the Tuesday indicator dot.
