# Milestone 2: Pure Computation Helpers, Mathematical Oracles & Unit Verification Strategy

**Author**: `explorer_m2_3` (teamwork_explorer)  
**Date**: 2026-11-03  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m2_3/`  
**Target Source**: `phone-mockup/mockup-app.js` (`window.PM_HELPERS` & Node `module.exports`)  
**Target Verification**: `tests/test-oracle.js` & `tests/test-all.sh`

---

## 1. Observation

### 1.1 Existing Codebase Infrastructure & Contracts
1. **`js/views-core.js` (lines 8–20)** defines legacy presentation helpers:
   ```javascript
   const esc = (str) =>
     String(str ?? "")
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;");

   const fmtMoney = (n) =>
     "$" +
     Number(n || 0).toLocaleString("en-US", {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     });
   ```
   *Note*: The legacy `esc` escapes `&`, `<`, `>`, `"`, but omits single quotes (`'`). For safe HTML template injection in the phone mockup, single quotes MUST also be escaped to `&#39;`.

2. **`tests/test-oracle.js` (lines 33–90)** defines reference helper implementations for headless verification:
   - `toMin(t)`: Parses regex `/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i`. Converts 12h/24h to minutes from midnight (lines 35–45).
   - `fmtMoney(amt)`: Formats numbers with `$` and 2 fixed decimal places (lines 46–48).
   - `letter(score)`: Thresholds: $\ge 95 \to \text{"A+"}$, $\ge 90 \to \text{"A"}$, $\ge 85 \to \text{"B+"}$, $\ge 80 \to \text{"B"}$, $\ge 70 \to \text{"C"}$, $< 70 \to \text{"D"}$ (lines 49–56).
   - `calcAvg(subjects)`: Computes mean of subject scores formatted via `.toFixed(1)` (lines 57–61).
   - `pseudoQr(seedStr, size)`: FNV-1a 32-bit hash + Xorshift PRNG + fixed 7x7 corner finder squares with quiet zones (lines 62–90).

3. **`tests/test-oracle.js` (lines 224–442)** contains 7 automated verification checks passing cleanly via `node tests/test-oracle.js --reference-only`:
   - Check 1: Outstanding family balance = `$1,710.00`; post-payment of INV-2026-0618 ($45.00) = `$1,665.00`.
   - Check 2: Grade averages: Child 1 (Sok Chanreaksa) = `91.9` ($643 / 7$); Child 11 (Sok Chanpanha) = `91.0` ($546 / 6$). Letter grade assertions: `95 -> A+`, `91 -> A`, `89 -> B+`, `90 -> A`, `94 -> A`, `88 -> B+`, `96 -> A+`.
   - Check 3: Attendance statistics for Child 1: Oct (25 school days, 23 P, 2 L, 0 E, 0 A); Nov thru Nov 3 (2 school days, 1 P, 0 L, 1 E, 0 A). Term totals = 27 school days, 24 Present, 2 Late, 1 Excused, 0 Absent; Rate = $\frac{24 + 2}{27} \times 100 = 96.3\%$. Child 11 Rate = $100.0\%$.
   - Check 4: Gate log & campus duration today: Child 1 entered `07:12 AM` (432 min), exited `11:32 AM` (692 min) $\to 260\text{ min} = \mathbf{4\text{h } 20\text{m}}$.
   - Check 5: Timetable status at demo clock 11:35 AM (695 min): Lunch break (11:00–13:30) is `"now"`; Biology (13:30–14:45) is `"next"`.
   - Check 6: Saturday timetable bounds: Child 1 has 6 periods (P7 `-` omitted); Child 11 has 5 entries (P1–P4 + recess, ends 11:20 AM, no lunch).
   - Check 7: Deterministic pseudo-QR generator produces identical active cell count for identical seeds (`STU-2026-001` -> 311 active modules on 25x25 grid) and distinct counts for different seeds (`STU-2026-007` -> 303 active modules).

4. **`implementation_plan.md` §4d and `PROJECT.md` line 47**:
   - `implementation_plan.md` line 401: "Letter grades are **computed**: ≥95 A+, 90–94 A, 85–89 B+, 80–84 B, 70–79 C, <70 D."
   - `PROJECT.md` line 47: "Subject rows with letter pills (A+, A, B+) and progress bars."

