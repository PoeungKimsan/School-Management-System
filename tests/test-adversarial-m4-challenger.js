#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m4-challenger.js
 * Empirical Challenger Adversarial Stress Harness for Milestone 4 (Parent Portal)
 * 
 * Verifies:
 * 1. Family balance calculations ($1,710.00 -> $1,665.00 -> $1,305.00 -> $0.00)
 * 2. In-memory invoice mutation & state machine reactivity (.pm-tab-dot & overdue alert)
 * 3. Multi-child and schedule bounds (Child 1 vs Child 11, Saturday half-day bounds)
 * 4. Zero storage leakage, clean console logs, and edge-case multi-payment exhaustion
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
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

async function main() {
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  EMPIRICAL CHALLENGER: M4 PARENT PORTAL DEEP STRESS HARNESS          ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`Target URL:          ${BASE_URL}\n`);

  // ============================================================================
  // SECTION 1: PURE DATA MODEL & MATHEMATICAL INVARIANTS (HEADLESS NODE)
  // ============================================================================
  console.log(`${colors.bold}${colors.magenta}--- SECTION 1: Data Models & Mathematical Invariants ---${colors.reset}`);
  const PM_DATA = require(path.join(__dirname, "../phone-mockup/mockup-data.js"));

  // 1. Initial Unpaid Invoices
  const unpaidInvoices = PM_DATA.invoices.filter((inv) => inv.status !== "Paid");
  report(
    1,
    "Initial unpaid invoices count is exactly 3",
    unpaidInvoices.length === 3,
    `Found: ${unpaidInvoices.length} [${unpaidInvoices.map((i) => i.invoiceNo).join(", ")}]`
  );

  const initialTotal = unpaidInvoices.reduce((s, i) => s + i.amount, 0);
  report(
    2,
    "Initial total unpaid family balance is exactly $1,710.00",
    initialTotal === 1710.0,
    `Sum: $${initialTotal.toFixed(2)}`
  );

  const invOverdue = unpaidInvoices.find((i) => i.invoiceNo === "INV-2026-0618");
  report(
    3,
    "Invoice INV-2026-0618 is overdue with amount $45.00 for Child 1",
    invOverdue && invOverdue.amount === 45.0 && invOverdue.status === "Overdue" && invOverdue.childId === 1,
    `Status: ${invOverdue?.status}, Amount: $${invOverdue?.amount}`
  );

  const invDueChild1 = unpaidInvoices.find((i) => i.invoiceNo === "INV-2026-0624");
  report(
    4,
    "Invoice INV-2026-0624 is due with amount $360.00 for Child 1",
    invDueChild1 && invDueChild1.amount === 360.0 && invDueChild1.status === "Due" && invDueChild1.childId === 1,
    `Status: ${invDueChild1?.status}, Amount: $${invDueChild1?.amount}`
  );

  const invDueChild11 = unpaidInvoices.find((i) => i.invoiceNo === "INV-2026-0631");
  report(
    5,
    "Invoice INV-2026-0631 is due with amount $1,305.00 for Child 11",
    invDueChild11 && invDueChild11.amount === 1305.0 && invDueChild11.status === "Due" && invDueChild11.childId === 11,
    `Status: ${invDueChild11?.status}, Amount: $${invDueChild11?.amount}`
  );

  // Child-specific balances
  const child1Initial = unpaidInvoices.filter((i) => i.childId === 1).reduce((s, i) => s + i.amount, 0);
  report(
    6,
    "Child 1 initial outstanding balance is exactly $405.00 ($45 + $360)",
    child1Initial === 405.0,
    `Sum: $${child1Initial.toFixed(2)}`
  );

  const child11Initial = unpaidInvoices.filter((i) => i.childId === 11).reduce((s, i) => s + i.amount, 0);
  report(
    7,
    "Child 11 initial outstanding balance is exactly $1,305.00",
    child11Initial === 1305.0,
    `Sum: $${child11Initial.toFixed(2)}`
  );

  // Midterm scores & averages
  const r1 = PM_DATA.reports[1];
  const r1Sum = r1.subjects.reduce((s, sub) => s + sub.score, 0);
  const r1Avg = (r1Sum / r1.subjects.length).toFixed(1);
  report(
    8,
    "Child 1 Midterm report: 7 subjects, sum = 643, avg = 91.9, Overall Score = 91.9%, teacher = Dr. Sokha Chan (SC)",
    r1.subjects.length === 7 && r1Sum === 643 && r1Avg === "91.9" && (r1.overallScore === "91.9%" || r1.score === "91.9%") && r1.teacher === "Dr. Sokha Chan",
    `Subjects: ${r1.subjects.length}, Sum: ${r1Sum}, Avg: ${r1Avg}, Score: ${r1.overallScore || r1.score}`
  );

  const r11 = PM_DATA.reports[11];
  const r11Sum = r11.subjects.reduce((s, sub) => s + sub.score, 0);
  const r11Avg = (r11Sum / r11.subjects.length).toFixed(1);
  report(
    9,
    "Child 11 Midterm report: 6 subjects, sum = 546, avg = 91.0, Overall Score = 91.0%, teacher = Ms. Bopha Pich (BP)",
    r11.subjects.length === 6 && r11Sum === 546 && r11Avg === "91.0" && (r11.overallScore === "91.0%" || r11.score === "91.0%") && r11.teacher === "Ms. Bopha Pich",
    `Subjects: ${r11.subjects.length}, Sum: ${r11Sum}, Avg: ${r11Avg}, Score: ${r11.overallScore || r11.score}`
  );

  // Saturday schedule bounds
  const sat1 = (PM_DATA.timetables || PM_DATA.schedule)[1].sat;
  report(
    10,
    "Child 1 Saturday schedule has exactly 6 entries, period 7 '-' is omitted, ends at 14:45",
    sat1.length === 6 && sat1[sat1.length - 1].end === "14:45",
    `Count: ${sat1.length}, Last: ${sat1[sat1.length - 1].subject} (${sat1[sat1.length - 1].end})`
  );

  const sat11 = (PM_DATA.timetables || PM_DATA.schedule)[11].sat;
  const sat11HasLunch = sat11.some((e) => e.isBreak && /lunch/i.test(e.label));
  report(
    11,
    "Child 11 Saturday schedule has exactly 5 entries, ends at 11:20 AM, no lunch break",
    sat11.length === 5 && sat11[sat11.length - 1].end === "11:20" && !sat11HasLunch,
    `Count: ${sat11.length}, Last: ${sat11[sat11.length - 1].subject} (${sat11[sat11.length - 1].end}), HasLunch: ${sat11HasLunch}`
  );

  // ============================================================================
  // SECTION 2: LIVE HEADLESS CHROMIUM INTERACTIVE STRESS & CDP VALIDATION
  // ============================================================================
  console.log(`\n${colors.bold}${colors.magenta}--- SECTION 2: Live CDP State Machine & UI Reactivity ---${colors.reset}`);

  // Locate Chrome
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
    console.error("FATAL: Chrome binary not found.");
    process.exit(1);
  }

  const cdpPort = 9222 + Math.floor(Math.random() * 500);
  const tmpDir = path.join(os.tmpdir(), `cdp-challenger-m4-${Date.now()}`);
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

    if (!wsEndpoint) {
      throw new Error(`Failed to establish CDP connection on port ${cdpPort}`);
    }

    cdp = new CdpClient(wsEndpoint);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Track browser console errors
    await cdp.evaluate(`(() => {
      window.__M4_CONSOLE_ERRORS = [];
      window.addEventListener("error", (e) => {
        window.__M4_CONSOLE_ERRORS.push(e.message || String(e));
      });
    })()`);

    await sleep(400);

    // Step 2.1: Login as Parent
    await cdp.evaluate(`(() => {
      const parentSeg = document.querySelector('.pm-seg-btn[data-role="parent"]');
      if (parentSeg) parentSeg.click();
    })()`);
    await sleep(200);

    await cdp.evaluate(`(() => {
      const form = document.querySelector(".pm-login-form");
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`);
    await sleep(1000); // 700ms simulated login

    // Verify initial Parent Home & Tab Bar state
    const homeState = await cdp.evaluate(`(() => {
      const dot = document.querySelector(".pm-tab[data-tab='payments'] .pm-tab-dot");
      const overdueAlert = document.querySelector(".pm-payment-overdue-alert");
      const totalOutNote = document.querySelector(".pm-payment-total-note");
      const nextDueAmount = document.querySelector(".pm-payment-amount");
      return {
        hasDot: !!dot,
        hasOverdueAlert: !!overdueAlert,
        totalOutText: totalOutNote ? totalOutNote.textContent.trim() : "",
        nextDueText: nextDueAmount ? nextDueAmount.textContent.trim() : ""
      };
    })()`);

    report(
      12,
      "Initial State: Payments tab dot (.pm-tab-dot) is PRESENT in DOM",
      homeState.hasDot,
      `Dot found: ${homeState.hasDot}`
    );

    report(
      13,
      "Initial State: Urgent overdue alert (.pm-payment-overdue-alert) is PRESENT on Home tab",
      homeState.hasOverdueAlert,
      `Overdue alert found: ${homeState.hasOverdueAlert}`
    );

    report(
      14,
      "Initial State: Home tab displays Total Family Outstanding: $1,710.00",
      homeState.totalOutText.includes("$1,710.00"),
      `Found: "${homeState.totalOutText}"`
    );

    // Step 2.2: Navigate to Payments Tab
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('.pm-tab[data-tab="payments"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    const paymentsInitial = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const heroAmount = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const overduePill = hero ? hero.querySelector("span[style*='#fee4e2']")?.textContent.trim() : "";
      const dueBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="due"]');
      const paidBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="paid"]');
      const dueCards = document.querySelectorAll(".pm-payments-view .pm-card:not(.pm-card-hero)");
      return {
        heroAmount: heroAmount || "",
        overduePill: overduePill || "",
        dueText: dueBtn ? dueBtn.textContent.trim() : "",
        paidText: paidBtn ? paidBtn.textContent.trim() : "",
        dueCardCount: dueCards.length
      };
    })()`);

    report(
      15,
      "Payments Hero Card displays initial Total Outstanding '$1,710.00'",
      paymentsInitial.heroAmount === "$1,710.00",
      `Found: "${paymentsInitial.heroAmount}"`
    );

    report(
      16,
      "Payments Hero Card highlights '$45.00 Overdue' badge",
      paymentsInitial.overduePill.includes("$45.00") && paymentsInitial.overduePill.includes("Overdue"),
      `Badge text: "${paymentsInitial.overduePill}"`
    );

    report(
      17,
      "Payments Segmented control indicates 'Due (3)' and 'Paid (2)'",
      paymentsInitial.dueText === "Due (3)" && paymentsInitial.paidText === "Paid (2)",
      `Due: "${paymentsInitial.dueText}", Paid: "${paymentsInitial.paidText}"`
    );

    // Filter by Child 1
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="1"]');
      if (chip) chip.click();
    })()`);
    await sleep(200);

    const child1FilterOut = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      return hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
    })()`);
    report(
      18,
      "Filtering Payments by Child 1 (Chanreaksa) computes outstanding = '$405.00'",
      child1FilterOut === "$405.00",
      `Found: "${child1FilterOut}"`
    );

    // Filter by Child 11
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="11"]');
      if (chip) chip.click();
    })()`);
    await sleep(200);

    const child11FilterOut = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      return hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
    })()`);
    report(
      19,
      "Filtering Payments by Child 11 (Chanpanha) computes outstanding = '$1,305.00'",
      child11FilterOut === "$1,305.00",
      `Found: "${child11FilterOut}"`
    );

    // Reset filter to All Children
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="all"]');
      if (chip) chip.click();
    })()`);
    await sleep(200);

    // Step 2.3: Pay INV-2026-0618 ($45.00)
    await cdp.evaluate(`(() => {
      const payBtn = document.querySelector('button[data-action="pay"][data-invoice="1"]');
      if (payBtn) payBtn.click();
    })()`);
    await sleep(300);

    const step1Check = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const title = sheet ? sheet.querySelector("h2")?.textContent.trim() : "";
      const khqrOpt = sheet ? sheet.querySelector('.pm-card[data-action="pay-method"][data-method="khqr"] input') : null;
      const qrMatrix = sheet ? sheet.querySelector(".pm-qr") : null;
      const payConfirmBtn = sheet ? sheet.querySelector('[data-action="pay-confirm"]') : null;
      return {
        open: !!sheet,
        title: title || "",
        khqrChecked: khqrOpt ? khqrOpt.checked : false,
        hasQr: !!qrMatrix,
        confirmBtnText: payConfirmBtn ? payConfirmBtn.textContent.trim() : ""
      };
    })()`);

    report(
      20,
      "Pay Sheet Step 1: Opens with title 'Pay Invoice', Bakong KHQR checked, and dynamic QR rendered",
      step1Check.open && step1Check.title === "Pay Invoice" && step1Check.khqrChecked && step1Check.hasQr,
      `Title: "${step1Check.title}", KHQR: ${step1Check.khqrChecked}, QR Matrix: ${step1Check.hasQr}`
    );

    report(
      21,
      "Pay Sheet Step 1: Confirm button displays 'Pay $45.00'",
      step1Check.confirmBtnText === "Pay $45.00",
      `Found: "${step1Check.confirmBtnText}"`
    );

    // Click confirm payment
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('[data-action="pay-confirm"]');
      if (btn) btn.click();
    })()`);
    await sleep(200);

    const step2Check = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const text = sheet ? sheet.textContent : "";
      const spinner = sheet ? sheet.querySelector("div[style*='animation: pmSpin']") : null;
      return {
        hasSpinner: !!spinner,
        hasProcessingText: text.includes("Processing Payment…"),
        hasBakongText: text.includes("Connecting to Bakong Settlement Network…")
      };
    })()`);

    report(
      22,
      "Pay Sheet Step 2: Animated circular spinner and 'Processing Payment…' active",
      step2Check.hasSpinner && step2Check.hasProcessingText && step2Check.hasBakongText,
      `Spinner: ${step2Check.hasSpinner}, Processing: ${step2Check.hasProcessingText}`
    );

    // Wait 1300ms for simulated payment processing
    await sleep(1300);

    const step3Check = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const title = sheet ? sheet.querySelector("div[style*='font-size: 20px']")?.textContent.trim() : "";
      const checkIcon = sheet ? sheet.querySelector(".bi-check-lg") : null;
      const receiptRows = Array.from(sheet?.querySelectorAll(".pm-card.pm-list .pm-row") || []).map(r => ({
        label: r.querySelector("span:first-child")?.textContent.trim(),
        val: r.querySelector("span:last-child")?.textContent.trim()
      }));
      const receiptNoRow = receiptRows.find(r => r.label === "Receipt No");
      const callout = sheet ? (sheet.querySelector(".pm-payment-balance-callout") || sheet.querySelector(".bi-shield-check")?.parentElement)?.textContent.trim() || "" : "";
      const doneBtn = sheet ? sheet.querySelector('[data-action="pay-done"]') : null;
      return {
        successTitle: title || "",
        hasCheckIcon: !!checkIcon,
        receiptNo: receiptNoRow ? receiptNoRow.val : "",
        calloutText: callout,
        hasDoneBtn: !!doneBtn
      };
    })()`);

    report(
      23,
      "Pay Sheet Step 3: Success state reached with valid receipt number and balance reduction message",
      step3Check.successTitle === "Payment Successful!" && /^RCP-2026-09\d{2}$/.test(step3Check.receiptNo),
      `Title: "${step3Check.successTitle}", Receipt: "${step3Check.receiptNo}", Callout: "${step3Check.calloutText}"`
    );

    // Click Done button
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('[data-action="pay-done"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    // In-memory invoice mutation checks
    const postPayState = await cdp.evaluate(`(() => {
      const dot = document.querySelector(".pm-tab[data-tab='payments'] .pm-tab-dot");
      const hero = document.querySelector(".pm-card-hero");
      const heroAmount = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const noOverduePill = hero ? hero.querySelector("span[style*='rgba(255,255,255,0.2)']")?.textContent.trim() : "";
      const dueBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="due"]');
      const paidBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="paid"]');
      return {
        hasDot: !!dot,
        heroAmount: heroAmount || "",
        noOverduePill: noOverduePill || "",
        dueText: dueBtn ? dueBtn.textContent.trim() : "",
        paidText: paidBtn ? paidBtn.textContent.trim() : ""
      };
    })()`);

    report(
      24,
      "Payments Hero Card dynamically updated to exactly '$1,665.00'",
      postPayState.heroAmount === "$1,665.00",
      `Found: "${postPayState.heroAmount}"`
    );

    report(
      25,
      "Payments Hero badge updated to 'No overdue fees'",
      postPayState.noOverduePill.includes("No overdue fees"),
      `Badge: "${postPayState.noOverduePill}"`
    );

    report(
      26,
      "CRITICAL: Payments tab dot (.pm-tab-dot) is COMPLETELY ABSENT from DOM",
      postPayState.hasDot === false,
      `Dot present: ${postPayState.hasDot}`
    );

    report(
      27,
      "Segmented control counts updated to 'Due (2)' and 'Paid (3)'",
      postPayState.dueText === "Due (2)" && postPayState.paidText === "Paid (3)",
      `Due: "${postPayState.dueText}", Paid: "${postPayState.paidText}"`
    );

    // Verify Child 1 outstanding after payment
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="1"]');
      if (chip) chip.click();
    })()`);
    await sleep(200);

    const child1PostPay = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      return hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
    })()`);
    report(
      28,
      "Child 1 outstanding balance dynamically reduced from $405.00 to '$360.00'",
      child1PostPay === "$360.00",
      `Found: "${child1PostPay}"`
    );

    // Verify Child 11 outstanding remains $1,305.00
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="11"]');
      if (chip) chip.click();
    })()`);
    await sleep(200);

    const child11PostPay = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      return hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
    })()`);
    report(
      29,
      "Child 11 outstanding balance remains '$1,305.00'",
      child11PostPay === "$1,305.00",
      `Found: "${child11PostPay}"`
    );

    // Step 2.4: Return to Home Tab and Verify Reactivity
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('.pm-tab[data-tab="home"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    const homePostPay = await cdp.evaluate(`(() => {
      const overdueAlert = document.querySelector(".pm-payment-overdue-alert");
      const totalOutNote = document.querySelector(".pm-payment-total-note");
      const nextDueAmount = document.querySelector(".pm-payment-amount");
      const nextDueBadge = document.querySelector(".pm-payment-amount-row .pm-pill");
      return {
        hasOverdueAlert: !!overdueAlert,
        totalOutText: totalOutNote ? totalOutNote.textContent.trim() : "",
        nextDueText: nextDueAmount ? nextDueAmount.textContent.trim() : "",
        nextDueBadge: nextDueBadge ? nextDueBadge.textContent.trim() : ""
      };
    })()`);

    report(
      30,
      "CRITICAL: Home Tab urgent overdue alert (.pm-payment-overdue-alert) COMPLETELY DISAPPEARED",
      homePostPay.hasOverdueAlert === false,
      `Overdue alert present: ${homePostPay.hasOverdueAlert}`
    );

    report(
      31,
      "Home Tab Total Family Outstanding reactively updated to '$1,665.00'",
      homePostPay.totalOutText.includes("$1,665.00"),
      `Found: "${homePostPay.totalOutText}"`
    );

    report(
      32,
      "Home Tab Next Payment Due now displays upcoming '$1,305.00' due Nov 10",
      homePostPay.nextDueText === "$1,305.00",
      `Found: "${homePostPay.nextDueText}", Badge: "${homePostPay.nextDueBadge}"`
    );

    // ============================================================================
    // SECTION 3: MULTI-CHILD TIMETABLE & GRADE REPORT SWITCHING BOUNDS
    // ============================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 3: Multi-Child & Schedule Bounds Verification ---${colors.reset}`);

    // Navigate to Scores tab
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('.pm-tab[data-tab="scores"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    // Switch to Child 1 via child switcher sheet
    await cdp.evaluate(`(() => {
      const switcherBtn = document.querySelector('[data-action="sheet"][data-sheet="child"]');
      if (switcherBtn) switcherBtn.click();
    })()`);
    await sleep(200);

    await cdp.evaluate(`(() => {
      const opt1 = document.querySelector('.pm-child-select-card[data-child="1"]');
      if (opt1) opt1.click();
    })()`);
    await sleep(300);

    const scoresChild1 = await cdp.evaluate(`(() => {
      const contextBar = document.querySelector(".pm-child-context-bar");
      const scoreVal = document.querySelector(".pm-score-val");
      const gpaVal = document.querySelector(".pm-stat-box .val");
      const subjects = document.querySelectorAll(".pm-subject-card");
      const teacherName = document.querySelector(".pm-comment-author");
      const teacherAvatar = document.querySelector(".pm-comment-avatar");
      return {
        context: contextBar ? contextBar.textContent.trim() : "",
        avgScore: scoreVal ? scoreVal.textContent.trim() : "",
        gpa: gpaVal ? gpaVal.textContent.trim() : "",
        subjectCount: subjects.length,
        teacher: teacherName ? teacherName.textContent.trim() : "",
        teacherInitials: teacherAvatar ? teacherAvatar.textContent.trim() : ""
      };
    })()`);

    report(
      33,
      "Scores Tab Child 1: Context 'Viewing Sok Chanreaksa · G12-A', Avg 91.9%, Overall Score 91.9%",
      scoresChild1.context.includes("Sok Chanreaksa") && scoresChild1.avgScore.includes("91.9") && scoresChild1.gpa === "91.9%",
      `Context: "${scoresChild1.context}", Avg: ${scoresChild1.avgScore}, Score: ${scoresChild1.gpa}`
    );

    report(
      34,
      "Scores Tab Child 1: 7 subjects rendered, Teacher 'Dr. Sokha Chan' with initials 'SC'",
      scoresChild1.subjectCount === 7 && scoresChild1.teacher.includes("Dr. Sokha Chan") && scoresChild1.teacherInitials === "SC",
      `Subjects: ${scoresChild1.subjectCount}, Teacher: "${scoresChild1.teacher}" [${scoresChild1.teacherInitials}]`
    );

    // Switch to Child 11 via context bar Change button
    await cdp.evaluate(`(() => {
      const changeBtn = document.querySelector('.pm-child-context-bar [data-action="sheet"][data-sheet="child"]');
      if (changeBtn) changeBtn.click();
    })()`);
    await sleep(200);

    await cdp.evaluate(`(() => {
      const opt11 = document.querySelector('.pm-child-select-card[data-child="11"]');
      if (opt11) opt11.click();
    })()`);
    await sleep(300);

    const scoresChild11 = await cdp.evaluate(`(() => {
      const contextBar = document.querySelector(".pm-child-context-bar");
      const scoreVal = document.querySelector(".pm-score-val");
      const gpaVal = document.querySelector(".pm-stat-box .val");
      const subjects = document.querySelectorAll(".pm-subject-card");
      const teacherName = document.querySelector(".pm-comment-author");
      const teacherAvatar = document.querySelector(".pm-comment-avatar");
      return {
        context: contextBar ? contextBar.textContent.trim() : "",
        avgScore: scoreVal ? scoreVal.textContent.trim() : "",
        gpa: gpaVal ? gpaVal.textContent.trim() : "",
        subjectCount: subjects.length,
        teacher: teacherName ? teacherName.textContent.trim() : "",
        teacherInitials: teacherAvatar ? teacherAvatar.textContent.trim() : ""
      };
    })()`);

    report(
      35,
      "Scores Tab Child 11: Context 'Viewing Sok Chanpanha · G7-IEP', Avg 91.0%, Overall Score 91.0%",
      scoresChild11.context.includes("Sok Chanpanha") && scoresChild11.avgScore.includes("91.0") && scoresChild11.gpa === "91.0%",
      `Context: "${scoresChild11.context}", Avg: ${scoresChild11.avgScore}, Score: ${scoresChild11.gpa}`
    );

    report(
      36,
      "Scores Tab Child 11: 6 subjects rendered, Teacher 'Ms. Bopha Pich' with initials 'BP'",
      scoresChild11.subjectCount === 6 && scoresChild11.teacher.includes("Ms. Bopha Pich") && scoresChild11.teacherInitials === "BP",
      `Subjects: ${scoresChild11.subjectCount}, Teacher: "${scoresChild11.teacher}" [${scoresChild11.teacherInitials}]`
    );

    // Navigate to Schedule Tab (remains Child 11)
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('.pm-tab[data-tab="schedule"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    // Switch to Saturday for Child 11
    await cdp.evaluate(`(() => {
      const satBtn = document.querySelector('.pm-day-btn[data-day="sat"]');
      if (satBtn) satBtn.click();
    })()`);
    await sleep(200);

    const schedChild11Sat = await cdp.evaluate(`(() => {
      const rows = document.querySelectorAll(".pm-period-row, .pm-break-row");
      const rowTexts = Array.from(rows).map((r) => r.textContent.trim());
      const hasLunch = rowTexts.some((t) => /lunch/i.test(t));
      const lastRow = rows.length > 0 ? rows[rows.length - 1].textContent.trim() : "";
      return {
        count: rows.length,
        hasLunch,
        lastRow
      };
    })()`);

    report(
      37,
      "Schedule Tab Child 11 Saturday: Exactly 5 entries, no lunch break, ends at 11:20 AM",
      schedChild11Sat.count === 5 && !schedChild11Sat.hasLunch && schedChild11Sat.lastRow.includes("11:20"),
      `Count: ${schedChild11Sat.count}, HasLunch: ${schedChild11Sat.hasLunch}, LastRow: "${schedChild11Sat.lastRow}"`
    );

    // Switch to Child 1 on Schedule
    await cdp.evaluate(`(() => {
      const changeBtn = document.querySelector('.pm-child-context-bar [data-action="sheet"][data-sheet="child"]');
      if (changeBtn) changeBtn.click();
    })()`);
    await sleep(200);

    await cdp.evaluate(`(() => {
      const opt1 = document.querySelector('.pm-child-select-card[data-child="1"]');
      if (opt1) opt1.click();
    })()`);
    await sleep(300);

    // Ensure Saturday is active for Child 1
    await cdp.evaluate(`(() => {
      const satBtn = document.querySelector('.pm-day-btn[data-day="sat"]');
      if (satBtn) satBtn.click();
    })()`);
    await sleep(200);

    const schedChild1Sat = await cdp.evaluate(`(() => {
      const rows = document.querySelectorAll(".pm-period-row, .pm-break-row");
      const lastRow = rows.length > 0 ? rows[rows.length - 1].textContent.trim() : "";
      return {
        count: rows.length,
        lastRow
      };
    })()`);

    report(
      38,
      "Schedule Tab Child 1 Saturday: Exactly 6 entries, period 7 '-' omitted, ends at 14:45",
      schedChild1Sat.count === 6 && schedChild1Sat.lastRow.includes("14:45"),
      `Count: ${schedChild1Sat.count}, LastRow: "${schedChild1Sat.lastRow}"`
    );

    // ============================================================================
    // SECTION 4: ADVERSARIAL STRESS: SECOND & THIRD INVOICE PAYMENT EXHAUSTION
    // ============================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- SECTION 4: Adversarial Stress & Exhaustion Testing ---${colors.reset}`);

    // Return to Payments tab
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('.pm-tab[data-tab="payments"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    // Select "All Children" and "Due" filter
    await cdp.evaluate(`(() => {
      const allChip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="all"]');
      if (allChip) allChip.click();
      const dueBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="due"]');
      if (dueBtn) dueBtn.click();
    })()`);
    await sleep(200);

    // Pay second invoice: INV-2026-0624 ($360.00) using ABA PayWay
    await cdp.evaluate(`(() => {
      const payBtn = document.querySelector('button[data-action="pay"][data-invoice="2"]');
      if (payBtn) payBtn.click();
    })()`);
    await sleep(300);

    // Select ABA PayWay via card click
    await cdp.evaluate(`(() => {
      const abaCard = document.querySelector('.pm-card[data-action="pay-method"][data-method="aba"]');
      if (abaCard) abaCard.click();
    })()`);
    await sleep(200);

    // Confirm payment 2
    await cdp.evaluate(`(() => {
      const confirmBtn = document.querySelector('[data-action="pay-confirm"]');
      if (confirmBtn) confirmBtn.click();
    })()`);
    await sleep(1300);

    const step3Pay2 = await cdp.evaluate(`(() => {
      const sheet = document.querySelector(".pm-sheet");
      const callout = sheet ? (sheet.querySelector(".pm-payment-balance-callout") || sheet.querySelector(".bi-shield-check")?.parentElement)?.textContent.trim() || "" : "";
      const doneBtn = sheet ? sheet.querySelector('[data-action="pay-done"]') : null;
      return {
        calloutText: callout,
        hasDoneBtn: !!doneBtn
      };
    })()`);

    report(
      39,
      "Second Payment ($360.00 via ABA PayWay): Success modal indicates balance updated to '$1,305.00'",
      step3Pay2.calloutText.includes("$1,305.00"),
      `Callout: "${step3Pay2.calloutText}"`
    );

    // Click Done
    await cdp.evaluate(`(() => {
      const btn = document.querySelector('[data-action="pay-done"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    // Verify Child 1 outstanding is now $0.00
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="1"]');
      if (chip) chip.click();
    })()`);
    await sleep(200);

    const child1ZeroOut = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const heroAmount = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const dueBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="due"]');
      if (dueBtn) dueBtn.click();
      const emptyState = document.querySelector(".pm-empty-state") || document.querySelector(".pm-payments-view .pm-card:not(.pm-card-hero)");
      return {
        hero: heroAmount,
        emptyText: emptyState ? emptyState.textContent.trim() : ""
      };
    })()`);

    report(
      40,
      "Child 1 balance reached $0.00: Due tab displays 'All caught up · No payments due' empty state",
      child1ZeroOut.hero === "$0.00" && child1ZeroOut.emptyText.includes("All caught up"),
      `Hero: "${child1ZeroOut.hero}", Text: "${child1ZeroOut.emptyText}"`
    );

    // Switch to Child 11: Pay final invoice INV-2026-0631 ($1,305.00) using ACLEDA Mobile
    await cdp.evaluate(`(() => {
      const chip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="11"]');
      if (chip) chip.click();
      const dueBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="due"]');
      if (dueBtn) dueBtn.click();
    })()`);
    await sleep(200);

    await cdp.evaluate(`(() => {
      const payBtn = document.querySelector('button[data-action="pay"][data-invoice="4"]');
      if (payBtn) payBtn.click();
    })()`);
    await sleep(300);

    await cdp.evaluate(`(() => {
      const acledaCard = document.querySelector('.pm-card[data-action="pay-method"][data-method="acleda"]');
      if (acledaCard) acledaCard.click();
    })()`);
    await sleep(200);

    await cdp.evaluate(`(() => {
      const confirmBtn = document.querySelector('[data-action="pay-confirm"]');
      if (confirmBtn) confirmBtn.click();
    })()`);
    await sleep(1300);

    await cdp.evaluate(`(() => {
      const btn = document.querySelector('[data-action="pay-done"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    // Check All Children Payments State: 100% Paid Exhaustion
    await cdp.evaluate(`(() => {
      const allChip = document.querySelector('.pm-chip[data-action="pay-child-filter"][data-child="all"]');
      if (allChip) allChip.click();
    })()`);
    await sleep(200);

    const allPaidState = await cdp.evaluate(`(() => {
      const hero = document.querySelector(".pm-card-hero");
      const heroAmount = hero ? hero.querySelector("div[style*='font-size: 34px']")?.textContent.trim() : "";
      const dueBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="due"]');
      const paidBtn = document.querySelector('.pm-seg-btn[data-action="pay-filter"][data-filter="paid"]');
      return {
        hero: heroAmount,
        dueText: dueBtn ? dueBtn.textContent.trim() : "",
        paidText: paidBtn ? paidBtn.textContent.trim() : ""
      };
    })()`);

    report(
      41,
      "Total Family Outstanding reaches '$0.00' with 'Due (0)' and 'Paid (5)' invoices",
      allPaidState.hero === "$0.00" && allPaidState.dueText === "Due (0)" && allPaidState.paidText === "Paid (5)",
      `Hero: "${allPaidState.hero}", Due: "${allPaidState.dueText}", Paid: "${allPaidState.paidText}"`
    );

    // Storage Isolation Check
    const storageCheck = await cdp.evaluate(`(() => {
      const pmLocalKeys = Object.keys(window.localStorage).filter(k => k.startsWith("pm_") || k.includes("mockup"));
      const sessionKeys = Object.keys(window.sessionStorage);
      return {
        pmLocalKeys,
        sessionKeys
      };
    })()`);

    report(
      42,
      "Storage Isolation: Zero mockup keys in window.localStorage or window.sessionStorage",
      storageCheck.pmLocalKeys.length === 0 && storageCheck.sessionKeys.length === 0,
      `Local: [${storageCheck.pmLocalKeys.join(", ")}], Session: [${storageCheck.sessionKeys.join(", ")}]`
    );

    // Console Errors Check
    const consoleErrors = await cdp.evaluate(`window.__M4_CONSOLE_ERRORS || []`);
    report(
      43,
      "Console Cleanliness: Zero uncaught runtime errors during all empirical stress sequences",
      consoleErrors.length === 0,
      `Errors: [${consoleErrors.join(", ")}]`
    );

  } finally {
    if (cdp) cdp.close();
    if (chromeProc) {
      chromeProc.kill("SIGKILL");
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}           EMPIRICAL CHALLENGER TEST SUMMARY REPORT                   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Total Checks Executed: ${totalChecks}`);
  console.log(`Checks Passed:         ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Checks Failed:         ${failedChecks > 0 ? colors.red : colors.green}${failedChecks}${colors.reset}`);

  if (failedChecks === 0) {
    console.log(`\n${colors.bold}${colors.green}OVERALL VERDICT: APPROVE (All empirical stress tests passed cleanly!)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}OVERALL VERDICT: REQUEST_CHANGES (${failedChecks} checks failed!)${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${colors.bold}${colors.red}FATAL ERROR: ${err.message}${colors.reset}\n${err.stack}`);
  process.exit(1);
});
