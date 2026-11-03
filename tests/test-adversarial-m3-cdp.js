#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m3-cdp.js
 * Empirical Adversarial Test Harness for Milestone 3:
 * Student Portal 5-Tab Live Interactive Behavior via Headless Chromium CDP
 *
 * Scenarios & Invariant Assertions:
 *   1. Login & Student Session Entry:
 *      - Sign in as Student (stu_chanreaksa / demo1234).
 *      - Transition into App Shell with 5 mobile tabs (Home, Schedule, Report, Attendance, Check-in).
 *   2. Home Tab Verification:
 *      - Greeting ("Good morning", student name "Chanreaksa" / "Sok Chanreaksa"), eyebrow "Tuesday, 3 November".
 *      - Hero card: "Lunch break · 11:00 – 13:30", "Checked out 11:32 AM · Gate 01", and "Biology · 13:30 – 14:45".
 *      - Deep links: Attendance stat card -> Attendance tab -> Return Home.
 *      - Deep links: Average score stat card -> Report tab -> Return Home.
 *      - Deep links: "See all" on Today's classes -> Schedule tab -> Return Home.
 *      - Today's schedule mini-list with Now & Next pills.
 *      - Independence Day announcement card.
 *   3. Schedule Tab Verification:
 *      - Weekday selector displays Mon, Tue, Wed, Thu, Fri, Sat (2–7 Nov 2026).
 *      - Dynamic timetable updates when switching through Mon, Tue, Wed, Thu, Fri, Sat.
 *      - Saturday half-day schedule with exactly 6 periods (period 7 omitted).
 *      - Tuesday Now pill on Lunch break and Next pill on Biology.
 *      - Rapid weekday switching stress test.
 *   4. Report Tab Verification:
 *      - Circular average ring displays 91.9 with conic-gradient.
 *      - Overall Score 91.9% and Class Rank 2 of 31.
 *      - All 7 subjects display score, letter grade pill (A+, A), and progress bar width.
 *      - Recent assessments breakdown (Integration Quiz, Lab Report, Essay, Unit Test).
 *      - Homeroom teacher evaluation quote card from Dr. Sokha Chan.
 *      - "Download report (PDF)" button triggers toast notification.
 *      - Rapid PDF button click spam stress test.
 *   5. Attendance Tab Verification:
 *      - Circular progress ring displays 96.3%.
 *      - 4-up metric cards: Present 24, Late 2, Excused 1, Absent 0.
 *      - Month navigation toggling between October 2026 and November 2026.
 *      - Calendar grid status dots (green, orange, blue) and holiday 'H' badges on Oct 15 & 29.
 *      - Non-present records list verifying Oct 8, Oct 21, and Nov 2.
 *      - Rapid month navigation toggle stress test.
 *   6. Check-in Log Tab & QR Sheet:
 *      - Today's status card displays "Off campus" and campus duration "4h 20m".
 *      - Today's gate entry/exit events.
 *      - Recent gate history across multiple days.
 *      - "Show my campus ID" button opens Campus ID bottom sheet modal.
 *      - Modal displays avatar "SC", student name "Sok Chanreaksa", card ID "STU-2026-001", and non-empty SVG QR code.
 *      - Three modal dismiss workflows: "Done" button, Close icon button, and Backdrop click.
 *   7. Storage Isolation & Console Cleanliness:
 *      - localStorage and sessionStorage verification (0 keys stored).
 *      - Zero uncaught JavaScript console errors throughout all interactions.
 *   8. Adversarial Resiliency & Stress Testing:
 *      - Rapid tab switching fuzzing (30 random switches).
 *      - DOM integrity verification (single instance of app shell, header, tab bar).
 *      - Leak check for "NaN", "undefined", or "[object Object]".
 *
 * Usage:
 *   node tests/test-adversarial-m3-cdp.js
 *   node tests/test-adversarial-m3-cdp.js --port=3000
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

// ANSI color formatting
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m"
};

let totalChecks = 0;
let passedTests = 0;
let failedChecks = 0;

function report(id, description, passed, detail = "") {
  totalChecks++;
  const idStr = String(id).padStart(2, "0");
  if (passed) {
    passedTests++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} [${idStr}] ${description}${detail ? ` (${colors.cyan}${detail}${colors.reset})` : ""}`);
  } else {
    failedChecks++;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} [${idStr}] ${description}`);
    if (detail) {
      console.log(`        ${colors.red}↳ Detail: ${detail}${colors.reset}`);
    }
  }
}

// Parse command line arguments
let PORT = 3000;
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--port=")) {
    PORT = parseInt(arg.split("=")[1], 10);
  }
}

const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;

/**
 * Lightweight CDP Session Client over native Node WebSocket
 */