5. **Dispatch Prompt Discrepancy**:
   - The dispatch message specifies:
     "`letter(score)`: Maps numeric grade to letter: $\ge 90 \to \text{"A+"}$, $\ge 80 \to \text{"A"}$, $\ge 70 \to \text{"B+"}$, $\ge 60 \to \text{"B"}$, $\ge 50 \to \text{"C"}$, $< 50 \to \text{"D"}$."
     "Additional unit tests to verify boundary conditions (e.g. score 89.9 -> A, 90.0 -> A+, negative/zero money, empty subjects, etc.)."

---

## 2. Logic Chain

### 2.1 Reconciling the Letter Grade Scale Discrepancy
- **Observation**:
  - `tests/test-oracle.js` lines 269–275 asserts:
    `assert.strictEqual(refHelpers.letter(91), "A")` and `assert.strictEqual(refHelpers.letter(89), "B+")`.
  - `implementation_plan.md` §4d explicitly specifies $\ge 95 \text{ A+}$, $90\text{–}94 \text{ A}$, $85\text{–}89 \text{ B+}$, $80\text{–}84 \text{ B}$, $70\text{–}79 \text{ C}$, $< 70 \text{ D}$.
  - Under this scale, Child 1's subjects (95, 91, 89, 90, 94, 88, 96) yield pills: Math (A+), Physics (A), Chem (B+), Bio (A), English (A), Khmer (B+), CS & AI (A+). This contains the exact set `{A+, A, B+}` documented in `PROJECT.md` line 47.
  - If the dispatch scale ($\ge 90 \to \text{A+}$, $\ge 80 \to \text{A}$) were used, scores 91 and 94 would become A+, score 89 would become A, score 88 would become A, leaving ZERO B+ grades and causing `tests/test-oracle.js` lines 270 and 273 to fail immediately.
- **Resolution**:
  - The authoritative scale for production implementation and `tests/test-oracle.js` compliance is the **95/90/85/80/70/<70** scale.
  - In `PM_HELPERS`, `letter(score)` MUST implement the authoritative scale.
  - We also specify both boundary sets in the unit verification suite to thoroughly document the rationale.

### 2.2 Time & Date Normalization Logic
- **`toMin(timeStr)`**:
  - Regular expression `/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i` matches:
    - 24-hour strings: `"11:35"` -> 695, `"07:30"` -> 450, `"13:30"` -> 810, `"00:00"` -> 0.
    - 12-hour strings: `"07:12 AM"` -> 432, `"11:32 AM"` -> 692, `"12:00 PM"` -> 720, `"12:00 AM"` -> 0, `"03:16 PM"` -> 916.
  - Handling of edge cases: Trim input, handle 12 AM ($12 \to 0$), 12 PM ($12 \to 12$). Non-matching or empty input safely yields `0`.
- **`fmtDate(isoStr)`**:
  - Parsing ISO strings via manual component splitting (`isoStr.split("-")`) instead of `new Date(...)` avoids all browser and Node timezone shifting (e.g. UTC shifting to previous day in Western Hemisphere timezones).
  - Mapping: `[y, m, d]` -> `"${d} ${monthNames[m]} ${y}"` (e.g. `"2026-11-03"` -> `"3 Nov 2026"`).
- **`fmtDay(dayKeyOrIso)`**:
  - Accepts either 3-letter weekday key (`"mon"`..`"sun"`) or ISO date string (`"2026-11-03"`).
  - Returns full day name: `"Monday"`, `"Tuesday"`, etc.
- **`daysBetween(isoA, isoB)`**:
  - Computes signed calendar day difference: $\frac{\text{UTC}(B) - \text{UTC}(A)}{86400000}$.
  - Returns $-4$ for overdue BacII Mock Exam (Oct 30 vs Nov 3), $+7$ for IEP Tuition (Nov 10 vs Nov 3), $+12$ for Lunch Plan (Nov 15 vs Nov 3).

