# Milestone 4 Technical Investigation & Architecture Report
## Parent Portal: Alerts, Push Notification Banner, Scores & Schedule Tabs

- **Author**: `explorer_m4_2` (Teamwork Explorer)
- **Target Audience**: Orchestrator, Worker agents (`worker_m4_1`), Reviewers, Challengers, Auditors
- **Date**: 2026-11-03
- **Status**: Complete & Verified

---

## 1. Observation

### 1.1 Existing Implementation Baseline
Direct inspection of the current phone mockup codebase revealed the following exact baseline states:

1. **Simulated Push Banner Implementation** (`phone-mockup/mockup-app.js:2182-2218`):
   - Currently, `scheduleParentPushBanner()` is triggered 1500ms after parent login:
     ```javascript
     function scheduleParentPushBanner() {
       if (state.pushTimer) clearTimeout(state.pushTimer);
       state.pushTimer = setTimeout(() => {
         if (state.view !== "app" || state.role !== "parent") return;
         if (document.querySelector(".pm-push")) return;
         const brand = applyBrand();
         const banner = document.createElement("div");
         banner.className = "pm-push";
         banner.setAttribute("data-action", "push-open");
         banner.setAttribute("role", "alert");
         banner.innerHTML = `
           <div class="pm-push-icon" style="background: var(--brand-primary); color: #fff;">
             <i class="bi bi-mortarboard-fill"></i>
           </div>
           <div style="flex: 1; min-width: 0;">
             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
               <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">${esc(brand.name)}</span>
               <span style="font-size: 11px; color: var(--text-muted);">now</span>
             </div>
             <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">Check-out alert</div>
             <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.35;">
               Sok Chanreaksa left campus at 11:32 AM via Gate 01 · Lunch break exit
             </div>
           </div>
         `;
         const appEl = document.getElementById("pmApp");
         if (appEl) { appEl.appendChild(banner); }
         setTimeout(() => { if (banner.parentNode) banner.remove(); }, 6000);
       }, 1500);
     }
     ```
   - **Issues observed**:
     - **Re-render wipeout**: If user taps anywhere triggering `render()` within the 6 seconds, `appEl.innerHTML = renderAppShell()` wipes `#pmApp`, destroying the banner DOM node prematurely.
     - **Missing swipe-up / dismiss without navigation**: Tapping anywhere on `.pm-push` triggers `push-open` (navigating to Alerts). There is no swipe-up handler or dedicated close button to dismiss without navigation.
     - **Missing slide-up exit animation**: When auto-dismissing after 6s or being dismissed, the banner disappears abruptly without `.pm-push-out` / `pmPushOut` CSS transition.
     - **Content mismatch with specification**: Title displays `"Check-out alert"` instead of `"Gate Alert: Sok Chanreaksa"`, and body displays `"Sok Chanreaksa left campus at 11:32 AM via Gate 01 · Lunch break exit"` instead of `"Checked out at 11:32 AM via Gate 01 (Lunch break)"`.

