# Handoff Report: Milestone 4 (Parent Portal: Child Switcher & Parent Home Tab)

**Agent**: `explorer_m4_1`  
**Milestone**: Milestone 4 (Parent Portal: Child Switcher & Parent Home Tab)  
**Date**: 2026-11-03  
**Status**: Investigation Complete · Technical Design Ready for Implementation  

---

## 1. Observation

Direct code observations from the current codebase:

### 1.1 State Management in `phone-mockup/mockup-app.js`
In `phone-mockup/mockup-app.js` lines 458–474:
```javascript
const state = {
  view: "login",              // "login" | "app"
  role: "student",            // "student" | "parent"
  tab: "home",
  childId: 1,                 // parent's active child
  day: D.demoNow.dayKey,      // schedule day
  month: "2026-11",           // attendance month ("2026-10" | "2026-11")
  alertFilter: "all",         // "all" | 1 | 11
  payFilter: "due",           // "due" | "paid"
  sheet: null,                // null | "account" | "child" | "pay" | "qr"
  pay: null,                  // { invoiceId, method, step: "choose"|"processing"|"success", receiptNo }
  invoices: JSON.parse(JSON.stringify(D.invoices)),
  gateLog: JSON.parse(JSON.stringify(D.gateLog)),
  signingIn: false,
  pushTimer: null,
};
```
- **Observation**: `state.activeChildId` is currently absent from `state`; only `state.childId` exists.
- **Observation**: In `phone-mockup/mockup-app.js` lines 2287–2296:
```javascript
case "child": {
  const cId = Number(actEl.dataset.child);
  if (cId) {
    state.childId = cId;
    state.sheet = null;
    if (state.tab === "home") state.tab = "scores";
    render();
  }
  break;
}
```
Line 2292 forces `if (state.tab === "home") state.tab = "scores";`, which violates the Milestone 4 requirement: *"Selecting a child closes the sheet and re-renders current view (Home, Scores, Schedule, Payments)"*.

### 1.2 Header Presentation in `phone-mockup/mockup-app.js`
In `phone-mockup/mockup-app.js` lines 2017–2034:
```javascript
    } else {
      if (state.tab === "home") {
        eyebrow = (D.demoNow && D.demoNow.dateLabel) || "Tuesday, 3 November";
        title = "Parent Portal";
      } else if (state.tab === "alerts") {
...
```
And header container (lines 2038–2046):
```javascript
        <header class="pm-header">
          <div>
            <div class="pm-eyebrow">${esc(eyebrow)}</div>
            <h1 class="pm-title">${title}</h1>
          </div>
          <button type="button" class="pm-avatar" data-action="sheet" data-sheet="account" aria-label="Open Account Menu">
            ${initials}
          </button>
        </header>
```
- **Observation**: Parent Home displays `"Parent Portal"` instead of the required personalized greeting `"Good morning, Vibol!"`.
- **Observation**: There is no child switcher trigger pill in the header. The only child switcher button currently in the codebase is hardcoded in the Scores tab (line 1858) and Schedule tab (line 1902).

### 1.3 Parent Home Tab Layout in `phone-mockup/mockup-app.js`
In `phone-mockup/mockup-app.js` lines 1746–1805:
- **Child status cards** (lines 1759–1789):
  - Displays name, short class, and campus location label (`c1Status.label`).
  - Completely omits the **Term Attendance Rate** (`96.3%` for child 1, `100.0%` for child 11).
  - Only provides a single button `"View Scores (91.9)"`; lacks quick navigation to `"Schedule"`.
  - Employs heavy inline styles (`style="display: flex; ... border-left: 4px solid ..."`) rather than dedicated `.pm-*` CSS classes.
- **Payment card** (lines 1791–1803):
  - Displays `"Total Outstanding Tuition"` and `"Next: INV-2026-0618 ($45.00 Overdue)"`.
  - Lacks structured visual hierarchy for the **urgent overdue invoice** ($45.00 with badge) and **upcoming tuition** ($1,305.00 due 10/15 Nov).