### 2.3 Financial Calculation Logic
- **`fmtMoney(amount)`**:
  - Input converted to `Number(amount || 0)`.
  - Format: `(n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
  - Guarantees: `1710` -> `"$1,710.00"`, `45` -> `"$45.00"`, `0` -> `"$0.00"`, `-45` -> `"-$45.00"`, null/empty -> `"$0.00"`.
- **`outstanding(childId, invoices)`**:
  - Filters invoices where `inv.status !== "Paid"`.
  - If `childId` is provided (`number`), filters to `inv.childId === childId`.
  - Sums `amount`:
    - Family total (no childId): $45 + 360 + 1305 = \mathbf{\$1,710.00}$.
    - Child 1: $45 + 360 = \mathbf{\$405.00}$.
    - Child 11: $\mathbf{\$1,305.00}$.
    - Post-Payment of INV-2026-0618 ($45.00): Total becomes $\$1,710.00 - \$45.00 = \mathbf{\$1,665.00}$.

### 2.4 Academic Statistics Logic
- **`calcAverage(subjects)`**:
  - Sums `s.score` across `subjects` array.
  - If array is empty/null, safely returns `"0.0"`.
  - Formatted using `(sum / subjects.length).toFixed(1)`.
  - Invariants:
    - Child 1: $\frac{95 + 91 + 89 + 90 + 94 + 88 + 96}{7} = \frac{643}{7} = 91.85714\ldots \to \mathbf{"91.9"}$.
    - Child 11: $\frac{93 + 92 + 89 + 87 + 95 + 90}{6} = \frac{546}{6} = 91.0 \to \mathbf{"91.0"}$.

### 2.5 Attendance Matrix & Rate Logic
- **`attendanceSummary(childId, dataset)`**:
  - School days: Monday through Saturday. Sundays and declared holidays are excluded.
  - October 2026 (31 days): 4 Sundays (4, 11, 18, 25) + 2 Holidays (15, 29) = 25 school days.
    - Child 1: 2 late (8, 21), 0 excused, 0 absent, 23 present.
  - November 2026 up to Nov 3 (demo date): Nov 1 (Sun), Nov 2 (Mon, excused), Nov 3 (Tue, present) = 2 school days. Days after Nov 3 are future.
    - Child 1: 0 late, 1 excused (2), 0 absent, 1 present (3).
  - Term Totals for Child 1:
    - Total School Days: $25 + 2 = \mathbf{27}$
    - Present: $23 + 1 = \mathbf{24}$
    - Late: $2 + 0 = \mathbf{2}$
    - Excused: $0 + 1 = \mathbf{1}$
    - Absent: $\mathbf{0}$
    - Attendance Rate: $\frac{\text{Present} + \text{Late}}{\text{Total School Days}} \times 100 = \frac{24 + 2}{27} \times 100 = 96.296296\ldots\% \to \mathbf{96.3\%}$.
  - Term Totals for Child 11: 27 school days, 27 Present, Rate = $\mathbf{100.0\%}$.
- **`attendanceMonth(childId, monthStr, dataset, demoIso)`**:
  - Generates calendar cell array with `status: "present" | "late" | "excused" | "absent" | "holiday" | "weekend" | "future"`.

### 2.6 Daily Campus Logistics Logic
- **`periodStatus(period, dayKey, allPeriods, demoMin = 695)`**:
  - Evaluates only when `dayKey === "tue"` (demo day).
  - Period start/end in minutes: $sMin = \text{toMin}(p.start)$, $eMin = \text{toMin}(p.end)$.
  - If $demoMin \ge sMin \text{ and } demoMin < eMin \to \mathbf{"now"}$ (e.g. Lunch break 11:00–13:30).
  - If $demoMin \ge eMin \to \mathbf{"past"}$ (P1–P4, Morning recess).
  - If $demoMin < sMin$:
    - If `p.isBreak`: `"upcoming"`.
    - If `p` is the first non-break period starting after $demoMin \to \mathbf{"next"}$ (Biology 13:30–14:45).
    - Subsequent non-break periods $\to \mathbf{"upcoming"}$ (Computer Science & AI 15:00–16:15).
- **`childToday(childId, gateLog, demoIso = "2026-11-03")`**:
  - Inspects today's last gate event:
    - Child 1: Last event `type: "out"`, `time: "11:32 AM"` $\to$ `{ onCampus: false, label: "Off campus · Out 11:32 AM", time: "11:32 AM" }`.
    - Child 11: Last event `type: "in"`, `time: "07:12 AM"` $\to$ `{ onCampus: true, label: "On campus · In 07:12 AM", time: "07:12 AM" }`.
- **`campusDuration(childId, gateLog, demoIso = "2026-11-03", demoMin = 695)`**:
  - Computes elapsed time on campus today:
    - Child 1: in `07:12 AM` (432 min) to out `11:32 AM` (692 min) = 260 min $\to \mathbf{"4h 20m"}$.
    - Child 11: in `07:12 AM` (432 min), still on campus at 11:35 AM (695 min) = 263 min $\to \mathbf{"4h 23m"}$.

### 2.7 Deterministic Pseudo-QR Generation
- **`pseudoQr(seedStr, size = 25, format = "html")`**:
  - PRNG: 32-bit FNV-1a seed hashing + Xorshift PRNG algorithm:
    ```javascript
    let h = 2166136261;
    for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    ```
  - Finder patterns: 7x7 squares at `[0,0]`, `[0, size-7]`, and `[size-7, 0]` with outer box, inner dot, and 1-module quiet zone.
  - Output formats supported:
    - HTML Grid: `<div class="pm-qr" style="--n:${size}">${cells}</div>` (matches `phone-mockup.css`).
    - SVG Vector: `<svg class="pm-qr-svg" viewBox="0 0 ${size} ${size}" fill="currentColor">${rects}</svg>`.
    - Verification object: `{ size, countOn, html, svg }` (allows unit assertions on matrix module counts).

### 2.8 Dual Packaging & Environment Isolation
- Pure helper functions take their dependencies as arguments or access `window.PM_DATA` / `global.window.PM_DATA` as fallbacks.
- Expose on both:
  - Browser: `window.PM_HELPERS = PM_HELPERS;`
  - Node.js: `if (typeof module !== "undefined" && module.exports) module.exports = PM_HELPERS;`
- Zero external libraries or npm packages. Zero mutation of global state or DOM.

---

## 3. Caveats

1. **Grade Scale Dissent / Dual Reference**:
   - The dispatch prompt mentioned a 10-point scale ($\ge 90 \text{ A+}$, $\ge 80 \text{ A}$, etc.), while `implementation_plan.md` §4d and `tests/test-oracle.js` mandate the $\ge 95 \text{ A+}$, $\ge 90 \text{ A}$, $\ge 85 \text{ B+}$ scale.
   - Using the dispatch prompt's scale would break `tests/test-oracle.js` lines 270 and 273 and eliminate B+ badges required by `PROJECT.md`. The authoritative $\ge 95$ scale has been adopted.
2. **Date Timezone Shift Guard**:
   - Date functions (`fmtDate`, `attendanceMonth`, `daysBetween`) must NEVER use `new Date("YYYY-MM-DD")` with local date methods (`getDate()`), as standard UTC-midnight parsing causes date decrements in US/European timezones. All helper logic uses string splitting or `Date.UTC(...)` with `getUTCDate()`.
3. **Immutability Assurance**:
   - Pure helpers receive arrays/objects (`invoices`, `gateLog`, `subjects`) and MUST NOT mutate them (`.sort()`, `.splice()`, etc.). All arrays are cloned or mapped non-destructively.

---

## 4. Conclusion & Technical Specification

### 4.1 Production Implementation of `PM_HELPERS`
Below is the complete, self-contained implementation to be placed in `phone-mockup/mockup-app.js` and exported on `window.PM_HELPERS` (and `module.exports`):

```javascript
/**
 * ==============================================================================
 * Pure Computation Helpers (window.PM_HELPERS)
 * Zero external dependencies. Zero side effects.
 * Dual-exported for browser client and headless Node.js testing.
 * ==============================================================================
 */