2. **Alerts Tab Implementation** (`phone-mockup/mockup-app.js:1807-1850`):
   - Currently, `renderParentTabContent()` renders a flat, ungrouped list of gate logs:
     ```javascript
     if (state.tab === "alerts") {
       const logs = state.gateLog.filter(l => {
         if (state.alertFilter === "all") return true;
         return l.childId === state.alertFilter;
       });
       return `
         <div class="pm-chips" role="tablist" aria-label="Alert Filters">
           <button type="button" class="pm-chip ${state.alertFilter === 'all' ? 'active' : ''}" data-action="alert-filter" data-filter="all">All Alerts</button>
           <button type="button" class="pm-chip ${state.alertFilter === 1 ? 'active' : ''}" data-action="alert-filter" data-filter="1">Chanreaksa</button>
           <button type="button" class="pm-chip ${state.alertFilter === 11 ? 'active' : ''}" data-action="alert-filter" data-filter="11">Chanpanha</button>
         </div>
         <div class="pm-card pm-list">
           ${logs.map(l => ...)}
         </div>
       `;
     }
     ```
   - **Issues observed**:
     - **No Date Grouping**: Events across multiple days (3 Nov, 2 Nov, 31 Oct, 30 Oct, 28 Oct) are dumped into a single list rather than grouped by date (`Today, 3 Nov 2026` vs `Yesterday, 2 Nov 2026`).
     - **Missing Chip Counts**: Filter chips say `All Alerts`, `Chanreaksa`, `Chanpanha` instead of `[All (3)]`, `[Chanreaksa (2)]`, `[Chanpanha (1)]`.
     - **Missing Settings Card**: The `"Instant gate notifications"` card with child notification toggles specified in `implementation_plan.md §5e` is missing.
     - **Unread state clearing timing**: In `onAction` (`mockup-app.js:2261-2263`), `state.gateLog.forEach((g) => { g.unread = false; });` clears `unread` immediately before `render()`, preventing the newly opened Alerts view from highlighting the unread event row before clearing the tab badge.

3. **Scores Tab Implementation in Parent Mode** (`phone-mockup/mockup-app.js:1852-1882`):
   - Currently, `renderParentTabContent()` for `scores` uses a minimal stub:
     ```javascript
     if (state.tab === "scores") {
       const rep = (D.reports && D.reports[state.childId]) || { gpa: "0.0", rank: "-", subjects: [] };
       const avg = PM_HELPERS.calcAverage(rep.subjects);
       return `
         <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
           <button type="button" class="pm-chip active" data-action="sheet" data-sheet="child">
             <i class="bi bi-person-fill"></i> ${esc(activeChild.nameEn)} <i class="bi bi-chevron-down"></i>
           </button>
         </div>
         <div class="pm-card" style="padding: 16px; text-align: center; margin-bottom: 16px;">
           <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Midterm Average Score</div>
           <div style="font-size: 34px; font-weight: 800; color: var(--brand-primary); margin: 4px 0 2px;">${avg}</div>
           <div style="font-size: 13px; color: var(--text-secondary);">GPA ${esc(rep.gpa)} · Rank ${esc(rep.rank)}</div>
         </div>
         ...
       `;
     }
     ```
   - **Issues observed**:
     - It does NOT reuse `renderReportContent(state.childId)`!
     - It misses the circular progress ring (conic-gradient 91.9 / 91.0), letter grade pills, progress bars, recent assessments, homeroom comment card, and PDF download button.
     - In `renderReportContent(childId)` (`mockup-app.js:1141-1145`), the teacher initials and details are hardcoded:
       `<div class="pm-avatar" ...> SC </div>`
       `<div style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">${esc(rep.teacher || "Dr. Sokha Chan")}</div>`
       `<div style="font-size: 12px; color: var(--text-muted);">Homeroom Advisor · Department of Mathematics</div>`
       When `childId = 11` (Chanpanha), `rep.teacher` is `"Ms. Bopha Pich"`, but the avatar displays `"SC"` instead of `"BP"`, and the department is hardcoded to Mathematics!

4. **Schedule Tab Implementation in Parent Mode** (`phone-mockup/mockup-app.js:1884-1918`):
   - `renderScheduleContent` does not exist as a standalone modular function; schedule logic is duplicated inside `renderStudentTabContent()` (`lines 1347-1427`) and simplified in `renderParentTabContent()` (`lines 1884-1918`).
   - The Parent Schedule tab currently lacks the Mon–Sat day strip (`.pm-day-strip`), the vertical timeline layout (`.pm-period-time`, `.pm-period-bar`), break rows (`.pm-break-row`), and the "Now" / "Next" status pills.
   - For Child 11 (`Grade 8-B / G7-IEP`):
     - Mon–Fri has 7 periods + 2 breaks (9 entries).
     - Saturday has 4 periods + 1 recess (5 entries), ending at 11:20 AM with no lunch break.
     - On Tuesday at 11:35 AM demo clock, Lunch break (11:20–12:30) is "Now", and Computing (12:30–13:20) is "Next".