- **Latest Gate Alerts Widget**:
  - **Completely absent**. Line 1804 immediately terminates the Home tab content without rendering any gate events.

### 1.4 Gate Log Chronological Ordering in `phone-mockup/mockup-data.js`
In `phone-mockup/mockup-data.js` lines 242–249:
```javascript
      // Today, Tue 3 Nov
      { childId: 1,  date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-11-03", type: "out", time: "11:32 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit", unread: true },
```
- **Observation**: Today's gate events are ordered chronologically ascending in the raw array (07:12 AM before 11:32 AM). Simply taking `gateLog.slice(0, 3)` would show the morning events first instead of the latest 11:32 AM checkout.

---

## 2. Logic Chain

1. **Active Child State Invariant**:
   - The Milestone 4 specification requires `state.activeChildId` (defaulting to 1).
   - Existing code references `state.childId`.
   - *Reasoning*: Synchronize `state.activeChildId` and `state.childId` so that both properties always hold the same child ID (`1` or `11`). Any action targeting either property will update both.

2. **Header Presentation Architecture**:
   - In Parent mode, the greeting must be `"Good morning, Vibol!"` (or dynamically `${D.demoNow.greeting}, ${D.parent.nameEn.split(" ")[1]}!`) with eyebrow `"Tuesday, 3 November"`.
   - The active child switcher trigger pill (`.pm-child-switcher`) must sit prominently in the header area, showing the active child's avatar dot/initials, name, and a downward chevron (`bi-chevron-down`).
   - The account avatar button (`SV`) remains fixed at the top right for opening the account sheet.
   - *Reasoning*: Positioning the child switcher trigger pill directly below the greeting title inside `.pm-header-titles` or as an inline header pill ensures it fits cleanly within the iPhone's 353px inner content width without overflowing into the avatar button.

3. **Bottom Sheet Selector Contract**:
   - Tapping the child switcher trigger pill opens `.pm-sheet` with `state.sheet = "child"`.
   - The sheet lists both children from `D.parent.childIds` (`[1, 11]`):
     - Sok Chanreaksa: G12-A, color `var(--brand-primary)`, initials `SC`.
     - Sok Chanpanha: G7-IEP / G8-B, color `#7a5af8`, initials `SP`.
   - The active child is indicated with a check icon (`bi-check-circle-fill`).
   - Clicking a child emits `data-action="child" data-child="${c.id}"`:
     - Sets `state.activeChildId = id` and `state.childId = id`.
     - Closes the sheet (`state.sheet = null`).
     - Re-renders current view (`render()`) **without forced tab switching**.

4. **Parent Home Tab Component Hierarchy**:
   - **Greeting & Date Eyebrow**: Handled by `.pm-header`.
   - **Children Status Cards**: Render two distinct cards `.pm-child-card` for Chanreaksa and Chanpanha:
     - Header: Avatar dot, child name, class badge, and campus status pill (`Off campus · Out 11:32 AM` vs `On campus · In 07:12 AM`).
     - Metrics grid: Attendance rate (`96.3%` vs `100.0%`), Midterm average (`91.9` vs `91.0`), and GPA (`3.85` vs `3.78`).
     - Quick navigation actions: Dedicated action buttons for `Scores` and `Schedule`.
   - **Next Payment Due Card**: Render `.pm-payment-card`:
     - Highlights urgent overdue invoice: `INV-2026-0618` ($45.00 overdue badge).
     - Highlights upcoming tuition: `INV-2026-0631` ($1,305.00 due 10 Nov / 7 days).
     - Displays total family outstanding balance ($1,710.00).
     - Primary button navigating to Payments tab.
   - **Latest Gate Alerts Widget**: Render `.pm-gate-widget`:
     - Header with "Latest Gate Alerts" and "See all" action link.
     - Top 3 gate events sorted chronologically descending (newest first).
     - Each row displays child indicator, in/out icon, event text, gate/RFID details, and time.

