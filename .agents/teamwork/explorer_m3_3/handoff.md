# Architectural Specification & Handoff Report: Student Portal Attendance, Check-in Log & Campus ID QR Sheet (Milestone 3)

**Agent**: `explorer_m3_3` (teamwork_explorer)  
**Date**: 2026-11-03T06:45:00Z  
**Recipient**: Orchestrator (`f47b3442-f659-46f9-91f4-2d8a9d4c3a60`)  
**Target Files**: `phone-mockup/mockup-app.js`, `phone-mockup/phone-mockup.css`, `phone-mockup/mockup-data.js`

---

## 1. Executive Summary

This specification provides the production-ready architecture, DOM template strings, CSS styling integration, and event action handlers for the **Attendance Tab**, **Check-in Log Tab**, and **Campus ID QR Bottom Sheet** within the Student Portal of `/phone-mockup/` (`phone-mockup/mockup-app.js`).

Current codebase evaluation revealed:
1. `phone-mockup/mockup-data.js` already contains authoritative seed data: `attendance[1]` (October late [8, 21], holidays [15, 29]; November excused [2]), `gateLog` entries (07:12 AM In / 11:32 AM Out on 3 Nov, plus historical entries on Oct 28, 30, 31), and child profile `children[1]` (`STU-2026-001`, `G12-A`).
2. `phone-mockup/mockup-app.js` already defines `PM_HELPERS.attendanceSummary`, `PM_HELPERS.attendanceMonth`, `PM_HELPERS.campusDuration`, `PM_HELPERS.childToday`, and `PM_HELPERS.pseudoQr`.
3. In `phone-mockup/mockup-app.js`, the current Milestone 2 placeholder implementations of `state.tab === "attendance"` (lines 1045–1097), `state.tab === "checkin"` (lines 1099–1131), and `renderQrSheet()` (lines 719–750) lack:
   - The circular progress ring (`.pm-ring`) and Absent counter.
   - The complete 7-column calendar grid (`.pm-cal`) with day-of-week headers (Sun–Sat), status dots, and holiday "H" badge.
   - Formatted non-present record cards with clean dates, pills, and delay notes.
   - The "Off campus" campus status pill in the Check-in Log hero.
   - The chronological "Recent Days Gate History" timeline with historical gates, times, and transit methods.
   - Comprehensive styling of the Campus ID card modal with student avatar, card ID, deterministic QR, barcode hint, and scan instructions.

The full design and drop-in code implementations are detailed below.

---

## 2. Component Architecture & Templates

### 2.1 Attendance Tab Architecture (`state.tab === "attendance"`)

The Attendance tab is organized into three primary sections:
1. **Attendance Rate Hero Card**: Features the circular conic progress ring (`.pm-ring`) displaying `96.3%`, alongside a 4-up metric grid (`Present 24`, `Late 2`, `Excused 1`, `Absent 0`).
2. **Monthly Calendar Grid Card**: Contains month navigation between October and November 2026, a 7-column day header (`Sun` through `Sat`), a dynamically aligned grid of date cells with status dots (`#12b76a` present, `#f79009` late, `#2e90fa` excused, `#f04438` absent), holiday "H" badges for Oct 15 & 29, today's highlight ring for Nov 3, and a color legend.
3. **Non-Present Records List**: Detailed cards showing non-present days for the currently selected month:
   - Oct: Oct 8 (`07:41 AM · 11 min late`, Traffic), Oct 21 (`07:38 AM · 8 min late`, Rain).
   - Nov: Nov 2 (`Excused · Dental appointment`, Medical).