---

## 2. Logic Chain

### 2.1 Simulated iOS Push Notification Banner Architecture

```
Parent Login (handleSignIn)
   │
   ▼ 700ms loading
state.view = "app", state.tab = "home", state.role = "parent"
   │
   ▼ 1500ms delay
scheduleParentPushBanner()
   │
   ├─► Set state.pushBanner = { visible: true, dismissing: false }
   │   and append .pm-push inside .pm-screen (above pmApp or inside pmApp root)
   │
   ▼ Slide down animation (pmPushIn: -120% -> 0)
┌────────────────────────────────────────────────────────────────────────┐
│  .pm-push (Frosted Glass, Blur 24px, Rounded 20px, Shadow MD)          │
│  [Grabber / Swipe handle]                                              │
│  [Graduation Icon]  [SCHOOL MANAGEMENT]                          [now] │
│                     Gate Alert: Sok Chanreaksa                         │
│                     Checked out at 11:32 AM via Gate 01 (Lunch break)  │
│                     [X Close Button]                                   │
└────────────────────────────────────────────────────────────────────────┘
   │
   ├─► User Taps Banner (data-action="push-open")
   │      │
   │      ├─► Dismiss banner immediately
   │      ├─► Navigate to tab="alerts"
   │      ├─► Clear state.gateLog unread flags (unread = false)
   │      └─► Re-render App (tab bar badge vanishes)
   │
   ├─► User Swipes Up / Taps Close (data-action="push-dismiss")
   │      │
   │      ├─► Slide up exit animation (pmPushOut: 0 -> -130%)
   │      ├─► Remove banner from DOM
   │      └─► Remain on current view (DO NOT navigate)
   │
   └─► Auto-Dismiss Timeout (7000ms)
          │
          ├─► Trigger slide-up exit animation (pmPushOut)
          └─► Remove banner from DOM
```

#### Detailed DOM Structure:
```html
<div
  class="pm-push"
  id="pmPushBanner"
  data-action="push-open"
  role="alert"
  aria-label="Gate check-out alert notification"
>
  <div class="pm-push-grabber" aria-hidden="true"></div>
  <div class="pm-push-content">
    <div class="pm-push-icon" aria-hidden="true">
      <i class="bi bi-mortarboard-fill"></i>
    </div>
    <div class="pm-push-body">
      <div class="pm-push-meta">
        <span class="pm-push-app">School Management</span>
        <span class="pm-push-time">now</span>
      </div>
      <div class="pm-push-title">Gate Alert: Sok Chanreaksa</div>
      <div class="pm-push-desc">
        Checked out at 11:32 AM via Gate 01 (Lunch break)
      </div>
    </div>
    <button
      type="button"
      class="pm-push-close"
      data-action="push-dismiss"
      aria-label="Dismiss notification"
    >
      <i class="bi bi-x"></i>
    </button>
  </div>
</div>
```

#### Scoped CSS Architecture:
```css
/* Push Banner Geometry & Frosted Glass */
.pm-push {
  position: absolute;
  top: 58px;
  left: 10px;
  right: 10px;
  z-index: 65;
  padding: 10px 14px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 10px 30px -5px rgba(16, 24, 40, 0.18), 0 4px 10px -2px rgba(16, 24, 40, 0.08);
  cursor: pointer;
  animation: pmPushIn 0.45s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
}

.pm-push.dismissing {
  animation: pmPushOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
  pointer-events: none;
}

.pm-push-grabber {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d0d5dd;
  margin: 0 auto 8px auto;
}

.pm-push-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.pm-push-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--brand-primary);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 119, 182, 0.3);
}

.pm-push-body {
  flex: 1;
  min-width: 0;
}

.pm-push-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.pm-push-app {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.pm-push-time {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

.pm-push-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.25;
  margin-bottom: 2px;
}

.pm-push-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.35;
}

.pm-push-close {
  background: none;
  border: 0;
  color: var(--text-muted);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  margin-left: 2px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.pm-push-close:hover,
.pm-push-close:active {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-main);
}

@keyframes pmPushIn {
  from {
    transform: translateY(-130%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pmPushOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-130%);
    opacity: 0;
  }
}
```