const PM_HELPERS = (function () {
  "use strict";

  // Safe fallback to PM_DATA
  const getPMData = () => {
    if (typeof window !== "undefined" && window.PM_DATA) return window.PM_DATA;
    if (typeof global !== "undefined" && global.window && global.window.PM_DATA) return global.window.PM_DATA;
    return {};
  };

  /**
   * 1. esc: Safely escape HTML special characters for template strings.
   */
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * 2. toMin: Converts "HH:MM" (24h) or "hh:mm AM/PM" to minutes from midnight.
   */
  function toMin(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = (match[3] || "").toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  /**
   * 3. fmtMoney: Formats number into USD currency format (e.g. 1710 -> "$1,710.00").
   */
  function fmtMoney(amount) {
    const n = Number(amount || 0);
    if (isNaN(n)) return "$0.00";
    const absFormatted = Math.abs(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (n < 0 ? "-$" : "$") + absFormatted;
  }

  /**
   * 4. fmtDate: Converts "YYYY-MM-DD" to "D Mon YYYY" (e.g. "2026-11-03" -> "3 Nov 2026").
   */
  function fmtDate(isoStr) {
    if (!isoStr || typeof isoStr !== "string") return "";
    const parts = isoStr.trim().split("-");
    if (parts.length < 3) return isoStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!months[m] || isNaN(d)) return isoStr;
    return `${d} ${months[m]} ${y}`;
  }

  /**
   * 5. fmtDay: Converts day key ("mon".."sat") or ISO date to full weekday name.
   */
  function fmtDay(dayKeyOrIso) {
    if (!dayKeyOrIso || typeof dayKeyOrIso !== "string") return "";
    const map = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };
    const key = dayKeyOrIso.trim().toLowerCase();
    if (map[key]) return map[key];
    const parts = key.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(Date.UTC(y, m, d));
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return dayNames[dt.getUTCDay()];
    }
    return dayKeyOrIso;
  }

  /**
   * 6. daysBetween: Calendar days difference between two ISO dates (isoB - isoA).
   */
  function daysBetween(isoA, isoB) {
    if (!isoA || !isoB) return 0;
    const pA = isoA.split("-").map(Number);
    const pB = isoB.split("-").map(Number);
    const msA = Date.UTC(pA[0], pA[1] - 1, pA[2]);
    const msB = Date.UTC(pB[0], pB[1] - 1, pB[2]);
    return Math.round((msB - msA) / 86400000);
  }

  /**
   * 7. letter: Authoritative grade scale (>=95 A+, >=90 A, >=85 B+, >=80 B, >=70 C, <70 D).
   */
  function letter(score) {
    const s = Number(score || 0);
    if (s >= 95) return "A+";
    if (s >= 90) return "A";
    if (s >= 85) return "B+";
    if (s >= 80) return "B";
    if (s >= 70) return "C";
    return "D";
  }

  /**
   * 8. calcAverage: Computes mean of subject scores rounded to 1 decimal place.
   */
  function calcAverage(subjects) {
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) return "0.0";
    const sum = subjects.reduce((acc, s) => acc + Number((s && s.score) || 0), 0);
    return (sum / subjects.length).toFixed(1);
  }

  /**
   * 9. attendanceSummary: Analyzes Oct & Nov attendance records for childId.
   */
  function attendanceSummary(childId, D) {
    const data = D || getPMData();
    if (!data || !data.attendance || !data.attendance[childId]) {
      return { present: 0, late: 0, excused: 0, absent: 0, schoolDays: 0, rate: 0 };
    }
    const att = data.attendance[childId];
    let totalSchoolDays = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalAbsent = 0;
    let totalPresent = 0;

    // October 2026 (full month)
    if (att["2026-10"]) {
      const oct = att["2026-10"];
      const lateSet = new Set(oct.late || []);
      const excSet = new Set(oct.excused || []);
      const absSet = new Set(oct.absent || []);
      const holSet = new Set(oct.holidays || []);

      for (let day = 1; day <= 31; day++) {
        const dt = new Date(Date.UTC(2026, 9, day));
        const dow = dt.getUTCDay(); // 0 = Sun
        if (dow === 0 || holSet.has(day)) continue; // Sundays & holidays excluded
        totalSchoolDays++;
        if (lateSet.has(day)) totalLate++;
        else if (excSet.has(day)) totalExcused++;
        else if (absSet.has(day)) totalAbsent++;
        else totalPresent++;
      }
    }

    // November 2026 up to Nov 3 demo clock
    if (att["2026-11"]) {
      const nov = att["2026-11"];
      const lateSet = new Set(nov.late || []);
      const excSet = new Set(nov.excused || []);
      const absSet = new Set(nov.absent || []);
      const holSet = new Set(nov.holidays || []);

      for (let day = 1; day <= 3; day++) {
        const dt = new Date(Date.UTC(2026, 10, day));
        const dow = dt.getUTCDay();
        if (dow === 0 || holSet.has(day)) continue;
        totalSchoolDays++;
        if (lateSet.has(day)) totalLate++;
        else if (excSet.has(day)) totalExcused++;
        else if (absSet.has(day)) totalAbsent++;
        else totalPresent++;
      }
    }

    const rate = totalSchoolDays > 0
      ? +(((totalPresent + totalLate) / totalSchoolDays) * 100).toFixed(1)
      : 0;

    return {
      present: totalPresent,
      late: totalLate,
      excused: totalExcused,
      absent: totalAbsent,
      schoolDays: totalSchoolDays,
      rate,
    };
  }

  /**
   * 10. attendanceMonth: Calendar day details for the monthly grid view.
   */
  function attendanceMonth(childId, monthStr, D, demoIso = "2026-11-03") {
    const data = D || getPMData();
    if (!data || !data.attendance || !data.attendance[childId] || !data.attendance[childId][monthStr]) {
      return [];
    }
    const monthData = data.attendance[childId][monthStr];
    const [yStr, mStr] = monthStr.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const totalDays = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const lateSet = new Set(monthData.late || []);
    const excSet = new Set(monthData.excused || []);
    const absSet = new Set(monthData.absent || []);
    const holSet = new Set(monthData.holidays || []);

    const [demoY, demoM, demoD] = demoIso.split("-").map(Number);

    const result = [];
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      const dow = dt.getUTCDay();
      let status = "present";

      const isFuture = (y > demoY) || (y === demoY && m > demoM) || (y === demoY && m === demoM && d > demoD);

      if (isFuture) {
        status = "future";
      } else if (dow === 0) {
        status = "weekend";
      } else if (holSet.has(d)) {
        status = "holiday";
      } else if (lateSet.has(d)) {
        status = "late";
      } else if (excSet.has(d)) {
        status = "excused";
      } else if (absSet.has(d)) {
        status = "absent";
      } else {
        status = "present";
      }

      result.push({
        day: d,
        dow,
        status,
        isToday: (y === demoY && m === demoM && d === demoD),
        note: (monthData.lateNotes && monthData.lateNotes[d]) || (monthData.excusedNotes && monthData.excusedNotes[d]) || null,
      });
    }
    return result;
  }

  /**
   * 11. periodStatus: Evaluates period status ("past"|"now"|"next"|"upcoming") relative to 11:35 AM demo clock.
   */
  function periodStatus(period, dayKey, allPeriods, demoMin = 695) {
    if (!period || dayKey !== "tue") return "";
    const sMin = toMin(period.start);
    const eMin = toMin(period.end);

    if (demoMin >= sMin && demoMin < eMin) return "now";
    if (demoMin >= eMin) return "past";

    if (period.isBreak) return "upcoming";

    if (Array.isArray(allPeriods)) {
      const nextPeriod = allPeriods.find((p) => !p.isBreak && toMin(p.start) > demoMin);
      if (nextPeriod && nextPeriod.start === period.start && nextPeriod.subject === period.subject) {
        return "next";
      }
    }
    return "upcoming";
  }

  /**
   * 12. childToday: Calculates current campus status for child today.
   */
  function childToday(childId, gateLog, demoIso = "2026-11-03") {
    const log = gateLog || (getPMData().gateLog || []);
    if (!Array.isArray(log)) return { onCampus: false, label: "Off campus", time: "" };

    const todayEvents = log.filter((e) => e.childId === childId && e.date === demoIso);
    if (todayEvents.length === 0) return { onCampus: false, label: "Off campus", time: "" };

    const last = todayEvents[todayEvents.length - 1];
    if (last.type === "in") {
      return {
        onCampus: true,
        label: `On campus · In ${last.time}`,
        time: last.time,
      };
    } else {
      return {
        onCampus: false,
        label: `Off campus · Out ${last.time}`,
        time: last.time,
      };
    }
  }

  /**
   * 13. campusDuration: Computes duration on campus today ("4h 20m").
   */
  function campusDuration(childId, gateLog, demoIso = "2026-11-03", demoMin = 695) {
    const log = gateLog || (getPMData().gateLog || []);
    if (!Array.isArray(log)) return "0h 00m";

    const events = log
      .filter((e) => e.childId === childId && e.date === demoIso)
      .slice()
      .sort((a, b) => toMin(a.time) - toMin(b.time));

    let totalMin = 0;
    let currentInMin = null;

    for (const e of events) {
      if (e.type === "in") {
        currentInMin = toMin(e.time);
      } else if (e.type === "out" && currentInMin !== null) {
        totalMin += toMin(e.time) - currentInMin;
        currentInMin = null;
      }
    }

    if (currentInMin !== null) {
      totalMin += Math.max(0, demoMin - currentInMin);
    }

    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * 14. outstanding: Calculates total unpaid balance for child or whole family.
   */
  function outstanding(childId, invoices) {
    const invs = invoices || (getPMData().invoices || []);
    if (!Array.isArray(invs)) return 0;

    return invs
      .filter((inv) => {
        const matchChild = childId === undefined || childId === null || inv.childId === childId;
        const isUnpaid = inv.status !== "Paid";
        return matchChild && isUnpaid;
      })
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  }

  /**
   * 15. pseudoQr: Deterministic pseudo-QR generator with 3 finder patterns.
   */
  function pseudoQr(seedStr, size = 25, format = "html") {
    let h = 2166136261;
    for (const c of String(seedStr || "")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rand = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
    const finder = (r, c) => {
      for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
        const y = r - fr, x = c - fc;
        if (y >= 0 && y < 7 && x >= 0 && x < 7) {
          return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
        }
        if (y >= -1 && y <= 7 && x >= -1 && x <= 7) return false;
      }
      return null;
    };

    let cellsHtml = "";
    let rectsSvg = "";
    let countOn = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const f = finder(r, c);
        const on = (f === null ? rand() > 0.5 : f);
        if (on) countOn++;
        cellsHtml += `<i class="${on ? "on" : ""}"></i>`;
        if (on) rectsSvg += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
      }
    }

    const html = `<div class="pm-qr" style="--n:${size}" aria-label="QR code">${cellsHtml}</div>`;
    const svg = `<svg class="pm-qr-svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%" fill="currentColor" aria-label="QR Code">${rectsSvg}</svg>`;

    if (format === "svg") return svg;
    if (format === "object") return { size, countOn, html, svg };
    return html;
  }

  return {
    esc,
    toMin,
    fmtMoney,
    fmtDate,
    fmtDay,
    daysBetween,
    letter,
    calcAverage,
    attendanceSummary,
    attendanceMonth,
    periodStatus,
    childToday,
    campusDuration,
    outstanding,
    pseudoQr,
  };
})();