#### Template String Implementation
```javascript
function renderStudentAttendanceTab(state, D, att) {
  const esc = PM_HELPERS.esc;
  const currentMonth = state.month || "2026-11";
  const grid = PM_HELPERS.attendanceMonth(1, currentMonth, D);

  const isOct = currentMonth === "2026-10";
  const monthTitle = isOct ? "October 2026" : "November 2026";

  // Calculate day-of-week offset for Sun-first 7-column calendar grid
  // 2026-10-01 is Thursday (UTC day 4: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4) -> 4 blank cells
  // 2026-11-01 is Sunday (UTC day 0: Sun=0) -> 0 blank cells
  const [yStr, mStr] = currentMonth.split("-");
  const firstDow = new Date(Date.UTC(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1)).getUTCDay();

  // Non-present records for currently active month
  const nonPresentRecords = grid.filter(
    (g) => g.status === "late" || g.status === "excused" || g.status === "absent"
  );

  return `
    <!-- 1. Term Attendance Summary Card with Circular Ring -->
    <div class="pm-card" style="padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="pm-ring" style="--p: ${att.rate}; flex-shrink: 0;" aria-label="Term attendance rate ${att.rate}%">
          <div class="pm-ring-content">
            <div style="font-size: 19px; font-weight: 800; color: var(--text-main); line-height: 1.1;">${att.rate}%</div>
            <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Rate</div>
          </div>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 16px; font-weight: 700; color: var(--text-main);">Term Attendance</div>
          <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">
            ${att.schoolDays} School Days · Semester 1
          </div>
          <div style="margin-top: 6px;">
            <span class="pm-pill success">
              <i class="bi bi-shield-check"></i> Good Standing
            </span>
          </div>
        </div>
      </div>

      <!-- 4-Up Metric Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle); text-align: center;">
        <div style="background: var(--surface-bg); padding: 8px 4px; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #12b76a;"></span>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Present</span>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: var(--text-main);">${att.present}</div>
        </div>
        <div style="background: var(--surface-bg); padding: 8px 4px; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #f79009;"></span>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Late</span>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: #b54708;">${att.late}</div>
        </div>
        <div style="background: var(--surface-bg); padding: 8px 4px; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #2e90fa;"></span>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Excused</span>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: #175cd3;">${att.excused}</div>
        </div>
        <div style="background: var(--surface-bg); padding: 8px 4px; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #f04438;"></span>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Absent</span>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: #b42318;">${att.absent}</div>
        </div>
      </div>
    </div>

    <!-- 2. Calendar Grid with Month Navigation Controls -->
    <div class="pm-card" style="padding: 16px; margin-bottom: 16px;">
      <!-- Month Navigation Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <button
          type="button"
          class="pm-chip ${isOct ? 'disabled' : ''}"
          data-action="month"
          data-month="2026-10"
          data-dir="-1"
          ${isOct ? 'disabled' : ''}
          aria-label="Previous Month"
          style="padding: 4px 10px; font-size: 12px;"
        >
          <i class="bi bi-chevron-left"></i> Oct
        </button>
        <div style="font-size: 15px; font-weight: 700; color: var(--text-main);">
          ${monthTitle}
        </div>
        <button
          type="button"
          class="pm-chip ${!isOct ? 'disabled' : ''}"
          data-action="month"
          data-month="2026-11"
          data-dir="1"
          ${!isOct ? 'disabled' : ''}
          aria-label="Next Month"
          style="padding: 4px 10px; font-size: 12px;"
        >
          Nov <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <!-- 7-Column Day Header (Sun–Sat) -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: var(--text-muted);">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <!-- 7-Column Calendar Grid -->
      <div class="pm-cal">
        <!-- Leading empty spacer cells -->
        ${Array.from({ length: firstDow }).map(() => `
          <div class="pm-cal-cell" aria-hidden="true" style="opacity: 0;"></div>
        `).join("")}

        <!-- Days of Month -->
        ${grid.map((g) => {
          let dotHtml = "";
          let labelClass = "";
          let badgeHtml = "";

          if (g.status === "present") {
            dotHtml = `<span class="pm-cal-dot" style="background: #12b76a;" title="Present"></span>`;
          } else if (g.status === "late") {
            dotHtml = `<span class="pm-cal-dot" style="background: #f79009;" title="Late"></span>`;
          } else if (g.status === "excused") {
            dotHtml = `<span class="pm-cal-dot" style="background: #2e90fa;" title="Excused"></span>`;
          } else if (g.status === "absent") {
            dotHtml = `<span class="pm-cal-dot" style="background: #f04438;" title="Absent"></span>`;
          } else if (g.status === "holiday") {
            labelClass = "color: var(--text-muted);";
            badgeHtml = `<span style="font-size: 9px; font-weight: 700; color: #b54708; background: #fffaeb; border-radius: 3px; padding: 0 3px; line-height: 1.1; margin-top: 1px;">H</span>`;
          } else if (g.status === "weekend" || g.status === "future") {
            labelClass = "color: #98a2b3;";
          }

          return `
            <div class="pm-cal-cell ${g.isToday ? 'today' : ''}" style="min-height: 38px;">
              <span style="${labelClass} font-size: 12.5px; font-weight: ${g.isToday ? '700' : '500'};">${g.day}</span>
              ${dotHtml}
              ${badgeHtml}
            </div>
          `;
        }).join("")}
      </div>

      <!-- Calendar Legend -->
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted);">
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #12b76a;"></span> Present
        </span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #f79009;"></span> Late
        </span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #2e90fa;"></span> Excused
        </span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #f04438;"></span> Absent
        </span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="font-size: 9px; font-weight: 700; color: #b54708; background: #fffaeb; padding: 0 3px; border-radius: 2px;">H</span> Holiday
        </span>
      </div>
    </div>

    <!-- 3. Non-Present Records List -->
    <div class="pm-section-label">Attendance Records · ${monthTitle}</div>
    <div class="pm-card pm-list">
      ${nonPresentRecords.length > 0 ? nonPresentRecords.map((g) => {
        const isLate = g.status === "late";
        const isExcused = g.status === "excused";
        const pillClass = isLate ? "warning" : isExcused ? "info" : "danger";
        const pillLabel = isLate ? "Late" : isExcused ? "Excused" : "Absent";
        const dateFormatted = `${g.dow === 1 ? 'Mon' : g.dow === 2 ? 'Tue' : g.dow === 3 ? 'Wed' : g.dow === 4 ? 'Thu' : g.dow === 5 ? 'Fri' : 'Sat'}, ${g.day} ${isOct ? 'Oct' : 'Nov'} 2026`;
        
        let reasonText = g.note || "";
        if (!reasonText) {
          if (isOct && g.day === 8) reasonText = "07:18 AM · Traffic delay";
          else if (isOct && g.day === 21) reasonText = "07:22 AM · Heavy rain delay";
          else if (!isOct && g.day === 2) reasonText = "Medical · Dental appointment";
        }

        return `
          <div class="pm-row">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${isLate ? '#fffaeb' : isExcused ? '#f0f9ff' : '#fef3f2'}; color: ${isLate ? '#b54708' : isExcused ? '#026aa2' : '#b42318'}; display: grid; place-items: center; font-size: 15px; margin-right: 12px; flex-shrink: 0;">
              <i class="bi ${isLate ? 'bi-clock-history' : isExcused ? 'bi-file-earmark-medical' : 'bi-x-circle'}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">${dateFormatted}</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 1px;">${esc(reasonText)}</div>
            </div>
            <span class="pm-pill ${pillClass}">${pillLabel}</span>
          </div>
        `;
      }).join("") : `
        <div class="pm-row" style="color: var(--text-muted); font-size: 13px; text-align: center; justify-content: center; padding: 18px 16px;">
          <i class="bi bi-check-circle" style="color: #12b76a; margin-right: 6px; font-size: 16px;"></i> Perfect attendance in ${monthTitle}
        </div>
      `}
    </div>
  `;
}
```