---

## 3. Detailed Technical Design & Specifications

### 3.1 State Machine Specification
```javascript
// State extensions in phone-mockup/mockup-app.js
const state = {
  view: "login",
  role: "student",
  tab: "home",
  activeChildId: 1,           // Primary active child state (Milestone 4)
  childId: 1,                 // Maintained in strict 1:1 sync with activeChildId
  day: D.demoNow.dayKey,
  month: "2026-11",
  alertFilter: "all",
  payFilter: "due",
  sheet: null,                // "account" | "child" | "pay" | "qr"
  pay: null,
  invoices: JSON.parse(JSON.stringify(D.invoices)),
  gateLog: JSON.parse(JSON.stringify(D.gateLog)),
  signingIn: false,
  pushTimer: null,
};

function setActiveChild(childId) {
  const id = Number(childId);
  if (id === 1 || id === 11) {
    state.activeChildId = id;
    state.childId = id;
  }
}
```

### 3.2 Header Presentation (DOM & Layout)
Inside `renderAppShell()`:
```html
<header class="pm-header pm-header-parent">
  <div class="pm-header-titles">
    <div class="pm-eyebrow">Tuesday, 3 November</div>
    <h1 class="pm-title">Good morning, Vibol!</h1>
    <!-- Child Switcher Trigger Pill in Header -->
    <div class="pm-header-switcher-wrap">
      <button
        type="button"
        class="pm-child-switcher"
        data-action="sheet"
        data-sheet="child"
        aria-label="Switch active child"
      >
        <span class="pm-child-switcher-dot" style="background: ${activeChild.color || 'var(--brand-primary)'};">
          ${activeChild.initials || 'SC'}
        </span>
        <span class="pm-child-switcher-name">${esc(activeChild.nameEn)}</span>
        <i class="bi bi-chevron-down"></i>
      </button>
    </div>
  </div>
  <button
    type="button"
    class="pm-avatar"
    data-action="sheet"
    data-sheet="account"
    aria-label="Open Account Menu"
  >
    SV
  </button>
</header>
```

### 3.3 Child Selector Bottom Sheet (`.pm-sheet`)
Inside `renderChildSheet()`:
```html
<div class="pm-sheet-backdrop" data-action="close-sheet"></div>
<div class="pm-sheet" role="dialog" aria-modal="true" aria-label="Select Child">
  <div class="pm-sheet-header">
    <h2 class="pm-sheet-title">Select Child</h2>
    <button
      type="button"
      class="pm-sheet-close"
      data-action="close-sheet"
      aria-label="Close sheet"
    >
      <i class="bi bi-x-lg"></i>
    </button>
  </div>

  <div class="pm-child-select-list">
    ${[1, 11].map(cId => {
      const c = D.children[cId];
      const isSelected = state.activeChildId === c.id;
      return `
        <div
          class="pm-child-select-card ${isSelected ? 'active' : ''}"
          data-action="child"
          data-child="${c.id}"
          tabindex="0"
          role="button"
          aria-pressed="${isSelected}"
        >
          <div class="pm-avatar" style="background: ${c.color};">
            ${c.initials}
          </div>
          <div class="pm-child-select-info">
            <div class="pm-child-select-name">${esc(c.nameEn)}</div>
            <div class="pm-child-select-meta">${esc(c.className)} · ${esc(c.campus)}</div>
          </div>
          ${isSelected 
            ? '<i class="bi bi-check-circle-fill pm-child-check"></i>' 
            : '<i class="bi bi-circle pm-child-uncheck"></i>'}
        </div>
      `;
    }).join("")}
  </div>

  <button type="button" class="pm-btn-primary" data-action="close-sheet">
    Done
  </button>
</div>
```

### 3.4 Parent Home Tab Components (DOM Structure)