#### Re-render Safe Management:
To ensure that re-rendering `#pmApp` does not abruptly discard the push banner:
- Either render `#pmPushContainer` inside `.pm-screen` (adjacent to `#pmApp`, matching `.pm-island` and `.pm-statusbar` isolation), OR
- Manage banner state declaratively:
  ```javascript
  // In state:
  state.pushBanner = {
    visible: false,
    dismissing: false,
    autoTimer: null
  };
  ```
  And in `renderAppShell()`:
  ```javascript
  ${state.pushBanner && state.pushBanner.visible ? renderPushBannerHtml() : ""}
  ```
  This guarantees 100% reactive rendering without losing the element during state updates!

---

### 2.2 Alerts Tab Architecture

```
Parent Alerts Tab (state.tab === "alerts")
   │
   ├─► Unread Badge Clearing:
   │   Entering Alerts tab sets all gateLog[].unread = false
   │   Tab bar badge count becomes 0 -> badge hidden
   │
   ├─► 1. Instant Gate Notifications Settings Card
   │      - Chanreaksa (G12-A) + iOS Toggle (Checked)
   │      - Chanpanha (G7-IEP) + iOS Toggle (Checked)
   │      - Toggle click -> Toast feedback
   │
   ├─► 2. Filter Chips
   │      - [All (3)]          (data-filter="all")
   │      - [Chanreaksa (2)]   (data-filter="1")
   │      - [Chanpanha (1)]    (data-filter="11")
   │
   └─► 3. Grouped Event Feed
          ├─► Today, 3 Nov 2026
          │      ├─ Chanreaksa · Check-out · 11:32 AM · Gate 01 · Lunch break exit [Exit]
          │      ├─ Chanreaksa · Check-in  · 07:12 AM · Gate 01 · RFID card        [Entry]
          │      └─ Chanpanha  · Check-in  · 07:12 AM · Gate 01 · RFID card        [Entry]
          │
          ├─► Yesterday, 2 Nov 2026
          │      ├─ Chanpanha  · Check-out · 03:16 PM · Gate 02 · School Bus B    [Exit]
          │      └─ Chanpanha  · Check-in  · 07:15 AM · Gate 01 · RFID card        [Entry]
          │
          └─► Previous Days (Sat 31 Oct, Fri 30 Oct, Wed 28 Oct...)
```

#### Detailed Layout & Components:
1. **Notification Settings Card**:
   ```html
   <div class="pm-card" style="padding: 14px 16px; margin-bottom: 14px;">
     <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
       <div style="display: flex; align-items: center; gap: 8px;">
         <i class="bi bi-bell-fill" style="color: var(--brand-primary); font-size: 15px;"></i>
         <span style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">Instant gate notifications</span>
       </div>
       <span class="pm-pill success" style="font-size: 10px;">Active</span>
     </div>

     <div style="display: flex; flex-direction: column; gap: 10px;">
       <div style="display: flex; justify-content: space-between; align-items: center;">
         <div style="display: flex; align-items: center; gap: 10px;">
           <div class="pm-avatar" style="width: 30px; height: 30px; font-size: 11px; background: var(--brand-primary);">SC</div>
           <div>
             <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Chanreaksa</div>
             <div style="font-size: 11px; color: var(--text-muted);">Grade 12-A</div>
           </div>
         </div>
         <label class="pm-switch">
           <input type="checkbox" checked data-action="toggle-notify" data-child="1">
           <span class="pm-switch-slider"></span>
         </label>
       </div>

       <div style="height: 1px; background: var(--border-subtle);"></div>

       <div style="display: flex; justify-content: space-between; align-items: center;">
         <div style="display: flex; align-items: center; gap: 10px;">
           <div class="pm-avatar" style="width: 30px; height: 30px; font-size: 11px; background: #7a5af8;">SP</div>
           <div>
             <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Chanpanha</div>
             <div style="font-size: 11px; color: var(--text-muted);">Grade 7-IEP</div>
           </div>
         </div>
         <label class="pm-switch">
           <input type="checkbox" checked data-action="toggle-notify" data-child="11">
           <span class="pm-switch-slider"></span>
         </label>
       </div>
     </div>
   </div>
   ```