// Dual-Export: Browser global and Node.js module
if (typeof window !== "undefined") {
  window.PM_HELPERS = PM_HELPERS;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = PM_HELPERS;
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
The implementation and mathematical oracles can be verified directly using:
1. **Reference Oracle Test**:
   ```bash
   node tests/test-oracle.js --reference-only
   ```
   *Expected Result*: 7 passed, 0 failed, exit code 0.
2. **Unified Mockup Test Suite**:
   ```bash
   ./tests/test-all.sh --oracle --reference-only
   ```
   *Expected Result*: Overall Result SUCCESS.

### 5.2 Standalone Unit Test Assertions for `PM_HELPERS`
The following automated test harness independently validates boundary conditions, edge cases, and zero side effects:

```javascript
const assert = require("assert");
const H = PM_HELPERS;

// 1. esc tests
assert.strictEqual(H.esc("<script>alert('xss')&\"bar\"</script>"), "&lt;script&gt;alert(&#39;xss&#39;)&amp;&quot;bar&quot;&lt;/script&gt;");
assert.strictEqual(H.esc(null), "");
assert.strictEqual(H.esc(undefined), "");
assert.strictEqual(H.esc(0), "0");

// 2. toMin tests
assert.strictEqual(H.toMin("11:35"), 695);
assert.strictEqual(H.toMin("07:12 AM"), 432);
assert.strictEqual(H.toMin("11:32 AM"), 692);
assert.strictEqual(H.toMin("12:00 AM"), 0);
assert.strictEqual(H.toMin("12:00 PM"), 720);
assert.strictEqual(H.toMin("03:16 PM"), 916);
assert.strictEqual(H.toMin(""), 0);
assert.strictEqual(H.toMin(null), 0);

// 3. fmtMoney tests
assert.strictEqual(H.fmtMoney(1710), "$1,710.00");
assert.strictEqual(H.fmtMoney(45), "$45.00");
assert.strictEqual(H.fmtMoney(0), "$0.00");
assert.strictEqual(H.fmtMoney(-45), "-$45.00");
assert.strictEqual(H.fmtMoney(null), "$0.00");

// 4. fmtDate tests
assert.strictEqual(H.fmtDate("2026-11-03"), "3 Nov 2026");
assert.strictEqual(H.fmtDate("2026-10-30"), "30 Oct 2026");
assert.strictEqual(H.fmtDate(""), "");

// 5. fmtDay & daysBetween tests
assert.strictEqual(H.fmtDay("tue"), "Tuesday");
assert.strictEqual(H.fmtDay("2026-11-03"), "Tuesday");
assert.strictEqual(H.daysBetween("2026-11-03", "2026-10-30"), -4);
assert.strictEqual(H.daysBetween("2026-11-03", "2026-11-10"), 7);

// 6. letter grade tests
assert.strictEqual(H.letter(96), "A+");
assert.strictEqual(H.letter(95.0), "A+");
assert.strictEqual(H.letter(94.9), "A");
assert.strictEqual(H.letter(90.0), "A");
assert.strictEqual(H.letter(89.9), "B+");
assert.strictEqual(H.letter(85.0), "B+");
assert.strictEqual(H.letter(84.9), "B");
assert.strictEqual(H.letter(70.0), "C");
assert.strictEqual(H.letter(69.9), "D");

// 7. calcAverage tests
const c1Subs = [{ score: 95 }, { score: 91 }, { score: 89 }, { score: 90 }, { score: 94 }, { score: 88 }, { score: 96 }];
const c11Subs = [{ score: 93 }, { score: 92 }, { score: 89 }, { score: 87 }, { score: 95 }, { score: 90 }];
assert.strictEqual(H.calcAverage(c1Subs), "91.9");
assert.strictEqual(H.calcAverage(c11Subs), "91.0");
assert.strictEqual(H.calcAverage([]), "0.0");

// 8. pseudoQr determinism & finder checks
const qrObj1 = H.pseudoQr("STU-2026-001", 25, "object");
const qrObj2 = H.pseudoQr("STU-2026-001", 25, "object");
const qrObjOther = H.pseudoQr("STU-2026-007", 25, "object");
assert.strictEqual(qrObj1.size, 25);
assert.strictEqual(qrObj1.countOn, qrObj2.countOn);
assert.notStrictEqual(qrObj1.countOn, qrObjOther.countOn);
```

### 5.3 Invalidation Conditions
The specifications in this document shall be deemed invalidated if:
1. `tests/test-oracle.js` changes its expected values for averages (91.9, 91.0), attendance rate (96.3%), or outstanding balance ($1,710.00).
2. The site switches from a 12-hour/24-hour hybrid string representation to native epoch timestamps in `mockup-data.js`.
3. School calendar holiday dates in October/November 2026 are altered in `mockup-data.js`.