#### A. Children Status Cards
```html
<div class="pm-section-label">My Children</div>
<div class="pm-children-cards">
  ${[1, 11].map(cId => {
    const c = D.children[cId];
    const status = PM_HELPERS.childToday(cId, state.gateLog);
    const att = PM_HELPERS.attendanceSummary(cId, D);
    const rep = D.reports[cId] || { gpa: "0.0", subjects: [] };
    const avg = PM_HELPERS.calcAverage(rep.subjects);

    return `
      <div class="pm-child-card child-${cId}">
        <div class="pm-child-card-header">
          <div class="pm-child-card-profile">
            <div class="pm-avatar pm-avatar-sm" style="background: ${c.color};">
              ${c.initials}
            </div>
            <div>
              <div class="pm-child-card-name">${esc(c.nameEn)}</div>
              <div class="pm-child-card-sub">${esc(c.classShort)} · ${esc(c.className.split("·")[1] || c.className)}</div>
            </div>
          </div>
          <span class="pm-pill ${status.onCampus ? 'success' : 'warning'}">
            <i class="bi ${status.onCampus ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'}"></i>
            ${esc(status.label)}
          </span>
        </div>

        <div class="pm-child-card-metrics">
          <div class="pm-child-metric">
            <div class="pm-child-metric-val">${att.rate}%</div>
            <div class="pm-child-metric-lbl">Attendance</div>
          </div>
          <div class="pm-child-metric-divider"></div>
          <div class="pm-child-metric">
            <div class="pm-child-metric-val">${avg}</div>
            <div class="pm-child-metric-lbl">Midterm Avg</div>
          </div>
          <div class="pm-child-metric-divider"></div>
          <div class="pm-child-metric">
            <div class="pm-child-metric-val">${esc(rep.gpa)}</div>
            <div class="pm-child-metric-lbl">GPA Score</div>
          </div>
        </div>

        <div class="pm-child-card-actions">
          <button
            type="button"
            class="pm-quick-btn"
            data-action="child-scores"
            data-child="${c.id}"
          >
            <i class="bi bi-bar-chart-line"></i> View Scores (${avg})
          </button>
          <button
            type="button"
            class="pm-quick-btn"
            data-action="child-schedule"
            data-child="${c.id}"
          >
            <i class="bi bi-calendar-week"></i> Schedule
          </button>
        </div>
      </div>
    `;
  }).join("")}
</div>
```

#### B. Next Payment Due Card
```html
<div class="pm-section-label">Tuition & Invoicing</div>
<div class="pm-card pm-payment-card">
  ${overdueInvoice ? `
    <!-- Urgent Overdue Invoice Callout -->
    <div class="pm-payment-overdue-alert">
      <div class="pm-payment-overdue-left">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div>
          <div class="pm-payment-overdue-title">1 Overdue Invoice</div>
          <div class="pm-payment-overdue-sub">${esc(overdueInvoice.invoiceNo)} · ${esc(overdueInvoice.title)}</div>
        </div>
      </div>
      <span class="pm-pill danger">${PM_HELPERS.fmtMoney(overdueInvoice.amount)} · Overdue</span>
    </div>
  ` : ''}

  <!-- Upcoming Next Payment -->
  <div class="pm-payment-body">
    <div class="pm-payment-eyebrow">Next Payment Due</div>
    <div class="pm-payment-amount-row">
      <div class="pm-payment-amount">${PM_HELPERS.fmtMoney(nextInvoice ? nextInvoice.amount : totalOut)}</div>
      <span class="pm-pill warning">
        <i class="bi bi-clock"></i> Due in ${daysUntilDue} days
      </span>
    </div>
    <div class="pm-payment-desc">
      ${esc(nextInvoice ? nextInvoice.title : 'Tuition & Academic Fees')}
      ${nextChild ? ` · ${esc(nextChild.first)}` : ''}
    </div>
  </div>

  <div class="pm-payment-footer">
    <div class="pm-payment-total-note">
      Total Family Outstanding: <strong>${PM_HELPERS.fmtMoney(totalOut)}</strong>
    </div>
    <button type="button" class="pm-btn-primary" data-action="tab" data-tab="payments">
      <i class="bi bi-credit-card"></i> Manage Payments
    </button>
  </div>
</div>
```