2. **Dynamic Filter Chips**:
   ```javascript
   const todayLogs = state.gateLog.filter(l => l.date === D.demoNow.iso);
   const todayAll = todayLogs.length; // 3
   const todayC1 = todayLogs.filter(l => l.childId === 1).length; // 2
   const todayC11 = todayLogs.filter(l => l.childId === 11).length; // 1
   ```
   HTML:
   ```html
   <div class="pm-chips" role="tablist" aria-label="Alert Filters">
     <button type="button" class="pm-chip ${state.alertFilter === 'all' ? 'active' : ''}" data-action="alert-filter" data-filter="all">
       All (${todayAll})
     </button>
     <button type="button" class="pm-chip ${state.alertFilter === 1 ? 'active' : ''}" data-action="alert-filter" data-filter="1">
       Chanreaksa (${todayC1})
     </button>
     <button type="button" class="pm-chip ${state.alertFilter === 11 ? 'active' : ''}" data-action="alert-filter" data-filter="11">
       Chanpanha (${todayC11})
     </button>
   </div>
   ```

3. **Date Grouping & Event Cards**:
   Grouping algorithm:
   ```javascript
   const grouped = {};
   logs.forEach(l => {
     if (!grouped[l.date]) grouped[l.date] = [];
     grouped[l.date].push(l);
   });
   // Render each date group
   ```
   Card HTML template:
   ```html
   <div class="pm-alert-group">
     <div class="pm-section-label" style="margin: 16px 4px 8px;">
       ${dayHeading}
     </div>
     <div class="pm-card pm-list">
       ${groupLogs.map(l => {
         const child = D.children[l.childId] || {};
         const isExit = l.type === "out";
         return `
           <div class="pm-row pm-alert-row ${l.unread ? 'unread' : ''}">
             <div class="pm-alert-avatar" style="background: ${child.color || 'var(--brand-primary)'};">
               ${child.initials}
             </div>
             <div class="pm-alert-icon ${isExit ? 'exit' : 'entry'}">
               <i class="bi ${isExit ? 'bi-box-arrow-right' : 'bi-box-arrow-in-right'}"></i>
             </div>
             <div style="flex: 1; min-width: 0;">
               <div style="display: flex; align-items: center; gap: 6px;">
                 <span style="font-size: 14px; font-weight: 700; color: var(--text-main);">
                   ${esc(child.nameEn)}
                 </span>
               </div>
               <div style="font-size: 12px; color: var(--text-muted); margin-top: 1px;">
                 ${esc(l.gate)} · ${esc(l.method)}
                 ${l.note ? `<span class="pm-alert-note">${esc(l.note)}</span>` : ""}
               </div>
             </div>
             <div style="text-align: right; flex-shrink: 0; margin-left: 8px;">
               <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main); font-variant-numeric: tabular-nums;">
                 ${esc(l.time)}
               </div>
               <span class="pm-pill ${isExit ? 'danger' : 'success'}" style="font-size: 10px; padding: 1px 7px; margin-top: 2px;">
                 ${isExit ? 'Exit' : 'Entry'}
               </span>
             </div>
           </div>
         `;
       }).join("")}
     </div>
   </div>
   ```

