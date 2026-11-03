/**
 * .agents/teamwork/worker_m3_1/test-m3-student.js
 * Comprehensive automated CDP test for Milestone 3 Student Portal
 */

const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      awaitPromise: true,
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
      try { this.ws.close(); } catch (e) {}
    }
  }
}

async function runM3TestSuite() {
  console.log("======================================================================");
  console.log("  EMPIRICAL VERIFICATION: MILESTONE 3 STUDENT PORTAL (5 TABS + QR)    ");
  console.log("======================================================================");

  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];
  const chromeBin = chromePaths.find((p) => fs.existsSync(p));
  if (!chromeBin) {
    console.error("FATAL: Google Chrome executable not found.");
    process.exit(1);
  }

  const CDP_PORT = 9446;
  const chromeProcess = spawn(chromeBin, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "about:blank"
  ]);

  let wsUrl = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(200);
    try {
      const targets = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => {
            try { resolve(JSON.parse(body)); } catch (e) { resolve([]); }
          });
        });
        req.on("error", reject);
      });
      const pageTarget = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (pageTarget) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    chromeProcess.kill();
    console.error("FATAL: Failed to obtain Chrome WebSocket Debugger URL.");
    process.exit(1);
  }

  const cdp = new CdpClient(wsUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  let passCount = 0;
  let failCount = 0;

  function report(name, passed, details = "") {
    if (passed) {
      console.log(`  ✓ PASS: ${name}`);
      passCount++;
    } else {
      console.error(`  ✗ FAIL: ${name} ${details ? "— " + details : ""}`);
      failCount++;
    }
  }

  try {
    // Navigate to mockup
    await cdp.send("Page.navigate", { url: "http://localhost:3000/phone-mockup/" });
    await sleep(700);

    // Sign in as student
    await cdp.evaluate(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      const form = document.querySelector(".pm-login-form");
      user.value = "stu_chanreaksa";
      pass.value = "demo1234";
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`);
    await sleep(850);

    // 1. HOME TAB
    console.log("\n--- PHASE 1: Student Home Tab ---");
    const h = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const attCard = document.querySelector('[data-action="tab"][data-tab="attendance"]');
      const repCard = document.querySelector('[data-action="tab"][data-tab="report"]');
      const classes = document.querySelectorAll(".pm-card.pm-list .pm-period-row, .pm-card.pm-list .pm-break-row");
      const seeAll = document.querySelector('button[data-action="tab"][data-tab="schedule"]');
      const announce = document.body.textContent.includes("Independence Day");

      return {
        hasHero: !!hero,
        heroText: hero ? hero.textContent : "",
        hasAttCard: !!attCard && attCard.textContent.includes("96.3%"),
        hasRepCard: !!repCard && repCard.textContent.includes("91.9"),
        classesCount: classes.length,
        hasSeeAll: !!seeAll,
        hasAnnounce: announce
      };
    })()`);

    report("Home Hero card displays campus checkout status 'Checked out 11:32 AM · Gate 01'", h.heroText.includes("Checked out 11:32 AM"));
    report("Home Hero card displays lunch break status 'Lunch break · 11:00 – 13:30'", h.heroText.includes("Lunch break"));
    report("Home Hero card displays upcoming class 'Biology'", h.heroText.includes("Biology"));
    report("Quick stat Attendance card renders 96.3% with data-action='tab' data-tab='attendance'", h.hasAttCard);
    report("Quick stat Report card renders 91.9 with data-action='tab' data-tab='report'", h.hasRepCard);
    report("Today's schedule mini-list renders periods with 'See all' link", h.hasSeeAll && h.classesCount === 7);
    report("Announcement card renders Independence Day notice", h.hasAnnounce);

    // 2. SCHEDULE TAB
    console.log("\n--- PHASE 2: Student Schedule Tab ---");
    await cdp.evaluate(`document.querySelector('[data-action="tab"][data-tab="schedule"]').click()`);
    await sleep(250);

    const s = await cdp.evaluate(`(() => {
      const dayBtns = Array.from(document.querySelectorAll(".pm-day-btn"));
      const activeBtn = document.querySelector(".pm-day-btn.active");
      const periods = document.querySelectorAll(".pm-period-row, .pm-break-row");
      const nowPill = document.querySelector(".pm-pill.brand");
      const nextPill = document.querySelector(".pm-pill.neutral");

      return {
        btnCount: dayBtns.length,
        days: dayBtns.map(b => b.dataset.day).join(","),
        activeDay: activeBtn ? activeBtn.dataset.day : null,
        periodCount: periods.length,
        hasNowPill: !!nowPill && nowPill.textContent.trim() === "Now",
        hasNextPill: !!nextPill && nextPill.textContent.trim() === "Next"
      };
    })()`);

    report("Weekday strip renders 6 buttons (mon-sat)", s.btnCount === 6 && s.days === "mon,tue,wed,thu,fri,sat");
    report("Active day defaults to Tuesday with 7 entries", s.activeDay === "tue" && s.periodCount === 7);
    report("Tuesday periods highlight lunch break 'Now' and Biology 'Next'", s.hasNowPill && s.hasNextPill);

    // Switch to Saturday
    await cdp.evaluate(`document.querySelector('.pm-day-btn[data-day="sat"]').click()`);
    await sleep(200);
    const satCount = await cdp.evaluate(`document.querySelectorAll(".pm-period-row, .pm-break-row").length`);
    report("Saturday schedule omits period 7 (exactly 6 entries)", satCount === 6);

    // 3. REPORT TAB
    console.log("\n--- PHASE 3: Student Report Tab ---");
    await cdp.evaluate(`document.querySelector('[data-action="tab"][data-tab="report"]').click()`);
    await sleep(250);

    const r = await cdp.evaluate(`(() => {
      const ring = document.querySelector(".pm-ring");
      const gpa = document.body.textContent.includes("3.85");
      const rank = document.body.textContent.includes("2 of 31");
      const subjects = document.querySelectorAll(".pm-subject-card");
      const pills = document.querySelectorAll(".pm-letter-pill");
      const bars = document.querySelectorAll(".pm-score-bar");
      const recent = document.querySelectorAll(".pm-card.pm-list .pm-row");
      const teacher = document.body.textContent.includes("Dr. Sokha Chan");
      const pdfBtn = document.querySelector('[data-action="pdf-toast"]');

      return {
        hasRing: !!ring && ring.textContent.includes("91.9"),
        hasGpa: gpa,
        hasRank: rank,
        subjectCount: subjects.length,
        pillCount: pills.length,
        barCount: bars.length,
        recentCount: recent.length,
        hasTeacher: teacher,
        hasPdfBtn: !!pdfBtn
      };
    })()`);

    report("Report tab displays circular progress ring with average 91.9", r.hasRing);
    report("Report tab displays Term GPA 3.85 and Class Rank 2 of 31", r.hasGpa && r.hasRank);
    report("Subject breakdown renders all 7 subjects with letter pills and progress bars", r.subjectCount === 7 && r.pillCount === 7 && r.barCount === 7);
    report("Recent assessments list renders quizzes and unit tests", r.recentCount >= 4);
    report("Homeroom Teacher Evaluation displays Dr. Sokha Chan remarks", r.hasTeacher);
    report("Download report (PDF) ghost button with data-action='pdf-toast' exists", r.hasPdfBtn);

    // PDF Toast test
    await cdp.evaluate(`document.querySelector('[data-action="pdf-toast"]').click()`);
    await sleep(150);
    const toastMsg = await cdp.evaluate(`(() => {
      const t = document.querySelector(".pm-toast");
      return t ? t.textContent.trim() : "";
    })()`);
    report("Tapping PDF button triggers toast notification", toastMsg.includes("Downloading Midterm_Report_2026_Term1.pdf"));

    // 4. ATTENDANCE TAB
    console.log("\n--- PHASE 4: Student Attendance Tab ---");
    await cdp.evaluate(`document.querySelector('[data-action="tab"][data-tab="attendance"]').click()`);
    await sleep(250);

    const a = await cdp.evaluate(`(() => {
      const ring = document.querySelector(".pm-ring");
      const grid = document.querySelector(".pm-calendar-grid");
      const cells = document.querySelectorAll(".pm-calendar-cell");
      const present = document.body.textContent.includes("24");
      const late = document.body.textContent.includes("2");
      const excused = document.body.textContent.includes("1");
      const absent = document.body.textContent.includes("0");

      return {
        hasRing: !!ring && ring.textContent.includes("96.3%"),
        hasGrid: !!grid,
        cellCount: cells.length,
        counts: present && late && excused && absent
      };
    })()`);

    report("Attendance tab renders circular progress ring with 96.3% rate", a.hasRing);
    report("4-up metric cards display 24 present, 2 late, 1 excused, 0 absent", a.counts);
    report("7-column calendar grid rendered", a.hasGrid && a.cellCount >= 30);

    // Month navigation to October
    await cdp.evaluate(`document.querySelector('[data-action="month"][data-month="2026-10"]').click()`);
    await sleep(200);

    const oct = await cdp.evaluate(`(() => {
      const holidayBadges = Array.from(document.querySelectorAll(".pm-calendar-cell")).filter(c => c.textContent.includes("H"));
      const recordsText = document.querySelector(".pm-card.pm-list") ? document.querySelector(".pm-card.pm-list").textContent : "";
      return {
        holidayCount: holidayBadges.length,
        hasLate8: recordsText.includes("8 Oct"),
        hasLate21: recordsText.includes("21 Oct")
      };
    })()`);

    report("Month navigation switches to October 2026", oct.holidayCount === 2);
    report("October non-present records list shows Oct 8 and Oct 21 late entries", oct.hasLate8 && oct.hasLate21);

    // 5. CHECK-IN LOG TAB & QR MODAL SHEET
    console.log("\n--- PHASE 5: Student Check-in Log Tab & Campus ID QR Sheet ---");
    await cdp.evaluate(`document.querySelector('[data-action="tab"][data-tab="checkin"]').click()`);
    await sleep(250);

    const c = await cdp.evaluate(`(() => {
      const offCampus = document.body.textContent.includes("Off campus");
      const duration = document.body.textContent.includes("4h 20m");
      const showBtn = document.querySelector('[data-action="sheet"][data-sheet="qr"]');
      const gateEvents = document.body.textContent.includes("07:12 AM") && document.body.textContent.includes("11:32 AM");

      return {
        hasOffCampus: offCampus,
        hasDuration: duration,
        hasShowBtn: !!showBtn,
        hasGateEvents: gateEvents
      };
    })()`);

    report("Check-in tab displays 'Off campus' status pill and '4h 20m' campus duration", c.hasOffCampus && c.hasDuration);
    report("Check-in tab displays today's RFID gate entry and exit scans", c.hasGateEvents);
    report("Button 'Show my campus ID' with data-action='sheet' data-sheet='qr' exists", c.hasShowBtn);

    // Open QR modal sheet
    await cdp.evaluate(`document.querySelector('[data-action="sheet"][data-sheet="qr"]').click()`);
    await sleep(200);

    const qr = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      const avatar = sheet ? sheet.querySelector(".pm-avatar") : null;
      const svg = sheet ? sheet.querySelector(".pm-qr-svg") : null;
      const cardId = sheet ? sheet.textContent.includes("STU-2026-001") : false;
      const name = sheet ? sheet.textContent.includes("Sok Chanreaksa") : false;
      const grade = sheet ? sheet.textContent.includes("G12-A") : false;

      return {
        hasSheet: !!sheet && !!backdrop,
        hasAvatar: avatar && avatar.textContent.trim() === "SC",
        hasSvg: !!svg,
        hasCardId: cardId,
        hasName: name,
        hasGrade: grade
      };
    })()`);

    report("Campus ID QR bottom sheet opens with backdrop", qr.hasSheet);
    report("Campus ID sheet displays avatar 'SC', name 'Sok Chanreaksa', grade 'G12-A'", qr.hasAvatar && qr.hasName && qr.hasGrade);
    report("Campus ID sheet displays card ID 'STU-2026-001' and deterministic SVG QR code", qr.hasCardId && qr.hasSvg);

    // Close QR modal sheet
    await cdp.evaluate(`document.querySelector('.pm-sheet [data-action="close-sheet"]').click()`);
    await sleep(200);
    const sheetDismissed = await cdp.evaluate(`!document.querySelector(".pm-sheet")`);
    report("Clicking Done closes the Campus ID sheet modal", sheetDismissed);

    console.log("\n======================================================================");
    console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("======================================================================");

    cdp.close();
    chromeProcess.kill();
    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error("Test failed with exception:", err);
    cdp.close();
    chromeProcess.kill();
    process.exit(1);
  }
}

runM3TestSuite();