#### C. Latest Gate Alerts Widget
```html
<div class="pm-section-header">
  <span class="pm-section-label" style="margin: 0;">Latest Gate Alerts</span>
  <button type="button" class="pm-link-btn" data-action="tab" data-tab="alerts">
    See all <i class="bi bi-chevron-right"></i>
  </button>
</div>

<div class="pm-card pm-list pm-gate-widget">
  ${recentGateEvents.map(event => {
    const child = D.children[event.childId] || {};
    const isIn = event.type === "in";
    return `
      <div class="pm-row pm-gate-feed-row" data-action="tab" data-tab="alerts">
        <div class="pm-gate-feed-icon ${isIn ? 'in' : 'out'}">
          <i class="bi ${isIn ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'}"></i>
        </div>
        <div class="pm-gate-feed-info">
          <div class="pm-gate-feed-title">
            <span class="pm-gate-feed-name">${esc(child.first || child.nameEn)}</span>
            <span>${isIn ? 'checked in' : 'checked out'}</span>
            <span class="pm-pill ${isIn ? 'success' : 'warning'} pm-pill-xs">
              ${isIn ? 'In' : 'Out'}
            </span>
          </div>
          <div class="pm-gate-feed-meta">
            ${esc(event.gate)} · ${esc(event.method)}${event.note ? ` · ${esc(event.note)}` : ''}
          </div>
        </div>
        <div class="pm-gate-feed-time">
          <div class="pm-gate-feed-clock">${esc(event.time)}</div>
          <div class="pm-gate-feed-day">Today</div>
        </div>
      </div>
    `;
  }).join("")}
</div>
```

### 3.5 CSS Architecture (`phone-mockup/phone-mockup.css`)
Add the following scoped rules to `phone-mockup/phone-mockup.css`:

