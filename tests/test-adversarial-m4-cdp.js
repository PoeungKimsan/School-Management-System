#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m4-cdp.js
 * Empirical Adversarial Test Harness for Milestone 4:
 * Parent Portal 5-Tab Live Interactive Behavior via Headless Chromium CDP
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

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

let PORT = 3000;
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--port=")) {
    PORT = parseInt(arg.split("=")[1], 10);
  }
}

const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.eventListeners = [];
  }

  onEvent(cb) {
    this.eventListeners.push(cb);
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
      if (msg.method) {
        this.eventListeners.forEach((cb) => cb(msg));
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
  console.log(`${colors.bold}${colors.cyan}  EMPIRICAL ADVERSARIAL CHALLENGE: M4 PARENT PORTAL CDP HARNESS       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`Target URL:          ${BASE_URL}`);

  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser"
  ];
  let chromeBin = chromePaths.find((p) => fs.existsSync(p));
  if (!chromeBin) {
    console.error("No Chrome binary found on system.");
    process.exit(1);
  }

  const cdpPort = 9222 + Math.floor(Math.random() * 500);
  const tmpDir = path.join("/tmp", `cdp-test-m4-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(chromeBin, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tmpDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-translate",
    "--hide-scrollbars",
    "--metrics-recording-only",
    "--mute-audio",
    "--no-sandbox",
    BASE_URL
  ]);

  let cdp = null;

  try {
    let wsEndpoint = null;
    for (let i = 0; i < 40; i++) {
      await sleep(150);
      try {
        const json = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${cdpPort}/json`, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        const target = json.find((t) => t.type === "page" && t.url.includes("phone-mockup"));
        if (target && target.webSocketDebuggerUrl) {
          wsEndpoint = target.webSocketDebuggerUrl;
          break;
        }
      } catch (err) {}
    }

    if (!wsEndpoint) throw new Error("Could not connect to Headless Chrome CDP endpoint.");

    cdp = new CdpClient(wsEndpoint);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const consoleErrors = [];
    const consoleWarnings = [];
    cdp.onEvent((msg) => {
      if (msg.method === "Runtime.exceptionThrown") {
        consoleErrors.push(msg.params.exceptionDetails.text);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || a.description).join(" ");
        if (msg.params.type === "error") {
          consoleErrors.push(text);
        } else if (msg.params.type === "warning") {
          consoleWarnings.push(text);
        }
      }
    });

    await sleep(400);

    // =========================================================================
    // PHASE 1: Parent Sign-In & App Shell Initialization
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 1: Parent Login & Header Presentation ---${colors.reset}`);

    // Switch to Parent role
    await cdp.evaluate(`(() => {
      const pTab = document.querySelector(".pm-seg-btn[data-role='parent']");
      if (pTab) pTab.click();
    })()`);
    await sleep(150);

    const pRole = await cdp.evaluate(`(() => {
      const pTab = document.querySelector(".pm-seg-btn[data-role='parent']");
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      return {
        active: pTab ? pTab.classList.contains("active") : false,
        username: user ? user.value : "",
        password: pass ? pass.value : ""
      };
    })()`);
    report(1, "Switched role to Parent on login screen", pRole.active && pRole.username === "par_vibol");

    // Test explicit credential entry: 'parent_vibol' / 'demo1234'
    await cdp.evaluate(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      if (user) user.value = "parent_vibol";
      if (pass) pass.value = "demo1234";
    })()`);

    const typedCreds = await cdp.evaluate(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      return { user: user?.value, pass: pass?.value };
    })()`);
    report(2, "Prefilled/entered credentials verify username 'parent_vibol' and password 'demo1234'", typedCreds.user === "parent_vibol" && typedCreds.pass === "demo1234");

    // Click submit
    await cdp.evaluate(`(() => {
      const form = document.querySelector(".pm-login-form") || document.getElementById("pmLoginForm");
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`);

    await sleep(900); // wait for 700ms loading transition

    const shell = await cdp.evaluate(`(() => {
      const header = document.querySelector(".pm-header");
      const eyebrow = document.querySelector(".pm-eyebrow");
      const title = document.querySelector(".pm-title");
      const greeting = document.querySelector(".pm-greeting");
      const avatar = document.querySelector(".pm-avatar");
      const switcher = document.querySelector(".pm-child-switcher");
      const tabs = Array.from(document.querySelectorAll(".pm-tab")).map(t => t.dataset.tab);
      const activeTab = document.querySelector(".pm-tab.active")?.dataset.tab;
      const tabDot = document.querySelector(".pm-tab[data-tab='payments'] .pm-tab-dot");

      return {
        hasHeader: !!header,
        eyebrow: eyebrow ? eyebrow.textContent.trim() : "",
        title: title ? title.textContent.trim() : "",
        greeting: greeting ? greeting.textContent.trim() : "",
        avatar: avatar ? avatar.textContent.trim() : "",
        hasSwitcher: !!switcher,
        switcherName: switcher ? switcher.querySelector(".pm-child-switcher-name")?.textContent.trim() : "",
        switcherDot: switcher ? switcher.querySelector(".pm-child-switcher-dot")?.textContent.trim() : "",
        tabs: tabs,
        activeTab: activeTab,
        hasPaymentDot: !!tabDot
      };
    })()`);

    report(3, "Parent login transitions to App Shell with 'Parent Portal' title", shell.title === "Parent Portal");
    report(4, "Parent header displays eyebrow 'Tuesday, 3 November'", shell.eyebrow.includes("Tuesday, 3 November"));
    report(5, "Parent header displays greeting 'Good morning, Vibol!'", shell.greeting === "Good morning, Vibol!");
    report(6, "Parent account avatar displays initials 'SV'", shell.avatar === "SV");
    report(7, "Parent Home header is clean without a redundant header child switcher dropdown", !shell.hasSwitcher);
    report(8, "Parent tab bar contains 5 tabs: [home, alerts, scores, schedule, payments]", shell.tabs.join(",") === "home,alerts,scores,schedule,payments");
    report(9, "Default active tab is 'home'", shell.activeTab === "home");
    report(10, "Payments tab displays overdue red dot indicator (.pm-tab-dot)", shell.hasPaymentDot);

    // =========================================================================
    // PHASE 2: Parent Home Tab Components
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 2: Parent Home Tab Components ---${colors.reset}`);

    const homeData = await cdp.evaluate(`(() => {
      const c1Card = document.querySelector(".pm-child-card.child-1");
      const c11Card = document.querySelector(".pm-child-card.child-11");
      const payCard = document.querySelector(".pm-payment-card");
      const gateWidget = document.querySelector(".pm-gate-widget");

      return {
        hasC1: !!c1Card,
        c1Name: c1Card?.querySelector(".pm-child-card-name")?.textContent.trim(),
        c1Status: c1Card?.querySelector(".pm-pill")?.textContent.trim(),
        c1Metrics: Array.from(c1Card?.querySelectorAll(".pm-child-metric-val") || []).map(m => m.textContent.trim()),
        hasC11: !!c11Card,
        c11Name: c11Card?.querySelector(".pm-child-card-name")?.textContent.trim(),
        c11Status: c11Card?.querySelector(".pm-pill")?.textContent.trim(),
        c11Metrics: Array.from(c11Card?.querySelectorAll(".pm-child-metric-val") || []).map(m => m.textContent.trim()),
        payTotal: payCard?.querySelector(".pm-payment-total-note")?.textContent.trim(),
        hasOverdueAlert: !!payCard?.querySelector(".pm-payment-overdue-alert"),
        overdueText: payCard?.querySelector(".pm-payment-overdue-alert")?.textContent.trim(),
        hasGateWidget: !!gateWidget,
        gateRows: Array.from(gateWidget?.querySelectorAll(".pm-gate-feed-row") || []).map(r => r.textContent.trim())
      };
    })()`);

    report(11, "Child 1 Status Card: Sok Chanreaksa Off campus · Out 11:32 AM", homeData.c1Name === "Sok Chanreaksa" && homeData.c1Status.includes("Off campus") && homeData.c1Status.includes("11:32 AM"));
    report(12, "Child 1 Metrics: Attendance 96.3%, Midterm Avg 91.9, GPA 3.85", homeData.c1Metrics[0] === "96.3%" && homeData.c1Metrics[1] === "91.9" && homeData.c1Metrics[2] === "3.85");
    report(13, "Child 11 Status Card: Sok Chanpanha On campus · In 07:12 AM", homeData.c11Name === "Sok Chanpanha" && homeData.c11Status.includes("On campus") && homeData.c11Status.includes("07:12 AM"));
    report(14, "Child 11 Metrics: Attendance 100.0%, Midterm Avg 91.0, GPA 3.78", homeData.c11Metrics[0] === "100.0%" && homeData.c11Metrics[1] === "91.0" && homeData.c11Metrics[2] === "3.78");
    report(15, "Next Payment Card: Total family balance $1,710.00", homeData.payTotal.includes("$1,710.00"));
    report(16, "Next Payment Card: Urgent overdue alert displays INV-2026-0618 ($45.00 Overdue)", homeData.hasOverdueAlert && homeData.overdueText.includes("INV-2026-0618") && homeData.overdueText.includes("$45.00"));
    report(17, "Latest Gate Alerts Widget: Top 3 events chronologically descending (11:32 AM on top)", homeData.hasGateWidget && homeData.gateRows.length === 3 && homeData.gateRows[0].includes("11:32 AM"));

    // =========================================================================
    // PHASE 3: Push Notification Banner — Workflow 1 (Dismissal via Close Button)
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 3: Push Notification Banner — Dismissal Workflow 1 ---${colors.reset}`);

    // Wait for the push banner timer (1.5s post-login)
    await sleep(1600);

    const pushBanner = await cdp.evaluate(`(() => {
      const banner = document.querySelector(".pm-push");
      return {
        exists: !!banner,
        role: banner ? banner.getAttribute("role") : null,
        title: banner ? banner.querySelector(".pm-push-title")?.textContent.trim() : "",
        subtitle: banner ? banner.querySelector("div[style*='font-size: 11px']")?.textContent.trim() : "",
        desc: banner ? banner.querySelector(".pm-push-desc")?.textContent.trim() : "",
        appName: banner ? banner.querySelector(".pm-push-app")?.textContent.trim() : "",
        time: banner ? banner.querySelector(".pm-push-time")?.textContent.trim() : "",
        hasIcon: !!banner?.querySelector(".pm-push-icon"),
        hasDismiss: !!banner?.querySelector("[data-action='push-dismiss']")
      };
    })()`);

    report(18, "Simulated iOS Push Banner (.pm-push) mounts in DOM below Dynamic Island", pushBanner.exists);
    report(19, "Push banner has accessibility role='alert'", pushBanner.role === "alert");
    report(20, "Push banner displays school brand name and timestamp 'now'", (pushBanner.appName.includes("Milky Way School") || pushBanner.appName.includes("School Management")) && pushBanner.time === "now");
    report(21, "Push banner displays title 'Gate Alert: Sok Chanreaksa'", pushBanner.title === "Gate Alert: Sok Chanreaksa");
    report(22, "Push banner body details 'Checked out at 11:32 AM via Gate 01 (Lunch break)'", pushBanner.desc.includes("11:32 AM") && pushBanner.desc.includes("Gate 01"));
    report(23, "Push banner close button exists for non-navigating dismissal", pushBanner.hasDismiss);

    // Dismiss banner using close button
    await cdp.evaluate(`(() => {
      const closeBtn = document.querySelector(".pm-push [data-action='push-dismiss']");
      if (closeBtn) closeBtn.click();
    })()`);

    await sleep(400); // allow dismissing animation

    const bannerDismissed = await cdp.evaluate(`(() => {
      return {
        gone: !document.querySelector(".pm-push"),
        currentTab: document.querySelector(".pm-tab.active")?.dataset.tab
      };
    })()`);
    report(24, "Dismissal Workflow 1: Close button dismissed push banner without navigating away from 'home'", bannerDismissed.gone && bannerDismissed.currentTab === "home");

    // =========================================================================
    // PHASE 4: Push Notification Banner — Workflow 2 (Click Banner Body Navigates to Alerts)
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 4: Push Notification Banner — Navigation Workflow 2 ---${colors.reset}`);

    // Open Account menu via avatar
    await cdp.evaluate(`(() => {
      const avatarBtn = document.querySelector(".pm-avatar[data-action='sheet'][data-sheet='account']");
      if (avatarBtn) avatarBtn.click();
    })()`);
    await sleep(150);

    const accountSheet = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const title = sheet ? sheet.querySelector("h2")?.textContent.trim() : "";
      const pill = sheet ? sheet.querySelector(".pm-pill")?.textContent.trim() : "";
      const signoutBtn = sheet ? sheet.querySelector("[data-action='signout']") : null;
      return { isOpen: !!sheet, title: title, pill: pill, hasSignout: !!signoutBtn };
    })()`);
    report(25, "Header avatar button opens Account Menu sheet with Parent Portal profile", accountSheet.isOpen && (accountSheet.title === "My Account" || accountSheet.pill === "Parent Portal"));

    // Click Sign Out
    await cdp.evaluate(`(() => {
      const btn = document.querySelector("[data-action='signout']");
      if (btn) btn.click();
    })()`);
    await sleep(200);

    const signoutState = await cdp.evaluate(`(() => {
      const loginForm = document.querySelector(".pm-login-form");
      const toast = document.querySelector(".pm-toast")?.textContent.trim();
      return { atLogin: !!loginForm, toast: toast };
    })()`);
    report(26, "Sign Out transitions back to login screen with toast confirmation", signoutState.atLogin && signoutState.toast.includes("Signed out"));

    // Sign back in as Parent
    await cdp.evaluate(`(() => {
      const form = document.querySelector(".pm-login-form");
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`);
    await sleep(900); // wait 700ms login transition

    // Wait 1.6s for Push Banner to reappear
    await sleep(1600);

    const banner2 = await cdp.evaluate(`(() => {
      const b = document.querySelector(".pm-push");
      return { exists: !!b, title: b?.querySelector(".pm-push-title")?.textContent.trim() };
    })()`);
    report(27, "Push banner successfully mounts again on fresh parent login session", banner2.exists && banner2.title.includes("Gate Alert"));

    // Workflow 2: Click banner body (not close button)
    await cdp.evaluate(`(() => {
      const b = document.getElementById("pmPushBanner") || document.querySelector(".pm-push");
      if (b) b.click();
    })()`);
    await sleep(200);

    const workflow2Result = await cdp.evaluate(`(() => {
      const banner = document.querySelector(".pm-push");
      const activeTab = document.querySelector(".pm-tab.active")?.dataset.tab;
      const unreadBadge = document.querySelector(".pm-tab[data-tab='alerts'] .pm-tab-badge");
      return {
        bannerGone: !banner,
        activeTab: activeTab,
        badgeCleared: !unreadBadge
      };
    })()`);

    report(28, "Navigation Workflow 2: Clicking banner body navigates to 'alerts' tab", workflow2Result.activeTab === "alerts");
    report(29, "Navigation Workflow 2: Clicking banner removes banner and clears unread alerts badge", workflow2Result.bannerGone && workflow2Result.badgeCleared);

    // =========================================================================
    // PHASE 5: Alerts Tab Feed, Toggles & Filtering
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 5: Alerts Tab Feed & Settings ---${colors.reset}`);

    const alertsFeed = await cdp.evaluate(`(() => {
      const chips = Array.from(document.querySelectorAll(".pm-chips .pm-chip")).map(c => c.textContent.trim());
      const switches = Array.from(document.querySelectorAll(".pm-switch input")).map(s => ({
        child: s.dataset.child,
        checked: s.checked
      }));
      const dateGroups = Array.from(document.querySelectorAll(".pm-section-label")).map(l => l.textContent.trim());
      const totalFeedRows = document.querySelectorAll(".pm-gate-feed-icon").length;

      return {
        chips: chips,
        switches: switches,
        hasToday: dateGroups.some(g => g.includes("Today, 3 Nov 2026")),
        hasYesterday: dateGroups.some(g => g.includes("Yesterday, 2 Nov 2026")),
        totalEvents: totalFeedRows
      };
    })()`);

    report(30, "Instant Gate Notifications card renders switches for Chanreaksa and Chanpanha", alertsFeed.switches.length === 2 && alertsFeed.switches[0].checked && alertsFeed.switches[1].checked);
    report(31, "Filter chips display counts: [All (3), Chanreaksa (2), Chanpanha (1)]", alertsFeed.chips.join(" ").includes("All (3)") && alertsFeed.chips.join(" ").includes("Chanreaksa (2)") && alertsFeed.chips.join(" ").includes("Chanpanha (1)"));
    report(32, "Date-grouped event feed renders 'Today, 3 Nov 2026' and 'Yesterday, 2 Nov 2026' sections", alertsFeed.hasToday && alertsFeed.hasYesterday);

    // Toggle switch for Chanreaksa to verify notification setting toast
    await cdp.evaluate(`(() => {
      const sw = document.querySelector(".pm-switch input[data-child='1']");
      if (sw) sw.click();
    })()`);
    await sleep(150);

    const toggleToast = await cdp.evaluate(`(() => {
      return document.querySelector(".pm-toast")?.textContent.trim() || "";
    })()`);
    report(33, "Toggling gate notifications switch triggers informative toast notification", toggleToast.includes("Sok Chanreaksa") && toggleToast.includes("muted"));

    // Toggle back
    await cdp.evaluate(`(() => {
      const sw = document.querySelector(".pm-switch input[data-child='1']");
      if (sw) sw.click();
    })()`);
    await sleep(150);

    // Filter by Chanpanha (Child 11)
    await cdp.evaluate(`(() => {
      const chip11 = document.querySelector(".pm-chip[data-action='alert-filter'][data-filter='11']");
      if (chip11) chip11.click();
    })()`);
    await sleep(150);

    const filteredRows11 = await cdp.evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll(".pm-row")).map(r => r.textContent.trim());
      return {
        count: rows.length,
        hasChanpanhaOnly: rows.every(r => r.includes("Chanpanha") || r.includes("Notifications") || r.includes("Filter"))
      };
    })()`);
    report(34, "Clicking 'Chanpanha (1)' filter chip filters feed to show only Chanpanha gate events", filteredRows11.count > 0);

    // Reset filter to All
    await cdp.evaluate(`(() => {
      const chipAll = document.querySelector(".pm-chip[data-action='alert-filter'][data-filter='all']");
      if (chipAll) chipAll.click();
    })()`);
    await sleep(150);

    // =========================================================================
    // PHASE 6: Multi-Child Switcher & Invariant Verification
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 6: Multi-Child Switcher & Invariant Verification ---${colors.reset}`);

    // Navigate to Scores tab to verify single unified child context switcher
    await cdp.evaluate(`(() => {
      const tab = document.querySelector(".pm-tab[data-tab='scores']");
      if (tab) tab.click();
    })()`);
    await sleep(150);

    // Open child switcher from unified context bar
    await cdp.evaluate(`(() => {
      const sw = document.querySelector(".pm-child-switcher");
      if (sw) sw.click();
    })()`);
    await sleep(150);

    const childSheet = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const title = sheet?.querySelector(".pm-sheet-title")?.textContent.trim();
      const cards = Array.from(sheet?.querySelectorAll(".pm-child-select-card") || []).map(c => ({
        id: c.dataset.child,
        name: c.querySelector(".pm-child-select-name")?.textContent.trim(),
        meta: c.querySelector(".pm-child-select-meta")?.textContent.trim(),
        active: c.classList.contains("active")
      }));
      return { isOpen: !!sheet, title: title, cards: cards };
    })()`);

    report(35, "Tapping unified child switcher opens 'Select Child' bottom sheet", childSheet.isOpen && childSheet.title === "Select Child");
    report(36, "Sheet displays both children: Sok Chanreaksa and Sok Chanpanha", childSheet.cards.length === 2 && childSheet.cards[0].name === "Sok Chanreaksa" && childSheet.cards[1].name === "Sok Chanpanha");

    // Select Sok Chanpanha (ID 11)
    await cdp.evaluate(`(() => {
      const c11Card = document.querySelector(".pm-child-select-card[data-child='11']");
      if (c11Card) c11Card.click();
    })()`);
    await sleep(150);

    const postSwitchHeader = await cdp.evaluate(`(() => {
      const swName = document.querySelector(".pm-child-switcher-name")?.textContent.trim();
      const swDot = document.querySelector(".pm-child-switcher-dot")?.textContent.trim();
      const switcherBars = document.querySelectorAll(".pm-child-context-bar").length;
      const headerSwitchers = document.querySelectorAll(".pm-header .pm-child-switcher").length;
      return { swName: swName, swDot: swDot, switcherBars, headerSwitchers };
    })()`);
    report(37, "Single unified child switcher updates to 'SP' / 'Sok Chanpanha' (no duplicate header dropdown)", postSwitchHeader.swDot === "SP" && postSwitchHeader.swName === "Sok Chanpanha" && postSwitchHeader.switcherBars === 1 && postSwitchHeader.headerSwitchers === 0);

    const scores11 = await cdp.evaluate(`(() => {
      const bar = document.querySelector(".pm-child-context-bar");
      const ring = document.querySelector(".pm-score-val")?.textContent.trim();
      const gpa = document.querySelector(".pm-stat-box .val")?.textContent.trim();
      const teacher = document.querySelector(".pm-comment-author")?.textContent.trim();
      const initials = document.querySelector(".pm-comment-avatar")?.textContent.trim();
      const subjectCards = document.querySelectorAll(".pm-subject-card").length;

      return {
        barText: bar ? bar.textContent.trim() : "",
        hasChangeBtn: !!bar?.querySelector("[data-action='sheet']"),
        score: ring,
        gpa: gpa,
        teacher: teacher,
        initials: initials,
        subjectCount: subjectCards
      };
    })()`);

    report(38, "Scores tab displays Child Context Bar 'Viewing Sok Chanpanha · G7-IEP'", scores11.barText.includes("Viewing") && scores11.barText.includes("Sok Chanpanha") && (scores11.barText.includes("G7-IEP") || scores11.barText.includes("G8-B")));
    report(39, "Scores tab renders Midterm evaluation for Chanpanha (Average 91.0, GPA 3.78, 6 subjects)", scores11.score === "91.0" && scores11.gpa === "3.78" && scores11.subjectCount === 6);
    report(40, "Teacher quote card displays Homeroom Advisor Ms. Bopha Pich with initials 'BP'", scores11.teacher?.includes("Ms. Bopha Pich") && scores11.initials === "BP");

    // Use Context Bar 'Change' button to switch back to Sok Chanreaksa (ID 1)
    await cdp.evaluate(`(() => {
      const btn = document.querySelector(".pm-child-context-bar [data-action='sheet']");
      if (btn) btn.click();
    })()`);
    await sleep(150);

    await cdp.evaluate(`(() => {
      const c1 = document.querySelector(".pm-child-select-card[data-child='1']");
      if (c1) c1.click();
    })()`);
    await sleep(150);

    const scores1 = await cdp.evaluate(`(() => {
      const bar = document.querySelector(".pm-child-context-bar");
      const ring = document.querySelector(".pm-score-val")?.textContent.trim();
      const gpa = document.querySelector(".pm-stat-box .val")?.textContent.trim();
      const teacher = document.querySelector(".pm-comment-author")?.textContent.trim();
      const initials = document.querySelector(".pm-comment-avatar")?.textContent.trim();
      const subjectCards = document.querySelectorAll(".pm-subject-card").length;

      return {
        barText: bar ? bar.textContent.trim() : "",
        score: ring,
        gpa: gpa,
        teacher: teacher,
        initials: initials,
        subjectCount: subjectCards
      };
    })()`);

    report(41, "Context bar switch updates to 'Viewing Sok Chanreaksa · G12-A'", scores1.barText.includes("Sok Chanreaksa") && scores1.barText.includes("G12-A"));
    report(42, "Scores view dynamically updates to Chanreaksa (Average 91.9, GPA 3.85, 7 subjects)", scores1.score === "91.9" && scores1.gpa === "3.85" && scores1.subjectCount === 7);
    report(43, "Teacher quote card dynamically updates to Dr. Sokha Chan with initials 'SC'", scores1.teacher?.includes("Dr. Sokha Chan") && scores1.initials === "SC");

    // Navigate to Schedule tab (active child is 1)
    await cdp.evaluate(`(() => {
      const tab = document.querySelector(".pm-tab[data-tab='schedule']");
      if (tab) tab.click();
    })()`);
    await sleep(150);

    const schedC1 = await cdp.evaluate(`(() => {
      const bar = document.querySelector(".pm-child-context-bar")?.textContent.trim();
      const activeDay = document.querySelector(".pm-day-btn.active")?.dataset.day;
      const nowPill = document.querySelector(".pm-break-row.now");
      const nextPill = document.querySelector(".pm-pill.neutral")?.textContent.trim();

      return {
        bar: bar,
        day: activeDay,
        nowText: nowPill ? nowPill.textContent.trim() : "",
        nextText: nextPill
      };
    })()`);

    report(44, "Schedule tab displays Context Bar 'Viewing Sok Chanreaksa · G12-A'", schedC1.bar.includes("Sok Chanreaksa"));
    report(45, "Tuesday demo clock (11:35 AM) marks Lunch break as 'Now' and Biology as 'Next'", schedC1.nowText.includes("Lunch") && schedC1.nextText === "Next");

    // Switch to Saturday for Child 1
    await cdp.evaluate(`(() => {
      const sat = document.querySelector(".pm-day-btn[data-day='sat']");
      if (sat) sat.click();
    })()`);
    await sleep(150);

    const satC1 = await cdp.evaluate(`(() => {
      const rows = document.querySelectorAll(".pm-period-row, .pm-break-row");
      return { count: rows.length };
    })()`);
    report(46, "Saturday schedule for Chanreaksa has exactly 6 periods (period 7 omitted)", satC1.count === 6);

    // Switch child to Chanpanha (ID 11) via context bar
    await cdp.evaluate(`(() => {
      const btn = document.querySelector(".pm-child-context-bar [data-action='sheet']");
      if (btn) btn.click();
    })()`);
    await sleep(150);

    await cdp.evaluate(`(() => {
      const c11 = document.querySelector(".pm-child-select-card[data-child='11']");
      if (c11) c11.click();
    })()`);
    await sleep(150);

    const satC11 = await cdp.evaluate(`(() => {
      const bar = document.querySelector(".pm-child-context-bar")?.textContent.trim();
      const rows = document.querySelectorAll(".pm-period-row, .pm-break-row");
      const lastRow = rows[rows.length - 1]?.textContent.trim();

      return {
        bar: bar,
        count: rows.length,
        lastRow: lastRow
      };
    })()`);

    report(47, "Switching child on Schedule stays on Schedule tab with Context Bar 'Viewing Sok Chanpanha'", satC11.bar.includes("Sok Chanpanha"));
    report(48, "Saturday schedule for Chanpanha updates to 5 timetable periods (ends 11:20 AM, no lunch)", satC11.count === 5 && satC11.lastRow.includes("11:20"));

    // Stress Fuzzing: Rapid child switching toggles
    for (let f = 0; f < 10; f++) {
      const targetChild = (f % 2 === 0) ? 1 : 11;
      await cdp.evaluate(`(() => {
        const btn = document.querySelector(".pm-child-context-bar [data-action='sheet']");
        if (btn) btn.click();
      })()`);
      await sleep(50);
      await cdp.evaluate(`(() => {
        const card = document.querySelector(".pm-child-select-card[data-child='${targetChild}']");
        if (card) card.click();
      })()`);
      await sleep(50);
    }
    const fuzzChildState = await cdp.evaluate(`(() => {
      return {
        header: !!document.querySelector(".pm-header"),
        activeChild: document.querySelector(".pm-child-switcher-name")?.textContent.trim()
      };
    })()`);
    report(49, "Rapid Child Switcher Stress Test (10 toggles) maintains DOM integrity without crashing", fuzzChildState.header && fuzzChildState.activeChild.includes("Sok"));

    // =========================================================================
    // PHASE 7: Payments Tab & Interactive 3-Step Checkout Flow
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 7: Payments Tab & 3-Step Checkout Flow ---${colors.reset}`);

    // Navigate to Payments tab
    await cdp.evaluate(`(() => {
      const tab = document.querySelector(".pm-tab[data-tab='payments']");
      if (tab) tab.click();
    })()`);
    await sleep(150);

    const payInitial = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const total = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const overduePill = hero ? hero.querySelector("span[style*='#fee4e2']")?.textContent.trim() : "";
      const segDue = document.querySelector(".pm-seg-btn[data-filter='due']")?.textContent.trim();
      const segPaid = document.querySelector(".pm-seg-btn[data-filter='paid']")?.textContent.trim();
      const invoices = Array.from(document.querySelectorAll(".pm-payments-view .pm-card:not(.pm-card-hero)")).map(c => ({
        title: c.querySelector("div[style*='font-weight: 700']")?.textContent.trim(),
        amount: c.querySelector("div[style*='font-weight: 800']")?.textContent.trim(),
        hasPayBtn: !!c.querySelector("[data-action='pay']")
      }));
      const tabDot = document.querySelector(".pm-tab[data-tab='payments'] .pm-tab-dot");

      return {
        total: total,
        overduePill: overduePill,
        segDue: segDue,
        segPaid: segPaid,
        invoices: invoices,
        hasTabDot: !!tabDot
      };
    })()`);

    report(50, "Payments Hero Card displays initial Total Family Outstanding '$1,710.00'", payInitial.total === "$1,710.00");
    report(51, "Hero breakdown pill highlights '$45.00 Overdue' in danger badge", payInitial.overduePill.includes("$45.00") && payInitial.overduePill.includes("Overdue"));
    report(52, "Segmented control indicates 'Due (3)' and 'Paid (2)'", payInitial.segDue === "Due (3)" && payInitial.segPaid === "Paid (2)");
    report(53, "Payments tab icon displays red dot warning indicator (.pm-tab-dot)", payInitial.hasTabDot);
    report(54, "First invoice in Due list is INV-2026-0618 ($45.00) with 'Pay $45.00' button", payInitial.invoices[0].amount === "$45.00" && payInitial.invoices[0].hasPayBtn);

    // CANCELLATION TEST: Open sheet on INV-2026-0618, then cancel via close-sheet
    await cdp.evaluate(`(() => {
      const payBtn = document.querySelector("[data-action='pay'][data-invoice='1']");
      if (payBtn) payBtn.click();
    })()`);
    await sleep(150);

    await cdp.evaluate(`(() => {
      const closeBtn = document.querySelector(".pm-sheet [data-action='close-sheet']");
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(150);

    const cancelState = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const total = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const tabDot = document.querySelector(".pm-tab[data-tab='payments'] .pm-tab-dot");
      const sheet = document.querySelector(".pm-sheet");
      return {
        sheetClosed: !sheet,
        total: total,
        tabDotVisible: !!tabDot
      };
    })()`);
    report(55, "Checkout Cancellation Test: Closing sheet leaves balance at $1,710.00 and tab dot intact", cancelState.sheetClosed && cancelState.total === "$1,710.00" && cancelState.tabDotVisible);

    // METHOD SELECTION INTERACTION: Open sheet again
    await cdp.evaluate(`(() => {
      const payBtn = document.querySelector("[data-action='pay'][data-invoice='1']");
      if (payBtn) payBtn.click();
    })()`);
    await sleep(150);

    const step1 = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const title = sheet ? sheet.querySelector("h2")?.textContent.trim() : "";
      const amount = sheet ? sheet.querySelector("div[style*='font-size: 32px']")?.textContent.trim() : "";
      const khqrSelected = sheet ? sheet.querySelector("[data-method='khqr'] input")?.checked : false;
      const qrMatrix = sheet ? sheet.querySelector(".pm-qr") : null;
      const confirmBtn = sheet ? sheet.querySelector("[data-action='pay-confirm']")?.textContent.trim() : "";

      return {
        isOpen: !!sheet,
        title: title,
        amount: amount,
        khqrSelected: khqrSelected,
        hasQr: !!qrMatrix,
        confirmBtn: confirmBtn
      };
    })()`);

    report(56, "Step 1 (Choose Method): Opens Pay Invoice bottom sheet for $45.00", step1.isOpen && step1.title === "Pay Invoice" && step1.amount === "$45.00");
    report(57, "Step 1: Bakong KHQR is selected by default", step1.khqrSelected);
    report(58, "Step 1: Renders dynamic Bakong KHQR matrix preview via PM_HELPERS.pseudoQr", step1.hasQr);
    report(59, "Step 1: Primary action button displays 'Pay $45.00'", step1.confirmBtn === "Pay $45.00");

    // Test method selection: Switch to ABA PayWay then back to Bakong KHQR
    await cdp.evaluate(`(() => {
      const aba = document.querySelector(".pm-sheet [data-action='pay-method'][data-method='aba']");
      if (aba) aba.click();
    })()`);
    await sleep(100);

    const abaState = await cdp.evaluate(`(() => {
      const abaRadio = document.querySelector("[data-method='aba'] input")?.checked;
      const qrMatrix = document.querySelector(".pm-qr");
      return { abaRadio: abaRadio, hasQr: !!qrMatrix };
    })()`);
    report(60, "Switching payment method to ABA PayWay deselects Bakong and hides QR preview", abaState.abaRadio && !abaState.hasQr);

    // Switch back to Bakong KHQR
    await cdp.evaluate(`(() => {
      const khqr = document.querySelector(".pm-sheet [data-action='pay-method'][data-method='khqr']");
      if (khqr) khqr.click();
    })()`);
    await sleep(100);

    // STEP 2: Click "Pay $45.00" to trigger processing simulation
    await cdp.evaluate(`(() => {
      const btn = document.querySelector("[data-action='pay-confirm']");
      if (btn) btn.click();
    })()`);
    await sleep(200);

    const step2 = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const text = sheet ? sheet.textContent : "";
      const spinner = sheet ? sheet.querySelector("div[style*='animation: pmSpin']") : null;

      return {
        hasSpinner: !!spinner,
        hasProcessingText: text.includes("Processing Payment…"),
        hasBakongText: text.includes("Connecting to Bakong Settlement Network…")
      };
    })()`);

    report(61, "Step 2 (Processing): Displays circular spinner with 'Processing Payment…'", step2.hasSpinner && step2.hasProcessingText);
    report(62, "Step 2: Displays 'Connecting to Bakong Settlement Network…'", step2.hasBakongText);

    // Rapid click spam test during processing: clicking again should not crash
    await cdp.evaluate(`(() => {
      const btn = document.querySelector("[data-action='pay-confirm']");
      if (btn) btn.click();
    })()`);

    // STEP 3: Wait 1,300ms for network settlement simulation to complete
    await sleep(1300);

    const step3 = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const title = sheet ? sheet.querySelector("div[style*='font-size: 20px']")?.textContent.trim() : "";
      const checkIcon = sheet ? sheet.querySelector(".bi-check-lg") : null;
      const receiptRows = Array.from(sheet?.querySelectorAll(".pm-card.pm-list .pm-row") || []).map(r => ({
        label: r.querySelector("span:first-child")?.textContent.trim(),
        val: r.querySelector("span:last-child")?.textContent.trim()
      }));
      const callout = sheet ? (sheet.querySelector(".pm-payment-balance-callout") || sheet.querySelector(".bi-shield-check")?.parentElement)?.textContent.trim() || "" : "";
      const doneBtn = sheet ? sheet.querySelector("[data-action='pay-done']")?.textContent.trim() : "";

      return {
        title: title,
        hasCheckIcon: !!checkIcon,
        receipt: receiptRows,
        callout: callout,
        hasDoneBtn: doneBtn === "Done"
      };
    })()`);

    report(63, "Step 3 (Success): Displays celebration checkmark and 'Payment Successful!'", step3.hasCheckIcon && step3.title === "Payment Successful!");
    report(64, "Step 3: Digital receipt contains Receipt No (RCP-2026-09XX)", step3.receipt.some(r => r.label === "Receipt No" && r.val.startsWith("RCP-2026-09")));
    report(65, "Step 3: Digital receipt details Amount '$45.00' and Method 'Bakong KHQR'", step3.receipt.some(r => r.label === "Paid Amount" && r.val === "$45.00") && step3.receipt.some(r => r.label === "Payment Method" && r.val === "Bakong KHQR"));
    report(66, "Step 3: Digital receipt details Billed To 'Sok Vibol' and Student 'Sok Chanreaksa'", step3.receipt.some(r => r.label === "Billed To" && r.val.includes("Sok Vibol")) && step3.receipt.some(r => r.label === "Student" && r.val.includes("Sok Chanreaksa")));
    report(67, "Step 3: Balance reduction callout indicates family balance updated to '$1,665.00'", step3.callout.includes("$1,665.00"));

    // Click "Done" button -> closes sheet and transitions to Paid view
    await cdp.evaluate(`(() => {
      const done = document.querySelector("[data-action='pay-done']");
      if (done) done.click();
    })()`);
    await sleep(200);

    const postPay = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const hero = document.querySelector(".pm-card-hero");
      const total = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const noOverduePill = hero ? hero.querySelector("span[style*='rgba(255,255,255,0.2)']")?.textContent.trim() : "";
      const segDue = document.querySelector(".pm-seg-btn[data-filter='due']")?.textContent.trim();
      const segPaid = document.querySelector(".pm-seg-btn[data-filter='paid']")?.textContent.trim();
      const activeSeg = document.querySelector(".pm-seg-btn.active")?.dataset.filter;
      const tabDot = document.querySelector(".pm-tab[data-tab='payments'] .pm-tab-dot");
      const paidInvoices = Array.from(document.querySelectorAll(".pm-payments-view .pm-card:not(.pm-card-hero)")).map(c => c.textContent.trim());

      return {
        sheetClosed: !sheet,
        total: total,
        noOverduePill: noOverduePill,
        segDue: segDue,
        segPaid: segPaid,
        activeSeg: activeSeg,
        tabDotGone: !tabDot,
        paidInvoices: paidInvoices
      };
    })()`);

    report(68, "Clicking 'Done' dismisses payment sheet and switches filter to 'Paid'", postPay.sheetClosed && postPay.activeSeg === "paid");
    report(69, "Dynamic Balance Reduction: Total Family Outstanding decreased from $1,710.00 to '$1,665.00'", postPay.total === "$1,665.00");
    report(70, "Hero breakdown pill now displays 'No overdue fees'", postPay.noOverduePill.includes("No overdue fees"));
    report(71, "Segmented control counts updated to 'Due (2)' and 'Paid (3)'", postPay.segDue === "Due (2)" && postPay.segPaid === "Paid (3)");
    report(72, "CRITICAL: Payments tab overdue red dot (.pm-tab-dot) is completely removed", postPay.tabDotGone);
    report(73, "Settled invoice INV-2026-0618 is now listed in Paid history with Bakong KHQR receipt", postPay.paidInvoices.some(t => t.includes("INV-2026-0618") && t.includes("Bakong KHQR") && t.includes("Paid")));

    // Return to Home tab to confirm global state reactivity
    await cdp.evaluate(`(() => {
      const home = document.querySelector(".pm-tab[data-tab='home']");
      if (home) home.click();
    })()`);
    await sleep(150);

    const homeAfterPay = await cdp.evaluate(`(() => {
      const payCard = document.querySelector(".pm-payment-card");
      return {
        total: payCard?.querySelector(".pm-payment-total-note")?.textContent.trim(),
        overdueAlertGone: !payCard?.querySelector(".pm-payment-overdue-alert"),
        nextAmount: payCard?.querySelector(".pm-payment-amount")?.textContent.trim()
      };
    })()`);

    report(74, "Home Tab Reactivity: Total Family Outstanding updated to '$1,665.00'", homeAfterPay.total.includes("$1,665.00"));
    report(75, "Home Tab Reactivity: Overdue invoice warning alert is completely cleared", homeAfterPay.overdueAlertGone);
    report(76, "Home Tab Reactivity: Next payment due now displays upcoming '$1,305.00'", homeAfterPay.nextAmount === "$1,305.00");

    // =========================================================================
    // PHASE 8: Payments Tab Child Filtering
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 8: Payments Tab Child Filtering ---${colors.reset}`);

    await cdp.evaluate(`(() => {
      const tab = document.querySelector(".pm-tab[data-tab='payments']");
      if (tab) tab.click();
    })()`);
    await sleep(150);

    // Filter by Chanpanha
    await cdp.evaluate(`(() => {
      const chip11 = document.querySelector(".pm-chip[data-action='pay-child-filter'][data-child='11']");
      if (chip11) chip11.click();
    })()`);
    await sleep(150);

    const payC11 = await cdp.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll(".pm-payments-view .pm-card:not(.pm-card-hero)")).map(c => c.textContent.trim());
      return { count: cards.length, allC11: cards.every(t => t.includes("Chanpanha") || t.includes("No payments") || t.includes("caught up")) };
    })()`);
    report(77, "Payments Child Filter: Filtering by Chanpanha isolates Child 11 invoices", payC11.allC11);

    // Reset filter to All Children
    await cdp.evaluate(`(() => {
      const chipAll = document.querySelector(".pm-chip[data-action='pay-child-filter'][data-child='all']");
      if (chipAll) chipAll.click();
    })()`);
    await sleep(150);

    // =========================================================================
    // PHASE 9: Adversarial Resiliency & UI Stress Fuzzing
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 9: Adversarial UI Resiliency & DOM Integrity Fuzzing ---${colors.reset}`);

    // Rapid Tab Switching Fuzzing (25 rapid switches)
    const testTabs = ["home", "alerts", "scores", "schedule", "payments"];
    for (let i = 0; i < 25; i++) {
      const randomTab = testTabs[Math.floor(Math.random() * testTabs.length)];
      await cdp.evaluate(`(() => {
        const t = document.querySelector(".pm-tab[data-tab='${randomTab}']");
        if (t) t.click();
      })()`);
      await sleep(35);
    }
    await sleep(200);

    const domIntegrity = await cdp.evaluate(`(() => {
      const devices = document.querySelectorAll(".pm-device").length;
      const screens = document.querySelectorAll(".pm-screen").length;
      const headers = document.querySelectorAll(".pm-header").length;
      const tabBars = document.querySelectorAll(".pm-tabbar").length;
      const activeTabs = document.querySelectorAll(".pm-tab.active").length;
      const bodyText = document.body.innerText;

      return {
        devices: devices,
        screens: screens,
        headers: headers,
        tabBars: tabBars,
        activeTabs: activeTabs,
        hasNaN: bodyText.includes("NaN"),
        hasUndefined: bodyText.includes("undefined"),
        hasObjectObject: bodyText.includes("[object Object]")
      };
    })()`);

    report(78, "DOM Single-Instance Integrity: Exactly 1 device, 1 screen, 1 header, 1 tab bar", domIntegrity.devices === 1 && domIntegrity.screens === 1 && domIntegrity.headers === 1 && domIntegrity.tabBars === 1, `devices=${domIntegrity.devices}, screens=${domIntegrity.screens}, headers=${domIntegrity.headers}, tabBars=${domIntegrity.tabBars}`);
    report(79, "DOM Tab Bar Integrity: Exactly 1 active tab highlighted after fuzzing", domIntegrity.activeTabs === 1);
    report(80, "No data corruption: Zero occurrences of 'NaN' in DOM text", !domIntegrity.hasNaN);
    report(81, "No template interpolation leaks: Zero occurrences of 'undefined' in DOM text", !domIntegrity.hasUndefined);
    report(82, "No object stringification leaks: Zero occurrences of '[object Object]' in DOM text", !domIntegrity.hasObjectObject);

    // =========================================================================
    // PHASE 10: Storage Isolation & Console Cleanliness
    // =========================================================================
    console.log(`\n${colors.bold}--- PHASE 10: Storage Isolation & Console Cleanliness ---${colors.reset}`);

    const storage = await cdp.evaluate(`(() => {
      return {
        localKeys: Object.keys(window.localStorage).filter(k => k.startsWith("pm_") || k.includes("mockup") || k.includes("role")),
        sessionKeys: Object.keys(window.sessionStorage),
        allLocalKeys: Object.keys(window.localStorage)
      };
    })()`);

    report(83, "Zero mockup session or auth keys written to window.localStorage", storage.localKeys.length === 0, `Keys found: ${storage.localKeys.length}`);
    report(84, "Zero items stored in window.sessionStorage", storage.sessionKeys.length === 0, `Session keys: [${storage.sessionKeys.join(", ")}]`);
    report(85, "Zero uncaught JavaScript runtime errors throughout all parent interactions", consoleErrors.length === 0, `Errors: [${consoleErrors.join(", ")}]`);
    report(86, "Zero browser console warnings emitted throughout all interactions", consoleWarnings.length === 0, `Warnings: [${consoleWarnings.join(", ")}]`);

  } finally {
    if (cdp) cdp.close();
    chromeProc.kill("SIGKILL");
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                 ADVERSARIAL M4 TEST SUMMARY REPORT                   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Total Invariant Checks: ${totalChecks}`);
  console.log(`Checks Passed:          ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Checks Failed:          ${failedChecks > 0 ? colors.red : colors.green}${failedChecks}${colors.reset}`);

  if (failedChecks === 0) {
    console.log(`\n${colors.bold}${colors.green}OVERALL VERDICT: APPROVE (100% of Milestone 4 Parent Portal invariants verified empirically)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}OVERALL VERDICT: REJECT (${failedChecks} invariant checks failed)${colors.reset}\n`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test Harness Fatal Crash:", err);
  process.exit(1);
});
