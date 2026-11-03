/**
 * ==============================================================================
 * test-adversarial-m3-reviewer.js
 * Independent Adversarial Stress Test Harness for Milestone 3 (Student Portal)
 * ==============================================================================
 */

const http = require("http");
const { spawn } = require("child_process");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m"
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(id, description, passed, detail = "") {
  totalChecks++;
  const idStr = String(id).padStart(2, "0");
  if (passed) {
    passedChecks++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} [${idStr}] ${description}${detail ? ` (${colors.cyan}${detail}${colors.reset})` : ""}`);
  } else {
    failedChecks++;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} [${idStr}] ${description}`);
    if (detail) {
      console.log(`        ${colors.red}↳ Detail: ${detail}${colors.reset}`);
    }
  }
}

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
      throw new Error(`Browser JS Exception: ${desc}`);
    }
    return res.result.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  INDEPENDENT REVIEWER ADVERSARIAL CHALLENGE: M3 STUDENT PORTAL       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);

  const PORT = 3000;
  const CDP_PORT = 9555;
  const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  const chromeProc = spawn(CHROME_PATH, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1440,900",
    `http://localhost:${PORT}/phone-mockup/`
  ]);

  await sleep(1500);

  let cdp = null;
  try {
    const targets = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve(JSON.parse(raw)));
      }).on("error", reject);
    });

    const pageTarget = targets.find((t) => t.type === "page" && t.url.includes("phone-mockup"));
    if (!pageTarget) throw new Error("Could not locate phone-mockup tab in headless Chrome");

    cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    // 1. Log in as Student
    await cdp.evaluate(`(() => {
      const form = document.querySelector(".pm-login-form");
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`);
    await sleep(900);

    // =========================================================================
    // SECTION 1: HOME TAB DEEP VERIFICATION
    // =========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 1: Home Tab Deep Verification ---${colors.reset}`);
    const hData = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const statCards = Array.from(document.querySelectorAll(".pm-stat-card"));
      const scheduleList = document.querySelector(".pm-card.pm-list");
      const announcement = document.querySelector(".pm-section-label + .pm-card");
      const bodyText = document.querySelector(".pm-body") ? document.querySelector(".pm-body").textContent : "";

      return {
        hasHero: !!hero,
        heroText: hero ? hero.textContent : "",
        statCardCount: statCards.length,
        statCard1Action: statCards[0] ? statCards[0].dataset.tab : null,
        statCard1Text: statCards[0] ? statCards[0].textContent : "",
        statCard2Action: statCards[1] ? statCards[1].dataset.tab : null,
        statCard2Text: statCards[1] ? statCards[1].textContent : "",
        hasScheduleList: !!scheduleList,
        scheduleItemCount: scheduleList ? scheduleList.querySelectorAll(".pm-period-row, .pm-break-row").length : 0,
        announcementText: announcement ? announcement.textContent : "",
        hasSubHeaderGrade: bodyText.includes("G12-A · High School")
      };
    })()`);

    report(1, "Home Hero card is rendered", hData.hasHero);
    report(2, "Hero card shows dynamic lunch break status ('Lunch break · 11:00 – 13:30')", hData.heroText.includes("Lunch break · 11:00 – 13:30"));
    report(3, "Hero card shows gate checkout ('Checked out 11:32 AM · Gate 01')", hData.heroText.includes("Checked out 11:32 AM · Gate 01"));
    report(4, "Hero card shows upcoming class ('Biology')", hData.heroText.includes("Biology"));
    report(5, "Sub-header badge shows class and high school ('G12-A · High School')", hData.hasSubHeaderGrade);
    report(6, "Quick stat overview renders exactly 2 cards", hData.statCardCount === 2);
    report(7, "Quick stat Card 1 links to attendance and displays 96.3%", hData.statCard1Action === "attendance" && hData.statCard1Text.includes("96.3%"));
    report(8, "Quick stat Card 2 links to report and displays 91.9", hData.statCard2Action === "report" && hData.statCard2Text.includes("91.9"));
    report(9, "Today's Schedule mini-list renders all 7 periods/breaks", hData.scheduleItemCount === 7, `Count: ${hData.scheduleItemCount}`);
    report(10, "Announcements card displays Independence Day notice", hData.announcementText.includes("Independence Day"));

    // =========================================================================
    // SECTION 2: STAT CARD DRILL-DOWN NAVIGATION
    // =========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 2: Stat Card Drill-Down Navigation ---${colors.reset}`);
    const navAtt = await cdp.evaluate(`(() => {
      const attCard = document.querySelector('.pm-stat-card[data-tab="attendance"]');
      if (attCard) attCard.click();
      const activeTab = document.querySelector(".pm-tab.active");
      const title = document.querySelector(".pm-title");
      return { tab: activeTab ? activeTab.dataset.tab : null, title: title ? title.textContent.trim() : null };
    })()`);
    report(11, "Clicking Attendance stat card transitions to Attendance tab", navAtt.tab === "attendance" && navAtt.title === "Attendance");

    // Return to home
    await cdp.evaluate(`document.querySelector('.pm-tab[data-tab="home"]').click()`);
    await sleep(100);

    const navRep = await cdp.evaluate(`(() => {
      const repCard = document.querySelector('.pm-stat-card[data-tab="report"]');
      if (repCard) repCard.click();
      const activeTab = document.querySelector(".pm-tab.active");
      const title = document.querySelector(".pm-title");
      return { tab: activeTab ? activeTab.dataset.tab : null, title: title ? title.textContent.trim() : null };
    })()`);
    report(12, "Clicking Average Score stat card transitions to Report tab", navRep.tab === "report" && navRep.title === "Report");

    // =========================================================================
    // SECTION 3: SCHEDULE TAB & WEEKDAY SWITCHING
    // =========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 3: Schedule Tab & Weekday Switching ---${colors.reset}`);
    await cdp.evaluate(`document.querySelector('.pm-tab[data-tab="schedule"]').click()`);
    await sleep(100);

    const sInit = await cdp.evaluate(`(() => {
      const activeDay = document.querySelector(".pm-day-btn.active");
      const dayButtons = Array.from(document.querySelectorAll(".pm-day-btn"));
      const periods = Array.from(document.querySelectorAll(".pm-period-row, .pm-break-row"));
      const nowPill = document.querySelector(".pm-pill.brand");
      const nextPill = document.querySelector(".pm-pill.neutral");
      const nowText = nowPill ? nowPill.closest(".pm-break-row, .pm-period-row").textContent : "";
      const nextText = nextPill ? nextPill.closest(".pm-break-row, .pm-period-row").textContent : "";

      return {
        activeDayKey: activeDay ? activeDay.dataset.day : null,
        totalDayButtons: dayButtons.length,
        tuePeriodCount: periods.length,
        nowIsLunch: nowText.includes("Lunch break"),
        nextIsBiology: nextText.includes("Biology")
      };
    })()`);

    report(13, "Schedule defaults to Tuesday (day key 'tue')", sInit.activeDayKey === "tue");
    report(14, "Day strip renders all 6 weekdays (Mon to Sat)", sInit.totalDayButtons === 6);
    report(15, "Tuesday timetable contains exactly 7 entries (5 classes + 2 breaks)", sInit.tuePeriodCount === 7);
    report(16, "Tuesday dynamic 'Now' marker correctly attached to Lunch break", sInit.nowIsLunch);
    report(17, "Tuesday dynamic 'Next' marker correctly attached to Biology class", sInit.nextIsBiology);

    // Switch to Saturday (Saturday boundary condition check)
    const satData = await cdp.evaluate(`(() => {
      const satBtn = document.querySelector('.pm-day-btn[data-day="sat"]');
      if (satBtn) satBtn.click();
      const periods = Array.from(document.querySelectorAll(".pm-period-row, .pm-break-row"));
      const periodTitles = periods.map(p => p.textContent.trim());

      return {
        satCount: periods.length,
        firstPeriod: periodTitles[0] || "",
        lastPeriod: periodTitles[periodTitles.length - 1] || ""
      };
    })()`);

    report(18, "Saturday timetable omits period 7 and renders exactly 6 entries", satData.satCount === 6, `Count: ${satData.satCount}`);
    report(19, "Saturday first class is BacII Mock Exam", satData.firstPeriod.includes("BacII Mock Exam"));
    report(20, "Saturday last period is Self-Study", satData.lastPeriod.includes("Self-Study"));

    // Check today indicator dot when switching to Monday
    const dotData = await cdp.evaluate(`(() => {
      const monBtn = document.querySelector('.pm-day-btn[data-day="mon"]');
      if (monBtn) monBtn.click();
      const tueBtn = document.querySelector('.pm-day-btn[data-day="tue"]');
      const dot = tueBtn ? tueBtn.querySelector(".pm-day-dot") : null;
      return { hasDotOnTue: !!dot };
    })()`);
    report(21, "Tuesday button displays indicator dot when inactive", dotData.hasDotOnTue);

    // =========================================================================
    // SECTION 4: ATTENDANCE TAB & CALENDAR RESILIENCE
    // =========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 4: Attendance Tab & Calendar Resilience ---${colors.reset}`);
    await cdp.evaluate(`document.querySelector('.pm-tab[data-tab="attendance"]').click()`);
    await sleep(100);

    const attNov = await cdp.evaluate(`(() => {
      const ringText = document.querySelector(".pm-ring-content").textContent;
      const monthBtn = document.querySelector('[data-action="month"][data-month="2026-10"]');
      const calHeader = monthBtn ? monthBtn.parentElement.textContent.trim() : "";
      const calCells = document.querySelectorAll(".pm-cal-cell");
      const listText = document.querySelector(".pm-card.pm-list") ? document.querySelector(".pm-card.pm-list").textContent : "";

      return {
        rate: ringText.includes("96.3%"),
        calHeader,
        cellCount: calCells.length,
        hasNov2Dental: listText.includes("Dental appointment")
      };
    })()`);

    report(22, "Attendance ring displays 96.3% rate", attNov.rate);
    report(23, "Default attendance month header shows November 2026", attNov.calHeader.includes("November 2026"));
    report(24, "November calendar records show Nov 2 dental excused absence", attNov.hasNov2Dental);

    // Switch to October 2026
    const attOct = await cdp.evaluate(`(() => {
      const prevBtn = document.querySelector('[data-action="month"][data-month="2026-10"]');
      if (prevBtn) prevBtn.click();
      const monthBtn = document.querySelector('[data-action="month"][data-month="2026-11"]');
      const calHeader = monthBtn ? monthBtn.parentElement.textContent.trim() : "";
      const listText = document.querySelector(".pm-card.pm-list") ? document.querySelector(".pm-card.pm-list").textContent : "";

      return {
        calHeader,
        hasOct8Traffic: listText.includes("Traffic delay") || listText.includes("11 min late"),
        hasOct21Rain: listText.includes("Heavy rain") || listText.includes("8 min late")
      };
    })()`);

    report(25, "Month navigation switches to October 2026", attOct.calHeader.includes("October 2026"));
    report(26, "October records include Oct 8 late traffic note", attOct.hasOct8Traffic);
    report(27, "October records include Oct 21 late rain note", attOct.hasOct21Rain);

    // =========================================================================
    // SECTION 5: CHECK-IN LOG & CAMPUS ID QR MODAL SHEET
    // =========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 5: Check-in Log & Campus ID QR Sheet ---${colors.reset}`);
    await cdp.evaluate(`document.querySelector('.pm-tab[data-tab="checkin"]').click()`);
    await sleep(100);

    const chkData = await cdp.evaluate(`(() => {
      const statusPill = document.querySelector(".pm-pill");
      const duration = document.querySelector(".pm-body").textContent;
      const qrBtn = document.querySelector('[data-sheet="qr"]');

      return {
        statusText: statusPill ? statusPill.textContent.trim() : "",
        hasDuration4h20m: duration.includes("4h 20m"),
        hasQrBtn: !!qrBtn
      };
    })()`);

    report(28, "Check-in tab shows 'Off campus' status pill", chkData.statusText.includes("Off campus"));
    report(29, "Campus duration shows '4h 20m' computed duration", chkData.hasDuration4h20m);
    report(30, "'Show my campus ID' button is present", chkData.hasQrBtn);

    // Open QR Bottom Sheet
    const qrData = await cdp.evaluate(`(() => {
      const qrBtn = document.querySelector('[data-sheet="qr"]');
      if (qrBtn) qrBtn.click();

      const sheet = document.querySelector(".pm-sheet");
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      const svg = sheet ? sheet.querySelector("svg.pm-qr-svg") : null;
      const rectCount = svg ? svg.querySelectorAll("rect").length : 0;
      const text = sheet ? sheet.textContent : "";

      return {
        sheetVisible: !!sheet,
        backdropVisible: !!backdrop,
        hasSvg: !!svg,
        rectCount,
        hasName: text.includes("Sok Chanreaksa"),
        hasCardId: text.includes("STU-2026-001"),
        hasGrade: text.includes("G12-A"),
        hasAvatar: text.includes("SC")
      };
    })()`);

    report(31, "Campus ID bottom sheet opens with backdrop", qrData.sheetVisible && qrData.backdropVisible);
    report(32, "Campus ID sheet renders crisp SVG QR code with genuine rect cells", qrData.hasSvg && qrData.rectCount > 100, `Rect cells: ${qrData.rectCount}`);
    report(33, "Campus ID displays student name 'Sok Chanreaksa'", qrData.hasName);
    report(34, "Campus ID displays card ID 'STU-2026-001'", qrData.hasCardId);
    report(35, "Campus ID displays grade 'G12-A · Science Track' & avatar 'SC'", qrData.hasGrade && qrData.hasAvatar);

    // Close QR Bottom Sheet
    const closeData = await cdp.evaluate(`(() => {
      const closeBtn = document.querySelector('.pm-sheet [data-action="close-sheet"]');
      if (closeBtn) closeBtn.click();
      return { sheetDismissed: !document.querySelector(".pm-sheet") };
    })()`);
    report(36, "Campus ID sheet dismisses cleanly on close action", closeData.sheetDismissed);

    // =========================================================================
    // SECTION 6: ADVERSARIAL RESILIENCE & STORAGE CLEANLINESS
    // =========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 6: Storage Cleanliness & Zero Leaks ---${colors.reset}`);
    const leakData = await cdp.evaluate(`(() => {
      const localKeys = Object.keys(window.localStorage);
      const sessionKeys = Object.keys(window.sessionStorage);
      const mockupLocalKeys = localKeys.filter(k => k.toLowerCase().includes("pm_") || k.toLowerCase().includes("auth") || k.toLowerCase().includes("user") || k.toLowerCase().includes("role"));
      const globalPollution = Object.keys(window).filter(k => k.startsWith("PM_") || k.startsWith("pm"));

      return {
        mockupLocalKeys,
        sessionKeys,
        globalPollution
      };
    })()`);

    report(37, "Zero mockup session/state keys in localStorage", leakData.mockupLocalKeys.length === 0);
    report(38, "Zero sessionStorage pollution", leakData.sessionKeys.length === 0);
    report(39, "Global window namespace only exposes designated 'PM_HELPERS' & 'PM_DATA'", leakData.globalPollution.sort().join(",") === "PM_DATA,PM_HELPERS");

  } finally {
    if (cdp && cdp.ws) cdp.ws.close();
    chromeProc.kill("SIGKILL");
  }

  console.log(`\n${colors.bold}======================================================================${colors.reset}`);
  console.log(`${colors.bold}TOTAL REVIEW CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}${colors.reset}`);
  console.log(`${colors.bold}======================================================================${colors.reset}`);

  if (failedChecks > 0) {
    console.error(`\n${colors.red}${colors.bold}ADVERSARIAL VERDICT: REQUEST_CHANGES (${failedChecks} checks failed)${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}ADVERSARIAL VERDICT: APPROVE (All 39 invariant checks passed cleanly)${colors.reset}`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});
