/**
 * ==============================================================================
 * phone-mockup/mockup-app.js
 * Application Engine & State Machine for Phone App Mockup (Milestone 2)
 *
 * Strict Vanilla ES2020 · Zero Dependencies · In-Memory State Only
 * Dual-exported: Browser (window.PM_HELPERS) & Node.js (module.exports)
 * ==============================================================================
 */

(function () {
  "use strict";

  // ============================================================================
  // 1. BRANDING & DEVICE FRAME ADAPTATION (FROM M1)
  // ============================================================================

  function applyBrand() {
    try {
      const st = (typeof window !== "undefined" && window.SMS_STATE) || {};
      const sp = st.schoolProfile || (typeof window !== "undefined" && window.SMS_PRESETS && window.SMS_PRESETS["milky-way"]) || {};
      if (typeof document !== "undefined" && document.documentElement) {
        const root = document.documentElement.style;
        root.setProperty("--brand-primary", sp.primaryColor || "#0077b6");
        root.setProperty("--brand-primary-hover", sp.primaryHover || "#023e8a");
        root.setProperty("--brand-primary-light", sp.primaryLight || "#f0f9ff");
      }
      return {
        name: sp.shortName || "Milky Way School",
        nameKh: sp.nameKh || "សាលាមីគីវ៉េ"
      };
    } catch (e) {
      if (typeof console !== "undefined") console.warn("Failed to apply brand theme:", e);
      return { name: "Milky Way School", nameKh: "សាលាមីគីវ៉េ" };
    }
  }

  function fitDevice() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const W = 425;
    const H = 876;
    const s = Math.max(0.45, Math.min(1, (window.innerHeight - 80) / H, (window.innerWidth - 32) / W));
    const dev = document.getElementById("pmDevice");
    const wrap = document.getElementById("pmDeviceWrap");
    if (!dev || !wrap) return;
    dev.style.transform = `scale(${s})`;
    wrap.style.width = `${W * s}px`;
    wrap.style.height = `${H * s}px`;
  }

  // ============================================================================
  // 2. PURE COMPUTATION HELPERS (PM_HELPERS)
  // ============================================================================

  const getPMData = () => {
    if (typeof window !== "undefined" && window.PM_DATA) return window.PM_DATA;
    if (typeof global !== "undefined" && global.window && global.window.PM_DATA) return global.window.PM_DATA;
    return {};
  };

  const PM_HELPERS = {
    /**
     * 1. esc: Safely escape HTML special characters for template strings.
     */
    esc: function (str) {
      return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    /**
     * 2. toMin: Converts "HH:MM" (24h) or "hh:mm AM/PM" to minutes from midnight.
     */
    toMin: function (timeStr) {
      if (!timeStr || typeof timeStr !== "string") return 0;
      const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = (match[3] || "").toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    },

    /**
     * 3. fmtMoney: Formats number into USD currency format (e.g. 1710 -> "$1,710.00").
     */
    fmtMoney: function (amount) {
      const n = Number(amount || 0);
      if (isNaN(n)) return "$0.00";
      const absFormatted = Math.abs(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return (n < 0 ? "-$" : "$") + absFormatted;
    },

    /**
     * 4. fmtDate: Converts "YYYY-MM-DD" to "D Mon YYYY" (e.g. "2026-11-03" -> "3 Nov 2026").
     */
    fmtDate: function (isoStr) {
      if (!isoStr || typeof isoStr !== "string") return "";
      const parts = isoStr.trim().split("-");
      if (parts.length < 3) return isoStr;
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (!months[m] || isNaN(d)) return isoStr;
      return `${d} ${months[m]} ${y}`;
    },

    /**
     * 5. fmtDay: Converts day key ("mon".."sat") or ISO date to full weekday name.
     */
    fmtDay: function (dayKeyOrIso) {
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
    },

    /**
     * 6. daysBetween: Calendar days difference between two ISO dates (isoB - isoA).
     */
    daysBetween: function (isoA, isoB) {
      if (!isoA || !isoB) return 0;
      const pA = isoA.split("-").map(Number);
      const pB = isoB.split("-").map(Number);
      const msA = Date.UTC(pA[0], pA[1] - 1, pA[2]);
      const msB = Date.UTC(pB[0], pB[1] - 1, pB[2]);
      return Math.round((msB - msA) / 86400000);
    },

    /**
     * 7. letter: Authoritative grade scale (>=95 A+, >=90 A, >=85 B+, >=80 B, >=70 C, <70 D).
     */
    letter: function (score) {
      const s = Number(score || 0);
      if (s >= 95) return "A+";
      if (s >= 90) return "A";
      if (s >= 85) return "B+";
      if (s >= 80) return "B";
      if (s >= 70) return "C";
      return "D";
    },

    /**
     * 8. calcAverage: Computes mean of subject scores rounded to 1 decimal place.
     */
    calcAverage: function (subjects) {
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) return "0.0";
      const sum = subjects.reduce((acc, s) => acc + Number((s && s.score) || 0), 0);
      return (sum / subjects.length).toFixed(1);
    },

    /**
     * 9. attendanceSummary: Analyzes Oct & Nov attendance records for childId.
     */
    attendanceSummary: function (childId, D) {
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
    },

    /**
     * 10. attendanceMonth: Calendar day details for the monthly grid view.
     */
    attendanceMonth: function (childId, monthStr, D, demoIso = "2026-11-03") {
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
    },

    /**
     * 11. periodStatus: Evaluates period status ("past"|"now"|"next"|"upcoming") relative to 11:35 AM demo clock.
     */
    periodStatus: function (period, dayKey, allPeriods, demoMin = 695) {
      if (!period || dayKey !== "tue") return "";
      const sMin = PM_HELPERS.toMin(period.start);
      const eMin = PM_HELPERS.toMin(period.end);

      if (demoMin >= sMin && demoMin < eMin) return "now";
      if (demoMin >= eMin) return "past";

      if (period.isBreak) return "upcoming";

      if (Array.isArray(allPeriods)) {
        const nextPeriod = allPeriods.find((p) => !p.isBreak && PM_HELPERS.toMin(p.start) > demoMin);
        if (nextPeriod && nextPeriod.start === period.start && nextPeriod.subject === period.subject) {
          return "next";
        }
      }
      return "upcoming";
    },

    /**
     * 12. childToday: Calculates current campus status for child today.
     */
    childToday: function (childId, gateLog, demoIso = "2026-11-03") {
      const log = gateLog || (getPMData().gateLog || []);
      if (!Array.isArray(log)) return { onCampus: false, label: "Off campus", time: "" };

      const todayEvents = log
        .filter((e) => e.childId === childId && e.date === demoIso)
        .slice()
        .sort((a, b) => PM_HELPERS.toMin(a.time) - PM_HELPERS.toMin(b.time));

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
    },

    /**
     * 13. campusDuration: Computes duration on campus today ("4h 20m").
     */
    campusDuration: function (childId, gateLog, demoIso = "2026-11-03", demoMin = 695) {
      const log = gateLog || (getPMData().gateLog || []);
      if (!Array.isArray(log)) return "0h 00m";

      const events = log
        .filter((e) => e.childId === childId && e.date === demoIso)
        .slice()
        .sort((a, b) => PM_HELPERS.toMin(a.time) - PM_HELPERS.toMin(b.time));

      let totalMin = 0;
      let currentInMin = null;

      for (const e of events) {
        if (e.type === "in") {
          currentInMin = PM_HELPERS.toMin(e.time);
        } else if (e.type === "out" && currentInMin !== null) {
          totalMin += PM_HELPERS.toMin(e.time) - currentInMin;
          currentInMin = null;
        }
      }

      if (currentInMin !== null) {
        totalMin += Math.max(0, demoMin - currentInMin);
      }

      const hours = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      return `${hours}h ${mins}m`;
    },

    /**
     * 14. outstanding: Calculates total unpaid balance for child or whole family.
     */
    outstanding: function (childId, invoices) {
      const invs = invoices || (getPMData().invoices || []);
      if (!Array.isArray(invs)) return 0;

      return invs
        .filter((inv) => {
          const matchChild = childId === undefined || childId === null || inv.childId === childId;
          const isUnpaid = inv.status !== "Paid";
          return matchChild && isUnpaid;
        })
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    },

    /**
     * 15. pseudoQr: Deterministic pseudo-QR generator with 3 finder patterns.
     */
    pseudoQr: function (seedStr, size = 25, format = "html") {
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
  };

  // Expose PM_HELPERS
  if (typeof window !== "undefined") {
    window.PM_HELPERS = PM_HELPERS;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = PM_HELPERS;
  }

  // ============================================================================
  // 3. IN-MEMORY STATE MACHINE
  // ============================================================================

  const state = {
    view: "login",              // "login" | "app"
    role: "student",            // "student" | "parent"
    tab: "home",                // active tab
    activeChildId: 1,           // active child (1 = Chanreaksa, 11 = Chanpanha)
    childId: 1,                 // active child (synced with activeChildId)
    day: "tue",                 // active timetable day
    month: "2026-11",           // active attendance month ("2026-10" | "2026-11")
    alertFilter: "all",         // "all" | 1 | 11
    payFilter: "due",           // "due" | "paid"
    payChildFilter: "all",      // "all" | 1 | 11
    sheet: null,                // null | "account" | "child" | "pay" | "qr"
    pay: null,                  // null | { invoiceId, method, step, receiptNo }
    invoices: [],               // deep-cloned mutable invoice records
    gateLog: [],                // deep-cloned mutable gate log records
    signingIn: false,           // boolean submit loading state
    pushTimer: null             // setTimeout handle for parent push notification
  };

  function setActiveChild(childId) {
    const id = Number(childId);
    if (id === 1 || id === 11) {
      state.activeChildId = id;
      state.childId = id;
    }
  }

  function initState() {
    const D = getPMData();
    state.activeChildId = 1;
    state.childId = 1;
    state.payChildFilter = "all";
    state.invoices = D.invoices ? JSON.parse(JSON.stringify(D.invoices)) : [];
    state.gateLog = D.gateLog ? JSON.parse(JSON.stringify(D.gateLog)) : [];
    state.day = (D.demoNow && D.demoNow.dayKey) || "tue";
  }

  // ============================================================================
  // 4. UI RENDERERS
  // ============================================================================

  const esc = PM_HELPERS.esc;

  function renderLoginScreen() {
    const D = getPMData();
    const creds = (D.credentials && D.credentials[state.role]) || {
      username: state.role === "student" ? "stu_chanreaksa" : "par_vibol",
      password: "demo1234",
      label: state.role === "student" ? "Student ID or username" : "Phone number or username"
    };
    const brand = applyBrand();

    return `
      <div class="pm-body" style="display: flex; flex-direction: column; justify-content: space-between; padding: 24px 20px 24px; min-height: 100%;">
        <div>
          <!-- School Brand Header -->
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 12px; margin-bottom: 24px;">
            <div style="width: 72px; height: 72px; border-radius: 18px; background: #ffffff; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs); display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <img src="/uploads/school_logos/default_school_logo.svg" alt="School Logo" style="width: 44px; height: auto;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';">
              <i class="bi bi-mortarboard-fill" style="display: none; font-size: 32px; color: var(--brand-primary);"></i>
            </div>
            <div style="font-size: 20px; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em;">${esc(brand.name)}</div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">${esc(brand.nameKh)}</div>
          </div>

          <!-- Greeting -->
          <div style="margin-bottom: 20px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 700; color: var(--text-main); margin: 0 0 4px; letter-spacing: -0.025em;">Welcome back</h1>
            <p style="font-size: 13.5px; color: var(--text-muted); margin: 0;">Sign in to access your student or parent portal</p>
          </div>

          <!-- Role Segmented Control -->
          <div class="pm-seg" role="tablist" aria-label="Portal Role">
            <button type="button" class="pm-seg-btn ${state.role === 'student' ? 'active' : ''}" data-action="role" data-role="student" role="tab" aria-selected="${state.role === 'student'}">
              <i class="bi bi-mortarboard-fill"></i> Student
            </button>
            <button type="button" class="pm-seg-btn ${state.role === 'parent' ? 'active' : ''}" data-action="role" data-role="parent" role="tab" aria-selected="${state.role === 'parent'}">
              <i class="bi bi-people-fill"></i> Parent
            </button>
          </div>

          <!-- Login Form -->
          <form class="pm-login-form" data-action="signin" novalidate>
            <div class="pm-input-wrap">
              <label class="pm-input-label" for="pmLoginUsername">${esc(creds.label)}</label>
              <input
                class="pm-input"
                type="text"
                id="pmLoginUsername"
                name="username"
                value="${esc(creds.username)}"
                placeholder="${state.role === 'student' ? 'e.g. stu_chanreaksa' : 'e.g. par_vibol or 012 998 877'}"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                ${state.signingIn ? "disabled" : ""}
              >
              <div class="pm-input-error-text" id="pmUserError"></div>
            </div>

            <div class="pm-input-wrap">
              <label class="pm-input-label" for="pmLoginPassword">Password</label>
              <div style="position: relative;">
                <input
                  class="pm-input"
                  type="password"
                  id="pmLoginPassword"
                  name="password"
                  value="demo1234"
                  autocomplete="current-password"
                  style="padding-right: 44px;"
                  ${state.signingIn ? "disabled" : ""}
                >
                <button
                  type="button"
                  class="pm-pw-toggle"
                  data-action="toggle-pass"
                  aria-label="Toggle password visibility"
                  ${state.signingIn ? "disabled" : ""}
                >
                  <i class="bi bi-eye"></i>
                </button>
              </div>
              <div class="pm-input-error-text" id="pmPassError"></div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: -6px; margin-bottom: 20px;">
              <button
                type="button"
                class="pm-forgot-btn"
                data-action="forgot"
                ${state.signingIn ? "disabled" : ""}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" class="pm-btn-primary" id="pmLoginSubmit" ${state.signingIn ? "disabled" : ""}>
              ${state.signingIn
                ? '<span class="pm-spinner"></span> Signing in…'
                : `Sign in as ${state.role === 'student' ? 'Student' : 'Parent'}`
              }
            </button>

            <div style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 10px;">
              Demo account · credentials pre-filled
            </div>
          </form>
        </div>

        <!-- Footer branding -->
        <div style="text-align: center; font-size: 11px; color: var(--text-muted); padding-top: 20px;">
          Powered by Tele-ICT · v2.4
        </div>
      </div>
    `;
  }

  function renderAccountSheet() {
    const D = getPMData();
    const isStudent = state.role === "student";
    const user = isStudent
      ? (D.children && D.children[1]) || { nameEn: "Sok Chanreaksa", initials: "SC", className: "Grade 12-A · Science Track", cardId: "STU-2026-001" }
      : D.parent || { nameEn: "Sok Vibol", salutation: "Mr. Vibol", initials: "SV", phone: "012 998 877" };

    const displayName = isStudent ? user.nameEn : (user.salutation || user.nameEn);
    const subtitle = isStudent ? `${user.className} · ${user.cardId}` : `Father · ${user.phone}`;
    const initials = user.initials || (isStudent ? "SC" : "SV");

    return `
      <div class="pm-sheet-backdrop" data-action="close-sheet"></div>
      <div class="pm-sheet" role="dialog" aria-modal="true" aria-label="My Account">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-main);">My Account</h2>
          <button type="button" data-action="close-sheet" style="background: none; border: 0; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 4px;" aria-label="Close sheet">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- User Card -->
        <div class="pm-card" style="display: flex; gap: 14px; align-items: center; padding: 14px; margin-bottom: 16px;">
          <div class="pm-avatar" style="width: 48px; height: 48px; font-size: 16px;">
            ${initials}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${esc(displayName)}
            </div>
            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
              ${esc(subtitle)}
            </div>
            <div style="margin-top: 6px;">
              <span class="pm-pill brand">${isStudent ? "Student Portal" : "Parent Portal"}</span>
            </div>
          </div>
        </div>

        <!-- Account Info List -->
        <div class="pm-card pm-list" style="margin-bottom: 20px;">
          <div class="pm-row">
            <i class="bi bi-building" style="font-size: 17px; color: var(--text-muted);"></i>
            <div style="flex: 1; font-size: 13.5px; color: var(--text-secondary);">Campus</div>
            <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">Campus #01 · Sen Sok HQ</div>
          </div>
          <div class="pm-row">
            <i class="bi bi-shield-check" style="font-size: 17px; color: var(--text-muted);"></i>
            <div style="flex: 1; font-size: 13.5px; color: var(--text-secondary);">Portal Access</div>
            <span class="pm-pill success">Active</span>
          </div>
        </div>

        <!-- Sign Out Button -->
        <button
          type="button"
          class="pm-btn-ghost"
          data-action="signout"
          style="color: #d92d20; border-color: #fda29b; margin-bottom: 10px;"
        >
          <i class="bi bi-box-arrow-right"></i> Sign Out
        </button>

        <button type="button" class="pm-btn-primary" data-action="close-sheet">
          Done
        </button>
      </div>
    `;
  }

  function renderChildSheet() {
    const D = getPMData();
    const childIds = (D.parent && D.parent.childIds) || [1, 11];

    return `
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
          ${childIds.map((cId) => {
            const c = (D.children && D.children[cId]) || {};
            const isSelected = (state.activeChildId || state.childId) === c.id;
            return `
              <div
                class="pm-child-select-card ${isSelected ? 'active' : ''}"
                data-action="child"
                data-child="${c.id}"
                tabindex="0"
                role="button"
                aria-pressed="${isSelected}"
              >
                <div class="pm-avatar" style="width: 42px; height: 42px; font-size: 15px; background: ${c.color || 'var(--brand-primary)'}; color: #ffffff;">
                  ${c.initials || ''}
                </div>
                <div class="pm-child-select-info">
                  <div class="pm-child-select-name">${esc(c.nameEn || '')}</div>
                  <div class="pm-child-select-meta">${esc(c.classShort || '')} · ${esc(c.campus || 'Sen Sok Campus')}</div>
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
    `;
  }

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
      <div class="pm-sheet" role="dialog" aria-modal="true" aria-label="Campus Digital ID">
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
        <div class="pm-card pm-qr-badge" style="padding: 20px; text-align: center; background: #ffffff; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm); border-radius: 20px; margin-bottom: 20px;">
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

  function renderPaySheet() {
    if (!state.pay) return "";
    const inv = state.invoices.find((i) => i.id === state.pay.invoiceId);
    if (!inv) return "";

    const D = getPMData();
    const child = (D.children && D.children[inv.childId]) || {};
    const parent = D.parent || { nameEn: "Sok Vibol", id: 201 };
    const step = state.pay.step || "choose";

    return `
      <div class="pm-sheet-backdrop" data-action="close-sheet"></div>
      <div class="pm-sheet" role="dialog" aria-modal="true" aria-label="Pay Invoice">
        
        <!-- Sheet Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-main);">
              ${step === 'success' ? 'Payment Successful' : step === 'processing' ? 'Processing Payment' : 'Pay Invoice'}
            </h2>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${esc(inv.invoiceNo)} · ${esc(child.nameEn || '')}
            </div>
          </div>
          ${step !== 'processing' ? `
            <button type="button" data-action="close-sheet" style="background: none; border: 0; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 4px;" aria-label="Close sheet">
              <i class="bi bi-x-lg"></i>
            </button>
          ` : ''}
        </div>

        <!-- STEP 1: METHOD SELECTION -->
        ${step === 'choose' ? `
          <!-- Amount Card -->
          <div class="pm-card" style="padding: 14px; text-align: center; margin-bottom: 16px; background: var(--surface-bg);">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Amount Due</div>
            <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin: 4px 0 2px;">
              ${PM_HELPERS.fmtMoney(inv.amount)}
            </div>
            <div style="font-size: 12.5px; color: var(--text-secondary);">
              ${esc(inv.title)} · <span class="pm-pill ${inv.status === 'Overdue' ? 'danger' : 'brand'}">${esc(inv.status)}</span>
            </div>
          </div>

          <!-- Payment Method Options -->
          <div style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 10px;">
            Select Payment Method
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <!-- Bakong KHQR (Default) -->
            <div
              class="pm-card"
              data-action="pay-method"
              data-method="khqr"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-color: ${state.pay.method === 'khqr' ? 'var(--brand-primary)' : 'var(--border-subtle)'}; background: ${state.pay.method === 'khqr' ? 'var(--brand-primary-light)' : '#ffffff'}; transition: all 0.15s ease;"
            >
              <div style="width: 36px; height: 36px; border-radius: 9px; background: #e11b22; color: #ffffff; display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0;">
                KHQR
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">Bakong KHQR</div>
                <div style="font-size: 12px; color: var(--text-muted);">Scan & pay with any mobile banking app</div>
              </div>
              <input type="radio" name="payMethod" ${state.pay.method === 'khqr' ? 'checked' : ''} style="accent-color: var(--brand-primary); pointer-events: none;">
            </div>

            <!-- Dynamic Bakong QR Preview Box (Expanded when khqr is active) -->
            ${state.pay.method === 'khqr' ? `
              <div style="background: #ffffff; border: 1.5px solid #fed4d6; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 4px; box-shadow: var(--shadow-xs);">
                <div style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #e11b22; color: #ffffff; font-size: 11px; font-weight: 700; margin-bottom: 10px;">
                  <i class="bi bi-qr-code"></i> NBC BAKONG KHQR
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                  <div style="width: 170px; height: 170px; background: #ffffff; padding: 8px; border: 1px solid var(--border-subtle); border-radius: 8px;">
                    ${PM_HELPERS.pseudoQr(inv.invoiceNo, 21, 'html')}
                  </div>
                </div>
                <div style="font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">
                  Scan with ABA, ACLEDA, Wing, or Bakong App
                </div>
                <div style="font-size: 11px; color: var(--text-muted);">
                  Amount: ${PM_HELPERS.fmtMoney(inv.amount)} · Standard KHQR Merchant QR
                </div>
              </div>
            ` : ''}

            <!-- ABA PayWay -->
            <div
              class="pm-card"
              data-action="pay-method"
              data-method="aba"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-color: ${state.pay.method === 'aba' ? 'var(--brand-primary)' : 'var(--border-subtle)'}; background: ${state.pay.method === 'aba' ? 'var(--brand-primary-light)' : '#ffffff'}; transition: all 0.15s ease;"
            >
              <div style="width: 36px; height: 36px; border-radius: 9px; background: #004b87; color: #ffffff; display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0;">
                ABA
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">ABA PayWay</div>
                <div style="font-size: 12px; color: var(--text-muted);">ABA Mobile instant push notification</div>
              </div>
              <input type="radio" name="payMethod" ${state.pay.method === 'aba' ? 'checked' : ''} style="accent-color: var(--brand-primary); pointer-events: none;">
            </div>

            <!-- ACLEDA Mobile -->
            <div
              class="pm-card"
              data-action="pay-method"
              data-method="acleda"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-color: ${state.pay.method === 'acleda' ? 'var(--brand-primary)' : 'var(--border-subtle)'}; background: ${state.pay.method === 'acleda' ? 'var(--brand-primary-light)' : '#ffffff'}; transition: all 0.15s ease;"
            >
              <div style="width: 36px; height: 36px; border-radius: 9px; background: #0b3b60; color: #ffffff; display: grid; place-items: center; font-weight: 800; font-size: 11px; flex-shrink: 0;">
                ACLEDA
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">ACLEDA Mobile</div>
                <div style="font-size: 12px; color: var(--text-muted);">ACLEDA Mobile & X-Border QR</div>
              </div>
              <input type="radio" name="payMethod" ${state.pay.method === 'acleda' ? 'checked' : ''} style="accent-color: var(--brand-primary); pointer-events: none;">
            </div>
          </div>

          <button type="button" class="pm-btn-primary" data-action="pay-confirm" style="margin-bottom: 8px;">
            Pay ${PM_HELPERS.fmtMoney(inv.amount)}
          </button>
          <button type="button" class="pm-btn-ghost" data-action="close-sheet">
            Cancel
          </button>
        ` : ''}

        <!-- STEP 2: PROCESSING SIMULATION -->
        ${step === 'processing' ? `
          <div style="text-align: center; padding: 36px 12px 40px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid #e0f2fe; border-top-color: var(--brand-primary); animation: pmSpin 0.8s linear infinite; margin: 0 auto 18px;"></div>
            <div style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
              Processing Payment…
            </div>
            <div style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 4px;">
              Connecting to Bakong Settlement Network…
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Authorizing transaction with National Bank of Cambodia (NBC)
            </div>
          </div>
        ` : ''}

        <!-- STEP 3: SUCCESS & DIGITAL RECEIPT -->
        ${step === 'success' ? `
          <div style="text-align: center; padding: 8px 0 10px;">
            <!-- Celebration checkmark -->
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf3; color: #027a48; display: grid; place-items: center; font-size: 32px; margin: 0 auto 12px; animation: pmPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
              <i class="bi bi-check-lg"></i>
            </div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
              Payment Successful!
            </div>
            <div style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px;">
              Transaction authorized by National Bank of Cambodia
            </div>

            <!-- Digital Receipt Card -->
            <div class="pm-card pm-list" style="text-align: left; margin-bottom: 16px;">
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Receipt No</span>
                <span style="font-size: 13px; font-weight: 700; font-family: var(--font-mono); color: var(--text-main);">${esc(state.pay.receiptNo)}</span>
              </div>
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Paid Amount</span>
                <span style="font-size: 15px; font-weight: 800; color: #027a48;">${PM_HELPERS.fmtMoney(inv.amount)}</span>
              </div>
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Payment Method</span>
                <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${esc(inv.method)}</span>
              </div>
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Date & Time</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--text-main);">${PM_HELPERS.fmtDate("2026-11-03")}, 11:35 AM</span>
              </div>
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Billed To</span>
                <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${esc(parent.nameEn)} (Parent ID #${parent.id})</span>
              </div>
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Student</span>
                <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${esc(child.nameEn)} (${esc(child.classShort)})</span>
              </div>
              <div class="pm-row">
                <span style="font-size: 13px; color: var(--text-muted);">Status</span>
                <span class="pm-pill success"><i class="bi bi-check-circle-fill"></i> Paid in Full</span>
              </div>
            </div>

            <!-- Balance Reduction Callout -->
            <div class="pm-payment-balance-callout" style="background: #ecfdf3; border: 1px solid #a6f4c5; border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; text-align: left;">
              <i class="bi bi-shield-check" style="font-size: 20px; color: #027a48; flex-shrink: 0;"></i>
              <div style="font-size: 12.5px; color: #027a48; line-height: 1.3;">
                Family balance updated to <strong>${PM_HELPERS.fmtMoney(PM_HELPERS.outstanding(null, state.invoices))}</strong>. Overdue alert cleared.
              </div>
            </div>

            <button type="button" class="pm-btn-primary" data-action="pay-done">
              Done
            </button>
          </div>
        ` : ''}

      </div>
    `;
  }

  function renderTabBar() {
    const isStudent = state.role === "student";

    if (isStudent) {
      return `
        <nav class="pm-tabbar" role="tablist" aria-label="Student Navigation">
          <button type="button" class="pm-tab ${state.tab === 'home' ? 'active' : ''}" data-action="tab" data-tab="home" role="tab" aria-selected="${state.tab === 'home'}">
            <i class="bi bi-house-door-fill"></i>
            <span>Home</span>
          </button>
          <button type="button" class="pm-tab ${state.tab === 'schedule' ? 'active' : ''}" data-action="tab" data-tab="schedule" role="tab" aria-selected="${state.tab === 'schedule'}">
            <i class="bi bi-calendar3"></i>
            <span>Schedule</span>
          </button>
          <button type="button" class="pm-tab ${state.tab === 'report' ? 'active' : ''}" data-action="tab" data-tab="report" role="tab" aria-selected="${state.tab === 'report'}">
            <i class="bi bi-mortarboard-fill"></i>
            <span>Report</span>
          </button>
          <button type="button" class="pm-tab ${state.tab === 'attendance' ? 'active' : ''}" data-action="tab" data-tab="attendance" role="tab" aria-selected="${state.tab === 'attendance'}">
            <i class="bi bi-check2-circle"></i>
            <span>Attendance</span>
          </button>
          <button type="button" class="pm-tab ${state.tab === 'checkin' ? 'active' : ''}" data-action="tab" data-tab="checkin" role="tab" aria-selected="${state.tab === 'checkin'}">
            <i class="bi bi-qr-code-scan"></i>
            <span>Check-in</span>
          </button>
        </nav>
      `;
    }

    // Parent Tab Bar
    const unreadCount = state.gateLog.filter((g) => g.unread).length;
    const hasOverdue = state.invoices.some((i) => i.status === "Overdue");
    return `
      <nav class="pm-tabbar" role="tablist" aria-label="Parent Navigation">
        <button type="button" class="pm-tab ${state.tab === 'home' ? 'active' : ''}" data-action="tab" data-tab="home" role="tab" aria-selected="${state.tab === 'home'}">
          <i class="bi bi-house-door-fill"></i>
          <span>Home</span>
        </button>
        <button type="button" class="pm-tab ${state.tab === 'alerts' ? 'active' : ''}" data-action="tab" data-tab="alerts" role="tab" aria-selected="${state.tab === 'alerts'}">
          <i class="bi bi-bell-fill"></i>
          ${unreadCount > 0 ? `<span class="pm-tab-badge">${unreadCount}</span>` : ''}
          <span>Alerts</span>
        </button>
        <button type="button" class="pm-tab ${state.tab === 'scores' ? 'active' : ''}" data-action="tab" data-tab="scores" role="tab" aria-selected="${state.tab === 'scores'}">
          <i class="bi bi-journal-check"></i>
          <span>Scores</span>
        </button>
        <button type="button" class="pm-tab ${state.tab === 'schedule' ? 'active' : ''}" data-action="tab" data-tab="schedule" role="tab" aria-selected="${state.tab === 'schedule'}">
          <i class="bi bi-calendar3"></i>
          <span>Schedule</span>
        </button>
        <button type="button" class="pm-tab ${state.tab === 'payments' ? 'active' : ''}" data-action="tab" data-tab="payments" role="tab" aria-selected="${state.tab === 'payments'}">
          <i class="bi bi-credit-card-fill"></i>
          ${hasOverdue ? '<span class="pm-tab-dot" aria-label="Overdue payment warning"></span>' : ''}
          <span>Payments</span>
        </button>
      </nav>
    `;
  }

  const SUBJECT_METADATA = {
    "English":                  { code: "ENG-101", credits: 4, teacher: "Ms. Bopha Pich" },
    "Academic English":         { code: "ENG-101", credits: 4, teacher: "Ms. Bopha Pich" },
    "Khmer Literature":         { code: "KHM-101", credits: 5, teacher: "Ms. Sreyneang Meas" },
    "Mathematics":              { code: "MAT-101", credits: 6, teacher: "Dr. Sokha Chan" },
    "Physics":                  { code: "PHY-201", credits: 5, teacher: "Mr. Dara Vong" },
    "Chemistry":                { code: "CHM-201", credits: 5, teacher: "Mr. Vannak Keo" },
    "Biology":                  { code: "BIO-201", credits: 4, teacher: "Mr. Vannak Keo" },
    "History":                  { code: "HIS-101", credits: 3, teacher: "Ms. Sreyneang Meas" },
    "Social Studies & History": { code: "HIS-101", credits: 3, teacher: "Ms. Sreyneang Meas" },
    "Computer Science & AI":    { code: "CSI-301", credits: 4, teacher: "Mr. Dara Vong" },
    // Child 11 Cambridge IEP Support
    "Cambridge Math":           { code: "CAM-M7",  credits: 5, teacher: "Mr. James Carter" },
    "Cambridge English":        { code: "CAM-E7",  credits: 5, teacher: "Ms. Bopha Pich" },
    "Cambridge Science":        { code: "CAM-S7",  credits: 4, teacher: "Mr. Vannak Keo" },
    "Khmer Language":           { code: "KHM-7",   credits: 4, teacher: "Ms. Sreyneang Meas" },
    "Computing":                { code: "CMP-7",   credits: 3, teacher: "Mr. Dara Vong" },
    "Global Perspectives":      { code: "GLP-7",   credits: 3, teacher: "Ms. Lina Park" }
  };

  function getGradeClasses(score) {
    const l = PM_HELPERS.letter(score);
    switch (l) {
      case "A+": return { letter: "A+", pill: "grade-aplus", bar: "bar-aplus", color: "#12b76a" };
      case "A":  return { letter: "A",  pill: "grade-a",     bar: "bar-a",     color: "#027a48" };
      case "B+": return { letter: "B+", pill: "grade-bplus", bar: "bar-bplus", color: "#0077b6" };
      case "B":  return { letter: "B",  pill: "grade-b",     bar: "bar-b",     color: "#026aa2" };
      case "C":  return { letter: "C",  pill: "grade-c",     bar: "bar-c",     color: "#b54708" };
      default:   return { letter: "D",  pill: "grade-d",     bar: "bar-d",     color: "#b42318" };
    }
  }

  function getTeacherMeta(teacherName) {
    if (!teacherName) return { initials: "FA", dept: "Faculty Advisor" };
    const name = teacherName.trim();
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

  function renderReportContent(childId = 1) {
    const D = getPMData();
    const child = (D.children && D.children[childId]) || (D.children && D.children[1]) || {};
    const rep = (D.reports && D.reports[childId]) || { gpa: "3.85", rank: "2 of 31", subjects: [], recent: [] };
    const avg = PM_HELPERS.calcAverage(rep.subjects);
    const tMeta = getTeacherMeta(rep.teacher);

    return `
      <!-- Header Meta Row: Class & Academic Year -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: -6px; margin-bottom: 14px;">
        <span class="pm-pill neutral" style="font-size: 12px; font-weight: 600;">
          <i class="bi bi-mortarboard-fill" style="margin-right: 4px; color: var(--brand-primary);"></i> Class ${esc(child.classShort || "G12-A")}
        </span>
        <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
          Academic Year 2026–2027
        </span>
      </div>

      <!-- GPA & Average Score Overview Card -->
      <div class="pm-card" style="display: flex; align-items: center; gap: 16px; padding: 18px; margin-bottom: 16px;">
        <!-- Circular Progress Average Ring for 91.9 -->
        <div
          class="pm-ring"
          style="background: conic-gradient(var(--brand-primary) calc(${avg} * 3.6deg), #eaecf0 0deg); width: 88px; height: 88px; flex-shrink: 0;"
          aria-label="Overall average score: ${avg}"
        >
          <div class="pm-ring-content">
            <div class="pm-score-val" style="font-size: 21px; font-weight: 800; color: var(--text-main); line-height: 1.1; letter-spacing: -0.02em;">
              ${avg}
            </div>
            <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 2px;">
              Average
            </div>
          </div>
        </div>

        <!-- Overview Stats Column -->
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span class="pm-pill success" style="font-size: 11px; padding: 2px 8px;">
              <i class="bi bi-patch-check-fill" style="margin-right: 3px;"></i> Midterm published
            </span>
          </div>
          <div style="display: flex; gap: 14px; margin-top: 4px;">
            <div class="pm-stat-box">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Term GPA</div>
              <div class="val" style="font-size: 22px; font-weight: 800; color: var(--brand-primary); line-height: 1.2;">
                ${esc(rep.gpa || "3.85")}
              </div>
            </div>
            <div style="width: 1px; background: var(--border-subtle); margin: 2px 0;"></div>
            <div>
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Class Rank</div>
              <div style="font-size: 18px; font-weight: 700; color: var(--text-main); line-height: 1.3;">
                ${esc(rep.rank || "2 of 31")}
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">students</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subject Breakdown Section -->
      <div class="pm-section-label" style="display: flex; justify-content: space-between; align-items: center;">
        <span>Subject Breakdown</span>
        <span style="font-size: 11px; text-transform: none; font-weight: 500; color: var(--text-muted);">
          ${rep.subjects ? rep.subjects.length : 7} subjects
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
        ${(rep.subjects || []).map((s) => {
          const meta = SUBJECT_METADATA[s.name] || {
            code: s.code || "GEN-100",
            credits: s.credits || 4,
            teacher: s.teacher || "Instructor"
          };
          const gradeInfo = getGradeClasses(s.score);

          return `
            <div class="pm-card pm-subject-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                    <span style="font-size: 10.5px; font-family: var(--font-mono); font-weight: 600; color: var(--text-muted); background: #f2f4f7; padding: 1px 5px; border-radius: 4px;">
                      ${esc(meta.code)}
                    </span>
                    <span style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">
                      ${esc(s.name)}
                    </span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                    ${esc(meta.teacher)} · <span style="color: var(--text-muted);">${meta.credits} credits</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14.5px; font-weight: 800; color: var(--text-main); font-variant-numeric: tabular-nums;">
                    ${s.score}<span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">/100</span>
                  </span>
                  <span class="pm-letter-pill ${gradeInfo.pill}">
                    ${gradeInfo.letter}
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="pm-score-bar-track">
                <div
                  class="pm-score-bar ${gradeInfo.bar}"
                  style="width: ${Math.min(100, Math.max(0, s.score))}%;"
                  role="progressbar"
                  aria-valuenow="${s.score}"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Recent Assessments Section -->
      <div class="pm-section-label" style="display: flex; justify-content: space-between; align-items: center;">
        <span>Recent Assessments</span>
        <span style="font-size: 11px; text-transform: none; font-weight: 500; color: var(--text-muted);">Quizzes & Tests</span>
      </div>

      <div class="pm-card pm-list" style="margin-bottom: 18px;">
        ${(rep.recent || []).map((a) => {
          const pct = Math.round((a.score / a.max) * 100);
          const l = PM_HELPERS.letter(pct);
          const dateParts = String(a.date || "").split(" ");
          const dayNum = dateParts[0] || "";
          const monthTxt = dateParts[1] || "";

          return `
            <div class="pm-row" style="padding: 12px 14px;">
              <div style="width: 38px; height: 38px; border-radius: 9px; background: #f2f4f7; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--text-main); line-height: 1;">${esc(dayNum)}</span>
                <span style="font-size: 9px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); line-height: 1; margin-top: 2px;">${esc(monthTxt)}</span>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${esc(a.title)}
                </div>
                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px;">
                  ${esc(a.subject)}
                </div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main); font-variant-numeric: tabular-nums;">
                  ${a.score}<span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">/${a.max}</span>
                </div>
                <span class="pm-pill ${pct >= 90 ? 'success' : pct >= 80 ? 'brand' : 'warning'}" style="font-size: 10px; padding: 1px 6px; margin-top: 2px;">
                  ${pct}% · ${l}
                </span>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Homeroom Teacher Evaluation Card -->
      <div class="pm-section-label">Homeroom Teacher Evaluation</div>
      <div class="pm-card" style="padding: 16px; margin-bottom: 18px; position: relative; overflow: hidden;">
        <i class="bi bi-quote" style="position: absolute; right: 10px; bottom: -8px; font-size: 72px; color: rgba(0, 119, 182, 0.07); pointer-events: none;"></i>

        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
          <div class="pm-avatar pm-comment-avatar" style="width: 40px; height: 40px; font-size: 14px; background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover)); color: #ffffff; flex-shrink: 0; box-shadow: var(--shadow-xs);">
            ${tMeta.initials}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="pm-comment-author" style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">${esc(rep.teacher || "Dr. Sokha Chan")}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${esc(tMeta.dept)}</div>
          </div>
          <span class="pm-pill brand" style="font-size: 10.5px;">Faculty Remarks</span>
        </div>

        <div style="position: relative; padding-left: 12px; border-left: 3px solid var(--brand-primary); margin: 10px 0 12px;">
          <p style="font-size: 13px; color: var(--text-main); font-style: italic; line-height: 1.5; margin: 0;">
            &ldquo;${esc(rep.comment || "Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort.")}&rdquo;
          </p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #f2f4f7; font-size: 11px; color: var(--text-muted);">
          <span>Evaluation Period: Midterm 2026</span>
          <span style="display: inline-flex; align-items: center; gap: 4px; color: #027a48; font-weight: 600;">
            <i class="bi bi-shield-check"></i> Faculty Endorsed
          </span>
        </div>
      </div>

      <!-- PDF Download Simulation Button -->
      <button
        type="button"
        class="pm-btn-ghost"
        data-action="pdf-toast"
        style="margin-bottom: 24px;"
        aria-label="Download midterm evaluation report as PDF"
      >
        <i class="bi bi-file-earmark-pdf-fill" style="color: #d92d20; font-size: 18px;"></i>
        <span>Download report (PDF)</span>
      </button>
    `;
  }

  function renderChildContextBar(child) {
    if (!child) return "";
    return `
      <div class="pm-child-context-bar" style="margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 12px; box-shadow: var(--shadow-xs);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="pm-child-dot" style="width: 28px; height: 28px; border-radius: 50%; background: ${child.id === 1 ? 'var(--brand-primary)' : '#7a5af8'}; color: #ffffff; font-size: 11px; font-weight: 700; display: grid; place-items: center;">
            ${child.initials || (child.id === 1 ? 'SC' : 'SP')}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">
            Viewing <span style="font-weight: 700;">${esc(child.nameEn)}</span> · ${esc(child.classShort)}
          </div>
        </div>
        <button type="button" class="pm-chip" data-action="sheet" data-sheet="child" style="padding: 4px 10px; font-size: 12px; font-weight: 600; height: auto;">
          Change <i class="bi bi-chevron-down" style="font-size: 10px; margin-left: 2px;"></i>
        </button>
      </div>
    `;
  }

  function renderScheduleContent(childId = 1) {
    const D = getPMData();
    const weekDays = [
      { key: "mon", label: "Mon", date: 2, isToday: false },
      { key: "tue", label: "Tue", date: 3, isToday: true },
      { key: "wed", label: "Wed", date: 4, isToday: false },
      { key: "thu", label: "Thu", date: 5, isToday: false },
      { key: "fri", label: "Fri", date: 6, isToday: false },
      { key: "sat", label: "Sat", date: 7, isToday: false },
    ];

    const periods = (D.timetables && D.timetables[childId] && D.timetables[childId][state.day]) || [];

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
                <i class="bi ${p.label && p.label.toLowerCase().includes('lunch') ? 'bi-cup-hot' : 'bi-pause-circle'}" style="margin-right: 6px; font-size: 13px;"></i>
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

  function renderStudentTabContent() {
    const D = getPMData();
    const child = (D.children && D.children[1]) || { nameEn: "Sok Chanreaksa", cardId: "STU-2026-001", classShort: "G12-A", first: "Chanreaksa" };
    const rep = (D.reports && D.reports[1]) || { gpa: "3.85", rank: "2 of 31", subjects: [], recent: [] };
    const att = PM_HELPERS.attendanceSummary(1, D);
    const durationStr = PM_HELPERS.campusDuration(1, state.gateLog);
    const todayStatus = PM_HELPERS.childToday(1, state.gateLog);

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
        <!-- Student Context Sub-Header Badge -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: -6px; margin-bottom: 14px;">
          <span class="pm-pill neutral" style="font-size: 12px; font-weight: 600;">
            <i class="bi bi-mortarboard-fill" style="margin-right: 4px; color: var(--brand-primary);"></i> ${esc(child.classShort || "G12-A")} · High School
          </span>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
            ${(D.demoNow && D.demoNow.dateLabel) || "Tuesday, 3 November"}
          </span>
        </div>

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
                  <i class="bi ${p.label && p.label.toLowerCase().includes('lunch') ? 'bi-cup-hot' : 'bi-pause-circle'}" style="margin-right: 6px; font-size: 13px;"></i>
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

    if (state.tab === "schedule") {
      return renderScheduleContent(1);
    }

    if (state.tab === "report") {
      return renderReportContent(1);
    }

    if (state.tab === "attendance") {
      const currentMonth = state.month || "2026-11";
      const grid = PM_HELPERS.attendanceMonth(1, currentMonth, D);

      const isOct = currentMonth === "2026-10";
      const monthTitle = isOct ? "October 2026" : "November 2026";

      const [yStr, mStr] = currentMonth.split("-");
      const firstDow = new Date(Date.UTC(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1)).getUTCDay();

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
          <div class="pm-cal pm-calendar-grid">
            <!-- Leading empty spacer cells -->
            ${Array.from({ length: firstDow }).map(() => `
              <div class="pm-cal-cell pm-calendar-cell" aria-hidden="true" style="opacity: 0;"></div>
            `).join("")}

            <!-- Days of Month -->
            ${grid.map((g) => {
              let dotHtml = "";
              let labelClass = "";
              let badgeHtml = "";

              if (g.status === "present") {
                dotHtml = `<span class="pm-cal-dot pm-calendar-dot" style="background: #12b76a;" title="Present"></span>`;
              } else if (g.status === "late") {
                dotHtml = `<span class="pm-cal-dot pm-calendar-dot" style="background: #f79009;" title="Late"></span>`;
              } else if (g.status === "excused") {
                dotHtml = `<span class="pm-cal-dot pm-calendar-dot" style="background: #2e90fa;" title="Excused"></span>`;
              } else if (g.status === "absent") {
                dotHtml = `<span class="pm-cal-dot pm-calendar-dot" style="background: #f04438;" title="Absent"></span>`;
              } else if (g.status === "holiday") {
                labelClass = "color: var(--text-muted);";
                badgeHtml = `<span style="font-size: 9px; font-weight: 700; color: #b54708; background: #fffaeb; border-radius: 3px; padding: 0 3px; line-height: 1.1; margin-top: 1px;">H</span>`;
              } else if (g.status === "weekend" || g.status === "future") {
                labelClass = "color: #98a2b3;";
              }

              return `
                <div class="pm-cal-cell pm-calendar-cell ${g.isToday ? 'today' : ''}" style="min-height: 38px;">
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
        <div class="pm-card pm-list" style="margin-bottom: 20px;">
          ${nonPresentRecords.length > 0 ? nonPresentRecords.map((g) => {
            const isLate = g.status === "late";
            const isExcused = g.status === "excused";
            const pillClass = isLate ? "warning" : isExcused ? "info" : "danger";
            const pillLabel = isLate ? "Late" : isExcused ? "Excused" : "Absent";
            const dateFormatted = `${g.dow === 1 ? 'Mon' : g.dow === 2 ? 'Tue' : g.dow === 3 ? 'Wed' : g.dow === 4 ? 'Thu' : g.dow === 5 ? 'Fri' : 'Sat'}, ${g.day} ${isOct ? 'Oct' : 'Nov'} 2026`;
            
            let reasonText = g.note || "";
            if (!reasonText) {
              if (isOct && g.day === 8) reasonText = "07:41 AM · 11 min late · Traffic delay";
              else if (isOct && g.day === 21) reasonText = "07:38 AM · 8 min late · Heavy rain delay";
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

    if (state.tab === "checkin") {
      const todayLogs = state.gateLog.filter((g) => g.childId === 1 && g.date === "2026-11-03");

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
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
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

    return "";
  }

  function renderParentTabContent() {
    const D = getPMData();
    const activeChildId = state.activeChildId || state.childId || 1;
    const activeChild = (D.children && D.children[activeChildId]) || (D.children && D.children[1]) || {};
    const totalOut = PM_HELPERS.outstanding(null, state.invoices);

    if (state.tab === "home") {
      const c1 = (D.children && D.children[1]) || {};
      const c11 = (D.children && D.children[11]) || {};
      const c1Status = PM_HELPERS.childToday(1, state.gateLog);
      const c11Status = PM_HELPERS.childToday(11, state.gateLog);
      const c1Att = PM_HELPERS.attendanceSummary(1, D);
      const c11Att = PM_HELPERS.attendanceSummary(11, D);
      const c1Rep = (D.reports && D.reports[1]) || { gpa: "0.0", subjects: [] };
      const c11Rep = (D.reports && D.reports[11]) || { gpa: "0.0", subjects: [] };
      const c1Avg = PM_HELPERS.calcAverage(c1Rep.subjects);
      const c11Avg = PM_HELPERS.calcAverage(c11Rep.subjects);

      const overdueInvoice = state.invoices.find((i) => i.status === "Overdue");
      const dueInvoices = state.invoices.filter((i) => i.status === "Due").slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const nextInvoice = dueInvoices[0];
      const nextChild = nextInvoice ? (D.children && D.children[nextInvoice.childId]) : null;

      // Latest 3 gate events chronologically descending
      const recentGateEvents = state.gateLog
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date) || PM_HELPERS.toMin(b.time) - PM_HELPERS.toMin(a.time))
        .slice(0, 3);

      return `
        <!-- Children Overview Cards -->
        <div class="pm-section-label">My Children</div>
        <div class="pm-children-cards">
          ${[1, 11].map((cId) => {
            const c = (D.children && D.children[cId]) || {};
            const status = cId === 1 ? c1Status : c11Status;
            const att = cId === 1 ? c1Att : c11Att;
            const rep = cId === 1 ? c1Rep : c11Rep;
            const avg = cId === 1 ? c1Avg : c11Avg;
            const track = c.className && c.className.includes("·") ? c.className.split("·")[1].trim() : (cId === 1 ? "Science Track" : "IEP Track");

            return `
              <div class="pm-child-card child-${cId}">
                <div class="pm-child-card-header">
                  <div class="pm-child-card-profile">
                    <div class="pm-avatar pm-avatar-sm" style="background: ${c.color || (cId === 1 ? 'var(--brand-primary)' : '#7a5af8')};">
                      ${c.initials || (cId === 1 ? 'SC' : 'SP')}
                    </div>
                    <div>
                      <div class="pm-child-card-name">${esc(c.nameEn)}</div>
                      <div class="pm-child-card-sub">${esc(c.classShort)} · ${esc(track)}</div>
                    </div>
                  </div>
                  <span class="pm-pill ${status.onCampus ? 'success' : 'warning'}">
                    <i class="bi ${status.onCampus ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'}"></i>
                    ${esc(status.label)}
                  </span>
                </div>

                <div class="pm-child-card-metrics">
                  <div class="pm-child-metric">
                    <div class="pm-child-metric-val">${Number(att.rate).toFixed(1)}%</div>
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

        <!-- Next Payment Due Card -->
        <div class="pm-section-label" style="margin-top: 16px;">Tuition & Invoicing</div>
        <div class="pm-card pm-payment-card" style="margin-bottom: 16px;">
          ${overdueInvoice ? `
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

          <div class="pm-payment-body">
            <div class="pm-payment-eyebrow">Next Payment Due</div>
            <div class="pm-payment-amount-row">
              <div class="pm-payment-amount">${PM_HELPERS.fmtMoney(nextInvoice ? nextInvoice.amount : totalOut)}</div>
              <span class="pm-pill ${overdueInvoice ? 'danger' : 'warning'}">
                <i class="bi bi-clock"></i> ${overdueInvoice ? 'Action Required' : 'Due 10 Nov'}
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

        <!-- Latest Gate Alerts Widget -->
        <div class="pm-section-header">
          <span class="pm-section-label" style="margin: 0;">Latest Gate Alerts</span>
          <button type="button" class="pm-link-btn" data-action="tab" data-tab="alerts">
            See all <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <div class="pm-card pm-list pm-gate-widget" style="margin-bottom: 20px;">
          ${recentGateEvents.map((event) => {
            const child = (D.children && D.children[event.childId]) || {};
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
                    ${esc(event.gate)} · ${esc(event.note || event.method)}
                  </div>
                </div>
                <div class="pm-gate-feed-time">
                  ${esc(event.time)}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    if (state.tab === "alerts") {
      const allLogs = state.gateLog.slice().sort((a, b) => b.date.localeCompare(a.date) || PM_HELPERS.toMin(b.time) - PM_HELPERS.toMin(a.time));
      const filteredLogs = allLogs.filter((l) => {
        if (state.alertFilter === "all") return true;
        return l.childId === state.alertFilter;
      });

      const todayLogs = state.gateLog.filter((l) => l.date === ((D.demoNow && D.demoNow.iso) || "2026-11-03"));
      const totalCount = todayLogs.length;
      const c1Count = todayLogs.filter((l) => l.childId === 1).length;
      const c11Count = todayLogs.filter((l) => l.childId === 11).length;

      // Group filtered logs by date
      const dateMap = {};
      filteredLogs.forEach((l) => {
        if (!dateMap[l.date]) dateMap[l.date] = [];
        dateMap[l.date].push(l);
      });

      const dates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));

      const getDateLabel = (dateStr) => {
        if (dateStr === "2026-11-03") return "Today, 3 Nov 2026";
        if (dateStr === "2026-11-02") return "Yesterday, 2 Nov 2026";
        return PM_HELPERS.fmtDate(dateStr);
      };

      return `
        <!-- Instant Gate Notifications Settings Card -->
        <div class="pm-card pm-list" style="margin-bottom: 16px;">
          <div style="padding: 12px 14px 6px;">
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">Instant Gate Notifications</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Receive push notifications upon campus entry and exit</div>
          </div>
          <div class="pm-row" style="padding: 10px 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="pm-child-switcher-dot" style="background: var(--brand-primary); width: 26px; height: 26px; font-size: 11px;">SC</div>
              <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">Sok Chanreaksa</div>
            </div>
            <label class="pm-switch" aria-label="Toggle notifications for Chanreaksa">
              <input type="checkbox" checked data-action="toggle-notify" data-child="1">
              <span class="pm-slider"></span>
            </label>
          </div>
          <div class="pm-row" style="padding: 10px 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="pm-child-switcher-dot" style="background: #7a5af8; width: 26px; height: 26px; font-size: 11px;">SP</div>
              <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">Sok Chanpanha</div>
            </div>
            <label class="pm-switch" aria-label="Toggle notifications for Chanpanha">
              <input type="checkbox" checked data-action="toggle-notify" data-child="11">
              <span class="pm-slider"></span>
            </label>
          </div>
        </div>

        <!-- Filter Chips with dynamic counts -->
        <div class="pm-chips" role="tablist" aria-label="Alert Filters">
          <button type="button" class="pm-chip ${state.alertFilter === 'all' ? 'active' : ''}" data-action="alert-filter" data-filter="all">
            All (${totalCount})
          </button>
          <button type="button" class="pm-chip ${state.alertFilter === 1 ? 'active' : ''}" data-action="alert-filter" data-filter="1">
            Chanreaksa (${c1Count})
          </button>
          <button type="button" class="pm-chip ${state.alertFilter === 11 ? 'active' : ''}" data-action="alert-filter" data-filter="11">
            Chanpanha (${c11Count})
          </button>
        </div>

        <!-- Date-Grouped Event Feed -->
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          ${dates.map((dateStr) => {
            const events = dateMap[dateStr];
            return `
              <div>
                <div class="pm-section-label" style="margin-bottom: 6px;">
                  ${esc(getDateLabel(dateStr))}
                </div>
                <div class="pm-card pm-list">
                  ${events.map((l) => {
                    const childObj = (D.children && D.children[l.childId]) || {};
                    const isIn = l.type === "in";
                    return `
                      <div class="pm-row ${l.unread ? 'unread' : ''}">
                        <div class="pm-gate-feed-icon ${isIn ? 'in' : 'out'}">
                          <i class="bi ${isIn ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'}"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">
                            ${esc(childObj.nameEn || '')} · ${isIn ? 'Check-in' : 'Check-out'}
                          </div>
                          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            ${esc(l.gate)} · ${esc(l.note || l.method)}
                          </div>
                        </div>
                        <div style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); text-align: right;">
                          ${esc(l.time)}
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            `;
          }).join("") || `
            <div class="pm-card" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
              No gate alerts found for this filter.
            </div>
          `}
        </div>
      `;
    }

    if (state.tab === "scores") {
      return `
        ${renderChildContextBar(activeChild)}
        ${renderReportContent(activeChildId)}
      `;
    }

    if (state.tab === "schedule") {
      return `
        ${renderChildContextBar(activeChild)}
        ${renderScheduleContent(activeChildId)}
      `;
    }

    if (state.tab === "payments") {
      const childFilter = state.payChildFilter || "all";
      const totalOut = PM_HELPERS.outstanding(childFilter === "all" ? null : childFilter, state.invoices);
      
      const filteredInvoices = state.invoices.filter((i) => {
        if (childFilter === "all") return true;
        return i.childId === childFilter;
      });

      const dueInvoices = filteredInvoices.filter((i) => i.status !== "Paid");
      const paidInvoices = filteredInvoices.filter((i) => i.status === "Paid");

      const overdueInvoices = dueInvoices.filter((i) => i.status === "Overdue");
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
      const upcomingAmount = Math.max(0, totalOut - overdueAmount);

      const displayInvoices = state.payFilter === "due" ? dueInvoices.slice() : paidInvoices.slice();
      // Sort due: Overdue first, then by dueDate
      if (state.payFilter === "due") {
        displayInvoices.sort((a, b) => {
          if (a.status === "Overdue" && b.status !== "Overdue") return -1;
          if (b.status === "Overdue" && a.status !== "Overdue") return 1;
          return a.dueDate.localeCompare(b.dueDate);
        });
      } else {
        // Sort paid: newest paidOn first
        displayInvoices.sort((a, b) => (b.paidOn || "").localeCompare(a.paidOn || ""));
      }

      return `
        <div class="pm-payments-view">
          <!-- Hero Card -->
          <div class="pm-card-hero" style="background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%); margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="pm-eyebrow" style="color: rgba(255,255,255,0.85); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                <i class="bi bi-credit-card-2-front"></i> Total Family Outstanding
              </span>
              <span style="font-size: 12px; color: rgba(255,255,255,0.75);">USD</span>
            </div>
            
            <div style="font-size: 34px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; line-height: 1.1; margin: 4px 0 10px;">
              ${PM_HELPERS.fmtMoney(totalOut)}
            </div>

            <!-- Breakdown Pills -->
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
              ${overdueAmount > 0 ? `
                <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: #fee4e2; color: #b42318; font-size: 11.5px; font-weight: 700;">
                  <i class="bi bi-exclamation-circle-fill"></i> ${PM_HELPERS.fmtMoney(overdueAmount)} Overdue
                </span>
              ` : `
                <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11.5px; font-weight: 600;">
                  <i class="bi bi-check-circle-fill"></i> No overdue fees
                </span>
              `}
              <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,0.15); color: #ffffff; font-size: 11.5px; font-weight: 500;">
                Upcoming: ${PM_HELPERS.fmtMoney(upcomingAmount)}
              </span>
            </div>
          </div>

          <!-- Child Fee Filter Chips -->
          <div class="pm-chips" role="tablist" aria-label="Student Fee Filter" style="margin-bottom: 12px;">
            <button type="button" class="pm-chip ${state.payChildFilter === 'all' ? 'active' : ''}" data-action="pay-child-filter" data-child="all">
              All Children
            </button>
            <button type="button" class="pm-chip ${state.payChildFilter === 1 ? 'active' : ''}" data-action="pay-child-filter" data-child="1">
              Chanreaksa
            </button>
            <button type="button" class="pm-chip ${state.payChildFilter === 11 ? 'active' : ''}" data-action="pay-child-filter" data-child="11">
              Chanpanha
            </button>
          </div>

          <!-- Segmented Toggle Control -->
          <div class="pm-seg" role="tablist" aria-label="Invoice Status Filter" style="margin-bottom: 14px;">
            <button type="button" class="pm-seg-btn ${state.payFilter === 'due' ? 'active' : ''}" data-action="pay-filter" data-filter="due" role="tab" aria-selected="${state.payFilter === 'due'}">
              Due (${dueInvoices.length})
            </button>
            <button type="button" class="pm-seg-btn ${state.payFilter === 'paid' ? 'active' : ''}" data-action="pay-filter" data-filter="paid" role="tab" aria-selected="${state.payFilter === 'paid'}">
              Paid (${paidInvoices.length})
            </button>
          </div>

          <!-- Invoices List -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            ${displayInvoices.map((inv) => {
              const childObj = (D.children && D.children[inv.childId]) || {};
              const isOverdue = inv.status === "Overdue";
              const isDue = inv.status !== "Paid";

              if (isDue) {
                return `
                  <div class="pm-card" style="padding: 14px; ${isOverdue ? 'border-left: 4px solid #d92d20; background: #fffbfa; border-color: #fda29b;' : 'border-left: 4px solid var(--brand-primary);'}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <div style="width: 36px; height: 36px; border-radius: 9px; background: ${isOverdue ? '#fee4e2' : 'var(--brand-primary-light)'}; color: ${isOverdue ? '#b42318' : 'var(--brand-primary)'}; display: grid; place-items: center; font-size: 17px; flex-shrink: 0;">
                          <i class="bi ${isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-receipt'}"></i>
                        </div>
                        <div>
                          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); line-height: 1.3;">${esc(inv.title)}</div>
                          <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                            ${esc(childObj.first || childObj.nameEn)} · <span style="font-family: var(--font-mono); font-size: 11.5px;">${esc(inv.invoiceNo)}</span>
                          </div>
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: 800; color: ${isOverdue ? '#b42318' : 'var(--text-main)'};">
                          ${PM_HELPERS.fmtMoney(inv.amount)}
                        </div>
                        <span class="pm-pill ${isOverdue ? 'danger' : 'warning'}" style="margin-top: 4px;">
                          ${isOverdue ? 'Overdue' : 'Due'}
                        </span>
                      </div>
                    </div>

                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 12px; color: ${isOverdue ? '#b42318' : 'var(--text-muted)'}; font-weight: 500;">
                        <i class="bi bi-calendar-event"></i> Due ${PM_HELPERS.fmtDate(inv.dueDate)}
                      </span>
                      <button type="button" class="pm-btn-primary" data-action="pay" data-invoice="${inv.id}" style="width: auto; height: 34px; padding: 0 16px; font-size: 12.5px; font-weight: 600;">
                        Pay ${PM_HELPERS.fmtMoney(inv.amount)}
                      </button>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="pm-card" style="padding: 14px; border-left: 4px solid #12b76a;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <div style="width: 36px; height: 36px; border-radius: 9px; background: #ecfdf3; color: #027a48; display: grid; place-items: center; font-size: 17px; flex-shrink: 0;">
                          <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div>
                          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); line-height: 1.3;">${esc(inv.title)}</div>
                          <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                            ${esc(childObj.first || childObj.nameEn)} · <span style="font-family: var(--font-mono); font-size: 11.5px;">${esc(inv.invoiceNo)}</span>
                          </div>
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: 800; color: #027a48;">${PM_HELPERS.fmtMoney(inv.amount)}</div>
                        <span class="pm-pill success" style="margin-top: 4px;"><i class="bi bi-check-lg"></i> Paid</span>
                      </div>
                    </div>

                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
                      <span>Paid on ${PM_HELPERS.fmtDate(inv.paidOn)} · ${esc(inv.method || 'Bakong KHQR')}</span>
                      <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">${esc(inv.receiptNo || '')}</span>
                    </div>
                  </div>
                `;
              }
            }).join("") || `
              <div class="pm-card" style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
                <i class="bi bi-check-circle" style="font-size: 28px; color: #12b76a; display: block; margin-bottom: 8px;"></i>
                All caught up · No payments due
              </div>
            `}
          </div>
        </div>
      `;
    }

    return "";
  }

  function renderAppShell() {
    const isStudent = state.role === "student";
    const D = getPMData();
    const initials = isStudent ? "SC" : "SV";

    let eyebrow = "Welcome";
    let title = "Dashboard";

    if (isStudent) {
      const child = (D.children && D.children[1]) || { first: "Chanreaksa", nameEn: "Sok Chanreaksa", classShort: "G12-A", className: "Grade 12-A · Science Track" };
      if (state.tab === "home") {
        eyebrow = (D.demoNow && D.demoNow.dateLabel) || "Tuesday, 3 November";
        title = `${(D.demoNow && D.demoNow.greeting) || 'Good morning'}, ${esc(child.first)}!`;
      } else if (state.tab === "schedule") {
        eyebrow = esc(child.className || "Grade 12-A · Science Track");
        title = "Schedule";
      } else if (state.tab === "report") {
        eyebrow = "Term 1 Midterm Evaluation";
        title = "Report";
      } else if (state.tab === "attendance") {
        eyebrow = "Academic Year 2026–2027";
        title = "Attendance";
      } else if (state.tab === "checkin") {
        eyebrow = "Campus Gate Security";
        title = "Gate Check-in";
      }

      return `
        <div class="pm-body">
          <header class="pm-header">
            <div>
              <div class="pm-eyebrow">${esc(eyebrow)}</div>
              <h1 class="pm-title">${title}</h1>
            </div>
            <button type="button" class="pm-avatar" data-action="sheet" data-sheet="account" aria-label="Open Account Menu">
              ${initials}
            </button>
          </header>

          ${renderStudentTabContent()}
        </div>

        ${renderTabBar()}

        ${state.sheet === "account" ? renderAccountSheet() : ""}
        ${state.sheet === "child" ? renderChildSheet() : ""}
        ${state.sheet === "qr" ? renderQrSheet() : ""}
        ${state.sheet === "pay" ? renderPaySheet() : ""}
      `;
    } else {
      const activeChildId = state.activeChildId || state.childId || 1;
      const activeChild = (D.children && D.children[activeChildId]) || (D.children && D.children[1]) || {};

      if (state.tab === "home") {
        eyebrow = (D.demoNow && D.demoNow.dateLabel) || "Tuesday, 3 November";
        title = "Parent Portal";
      } else if (state.tab === "alerts") {
        eyebrow = "Campus Activity";
        title = "Gate Alerts";
      } else if (state.tab === "scores") {
        eyebrow = "Academic Performance";
        title = "Midterm Scores";
      } else if (state.tab === "schedule") {
        eyebrow = "Class Timetable";
        title = "Daily Schedule";
      } else if (state.tab === "payments") {
        eyebrow = "School Invoicing";
        title = "Tuition & Fees";
      }

      return `
        <div class="pm-body">
          <header class="pm-header pm-header-parent">
            <div class="pm-header-titles">
              <div class="pm-eyebrow">${esc(eyebrow)}</div>
              <h1 class="pm-title">${title}</h1>
              ${state.tab === "home" ? '<div class="pm-greeting" style="font-size: 13px; color: var(--text-secondary); margin-top: 1px;">Good morning, Vibol!</div>' : ''}
              <!-- Child Switcher Pill in Header -->
              <div class="pm-header-switcher-wrap" style="margin-top: 6px;">
                <button
                  type="button"
                  class="pm-child-switcher"
                  data-action="sheet"
                  data-sheet="child"
                  aria-label="Switch active child"
                >
                  <span class="pm-child-switcher-dot" style="background: ${activeChild.color || (activeChild.id === 11 ? '#7a5af8' : 'var(--brand-primary)')};">
                    ${activeChild.initials || (activeChild.id === 11 ? 'SP' : 'SC')}
                  </span>
                  <span class="pm-child-switcher-name">${esc(activeChild.nameEn || 'Sok Chanreaksa')}</span>
                  <i class="bi bi-chevron-down"></i>
                </button>
              </div>
            </div>
            <button type="button" class="pm-avatar" data-action="sheet" data-sheet="account" aria-label="Open Account Menu">
              ${initials}
            </button>
          </header>

          ${renderParentTabContent()}
        </div>

        ${renderTabBar()}

        ${state.sheet === "account" ? renderAccountSheet() : ""}
        ${state.sheet === "child" ? renderChildSheet() : ""}
        ${state.sheet === "qr" ? renderQrSheet() : ""}
        ${state.sheet === "pay" ? renderPaySheet() : ""}
      `;
    }
  }

  function render() {
    const appEl = document.getElementById("pmApp");
    if (!appEl) return;

    if (state.view === "login") {
      appEl.innerHTML = renderLoginScreen();
    } else {
      appEl.innerHTML = renderAppShell();
    }
  }

  // ============================================================================
  // 5. EVENT DELEGATION & ACTION HANDLERS
  // ============================================================================

  function handleTogglePass(actEl) {
    const passInput = document.getElementById("pmLoginPassword");
    const icon = actEl.querySelector("i");
    if (!passInput) return;
    if (passInput.type === "password") {
      passInput.type = "text";
      if (icon) icon.className = "bi bi-eye-slash";
    } else {
      passInput.type = "password";
      if (icon) icon.className = "bi bi-eye";
    }
  }

  function handleSignIn(e) {
    if (e) e.preventDefault();
    if (state.signingIn) return;

    const userEl = document.getElementById("pmLoginUsername");
    const passEl = document.getElementById("pmLoginPassword");
    const userErr = document.getElementById("pmUserError");
    const passErr = document.getElementById("pmPassError");

    const username = userEl ? userEl.value.trim() : "";
    const password = passEl ? passEl.value : "";

    let hasError = false;

    // Clear previous errors
    if (userEl) userEl.classList.remove("error");
    if (passEl) passEl.classList.remove("error");
    if (userErr) userErr.textContent = "";
    if (passErr) passErr.textContent = "";

    if (!username) {
      hasError = true;
      if (userEl) userEl.classList.add("error");
      if (userErr) userErr.textContent = "Please enter your username";
    }

    if (!password) {
      hasError = true;
      if (passEl) passEl.classList.add("error");
      if (passErr) passErr.textContent = "Please enter your password";
    }

    if (hasError) {
      if (!username && userEl) userEl.focus();
      else if (!password && passEl) passEl.focus();
      return;
    }

    // Visual loading transition
    state.signingIn = true;
    render();

    setTimeout(() => {
      state.signingIn = false;
      state.view = "app";
      state.tab = "home";
      render();

      // Trigger Parent iOS Push Notification Banner 1.5s after parent login
      if (state.role === "parent") {
        scheduleParentPushBanner();
      }
    }, 700);
  }

  function handleSignOut() {
    if (state.pushTimer) {
      clearTimeout(state.pushTimer);
      state.pushTimer = null;
    }
    const banner = document.querySelector(".pm-push");
    if (banner) banner.remove();

    state.view = "login";
    state.sheet = null;
    state.signingIn = false;
    // NOTE: state.role is deliberately PRESERVED so the login screen displays the user's role
    render();
    toast("Signed out successfully");
  }

  let toastTimer = null;
  function toast(msg) {
    const existing = document.querySelector(".pm-toast");
    if (existing) existing.remove();
    if (toastTimer) clearTimeout(toastTimer);

    const t = document.createElement("div");
    t.className = "pm-toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    t.textContent = msg;

    const appEl = document.getElementById("pmApp");
    if (appEl) {
      appEl.appendChild(t);
    }

    toastTimer = setTimeout(() => {
      t.remove();
      toastTimer = null;
    }, 2200);
  }

  function scheduleParentPushBanner() {
    if (state.pushTimer) clearTimeout(state.pushTimer);
    state.pushTimer = setTimeout(() => {
      if (state.view !== "app" || state.role !== "parent") return;
      if (document.querySelector(".pm-push")) return;

      const brand = applyBrand();
      const banner = document.createElement("div");
      banner.className = "pm-push";
      banner.id = "pmPushBanner";
      banner.setAttribute("data-action", "push-open");
      banner.setAttribute("role", "alert");
      banner.setAttribute("aria-label", "Gate check-out alert notification");
      banner.innerHTML = `
        <div class="pm-push-grabber" aria-hidden="true"></div>
        <div class="pm-push-content">
          <div class="pm-push-icon" aria-hidden="true">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <div class="pm-push-body">
            <div class="pm-push-meta">
              <span class="pm-push-app">${esc(brand.name || "School Management")}</span>
              <span class="pm-push-time">now</span>
            </div>
            <div class="pm-push-title">Gate Alert: Sok Chanreaksa</div>
            <div style="font-size: 11px; font-weight: 600; color: #b42318; margin-bottom: 2px;">Check-out alert</div>
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
            <i class="bi bi-x-lg" style="font-size: 12px;"></i>
          </button>
        </div>
      `;

      const appEl = document.getElementById("pmApp");
      if (appEl) {
        appEl.appendChild(banner);
      }

      setTimeout(() => {
        if (banner.parentNode) {
          banner.classList.add("dismissing");
          setTimeout(() => {
            if (banner.parentNode) banner.remove();
          }, 350);
        }
      }, 6500);
    }, 1500);
  }

  function onAction(e) {
    if (e.type === "submit") {
      e.preventDefault();
      handleSignIn(e);
      return;
    }

    const actEl = e.target.closest("[data-action]");
    if (!actEl) return;

    const action = actEl.dataset.action;

    switch (action) {
      case "role": {
        const nextRole = actEl.dataset.role;
        if (nextRole && nextRole !== state.role) {
          state.role = nextRole;
          render();
        }
        break;
      }
      case "toggle-pass": {
        e.preventDefault();
        handleTogglePass(actEl);
        break;
      }
      case "forgot": {
        e.preventDefault();
        toast("Please contact the registrar office at 012 998 877 to reset credentials");
        break;
      }
      case "signin": {
        e.preventDefault();
        handleSignIn(e);
        break;
      }
      case "tab": {
        const nextTab = actEl.dataset.tab;
        if (nextTab) {
          state.tab = nextTab;
          state.sheet = null;
          if (state.role === "parent" && nextTab === "alerts") {
            state.gateLog.forEach((g) => { g.unread = false; });
          }
          render();
          const bodyEl = document.querySelector(".pm-body");
          if (bodyEl) bodyEl.scrollTop = 0;
        }
        break;
      }
      case "sheet": {
        const sheetName = actEl.dataset.sheet;
        if (sheetName) {
          state.sheet = sheetName;
          render();
        }
        break;
      }
      case "close-sheet": {
        state.sheet = null;
        render();
        break;
      }
      case "signout": {
        handleSignOut();
        break;
      }
      case "child": {
        const cId = Number(actEl.dataset.child);
        if (cId) {
          setActiveChild(cId);
          state.sheet = null;
          render();
        }
        break;
      }
      case "child-scores": {
        const cId = Number(actEl.dataset.child);
        if (cId) {
          setActiveChild(cId);
          state.tab = "scores";
          state.sheet = null;
          render();
        }
        break;
      }
      case "child-schedule": {
        const cId = Number(actEl.dataset.child);
        if (cId) {
          setActiveChild(cId);
          state.tab = "schedule";
          state.sheet = null;
          render();
        }
        break;
      }
      case "day": {
        const dayKey = actEl.dataset.day;
        if (dayKey) {
          state.day = dayKey;
          render();
        }
        break;
      }
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
      case "pdf-toast": {
        toast("Downloading Midterm_Report_2026_Term1.pdf…");
        break;
      }
      case "alert-filter": {
        const f = actEl.dataset.filter;
        state.alertFilter = f === "all" ? "all" : Number(f);
        render();
        break;
      }
      case "pay-child-filter": {
        const c = actEl.dataset.child;
        state.payChildFilter = c === "all" ? "all" : Number(c);
        render();
        break;
      }
      case "pay-filter": {
        state.payFilter = actEl.dataset.filter || "due";
        render();
        break;
      }
      case "pay": {
        const invId = Number(actEl.dataset.invoice);
        state.pay = { invoiceId: invId, method: "khqr", step: "choose", receiptNo: null };
        state.sheet = "pay";
        render();
        break;
      }
      case "pay-method": {
        if (state.pay) {
          state.pay.method = actEl.dataset.method || "khqr";
          render();
        }
        break;
      }
      case "pay-confirm": {
        if (state.pay) {
          state.pay.step = "processing";
          render();
          setTimeout(() => {
            const paidCount = state.invoices.filter((i) => i.status === "Paid").length;
            const receiptNo = "RCP-2026-09" + (10 + paidCount);
            state.pay.step = "success";
            state.pay.receiptNo = receiptNo;
            const inv = state.invoices.find((i) => i.id === state.pay.invoiceId);
            if (inv) {
              inv.status = "Paid";
              inv.paidOn = (getPMData().demoNow && getPMData().demoNow.iso) || "2026-11-03";
              inv.method = state.pay.method === "khqr" ? "Bakong KHQR" : state.pay.method === "aba" ? "ABA PayWay" : "ACLEDA Mobile";
              inv.receiptNo = receiptNo;
            }
            render();
          }, 1200);
        }
        break;
      }
      case "pay-done": {
        state.sheet = null;
        state.pay = null;
        state.payFilter = "paid";
        render();
        break;
      }
      case "push-open": {
        const p = document.querySelector(".pm-push");
        if (p) p.remove();
        state.tab = "alerts";
        state.sheet = null;
        state.gateLog.forEach((g) => { g.unread = false; });
        render();
        break;
      }
      case "push-dismiss": {
        e.stopPropagation();
        const p = document.querySelector(".pm-push");
        if (p) {
          p.classList.add("dismissing");
          setTimeout(() => {
            if (p.parentNode) p.remove();
          }, 350);
        }
        break;
      }
      case "toggle-notify": {
        const cId = Number(actEl.dataset.child);
        const isChecked = actEl.checked;
        const cName = cId === 11 ? "Sok Chanpanha" : "Sok Chanreaksa";
        toast(`${cName} gate notifications ${isChecked ? "enabled" : "muted"}`);
        break;
      }
      case "toast-demo": {
        const msg = actEl.dataset.msg || "Action completed";
        toast(msg);
        break;
      }
    }
  }

  function onInput(e) {
    if (e.target && e.target.classList.contains("error")) {
      e.target.classList.remove("error");
      const wrap = e.target.closest(".pm-input-wrap");
      const errText = wrap ? wrap.querySelector(".pm-input-error-text") : null;
      if (errText) errText.textContent = "";
    }
  }

  // ============================================================================
  // 6. BOOTSTRAP SEQUENCE
  // ============================================================================

  if (typeof window !== "undefined") {
    window.addEventListener("resize", fitDevice);
  }

  if (typeof document !== "undefined") {
    const startApp = () => {
      applyBrand();
      fitDevice();
      initState();
      render();

      const appEl = document.getElementById("pmApp");
      if (appEl) {
        appEl.addEventListener("click", onAction);
        appEl.addEventListener("submit", onAction);
        appEl.addEventListener("input", onInput);
      }
    };

    if (document.getElementById("pmApp")) {
      startApp();
    } else if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startApp);
    } else {
      startApp();
    }
  }
})();