4. **CSS Styles for Alerts & Switches**:
   ```css
   /* iOS Style Toggle Switch */
   .pm-switch {
     position: relative;
     display: inline-block;
     width: 44px;
     height: 26px;
     flex-shrink: 0;
   }

   .pm-switch input {
     opacity: 0;
     width: 0;
     height: 0;
   }

   .pm-switch-slider {
     position: absolute;
     cursor: pointer;
     inset: 0;
     background-color: #e4e7ec;
     transition: 0.22s cubic-bezier(0.32, 0.72, 0, 1);
     border-radius: 999px;
   }

   .pm-switch-slider::before {
     position: absolute;
     content: "";
     height: 20px;
     width: 20px;
     left: 3px;
     bottom: 3px;
     background-color: #ffffff;
     transition: 0.22s cubic-bezier(0.32, 0.72, 0, 1);
     border-radius: 50%;
     box-shadow: 0 1px 4px rgba(16, 24, 40, 0.2);
   }

   .pm-switch input:checked + .pm-switch-slider {
     background-color: #12b76a;
   }

   .pm-switch input:checked + .pm-switch-slider::before {
     transform: translateX(18px);
   }

   /* Alerts Feed Elements */
   .pm-alert-avatar {
     width: 32px;
     height: 32px;
     border-radius: 50%;
     color: #ffffff;
     font-size: 11.5px;
     font-weight: 700;
     display: grid;
     place-items: center;
     flex-shrink: 0;
     margin-right: 2px;
   }

   .pm-alert-icon {
     width: 26px;
     height: 26px;
     border-radius: 7px;
     display: grid;
     place-items: center;
     font-size: 13px;
     flex-shrink: 0;
     margin-right: 10px;
   }

   .pm-alert-icon.entry {
     background: #ecfdf3;
     color: #027a48;
   }

   .pm-alert-icon.exit {
     background: #fef3f2;
     color: #d92d20;
   }

   .pm-alert-note {
     display: inline-block;
     background: #f2f4f7;
     color: var(--text-secondary);
     padding: 1px 6px;
     border-radius: 4px;
     font-size: 11px;
     margin-left: 4px;
   }

   .pm-alert-row.unread {
     background: var(--brand-primary-light);
     border-left: 3px solid var(--brand-primary);
   }
   ```

---

### 2.3 Scores & Schedule Tabs for Parent Mode

#### 1. Child Context Indicator (Subheader):
To provide clear orientation of which child's academic data is currently being inspected:
```html
<div class="pm-child-context-bar">
  <div class="pm-child-context-info">
    <div class="pm-child-avatar-mini" style="background: ${child.color || 'var(--brand-primary)'};">
      ${child.initials}
    </div>
    <div class="pm-child-context-details">
      <span class="pm-child-context-viewing">Viewing</span>
      <span class="pm-child-context-name">${esc(child.nameEn)}</span>
      <span class="pm-child-context-class">· ${esc(child.classShort)}</span>
    </div>
  </div>
  <button
    type="button"
    class="pm-btn-change-child"
    data-action="sheet"
    data-sheet="child"
    aria-label="Change selected student"
  >
    <span>Change</span>
    <i class="bi bi-chevron-down"></i>
  </button>
</div>
```

CSS:
```css
.pm-child-context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  margin-top: -6px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-xs);
}

.pm-child-context-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.pm-child-avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.pm-child-context-details {
  font-size: 13.5px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pm-child-context-viewing {
  color: var(--text-muted);
  font-size: 12px;
  margin-right: 4px;
}

.pm-child-context-name {
  font-weight: 700;
  color: var(--text-main);
}

.pm-child-context-class {
  color: var(--text-secondary);
  font-weight: 500;
}

.pm-btn-change-child {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: #ffffff;
  color: var(--text-main);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.pm-btn-change-child:hover,
.pm-btn-change-child:active {
  background: #f2f4f7;
  border-color: var(--border-subtle);
}
```