```css
/* ============================================================================
   9. PARENT PORTAL: CHILD SWITCHER & HOME TAB COMPONENTS (M4)
   ============================================================================ */

/* Header Child Switcher Trigger Pill */
.pm-header-parent {
  align-items: flex-start;
}

.pm-header-switcher-wrap {
  margin-top: 6px;
}

.pm-child-switcher {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px 4px 5px;
  border-radius: 999px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xs);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.pm-child-switcher:hover {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
}

.pm-child-switcher:active {
  transform: scale(0.98);
}

.pm-child-switcher-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
  line-height: 1;
}

.pm-child-switcher-name {
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pm-child-switcher i {
  font-size: 11px;
  color: var(--text-muted);
}

/* Child Selector Modal Sheet */
.pm-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pm-sheet-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--text-main);
}

.pm-sheet-close {
  background: none;
  border: 0;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: grid;
  place-items: center;
}

.pm-child-select-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.pm-child-select-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border-subtle);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.pm-child-select-card:hover {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
}

.pm-child-select-card.active {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
}

.pm-child-select-info {
  flex: 1;
  min-width: 0;
}

.pm-child-select-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.pm-child-select-meta {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pm-child-check {
  color: var(--brand-primary);
  font-size: 20px;
}

.pm-child-uncheck {
  color: #d0d5dd;
  font-size: 20px;
}

/* Children Status Cards (Home) */
.pm-children-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.pm-child-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-xs);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.pm-child-card.child-1 {
  border-left: 4px solid var(--brand-primary);
}

.pm-child-card.child-11 {
  border-left: 4px solid #7a5af8;
}

.pm-child-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.pm-child-card-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-avatar-sm {
  width: 34px;
  height: 34px;
  font-size: 12px;
}

.pm-child-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.pm-child-card-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.pm-child-card-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.pm-child-metric {
  flex: 1;
  text-align: center;
}

.pm-child-metric-val {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.1;
}

.pm-child-metric-lbl {
  font-size: 10.5px;
  color: var(--text-muted);
  margin-top: 3px;
  font-weight: 500;
}

.pm-child-metric-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
}

.pm-child-card-actions {
  display: flex;
  gap: 8px;
}

.pm-quick-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pm-quick-btn:hover {
  background: var(--surface-subtle);
  border-color: var(--border-strong);
  color: var(--text-main);
}

/* Next Payment Due Card */
.pm-payment-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 16px;
  margin-bottom: 18px;
}

.pm-payment-overdue-alert {
  background: #fef3f2;
  border: 1px solid #fee4e2;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pm-payment-overdue-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pm-payment-overdue-left i {
  color: #d92d20;
  font-size: 16px;
  flex-shrink: 0;
}

.pm-payment-overdue-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #b42318;
}

.pm-payment-overdue-sub {
  font-size: 11px;
  color: #7a271a;
  margin-top: 1px;
}

.pm-payment-body {
  margin-bottom: 14px;
}

.pm-payment-eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.pm-payment-amount-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 2px;
}

.pm-payment-amount {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.pm-payment-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.pm-payment-footer {
  padding-top: 12px;
  border-top: 1px solid #f2f4f7;
}

.pm-payment-total-note {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.pm-payment-total-note strong {
  color: var(--text-main);
}

/* Latest Gate Alerts Widget */
.pm-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 4px 8px;
}

.pm-link-btn {
  background: none;
  border: 0;
  color: var(--brand-primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: opacity 0.15s ease;
}

.pm-link-btn:hover {
  opacity: 0.8;
}

.pm-gate-widget {
  margin-bottom: 16px;
}

.pm-gate-feed-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.pm-gate-feed-row:hover {
  background: #f8fafc;
}

.pm-gate-feed-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 16px;
  flex-shrink: 0;
  margin-right: 10px;
}

.pm-gate-feed-icon.in {
  background: #ecfdf3;
  color: #027a48;
}

.pm-gate-feed-icon.out {
  background: #fffaeb;
  color: #b54708;
}

.pm-gate-feed-info {
  flex: 1;
  min-width: 0;
}

.pm-gate-feed-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-main);
}

.pm-gate-feed-name {
  color: var(--text-main);
}

.pm-pill-xs {
  font-size: 10px;
  padding: 1px 6px;
  font-weight: 600;
}

.pm-gate-feed-meta {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pm-gate-feed-time {
  text-align: right;
  flex-shrink: 0;
}

.pm-gate-feed-clock {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.pm-gate-feed-day {
  font-size: 11px;
  color: var(--text-muted);
}
```

---

## 4. Event Delegation Contracts

| Action Attribute | Parameters / Context | State Mutation | DOM Effect |
|---|---|---|---|
| `data-action="sheet"` | `data-sheet="child"` | `state.sheet = "child"` | Renders `.pm-sheet` modal with child switcher cards. |
| `data-action="close-sheet"` | Triggered by backdrop, close button, or "Done" | `state.sheet = null` | Removes `.pm-sheet` modal and returns focus to trigger. |
| `data-action="child"` | `data-child="1"` or `data-child="11"` | `state.activeChildId = +id; state.childId = +id; state.sheet = null;` | Re-renders current active tab (Home, Scores, Schedule, Payments) with selected child data. **Does NOT navigate away from Home.** |
| `data-action="child-scores"` | `data-child="1"` or `data-child="11"` | `state.activeChildId = +id; state.childId = +id; state.tab = "scores";` | Directly transitions to Scores tab for the chosen child. Resets `pm-body.scrollTop` to 0. |
| `data-action="child-schedule"` | `data-child="1"` or `data-child="11"` | `state.activeChildId = +id; state.childId = +id; state.tab = "schedule";` | Directly transitions to Schedule tab for the chosen child. Resets `pm-body.scrollTop` to 0. |
| `data-action="tab"` | `data-tab="payments"` or `data-tab="alerts"` | `state.tab = targetTab; state.sheet = null;` | Switches main tab view and clears unread badges where applicable. |