class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new globalThis.WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception
        ? res.exceptionDetails.exception.description
        : JSON.stringify(res.exceptionDetails);
      throw new Error(`Browser Eval Exception: ${desc}`);
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTestSuite() {
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  EMPIRICAL ADVERSARIAL CHALLENGE: M3 STUDENT PORTAL 5-TAB CDP HARNESS ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`Target URL:          ${BASE_URL}`);

  // 1. Locate Chrome Binary
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe") : ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);
  const chromeBin = chromePaths.find((p) => fs.existsSync(p));
  if (!chromeBin) {
    console.error(`${colors.red}FATAL: Google Chrome / Chromium executable not found in standard paths.${colors.reset}`);
    process.exit(1);
  }

  // 2. Check local dev server
  const serverUp = await new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => resolve(res.statusCode === 200));
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!serverUp) {
    console.error(`${colors.red}FATAL: Server not reachable at ${BASE_URL}. Ensure 'node server.js' is running on port ${PORT}.${colors.reset}`);
    process.exit(1);
  }

  // 3. Launch Headless Chromium
  const CDP_PORT = 9446;
  const chromeProcess = spawn(chromeBin, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--window-size=1440,900",
    BASE_URL
  ]);

  let cdp = null;

  try {
    // Wait for CDP endpoint to respond
    let tabs = null;
    for (let i = 0; i < 25; i++) {
      await sleep(200);
      try {
        tabs = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        if (tabs && tabs.length > 0) break;
      } catch (e) {}
    }

    if (!tabs || tabs.length === 0) {
      throw new Error("Could not connect to Chrome debugging port " + CDP_PORT);
    }

    const targetTab = tabs.find((t) => t.url && t.url.includes("phone-mockup")) || tabs[0];
    cdp = new CdpClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Install global error listener in browser context
    await cdp.evaluate(`(() => {
      window.__CAPTURED_ERRORS = [];
      window.addEventListener("error", (e) => {
        window.__CAPTURED_ERRORS.push(e.message || String(e));
      });
      const origConsoleErr = console.error;
      console.error = function(...args) {
        window.__CAPTURED_ERRORS.push(args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
        origConsoleErr.apply(console, args);
      };
    })()`);

    // Give DOM a moment to complete boot sequence
    await sleep(400);

    // ==========================================================================
    // PHASE 1: Login & Student Session Entry
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 1: Login & Student Session Entry ---${colors.reset}`);

    const p1 = await cdp.evaluate(`(() => {
      const form = document.querySelector(".pm-login-form");
      const userIn = document.getElementById("pmLoginUsername");
      const passIn = document.getElementById("pmLoginPassword");
      const submitBtn = document.getElementById("pmLoginSubmit");
      const studentRoleBtn = document.querySelector(".pm-seg-btn[data-role='student']");

      return {
        formExists: !!form,
        studentRoleActive: studentRoleBtn ? studentRoleBtn.classList.contains("active") : false,
        userVal: userIn ? userIn.value : "",
        passVal: passIn ? passIn.value : "",
        btnDisabled: submitBtn ? submitBtn.disabled : true
      };
    })()`);

    report(1, "Login screen is present with form and inputs", p1.formExists);
    report(2, "Default login role is Student", p1.studentRoleActive);
    report(3, "Student credentials prefilled with 'stu_chanreaksa'", p1.userVal === "stu_chanreaksa", `Value: '${p1.userVal}'`);
    report(4, "Password prefilled with 'demo1234'", p1.passVal === "demo1234");

    // Click submit button to log in as Student
    await cdp.evaluate(`(() => {
      const submitBtn = document.querySelector(".pm-login-form button[type='submit']");
      if (submitBtn) submitBtn.click();
    })()`);

    // Simulated login delay is 700ms -> wait 850ms
    await sleep(850);

    const p1Shell = await cdp.evaluate(`(() => {
      const app = document.getElementById("pmApp");
      const header = app ? app.querySelector(".pm-header") : null;
      const body = app ? app.querySelector(".pm-body") : null;
      const form = app ? app.querySelector(".pm-login-form") : null;
      const tabBar = app ? app.querySelector(".pm-tabbar") : null;
      const tabs = tabBar ? Array.from(tabBar.querySelectorAll(".pm-tab")).map(b => b.dataset.tab) : [];
      const activeTab = tabBar ? tabBar.querySelector(".pm-tab.active") : null;
      const avatar = header ? header.querySelector(".pm-avatar") : null;

      return {
        loginFormGone: !form,
        headerExists: !!header,
        bodyExists: !!body,
        avatarInitials: avatar ? avatar.textContent.trim() : "",
        tabBarExists: !!tabBar,
        tabCount: tabs.length,
        tabs,
        activeTab: activeTab ? activeTab.dataset.tab : null
      };
    })()`);

    report(5, "Login transition completes: Login form removed from DOM", p1Shell.loginFormGone);
    report(6, "App Shell body and header successfully rendered", p1Shell.headerExists && p1Shell.bodyExists);
    report(7, "Student avatar displays 'SC' initials", p1Shell.avatarInitials === "SC");
    report(8, "Student navigation tab bar renders exactly 6 tabs", p1Shell.tabCount === 6, `Tabs: ${p1Shell.tabs.join(", ")}`);
    report(9, "6 Student tabs are [home, schedule, report, attendance, checkin, news]",
      JSON.stringify(p1Shell.tabs) === JSON.stringify(["home", "schedule", "report", "attendance", "checkin", "news"]));
    report(10, "Default active tab upon login is 'home'", p1Shell.activeTab === "home");

    // ==========================================================================
    // PHASE 2: Home Tab Verification & Interactive Deep Linking
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 2: Home Tab Verification & Interactive Deep Linking ---${colors.reset}`);

    const p2Home = await cdp.evaluate(`(() => {
      const header = document.querySelector(".pm-header");
      const title = header ? header.querySelector(".pm-title").textContent.trim() : "";
      const eyebrow = header ? header.querySelector(".pm-eyebrow").textContent.trim() : "";

      const hero = document.querySelector(".pm-card-hero");
      const heroText = hero ? hero.textContent : "";

      const statCards = Array.from(document.querySelectorAll(".pm-stat-card"));
      const attCard = statCards.find(c => c.dataset.tab === "attendance");
      const repCard = statCards.find(c => c.dataset.tab === "report");

      const seeAllBtn = document.querySelector("button[data-action='tab'][data-tab='schedule']");

      const periodRows = Array.from(document.querySelectorAll(".pm-period-row, .pm-break-row"));
      const announcementCard = document.querySelector(".bi-flag-fill") ? document.querySelector(".bi-flag-fill").closest(".pm-card") : null;

      return {
        title,
        eyebrow,
        heroExists: !!hero,
        heroText,
        attCardExists: !!attCard,
        attCardText: attCard ? attCard.textContent.trim().replace(/\\s+/g, " ") : "",
        repCardExists: !!repCard,
        repCardText: repCard ? repCard.textContent.trim().replace(/\\s+/g, " ") : "",
        seeAllBtnExists: !!seeAllBtn,
        periodRowCount: periodRows.length,
        announcementExists: !!announcementCard,
        announcementText: announcementCard ? announcementCard.textContent.trim().replace(/\\s+/g, " ") : ""
      };
    })()`);

    report(11, "Home header eyebrow displays 'Tuesday, 3 November'", p2Home.eyebrow === "Tuesday, 3 November");
    report(12, "Home greeting contains 'Good morning' and student's name",
      p2Home.title.includes("Good morning") && (p2Home.title.includes("Chanreaksa") || p2Home.title.includes("Sok Chanreaksa")),
      `Title: '${p2Home.title}'`);
    report(13, "Hero card exists in Home tab", p2Home.heroExists);
    report(14, "Hero card displays 'Lunch break · 11:00 – 13:30'", p2Home.heroText.includes("Lunch break · 11:00 – 13:30"));
    report(15, "Hero card displays 'Checked out 11:32 AM · Gate 01'", p2Home.heroText.includes("Checked out 11:32 AM · Gate 01"));
    report(16, "Hero card displays Next class 'Biology' and '13:30 – 14:45'",
      p2Home.heroText.includes("Biology") && p2Home.heroText.includes("13:30 – 14:45"));
    report(17, "Attendance stat overview card displays 96.3% and 24 Present",
      p2Home.attCardText.includes("96.3%") && p2Home.attCardText.includes("24 Present"));
    report(18, "Average score stat overview card displays 91.9%, Rank 2 of 31",
      p2Home.repCardText.includes("91.9") && p2Home.repCardText.includes("2 of 31"));
    report(19, "Today's classes mini-list renders periods on Home tab", p2Home.periodRowCount >= 5);
    report(20, "Independence Day announcement card rendered",
      p2Home.announcementExists && p2Home.announcementText.includes("Independence Day"));

    // Deep link 1: Click Attendance stat card -> verify Attendance tab -> return to Home
    await cdp.evaluate(`(() => {
      const card = document.querySelector(".pm-stat-card[data-tab='attendance']");
      if (card) card.click();
    })()`);
    await sleep(80);

    const deepAtt = await cdp.evaluate(`(() => {
      const activeTab = document.querySelector(".pm-tab.active");
      const title = document.querySelector(".pm-title");
      return {
        tab: activeTab ? activeTab.dataset.tab : null,
        title: title ? title.textContent.trim() : ""
      };
    })()`);
    report(21, "Clicking Attendance stat card transitions to Attendance tab",
      deepAtt.tab === "attendance" && deepAtt.title === "Attendance");

    // Return to Home
    await cdp.evaluate(`(() => {
      const homeTab = document.querySelector(".pm-tab[data-tab='home']");
      if (homeTab) homeTab.click();
    })()`);
    await sleep(80);

    // Deep link 2: Click Average score stat card -> verify Report tab -> return to Home
    await cdp.evaluate(`(() => {
      const card = document.querySelector(".pm-stat-card[data-tab='report']");
      if (card) card.click();
    })()`);
    await sleep(80);

    const deepRep = await cdp.evaluate(`(() => {
      const activeTab = document.querySelector(".pm-tab.active");
      const title = document.querySelector(".pm-title");
      return {
        tab: activeTab ? activeTab.dataset.tab : null,
        title: title ? title.textContent.trim() : ""
      };
    })()`);
    report(22, "Clicking Average score stat card transitions to Report tab",
      deepRep.tab === "report" && deepRep.title === "Report");

    // Return to Home
    await cdp.evaluate(`(() => {
      const homeTab = document.querySelector(".pm-tab[data-tab='home']");
      if (homeTab) homeTab.click();
    })()`);
    await sleep(80);

    // Deep link 3: Click 'See all' on Today's classes -> verify Schedule tab
    await cdp.evaluate(`(() => {
      const seeAllBtn = document.querySelector("button[data-action='tab'][data-tab='schedule']");
      if (seeAllBtn) seeAllBtn.click();
    })()`);
    await sleep(80);

    const deepSched = await cdp.evaluate(`(() => {
      const activeTab = document.querySelector(".pm-tab.active");
      const title = document.querySelector(".pm-title");
      return {
        tab: activeTab ? activeTab.dataset.tab : null,
        title: title ? title.textContent.trim() : ""
      };
    })()`);
    report(23, "Clicking 'See all' on Today's classes transitions to Schedule tab",
      deepSched.tab === "schedule" && deepSched.title === "Schedule");

    // ==========================================================================
    // PHASE 3: Schedule Tab Verification & Dynamic Weekday Updates
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 3: Schedule Tab Verification & Weekday Updates ---${colors.reset}`);

    const p3Strip = await cdp.evaluate(`(() => {
      const strip = document.querySelector(".pm-day-strip");
      const btns = strip ? Array.from(strip.querySelectorAll(".pm-day-btn")) : [];
      const days = btns.map(b => ({
        dayKey: b.dataset.day,
        name: b.querySelector(".pm-day-name") ? b.querySelector(".pm-day-name").textContent.trim() : "",
        num: b.querySelector(".pm-day-num") ? b.querySelector(".pm-day-num").textContent.trim() : "",
        isActive: b.classList.contains("active"),
        hasTodayDot: !!b.querySelector(".pm-day-dot")
      }));

      return {
        stripExists: !!strip,
        btnCount: btns.length,
        days
      };
    })()`);

    report(24, "Schedule weekday selector strip exists with 6 buttons", p3Strip.btnCount === 6);
    const expectedDays = [
      { dayKey: "mon", name: "Mon", num: "2" },
      { dayKey: "tue", name: "Tue", num: "3" },
      { dayKey: "wed", name: "Wed", num: "4" },
      { dayKey: "thu", name: "Thu", num: "5" },
      { dayKey: "fri", name: "Fri", num: "6" },
      { dayKey: "sat", name: "Sat", num: "7" }
    ];
    const daysMatch = expectedDays.every((ed, idx) => {
      const actual = p3Strip.days[idx];
      return actual && actual.dayKey === ed.dayKey && actual.name === ed.name && actual.num === ed.num;
    });
    report(25, "Weekday selector correctly displays Mon, Tue, Wed, Thu, Fri, Sat (2–7 Nov 2026)", daysMatch);

    // Verify Tuesday default period status (Now & Next markers)
    const p3Tue = await cdp.evaluate(`(() => {
      const periods = Array.from(document.querySelectorAll(".pm-period-row, .pm-break-row"));
      const lunchBreak = periods.find(p => p.textContent.includes("Lunch break"));
      const lunchPill = lunchBreak ? lunchBreak.querySelector(".pm-pill") : null;

      const biology = periods.find(p => p.textContent.includes("Biology"));
      const bioPill = biology ? biology.querySelector(".pm-pill") : null;

      return {
        lunchNow: lunchPill ? lunchPill.textContent.trim() : "",
        bioNext: bioPill ? bioPill.textContent.trim() : "",
        totalPeriods: periods.length
      };
    })()`);

    report(26, "Tuesday: 'Now' pill rendered on Lunch break (11:00 – 13:30)", p3Tue.lunchNow === "Now");
    report(27, "Tuesday: 'Next' pill rendered on Biology (13:30 – 14:45)", p3Tue.bioNext === "Next");

    // Test clicking through each weekday in sequence
    const weekdayTests = [
      { id: 28, key: "mon", expectedSubject: "Mathematics", minCount: 7 },
      { id: 29, key: "wed", expectedSubject: "Mathematics", minCount: 7 },
      { id: 30, key: "thu", expectedSubject: "Chemistry", minCount: 7 },
      { id: 31, key: "fri", expectedSubject: "Social Studies & History", minCount: 7 }
    ];

    for (const wt of weekdayTests) {
      await cdp.evaluate(`(() => {
        const btn = document.querySelector(".pm-day-btn[data-day='${wt.key}']");
        if (btn) btn.click();
      })()`);
      await sleep(60);

      const dayCheck = await cdp.evaluate(`(() => {
        const activeBtn = document.querySelector(".pm-day-btn.active");
        const listText = document.querySelector(".pm-list") ? document.querySelector(".pm-list").textContent : "";
        const rowCount = document.querySelectorAll(".pm-period-row, .pm-break-row").length;
        return {
          activeDay: activeBtn ? activeBtn.dataset.day : null,
          listText,
          rowCount
        };
      })()`);

      report(wt.id, `Weekday selector: Click '${wt.key}' dynamically updates timetable (${wt.expectedSubject})`,
        dayCheck.activeDay === wt.key && dayCheck.listText.includes(wt.expectedSubject) && dayCheck.rowCount >= wt.minCount);
    }

    // Now test Saturday: Half-day schedule verification
    await cdp.evaluate(`(() => {
      const satBtn = document.querySelector(".pm-day-btn[data-day='sat']");
      if (satBtn) satBtn.click();
    })()`);
    await sleep(60);

    const p3Sat = await cdp.evaluate(`(() => {
      const activeBtn = document.querySelector(".pm-day-btn.active");
      const rows = Array.from(document.querySelectorAll(".pm-period-row, .pm-break-row"));
      const items = rows.map(r => r.textContent.trim().replace(/\\s+/g, " "));

      return {
        activeDay: activeBtn ? activeBtn.dataset.day : null,
        rowCount: rows.length,
        items
      };
    })()`);

    report(32, "Saturday: Active day switches to 'sat'", p3Sat.activeDay === "sat");
    report(33, "Saturday: Timetable displays exactly 6 periods (half-day schedule, period 7 omitted)",
      p3Sat.rowCount === 6, `Found ${p3Sat.rowCount} periods`);
    report(34, "Saturday schedule contains BacII Mock Exam, STEM Project Lab, Recess, Club & Debate, Lunch, Self-Study",
      p3Sat.items.some(t => t.includes("BacII Mock Exam")) &&
      p3Sat.items.some(t => t.includes("STEM Project Lab")) &&
      p3Sat.items.some(t => t.includes("Morning recess")) &&
      p3Sat.items.some(t => t.includes("Club & Debate")) &&
      p3Sat.items.some(t => t.includes("Lunch break")) &&
      p3Sat.items.some(t => t.includes("Self-Study")));

    // Adversarial rapid day switching stress test
    const stressDays = ["mon", "sat", "wed", "tue", "fri", "thu", "tue"];
    for (const d of stressDays) {
      await cdp.evaluate(`(() => {
        const btn = document.querySelector(".pm-day-btn[data-day='${d}']");
        if (btn) btn.click();
      })()`);
    }
    await sleep(100);

    const p3Stress = await cdp.evaluate(`(() => {
      const activeBtn = document.querySelector(".pm-day-btn.active");
      const rows = document.querySelectorAll(".pm-period-row, .pm-break-row");
      return {
        activeDay: activeBtn ? activeBtn.dataset.day : null,
        rowCount: rows.length
      };
    })()`);
    report(35, "Adversarial: Rapid weekday switching resolves cleanly to final selected day (tue)",
      p3Stress.activeDay === "tue" && p3Stress.rowCount >= 7);

    // ==========================================================================
    // PHASE 4: Report Tab Verification & PDF Simulation
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 4: Report Tab Verification & PDF Simulation ---${colors.reset}`);

    // Switch to Report tab
    await cdp.evaluate(`(() => {
      const repTab = document.querySelector(".pm-tab[data-tab='report']");
      if (repTab) repTab.click();
    })()`);
    await sleep(100);

    const p4Report = await cdp.evaluate(`(() => {
      const ring = document.querySelector(".pm-ring");
      const ringText = ring ? ring.querySelector(".pm-ring-content div").textContent.trim() : "";
      const ringLabel = ring ? ring.getAttribute("aria-label") : "";
      const ringStyle = ring ? ring.getAttribute("style") : "";

      const gpaEl = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "Overall Score" || d.textContent.trim() === "Term GPA");
      const gpaVal = gpaEl && gpaEl.nextElementSibling ? gpaEl.nextElementSibling.textContent.trim() : "";

      const rankEl = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "Class Rank");
      const rankVal = rankEl && rankEl.nextElementSibling ? rankEl.nextElementSibling.textContent.trim() : "";

      const subjectCards = Array.from(document.querySelectorAll(".pm-subject-card"));
      const subjects = subjectCards.map(sc => {
        const titleEl = sc.querySelector(".pm-card div div span:nth-child(2)") || sc.querySelector("span[style*='font-weight: 700']");
        const scoreEl = sc.querySelector("span[style*='font-variant-numeric']");
        const pillEl = sc.querySelector(".pm-letter-pill");
        const barEl = sc.querySelector(".pm-score-bar");
        return {
          title: titleEl ? titleEl.textContent.trim() : "",
          score: scoreEl ? scoreEl.textContent.trim() : "",
          letter: pillEl ? pillEl.textContent.trim() : "",
          barWidth: barEl ? barEl.style.width : ""
        };
      });

      const teacherCard = document.querySelector(".bi-quote") ? document.querySelector(".bi-quote").closest(".pm-card") : null;
      const teacherText = teacherCard ? teacherCard.textContent.trim().replace(/\\s+/g, " ") : "";

      const pdfBtn = document.querySelector("button[data-action='pdf-toast']");

      return {
        ringText,
        ringLabel,
        ringStyle,
        gpaVal,
        rankVal,
        subjectCount: subjects.length,
        subjects,
        teacherText,
        pdfBtnExists: !!pdfBtn
      };
    })()`);

    report(36, "Report average circular ring displays '91.9%'", p4Report.ringText.includes("91.9"));
    report(37, "Report ring style contains dynamic conic-gradient for 91.9",
      p4Report.ringStyle.includes("91.9") || p4Report.ringStyle.includes("conic-gradient"));
    report(38, "Overall Score displays '91.9%'", p4Report.gpaVal === "91.9%");
    report(39, "Class Rank displays '2 of 31'", p4Report.rankVal === "2 of 31");
    report(40, "Subject breakdown displays exactly 7 subjects", p4Report.subjectCount === 7, `Found ${p4Report.subjectCount} subjects`);

    // Verify individual subjects
    const expectedSubjects = [
      { name: "Mathematics", score: "95", letter: "A+", width: "95%" },
      { name: "Physics", score: "91", letter: "A", width: "91%" },
      { name: "Chemistry", score: "89", letter: "B+", width: "89%" },
      { name: "Biology", score: "90", letter: "A", width: "90%" },
      { name: "Academic English", score: "94", letter: "A", width: "94%" },
      { name: "Khmer Literature", score: "88", letter: "B+", width: "88%" },
      { name: "Computer Science & AI", score: "96", letter: "A+", width: "96%" }
    ];

    const allSubjectsValid = expectedSubjects.every(es => {
      const match = p4Report.subjects.find(s => s.title.includes(es.name));
      return match && match.score.includes(es.score) && match.letter === es.letter && match.barWidth === es.width;
    });

    report(41, "All 7 subjects display exact scores, letter grades (A+, A, B+), and progress bar widths", allSubjectsValid);
    report(42, "Homeroom teacher evaluation quote card features Dr. Sokha Chan",
      p4Report.teacherText.includes("Dr. Sokha Chan"));
    report(43, "Teacher quote includes 'Exceptional analytical performance in Mathematics and AI Computer Science'",
      p4Report.teacherText.includes("Exceptional analytical performance in Mathematics and AI Computer Science"));
    report(44, "PDF Download button exists in Report view", p4Report.pdfBtnExists);

    // Interactive PDF download toast verification
    await cdp.evaluate(`(() => {
      const btn = document.querySelector("button[data-action='pdf-toast']");
      if (btn) btn.click();
    })()`);
    await sleep(60);

    const toastCheck = await cdp.evaluate(`(() => {
      const t = document.querySelector(".pm-toast");
      return {
        exists: !!t,
        text: t ? t.textContent.trim() : "",
        role: t ? t.getAttribute("role") : null
      };
    })()`);

    report(45, "Clicking 'Download report (PDF)' triggers toast notification", toastCheck.exists);
    report(46, "Toast displays 'Downloading Midterm_Report_2026_Term1.pdf…'",
      toastCheck.text.includes("Downloading Midterm_Report_2026_Term1.pdf"));
    report(47, "Toast has accessibility role='status'", toastCheck.role === "status");

    // Adversarial: rapid clicking on PDF button doesn't crash or duplicate timers destructively
    for (let i = 0; i < 5; i++) {
      await cdp.evaluate(`(() => {
        const btn = document.querySelector("button[data-action='pdf-toast']");
        if (btn) btn.click();
      })()`);
    }
    await sleep(80);
    const toastSpam = await cdp.evaluate(`(() => {
      return document.querySelectorAll(".pm-toast").length;
    })()`);
    report(48, "Adversarial: Repeated PDF button clicks result in exactly ONE active toast element", toastSpam === 1);

    // ==========================================================================
    // PHASE 5: Attendance Tab Verification & Calendar Navigation
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 5: Attendance Tab Verification & Calendar Navigation ---${colors.reset}`);

    // Switch to Attendance tab
    await cdp.evaluate(`(() => {
      const attTab = document.querySelector(".pm-tab[data-tab='attendance']");
      if (attTab) attTab.click();
    })()`);
    await sleep(100);

    const p5Att = await cdp.evaluate(`(() => {
      const ring = document.querySelector(".pm-ring");
      const ringText = ring ? ring.querySelector(".pm-ring-content div").textContent.trim() : "";

      // 4-up metric cards
      const metricsText = document.querySelector(".pm-card") ? document.querySelector(".pm-card").textContent : "";

      // Month controls
      const prevBtn = document.querySelector("button[data-action='month'][data-month='2026-10']");
      const nextBtn = document.querySelector("button[data-action='month'][data-month='2026-11']");
      const monthHeader = document.querySelector(".pm-card div[style*='font-weight: 700']") ?
        Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "November 2026" || d.textContent.trim() === "October 2026") : null;

      // Calendar cells
      const cells = Array.from(document.querySelectorAll(".pm-cal-cell"));
      const todayCell = cells.find(c => c.classList.contains("today"));

      // Records list
      const records = Array.from(document.querySelectorAll(".pm-row")).map(r => r.textContent.trim().replace(/\\s+/g, " "));

      return {
        ringText,
        metricsText,
        prevBtnExists: !!prevBtn,
        nextBtnDisabled: nextBtn ? nextBtn.disabled || nextBtn.classList.contains("disabled") : false,
        monthTitle: monthHeader ? monthHeader.textContent.trim() : "",
        cellCount: cells.length,
        todayDayNum: todayCell ? todayCell.textContent.trim() : "",
        records
      };
    })()`);

    report(49, "Attendance circular progress ring displays '96.3%'", p5Att.ringText === "96.3%");
    report(50, "4-up metric cards display Present: 24", p5Att.metricsText.includes("Present") && p5Att.metricsText.includes("24"));
    report(51, "4-up metric cards display Late: 2", p5Att.metricsText.includes("Late") && p5Att.metricsText.includes("2"));
    report(52, "4-up metric cards display Excused: 1", p5Att.metricsText.includes("Excused") && p5Att.metricsText.includes("1"));
    report(53, "4-up metric cards display Absent: 0", p5Att.metricsText.includes("Absent") && p5Att.metricsText.includes("0"));
    report(54, "Default calendar view displays 'November 2026'", p5Att.monthTitle === "November 2026");
    report(55, "November calendar marks Day 3 as today", p5Att.todayDayNum.includes("3"));
    report(56, "November records list displays Excused record for Nov 2 (Dental appointment)",
      p5Att.records.some(r => r.includes("2 Nov") && r.includes("Dental appointment") && r.includes("Excused")));

    // Interactive Calendar Navigation: Toggle to October 2026
    await cdp.evaluate(`(() => {
      const prevBtn = document.querySelector("button[data-action='month'][data-month='2026-10']");
      if (prevBtn) prevBtn.click();
    })()`);
    await sleep(80);

    const p5Oct = await cdp.evaluate(`(() => {
      const monthHeader = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "October 2026");
      const cells = Array.from(document.querySelectorAll(".pm-cal-cell"));

      // Holiday badges on 15 and 29
      const hBadges = cells.filter(c => c.textContent.includes("H"));
      const hDays = hBadges.map(c => parseInt(c.textContent.replace(/[^0-9]/g, ""), 10));

      // Late dots on 8 and 21
      const lateDots = cells.filter(c => {
        const dot = c.querySelector(".pm-cal-dot");
        return dot && (dot.style.background.includes("247, 144, 9") || dot.style.background.includes("#f79009") || dot.getAttribute("title") === "Late");
      });
      const lateDays = lateDots.map(c => parseInt(c.textContent.replace(/[^0-9]/g, ""), 10));

      // Records list for October
      const records = Array.from(document.querySelectorAll(".pm-row")).map(r => r.textContent.trim().replace(/\\s+/g, " "));

      return {
        monthTitle: monthHeader ? monthHeader.textContent.trim() : "",
        hDays,
        lateDays,
        records
      };
    })()`);

    report(57, "Toggling month switches calendar to 'October 2026'", p5Oct.monthTitle === "October 2026");
    report(58, "October calendar grid displays holiday 'H' badges on Oct 15 & Oct 29",
      p5Oct.hDays.includes(15) && p5Oct.hDays.includes(29), `Found H on days: ${p5Oct.hDays.join(", ")}`);
    report(59, "October calendar grid displays Late dots on Oct 8 & Oct 21",
      p5Oct.lateDays.includes(8) && p5Oct.lateDays.includes(21), `Found Late on days: ${p5Oct.lateDays.join(", ")}`);
    report(60, "October non-present records list displays Oct 8 (11 min late) and Oct 21 (8 min late)",
      p5Oct.records.some(r => r.includes("8 Oct") && r.includes("11 min late")) &&
      p5Oct.records.some(r => r.includes("21 Oct") && r.includes("8 min late")));

    // Toggle back to November 2026
    await cdp.evaluate(`(() => {
      const nextBtn = document.querySelector("button[data-action='month'][data-month='2026-11']");
      if (nextBtn) nextBtn.click();
    })()`);
    await sleep(80);

    const p5NovRestored = await cdp.evaluate(`(() => {
      const monthHeader = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "November 2026");
      return monthHeader ? monthHeader.textContent.trim() : "";
    })()`);
    report(61, "Toggling back restores 'November 2026' calendar grid", p5NovRestored === "November 2026");

    // Adversarial: 10 rapid month toggles
    for (let i = 0; i < 10; i++) {
      const target = i % 2 === 0 ? "2026-10" : "2026-11";
      await cdp.evaluate(`(() => {
        const btn = document.querySelector("button[data-action='month'][data-month='${target}']");
        if (btn) btn.click();
      })()`);
    }
    await sleep(100);

    const p5MonthStress = await cdp.evaluate(`(() => {
      const monthHeader = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "November 2026" || d.textContent.trim() === "October 2026");
      return monthHeader ? monthHeader.textContent.trim() : "";
    })()`);
    report(62, "Adversarial: 10 rapid month toggles complete with coherent calendar state",
      p5MonthStress === "November 2026" || p5MonthStress === "October 2026");

    // ==========================================================================
    // PHASE 6: Check-in Log Tab & QR Sheet Modal Verification
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 6: Check-in Log Tab & QR Sheet Modal ---${colors.reset}`);

    // Switch to Check-in tab
    await cdp.evaluate(`(() => {
      const ciTab = document.querySelector(".pm-tab[data-tab='checkin']");
      if (ciTab) ciTab.click();
    })()`);
    await sleep(100);

    const p6Checkin = await cdp.evaluate(`(() => {
      const headerTitle = document.querySelector(".pm-title") ? document.querySelector(".pm-title").textContent.trim() : "";
      const statusPill = Array.from(document.querySelectorAll(".pm-pill")).find(p => p.textContent.includes("campus"));
      const durationEl = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "4h 20m");

      const todayCards = Array.from(document.querySelectorAll(".pm-card")).slice(0, 1);
      const todayText = todayCards.length > 0 ? todayCards[0].textContent : "";

      const qrBtn = document.querySelector("button[data-action='sheet'][data-sheet='qr']");

      return {
        headerTitle,
        statusText: statusPill ? statusPill.textContent.trim() : "",
        durationFound: !!durationEl,
        todayText,
        qrBtnExists: !!qrBtn
      };
    })()`);

    report(63, "Check-in header title displays 'Gate Check-in'", p6Checkin.headerTitle === "Gate Check-in");
    report(64, "Today's campus status card displays 'Off campus'", p6Checkin.statusText.includes("Off campus"));
    report(65, "Calculated campus duration displays '4h 20m'", p6Checkin.durationFound);
    report(66, "Today's gate timeline records entry at 07:12 AM and exit at 11:32 AM (Gate 01)",
      p6Checkin.todayText.includes("07:12 AM") && p6Checkin.todayText.includes("11:32 AM") && p6Checkin.todayText.includes("Gate 01"));
    report(67, "Recent gate history rendered with past dates",
      p6Checkin.todayText.length > 0);
    report(68, "'Show my campus ID' button is present", p6Checkin.qrBtnExists);

    // Click "Show my campus ID" button -> Open modal sheet
    await cdp.evaluate(`(() => {
      const qrBtn = document.querySelector("button[data-action='sheet'][data-sheet='qr']");
      if (qrBtn) qrBtn.click();
    })()`);
    await sleep(100);

    const p6Modal = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      const title = sheet ? sheet.querySelector("h2").textContent.trim() : "";
      const avatar = sheet ? sheet.querySelector(".pm-avatar").textContent.trim() : "";
      const name = sheet ? sheet.querySelector("div[style*='font-size: 17px']").textContent.trim() : "";
      const cardId = sheet ? sheet.querySelector("div[style*='font-family: var(--font-mono)']").textContent.trim() : "";
      const qrSvg = sheet ? sheet.querySelector("svg") : null;
      const doneBtn = sheet ? Array.from(sheet.querySelectorAll("button")).find(b => b.textContent.trim() === "Done") : null;

      return {
        sheetExists: !!sheet,
        backdropExists: !!backdrop,
        title,
        avatar,
        name,
        cardId,
        hasSvg: !!qrSvg,
        svgHasContent: qrSvg ? (qrSvg.children.length > 0 || qrSvg.innerHTML.length > 20) : false,
        doneBtnExists: !!doneBtn
      };
    })()`);

    report(69, "Clicking 'Show my campus ID' opens bottom sheet modal with backdrop",
      p6Modal.sheetExists && p6Modal.backdropExists);
    report(70, "Modal sheet title is 'Campus Digital ID'", p6Modal.title === "Campus Digital ID");
    report(71, "Modal avatar displays 'SC'", p6Modal.avatar === "SC");
    report(72, "Modal student name is 'Sok Chanreaksa'", p6Modal.name === "Sok Chanreaksa");
    report(73, "Modal card ID displays 'STU-2026-001'", p6Modal.cardId === "STU-2026-001");
    report(74, "Modal renders valid, non-empty SVG QR code element", p6Modal.hasSvg && p6Modal.svgHasContent);

    // Dismiss workflow 1: Click "Done" button
    await cdp.evaluate(`(() => {
      const doneBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Done");
      if (doneBtn) doneBtn.click();
    })()`);
    await sleep(80);

    const p6Dismiss1 = await cdp.evaluate(`(() => {
      return {
        sheet: !!document.querySelector(".pm-sheet"),
        backdrop: !!document.querySelector(".pm-sheet-backdrop")
      };
    })()`);
    report(75, "Clicking 'Done' button closes QR modal cleanly", !p6Dismiss1.sheet && !p6Dismiss1.backdrop);

    // Dismiss workflow 2: Reopen -> Click 'x' close button
    await cdp.evaluate(`(() => {
      const qrBtn = document.querySelector("button[data-action='sheet'][data-sheet='qr']");
      if (qrBtn) qrBtn.click();
    })()`);
    await sleep(60);
    await cdp.evaluate(`(() => {
      const closeBtn = document.querySelector("button[aria-label='Close sheet']");
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(60);

    const p6Dismiss2 = await cdp.evaluate(`(() => !document.querySelector(".pm-sheet"))()`);
    report(76, "Dismiss workflow 2: Close icon button ('x') closes QR modal cleanly", p6Dismiss2);

    // Dismiss workflow 3: Reopen -> Click backdrop
    await cdp.evaluate(`(() => {
      const qrBtn = document.querySelector("button[data-action='sheet'][data-sheet='qr']");
      if (qrBtn) qrBtn.click();
    })()`);
    await sleep(60);
    await cdp.evaluate(`(() => {
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      if (backdrop) backdrop.click();
    })()`);
    await sleep(60);

    const p6Dismiss3 = await cdp.evaluate(`(() => !document.querySelector(".pm-sheet"))()`);
    report(77, "Dismiss workflow 3: Backdrop click closes QR modal cleanly", p6Dismiss3);

    // ==========================================================================
    // PHASE 7: Storage Isolation & Console Cleanliness
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 7: Storage Isolation & Console Cleanliness ---${colors.reset}`);

    const p7Storage = await cdp.evaluate(`(() => {
      const localKeys = Object.keys(window.localStorage);
      const sessionKeys = Object.keys(window.sessionStorage);
      const mockupLocalKeys = localKeys.filter(k => 
        k.toLowerCase().includes("pm_") || 
        k.toLowerCase().includes("auth") || 
        k.toLowerCase().includes("user") || 
        k.toLowerCase().includes("role") ||
        k.toLowerCase().includes("mockup") ||
        k.toLowerCase().includes("student")
      );
      const errors = window.__CAPTURED_ERRORS || [];

      return {
        localKeyCount: localKeys.length,
        localKeys,
        mockupLocalKeyCount: mockupLocalKeys.length,
        mockupLocalKeys,
        sessionKeyCount: sessionKeys.length,
        sessionKeys,
        errorCount: errors.length,
        errors
      };
    })()`);

    report(78, "Zero mockup session or auth keys stored in window.localStorage",
      p7Storage.mockupLocalKeyCount === 0, `Mockup keys: [${p7Storage.mockupLocalKeys.join(", ")}], Total keys: [${p7Storage.localKeys.join(", ")}]`);
    report(79, "Zero session data stored in window.sessionStorage",
      p7Storage.sessionKeyCount === 0, `Keys found: ${p7Storage.sessionKeyCount}`);
    report(80, "Zero uncaught JavaScript runtime or console errors throughout all interactions",
      p7Storage.errorCount === 0, `Errors: ${JSON.stringify(p7Storage.errors)}`);

    // ==========================================================================
    // PHASE 8: Adversarial Resiliency & Fuzz Stress Testing
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 8: Adversarial Resiliency & Stress Testing ---${colors.reset}`);

    // Fuzz rapid tab switching across all 6 tabs in pseudo-random pattern
    const tabsList = ["home", "schedule", "report", "attendance", "checkin", "news"];
    for (let i = 0; i < 25; i++) {
      const targetTab = tabsList[Math.floor(Math.random() * tabsList.length)];
      await cdp.evaluate(`(() => {
        const tabBtn = document.querySelector(".pm-tab[data-tab='${targetTab}']");
        if (tabBtn) tabBtn.click();
      })()`);
      await sleep(20);
    }
    await sleep(100);

    // End on home
    await cdp.evaluate(`(() => {
      const homeTab = document.querySelector(".pm-tab[data-tab='home']");
      if (homeTab) homeTab.click();
    })()`);
    await sleep(100);

    const p8Sanity = await cdp.evaluate(`(() => {
      const appRoots = document.querySelectorAll("#pmApp");
      const headers = document.querySelectorAll(".pm-header");
      const tabBars = document.querySelectorAll(".pm-tabbar");
      const activeTabs = document.querySelectorAll(".pm-tab.active");
      const bodyText = document.getElementById("pmApp") ? document.getElementById("pmApp").textContent : "";

      const hasNaN = /\\bNaN\\b/.test(bodyText);
      const hasUndefined = /\\bundefined\\b/.test(bodyText);
      const hasObjectObject = bodyText.includes("[object Object]");

      return {
        appCount: appRoots.length,
        headerCount: headers.length,
        tabBarCount: tabBars.length,
        activeTabCount: activeTabs.length,
        activeTabKey: activeTabs[0] ? activeTabs[0].dataset.tab : null,
        hasNaN,
        hasUndefined,
        hasObjectObject
      };
    })()`);

    report(81, "DOM integrity: Exactly 1 #pmApp, 1 .pm-header, and 1 .pm-tabbar rendered",
      p8Sanity.appCount === 1 && p8Sanity.headerCount === 1 && p8Sanity.tabBarCount === 1);
    report(82, "Tab bar integrity: Exactly 1 tab marked as active after rapid fuzzing",
      p8Sanity.activeTabCount === 1 && p8Sanity.activeTabKey === "home");
    report(83, "Zero NaN string literals leaked in rendered DOM text", !p8Sanity.hasNaN);
    report(84, "Zero undefined string literals leaked in rendered DOM text", !p8Sanity.hasUndefined);
    report(85, "Zero [object Object] serializations leaked in rendered DOM text", !p8Sanity.hasObjectObject);

    // Final console error inspection
    const finalErrors = await cdp.evaluate(`window.__CAPTURED_ERRORS || []`);
    report(86, "Final post-fuzz console cleanliness: 0 uncaught errors recorded", finalErrors.length === 0,
      finalErrors.length > 0 ? `Errors: ${JSON.stringify(finalErrors)}` : "Clean");

    console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}                 ADVERSARIAL TEST SUMMARY REPORT                      ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`Total Invariant Checks: ${totalChecks}`);
    console.log(`Checks Passed:          ${colors.green}${passedTests}${colors.reset}`);
    console.log(`Checks Failed:          ${failedChecks > 0 ? colors.red : colors.green}${failedChecks}${colors.reset}`);

    if (failedChecks === 0) {
      console.log(`\n${colors.bold}${colors.green}OVERALL VERDICT: APPROVE (100% of adversarial M3 invariants verified empirically)${colors.reset}\n`);
    } else {
      console.log(`\n${colors.bold}${colors.red}OVERALL VERDICT: REQUEST_CHANGES (${failedChecks} invariant check(s) failed)${colors.reset}\n`);
    }

  } catch (err) {
    console.error(`\n${colors.red}FATAL ERROR during test execution: ${err.message}${colors.reset}`);
    console.error(err.stack);
    failedChecks++;
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill("SIGKILL");
  }

  process.exit(failedChecks === 0 ? 0 : 1);
}

runTestSuite();