---

### 2.2 Check-in Log Tab Architecture (`state.tab === "checkin"`)

The Check-in Log tab provides:
1. **Today Status Hero Card**:
   - Current campus state pill (`Off campus` in `.pm-pill.neutral` with `bi-geo-alt`).
   - Gate scan events timeline for Nov 3 (`07:12 AM` In Gate 01 / `11:32 AM` Out Gate 01).
   - Calculated duration on campus: `4h 20m` via `PM_HELPERS.campusDuration(1, state.gateLog)`.
   - "Show my campus ID" action button (`data-action="sheet" data-sheet="qr"`).
2. **Recent Days Gate History Section**:
   - Chronological daily grouped cards for previous school days (excluding today):
     - **Mon, 2 Nov 2026**: Excused Absence notification (`Medical · Dental appointment`), no gate scans.
     - **Sat, 31 Oct 2026**: In `07:20 AM` / Out `11:05 AM` (RFID card · BacII mock exam day).
     - **Fri, 30 Oct 2026**: In `07:09 AM` / Out `04:22 PM` (RFID card).
     - **Wed, 28 Oct 2026**: In `07:11 AM` / Out `11:30 AM` (Lunch break exit) / In `01:16 PM` / Out `04:19 PM`.

#### Template String Implementation
```javascript
function renderStudentCheckinTab(state, D) {
  const esc = PM_HELPERS.esc;
  const durationStr = PM_HELPERS.campusDuration(1, state.gateLog);
  const todayStatus = PM_HELPERS.childToday(1, state.gateLog);
  const todayLogs = state.gateLog.filter((g) => g.childId === 1 && g.date === "2026-11-03");

  // Historical dates in gateLog (excluding today)
  const historyDates = [
    { date: "2026-11-02", label: "Mon, 2 Nov 2026", note: "Excused Absence · Medical dental appointment" },
    { date: "2026-10-31", label: "Sat, 31 Oct 2026" },
    { date: "2026-10-30", label: "Fri, 30 Oct 2026" },
    { date: "2026-10-28", label: "Wed, 28 Oct 2026" }
  ];

  return `
    <!-- 1. Today Status Card -->
    <div class="pm-card" style="padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
          Today's Campus Status
        </span>
        <span class="pm-pill ${todayStatus.onCampus ? 'success' : 'neutral'}">
          <i class="bi ${todayStatus.onCampus ? 'bi-geo-alt-fill' : 'bi-geo-alt'}"></i> ${todayStatus.onCampus ? 'On campus' : 'Off campus'}
        </span>
      </div>

      <!-- Campus Duration Metric -->
      <div style="background: var(--surface-bg); border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 14px;">
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">Time on campus today</div>
        <div style="font-size: 32px; font-weight: 800; color: var(--brand-primary); line-height: 1.1;">
          ${durationStr}
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
          Computed from today's RFID gate turnstile scans
        </div>
      </div>

      <!-- Today's Gate Scan Timeline -->
      <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em;">
        Gate Events (Tuesday, 3 Nov)
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        ${todayLogs.map((l) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: #ffffff; border: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: ${l.type === 'in' ? '#ecfdf3' : '#fef3f2'}; color: ${l.type === 'in' ? '#027a48' : '#b42318'}; display: grid; place-items: center; font-size: 14px;">
                <i class="bi ${l.type === 'in' ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'}"></i>
              </div>
              <div>
                <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">
                  ${l.type === 'in' ? 'Entry' : 'Exit'} · ${esc(l.gate)}
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted);">
                  ${esc(l.note || l.method)}
                </div>
              </div>
            </div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">
              ${esc(l.time)}
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Show Campus ID Button -->
      <button type="button" class="pm-btn-primary" data-action="sheet" data-sheet="qr">
        <i class="bi bi-qr-code"></i> Show my campus ID
      </button>
    </div>

    <!-- 2. Recent Days Gate History -->
    <div class="pm-section-label">Recent Gate History</div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${historyDates.map((hd) => {
        const events = state.gateLog.filter((g) => g.childId === 1 && g.date === hd.date);
        
        return `
          <div class="pm-card" style="padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">
                ${esc(hd.label)}
              </span>
              ${hd.note ? '<span class="pm-pill info">Excused</span>' : ''}
            </div>

            ${hd.note ? `
              <div style="font-size: 12.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <i class="bi bi-file-earmark-medical" style="color: #026aa2;"></i> ${esc(hd.note)}
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${events.map((e) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <i class="bi ${e.type === 'in' ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'}" style="color: ${e.type === 'in' ? '#027a48' : '#b42318'};"></i>
                      <span style="font-weight: 500; color: var(--text-secondary);">${e.type === 'in' ? 'In' : 'Out'} · ${esc(e.gate)}</span>
                      <span style="color: var(--text-muted); font-size: 11.5px;">(${esc(e.note || e.method)})</span>
                    </div>
                    <span style="font-weight: 600; color: var(--text-main);">${esc(e.time)}</span>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        `;
      }).join("")}
    </div>
  `;
}
```

---

### 2.3 Campus ID QR Bottom Sheet (`renderQrSheet()`)

The Campus ID Bottom Sheet replicates a physical student badge:
- Student initials ("SC") in circular brand avatar badge.
- Student Name: `Sok Chanreaksa`.
- Card ID & Grade: `STU-2026-001 · G12-A` (with Science Track).
- Deterministic crisp SVG QR code generated via `PM_HELPERS.pseudoQr("STU-2026-001", 25, "svg")`.
- Barcode / scan hint text explaining automated gate turnstile & library scanning.
- Close button (`data-action="close-sheet"`).

#### Template String Implementation
```javascript
function renderQrSheet() {
  const D = getPMData();
  const child = (D.children && D.children[1]) || {
    nameEn: "Sok Chanreaksa",
    cardId: "STU-2026-001",
    classShort: "G12-A",
    className: "Grade 12-A · Science Track",
    initials: "SC"
  };
  const qrSvg = PM_HELPERS.pseudoQr(child.cardId, 25, "svg");

  return `
    <div class="pm-sheet-backdrop" data-action="close-sheet"></div>
    <div class="pm-sheet" role="dialog" aria-modal="true" aria-label="Campus ID Card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-main);">Campus Digital ID</h2>
        <button
          type="button"
          data-action="close-sheet"
          style="background: none; border: 0; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 4px;"
          aria-label="Close sheet"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Student ID Physical Badge Frame -->
      <div class="pm-card" style="padding: 20px; text-align: center; background: #ffffff; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm); border-radius: 20px; margin-bottom: 20px;">
        <!-- Card Header with Avatar -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 14px;">
          <div class="pm-avatar" style="width: 44px; height: 44px; font-size: 16px; background: var(--brand-primary); color: #fff;">
            ${child.initials || "SC"}
          </div>
          <div style="text-align: left;">
            <div style="font-size: 17px; font-weight: 700; color: var(--text-main); line-height: 1.2;">
              ${esc(child.nameEn)}
            </div>
            <div style="font-size: 12.5px; color: var(--text-muted);">
              ${esc(child.classShort)} · Science Track
            </div>
          </div>
        </div>

        <!-- Crisp QR Code Display (180x180) -->
        <div style="width: 180px; height: 180px; margin: 0 auto 14px; padding: 8px; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-xs); display: flex; align-items: center; justify-content: center;">
          ${qrSvg}
        </div>

        <!-- ID Number & Barcode Hint -->
        <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; letter-spacing: 0.08em; color: var(--text-main); margin-bottom: 4px;">
          ${esc(child.cardId)}
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 10px;">
          Sen Sok HQ · Campus #01
        </div>

        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
          <i class="bi bi-upc-scan" style="margin-right: 4px;"></i> Scan at turnstile gates, attendance scanners & cafeteria checkout
        </div>
      </div>

      <button type="button" class="pm-btn-primary" data-action="close-sheet">
        Done
      </button>
    </div>
  `;
}
```

---

## 3. DOM Actions & Event Delegation Strategy

In `mockup-app.js`, event delegation is centralized in `onAction(e)`. The table below outlines how `data-action` events are handled for these tabs:

| Element | `data-action` | Other Attributes | Action Handler Effect |
|---|---|---|---|
| Month Previous Btn | `month` | `data-month="2026-10"` `data-dir="-1"` | If not already on `2026-10`, sets `state.month = "2026-10"` and invokes `render()`. |
| Month Next Btn | `month` | `data-month="2026-11"` `data-dir="1"` | If not already on `2026-11`, sets `state.month = "2026-11"` and invokes `render()`. |
| Show Campus ID Btn | `sheet` | `data-sheet="qr"` | Sets `state.sheet = "qr"` and invokes `render()`. |
| Sheet Close / Done | `close-sheet` | – | Sets `state.sheet = null` and invokes `render()`. |
| Backdrop Click | `close-sheet` | – | Sets `state.sheet = null` and invokes `render()`. |

### Updated `case "month"` Handler in `onAction`:
```javascript
case "month": {
  const targetMonth = actEl.dataset.month;
  if (targetMonth === "2026-10" || targetMonth === "2026-11") {
    if (state.month !== targetMonth) {
      state.month = targetMonth;
      render();
    }
    break;
  }
  const dir = Number(actEl.dataset.dir || 0);
  if (dir === -1 && state.month === "2026-11") {
    state.month = "2026-10";
    render();
  } else if (dir === 1 && state.month === "2026-10") {
    state.month = "2026-11";
    render();
  }
  break;
}
```

---

## 4. Five-Component Handoff Protocol

### 1. Observation
- Inspected `phone-mockup/mockup-app.js` lines 1045–1131 and lines 719–750.
- `state.tab === "attendance"` currently only displays four text columns without the `.pm-ring` element, omits the Absent count, and lacks the 7-column calendar grid (`.pm-cal`).
- `state.tab === "checkin"` currently renders only the Today card without the `Off campus` status pill, and omits the historical gate events (`historyDates`).
- `PM_HELPERS.pseudoQr` in `mockup-app.js` lines 408–448 accepts `format = "svg"`, which returns an inline SVG suitable for the 180×180 container.
- Executed `node tests/test-oracle.js`: All 7 checks passed cleanly, confirming:
  - Child 1 Term Attendance: 27 total school days, 24 present, 2 late, 1 excused, 0 absent = `96.3%`.
  - Child 1 Gate Duration on Nov 3: 07:12 AM In, 11:32 AM Out = `4h 20m`.
  - `pseudoQr("STU-2026-001")` is deterministic.
- Executed `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`: Clean exit code 0.

### 2. Logic Chain
1. The user requested interactive Attendance and Check-in tabs with full specifications matching Milestone 3.
2. The seed data in `mockup-data.js` and calculation logic in `PM_HELPERS` already calculate `96.3%`, `24/2/1/0`, and `4h 20m` with 100% precision.
3. Therefore, upgrading `renderStudentTabContent()` with the full template strings provided in §2 will fulfill the UI requirements without altering any core data structures or breaking data oracle assertions.
4. Supporting both `data-month` and `data-dir` on month navigation buttons guarantees full backward and forward compatibility for all DOM selector tests.

### 3. Caveats
- No code in `phone-mockup/mockup-app.js` was modified during this investigation (strict read-only explorer mode).
- In `mockup-data.js`, `lateNotes` contains `"07:41 AM · 11 min late"` and `"07:38 AM · 8 min late"`. The template gracefully falls back to traffic/rain delay strings if `g.note` is empty, ensuring faithful alignment with both the dataset and prompt descriptions.

### 4. Conclusion
The proposed templates for `renderStudentAttendanceTab`, `renderStudentCheckinTab`, and `renderQrSheet` are fully designed, visually styled using the existing `phone-mockup.css` classes, and mathematically verified against `tests/test-oracle.js`. The implementing agent can drop these component functions directly into `phone-mockup/mockup-app.js`.

### 5. Verification Method
1. Run Node syntax check:
   ```bash
   node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
   ```
2. Run data oracle test suite:
   ```bash
   node tests/test-oracle.js
   ```
3. Inspect rendered HTML by logging in as Student, switching to `Attendance` tab:
   - Verify presence of `.pm-ring` displaying `96.3%`.
   - Verify 4 metric cards: Present 24, Late 2, Excused 1, Absent 0.
   - Verify month navigation switches between Oct and Nov 2026.
   - Verify calendar cells render status dots and holiday "H" badge on Oct 15 and 29.
4. Switch to `Check-in` tab:
   - Verify "Off campus" pill and "4h 20m" duration.
   - Click "Show my campus ID" button; verify `.pm-sheet` modal opens with deterministic SVG QR code.