---

## 5. Exact Data Mappings from `PM_DATA`

### 5.1 Parent Profile & Children Entities
- `D.parent`:
  - `id`: `201`
  - `nameEn`: `"Sok Vibol"`
  - `salutation`: `"Mr. Vibol"`
  - `initials`: `"SV"`
  - Greeting format: `"Good morning, Vibol!"` (or `"Good morning, Mr. Vibol!"`)
- `D.children[1]` (Sok Chanreaksa):
  - `nameEn`: `"Sok Chanreaksa"`, `first`: `"Chanreaksa"`, `initials`: `"SC"`
  - `classShort`: `"G12-A"`, `className`: `"Grade 12-A · Science Track"`
  - `color`: `"var(--brand-primary)"`
  - Campus status: `PM_HELPERS.childToday(1, state.gateLog)` → `{ onCampus: false, label: "Off campus · Out 11:32 AM", time: "11:32 AM" }`
  - Term attendance: `PM_HELPERS.attendanceSummary(1, D)` → `{ present: 24, late: 2, excused: 1, absent: 0, schoolDays: 27, rate: 96.3 }`
  - Midterm score average: `PM_HELPERS.calcAverage(D.reports[1].subjects)` → `"91.9"`
  - GPA: `D.reports[1].gpa` → `"3.85"`
- `D.children[11]` (Sok Chanpanha):
  - `nameEn`: `"Sok Chanpanha"`, `first`: `"Chanpanha"`, `initials`: `"SP"`
  - `classShort`: `"G7-IEP"` (or `"G8-B"` depending on data seed), `className`: `"Grade 7 · Cambridge Emerald"`
  - `color`: `"#7a5af8"`
  - Campus status: `PM_HELPERS.childToday(11, state.gateLog)` → `{ onCampus: true, label: "On campus · In 07:12 AM", time: "07:12 AM" }`
  - Term attendance: `PM_HELPERS.attendanceSummary(11, D)` → `{ present: 27, late: 0, excused: 0, absent: 0, schoolDays: 27, rate: 100.0 }`
  - Midterm score average: `PM_HELPERS.calcAverage(D.reports[11].subjects)` → `"91.0"`
  - GPA: `D.reports[11].gpa` → `"3.78"`

### 5.2 Financial Invoices & Overdue Logic
- Total family balance: `PM_HELPERS.outstanding(null, state.invoices)` → `$1,710.00`
- Urgent overdue invoice: `state.invoices.find(i => i.status === "Overdue")`
  - `invoiceNo`: `"INV-2026-0618"`
  - `amount`: `45.00`
  - `title`: `"BacII Mock Exam & Materials Fee"`
  - `dueDate`: `"2026-10-30"` (4 days overdue relative to demo clock `2026-11-03`)
- Upcoming tuition invoice: `state.invoices.find(i => i.status === "Due" && i.id === 4)`
  - `invoiceNo`: `"INV-2026-0631"`
  - `amount`: `1305.00`
  - `title`: `"Cambridge IEP Term 2 Tuition (Sibling −10%)"`
  - `dueDate`: `"2026-11-10"` (`PM_HELPERS.daysBetween("2026-11-03", "2026-11-10")` = `7 days`)

### 5.3 Latest Gate Alerts Sorting & Extraction
Deterministic sorting query for gate feed:
```javascript
const recentGateEvents = state.gateLog
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date) || PM_HELPERS.toMin(b.time) - PM_HELPERS.toMin(a.time))
  .slice(0, 3);
```
Yields:
1. `2026-11-03 11:32 AM`: Sok Chanreaksa (`childId: 1`), `type: "out"`, Gate 01, Note: `"Lunch break exit"`
2. `2026-11-03 07:12 AM`: Sok Chanpanha (`childId: 11`), `type: "in"`, Gate 01, Method: `"RFID card"`
3. `2026-11-03 07:12 AM`: Sok Chanreaksa (`childId: 1`), `type: "in"`, Gate 01, Method: `"RFID card"`