#### 2. Dynamic Teacher Avatar Initials & Faculty Remarks in `renderReportContent`:
Currently `mockup-app.js:1141` hardcodes `"SC"` and Dr. Sokha Chan.
We implement a dynamic teacher helper:
```javascript
function getTeacherMeta(teacherName) {
  if (!teacherName) return { initials: "T", dept: "Faculty Advisor" };
  const name = teacherName.trim();
  // Strip salutations
  const clean = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, "").trim();
  const parts = clean.split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : clean.slice(0, 2).toUpperCase();

  let dept = "Homeroom Advisor";
  if (name.includes("Sokha Chan")) {
    dept = "Homeroom Advisor · Department of Mathematics";
  } else if (name.includes("Bopha Pich")) {
    dept = "Homeroom Advisor · Cambridge IEP";
  }
  return { initials, dept };
}
```
In `renderReportContent(childId)`:
```javascript
const tMeta = getTeacherMeta(rep.teacher);
```
HTML for Teacher Card:
```html
<div class="pm-avatar" style="width: 40px; height: 40px; font-size: 14px; background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover)); color: #ffffff; flex-shrink: 0; box-shadow: var(--shadow-xs);">
  ${tMeta.initials}
</div>
<div style="flex: 1; min-width: 0;">
  <div style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">${esc(rep.teacher)}</div>
  <div style="font-size: 12px; color: var(--text-muted);">${esc(tMeta.dept)}</div>
</div>
```
- **Child 1 (Chanreaksa)**: `rep.teacher` = `"Dr. Sokha Chan"` -> initials `SC`, dept `Homeroom Advisor · Department of Mathematics`.
- **Child 11 (Chanpanha)**: `rep.teacher` = `"Ms. Bopha Pich"` -> initials `BP`, dept `Homeroom Advisor · Cambridge IEP`.

#### 3. Reusable Schedule Rendering & Child 11 Period Matrix:
Extract `renderScheduleContent(childId)` so it can be called identically from both Student mode (`childId = 1`) and Parent mode (`childId = state.childId`).

Child 11 Period Schedule Matrix Verification:
- **Child 11 Weekday Timetable (Mon–Fri)**:
  - P1: 07:30–08:20
  - P2: 08:25–09:15
  - Morning recess: 09:15–09:35 (Break)
  - P3: 09:35–10:25
  - P4: 10:30–11:20
  - Lunch break: 11:20–12:30 (Break)
  - P5: 12:30–13:20
  - P6: 13:25–14:15
  - P7: 14:20–15:10
  *Total*: 7 teaching periods + 2 breaks = 9 timeline rows.
- **Child 11 Saturday Timetable (Sat)**:
  - P1: 07:30–08:20 (Checkpoint Practice)
  - P2: 08:25–09:15 (Science Practical)
  - Morning recess: 09:15–09:35 (Break)
  - P3: 09:35–10:25 (Sports & PE)
  - P4: 10:30–11:20 (Sports & PE)
  *Total*: 4 teaching periods + 1 recess = 5 period entries total. Ends at 11:20 AM. NO lunch break!
- **Child 11 Tuesday 11:35 AM Demo Clock Evaluation**:
  - `demoMin = 695` (11:35 AM).
  - P1–P4 end at or before 11:20 AM (`eMin <= 680 <= 695`) -> status: `"past"`.
  - Lunch break is 11:20–12:30 (`680 <= 695 < 750`) -> status: `"now"`!
  - Next teaching period after 11:35 is P5 Computing starting at 12:30 (`sMin = 750 > 695`) -> status: `"next"`!
  - P6 & P7 start after 13:20 -> status: `"upcoming"`.

---

## 3. Caveats

1. **In-Memory Mutability Only**:
   All state changes (`state.childId`, `state.gateLog.forEach(g => g.unread = false)`, `state.pushBanner`) are in-memory. Zero `localStorage` writes or persistence across reloads.