---

## 6. Caveats

1. **Child 11 Grade/Class Designation**:
   In `mockup-data.js`, child 11 is Grade 7 · Cambridge Emerald (`classShort: "G7-IEP"`), while the prompt note mentions `(ID 11, G8-B)`. The implementation must reference `D.children[11].classShort` and `D.children[11].className` dynamically rather than hardcoding either string.
2. **Upcoming Tuition Due Date**:
   In `mockup-data.js`, `INV-2026-0631` has `dueDate: "2026-11-10"`, while the prompt mentions `due 15 Nov`. Using dynamic relative date formatting (`PM_HELPERS.daysBetween(D.demoNow.iso, inv.dueDate)` = 7 days) ensures the rendered UI remains 100% data-driven and resistant to changes in seed data.
3. **Active Child State Dual Property**:
   To satisfy both the original implementation plan (`state.childId`) and the Milestone 4 specification (`state.activeChildId`), both properties should be initialized in state and kept strictly synchronized.
4. **Gate Log Chronological Sorting**:
   Because `PM_DATA.gateLog` lists events in daytime sequence (07:12 AM before 11:32 AM), a descending sort by date and minute offset is required before taking the top 3 items.

---

## 7. Conclusion

The existing Phone Mockup code provides a solid foundational shell, but the Parent Portal Home tab currently lacks the required fidelity:
- Missing attendance rates on child status cards.
- Missing urgent overdue badge for `INV-2026-0618` on the payment card.
- Complete absence of the Latest Gate Alerts widget.
- Incomplete header presentation lacking the child switcher trigger pill.
- Premature tab transition bug on child selection when on the Home tab.

Implementing the technical architecture documented above will achieve complete specification parity for Milestone 4 without breaking any existing Milestone 1–3 invariants.

---

## 8. Verification Method

To independently verify the implementation, the implementer and reviewers should execute the following test plan:

### 8.1 Automated Headless Tests
1. **Syntax Validation**:
   ```bash
   node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
   ```
2. **Unified Test Suite**:
   ```bash
   bash tests/test-all.sh
   ```
3. **Dedicated Milestone 4 Adversarial Test Suite** (`tests/test-adversarial-m4-parent.js`):
   Create and execute a Node test verifying:
   - Initial `state.activeChildId === 1` and `state.childId === 1`.
   - Selecting child 11 updates `state.activeChildId === 11` and `state.childId === 11`.
   - Attendance rate oracle: Child 1 = `96.3%`, Child 11 = `100.0%`.
   - Midterm average score oracle: Child 1 = `91.9`, Child 11 = `91.0`.
   - Financial overdue calculation: exactly 1 invoice overdue totaling `$45.00`.
   - Gate feed ordering: top event is `11:32 AM` out for Chanreaksa.
   - String evaluation of `renderAppShell()` in Parent Home tab containing:
     - `"Good morning, Vibol!"`
     - `"Sok Chanreaksa"` inside `.pm-child-switcher`
     - `"96.3%"` and `"100.0%"` inside child cards
     - `"INV-2026-0618"` and `"$45.00"` inside `.pm-payment-overdue-alert`
     - `"Latest Gate Alerts"` and 3 gate event rows.

### 8.2 Invalidation Conditions
The implementation will be considered INVALID if:
- Selecting a child from the bottom sheet while on Home forces navigation to Scores (`state.tab = "scores"`).
- Term attendance rates (96.3% / 100.0%) are missing from the Home children cards.
- The overdue invoice `INV-2026-0618` ($45.00) is not highlighted on the payment card.
- The Latest Gate Alerts widget does not display the 11:32 AM checkout event first.
- `state.activeChildId` is undefined or unsynchronized with `state.childId`.
- Browser console errors are thrown or `localStorage` is accessed.