2. **Push Banner Dismissal Persistence**:
   Once dismissed (either via tap or close), the push banner should not reappear in the same session unless the user signs out and signs in again as parent.
3. **Child 11 Class Short Name**:
   `mockup-data.js` and `js/mock-data.js` define Child 11's `classShort` as `"G7-IEP"` and `className` as `"Grade 7 · Cambridge Emerald"`. The dispatch prompt mentions `"G8-B"`. In our design, the Child Context Subheader dynamically references `child.classShort`, guaranteeing it renders correctly regardless of whether the seed data specifies G7-IEP or G8-B.
4. **CSS Token Scoping**:
   All selectors use the `.pm-` prefix and strictly leverage site design tokens (`var(--brand-primary)`, `var(--brand-primary-light)`, `var(--border-subtle)`, `var(--surface-card)`). Never inject Bootstrap classes or reset existing site styles.

---

## 4. Conclusion

1. **Push Banner**:
   A dedicated frosted glass banner `.pm-push` slides down 1500ms post-parent login, displays `"Gate Alert: Sok Chanreaksa"` and `"Checked out at 11:32 AM via Gate 01 (Lunch break)"`, supports immediate navigation on tap, swipe-up/close dismiss without navigation, and 7-second auto-dismiss with `pmPushOut` slide-up animation.
2. **Alerts Tab**:
   Fully incorporates:
   - Dynamic tab badge showing unread count (`1`), cleared on tab visit or push banner tap.
   - Top notification settings card with iOS switches.
   - Three filter chips with count indicators: `[All (3)]`, `[Chanreaksa (2)]`, `[Chanpanha (1)]`.
   - Date-grouped gate event feed (`Today, 3 Nov 2026` vs `Yesterday, 2 Nov 2026`) with entry/exit pill badges and RFID/bus metadata.
3. **Scores & Schedule Tabs**:
   - Reuses `renderReportContent(childId)` and `renderScheduleContent(childId)` seamlessly between Student and Parent modes.
   - Pinned Child Context Bar (`Viewing Sok Chanreaksa · G12-A` vs `Viewing Sok Chanpanha · G7-IEP`) with a "Change" button opening `.pm-sheet`.
   - Dynamically derives teacher avatar initials (`BP` for Ms. Bopha Pich, `SC` for Dr. Sokha Chan).
   - Verifies Child 11's schedule matrix (5 entries on Saturday ending at 11:20 AM without lunch; Tuesday 11:35 Now = Lunch break, Next = Computing).

---

## 5. Verification Method

To verify these specifications independently:

1. **Syntax Validation**:
   ```bash
   node --check phone-mockup/mockup-data.js
   node --check phone-mockup/mockup-app.js
   ```
2. **Automated Headless Data Oracle**:
   ```bash
   node tests/test-oracle.js
   ```
   Validates grade averages (91.9 & 91.0), timetable periods, half-day bounds, and campus duration.
3. **Headless Chrome / Playwright / CDP Checks**:
   - **Push Banner**:
     - Login as parent (`par_vibol`).
     - Wait 1.6s -> verify `.pm-push` is present in DOM with text `"Gate Alert: Sok Chanreaksa"`.
     - Tap `.pm-push` -> verify active tab is `'alerts'` and `.pm-tab-badge` is removed.
   - **Alerts Feed**:
     - Verify filter chips have text `All (3)`, `Chanreaksa (2)`, `Chanpanha (1)`.
     - Filter by Chanreaksa -> verify only 2 today events shown.
   - **Scores & Schedule Tabs**:
     - Switch child to ID 11 -> verify Child Context Subheader says `"Viewing Sok Chanpanha"`.
     - In Scores tab, verify Average ring shows `91.0` and teacher avatar shows `BP` with name `"Ms. Bopha Pich"`.
     - In Schedule tab, verify Saturday shows only 5 entries ending at 11:20 AM, and Tuesday 11:35 AM highlights Lunch break as "Now" and Computing as "Next".
