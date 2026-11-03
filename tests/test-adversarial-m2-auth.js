#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m2-auth.js
 * Empirical Adversarial Test Harness for Milestone 2:
 * Auth Flow, State Transitions, and Browser Interactions via Headless Chromium CDP
 *
 * Scenarios & Invariant Assertions:
 *   1. Initial Login Presentation (#pmApp, student default, stu_chanreaksa/demo1234)
 *   2. Role Switching (Parent <-> Student, creds & labels synchronization)
 *   3. Password Eye Toggle (type password -> text, icon bi-eye -> bi-eye-slash)
 *   4. Validation & Inline Error Styling (empty & whitespace credentials blocked,
 *      red border .error, error text visible, typing clears error)
 *   5. Sign-In Loading Transition & App Entry (spinner, disabled inputs, 700ms delay,
 *      transition to app shell, header & tab bar verification)
 *   6. Account Bottom Sheet & Sign Out (avatar click opens sheet, student details,
 *      sign out returns to login with role PRESERVED)
 *   7. Parent Portal Auth Lifecycle & Push Banner (parent login, avatar SV, 1.5s push
 *      banner trigger, banner click switches to alerts, sign out preserves parent role)
 *   8. Storage Isolation & Reload Persistence (zero mockup persistence keys,
 *      state reset to login screen upon reload)
 *   9. Adversarial Security & Stress (XSS injection escape, rapid double-click guard)
 *
 * Usage:
 *   node tests/test-adversarial-m2-auth.js
 *   node tests/test-adversarial-m2-auth.js --port=3000
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
  console.log(`${colors.bold}${colors.cyan}  EMPIRICAL ADVERSARIAL CHALLENGE: M2 AUTH & STATE TRANSITIONS (CDP)  ${colors.reset}`);
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
  const CDP_PORT = 9445;
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

    await cdp.evaluate(`(() => {
      window.__CAPTURED_ERRORS = [];
      window.addEventListener("error", (e) => {
        window.__CAPTURED_ERRORS.push(e.message || String(e));
      });
    })()`);

    // Give DOM a moment to complete boot sequence
    await sleep(400);

    // ==========================================================================
    // PHASE 1: Initial Login Presentation & Baseline DOM State
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 1: Initial Login Presentation & Default State ---${colors.reset}`);

    const p1 = await cdp.evaluate(`(() => {
      const app = document.getElementById("pmApp");
      const form = app ? app.querySelector(".pm-login-form") : null;
      const studentBtn = app ? app.querySelector('.pm-seg-btn[data-role="student"]') : null;
      const parentBtn = app ? app.querySelector('.pm-seg-btn[data-role="parent"]') : null;
      const userInput = document.getElementById("pmLoginUsername");
      const passInput = document.getElementById("pmLoginPassword");
      const userLabel = userInput ? userInput.closest(".pm-input-wrap").querySelector(".pm-input-label").textContent.trim() : "";
      const submitBtn = document.getElementById("pmLoginSubmit");
      const eyeIcon = app ? app.querySelector(".pm-pw-toggle i") : null;
      const brandName = app ? app.querySelector(".pm-body").textContent : "";

      return {
        appExists: !!app,
        formExists: !!form,
        studentActive: studentBtn ? studentBtn.classList.contains("active") : false,
        studentAria: studentBtn ? studentBtn.getAttribute("aria-selected") : null,
        parentActive: parentBtn ? parentBtn.classList.contains("active") : false,
        username: userInput ? userInput.value : null,
        usernameLabel: userLabel,
        password: passInput ? passInput.value : null,
        passwordType: passInput ? passInput.type : null,
        submitText: submitBtn ? submitBtn.textContent.trim() : null,
        submitDisabled: submitBtn ? submitBtn.disabled : null,
        eyeClass: eyeIcon ? eyeIcon.className : null,
        hasBrandMilkyWay: brandName.includes("Milky Way School")
      };
    })()`);

    report(1, "#pmApp container and login form exist", p1.appExists && p1.formExists);
    report(2, "Default role is Student with active class and aria-selected='true'", p1.studentActive && p1.studentAria === "true" && !p1.parentActive);
    report(3, "Student credentials prefilled with 'stu_chanreaksa'", p1.username === "stu_chanreaksa", `Found '${p1.username}'`);
    report(4, "Username label is 'Student ID or username'", p1.usernameLabel === "Student ID or username", `Label: '${p1.usernameLabel}'`);
    report(5, "Password prefilled with 'demo1234' and type is 'password'", p1.password === "demo1234" && p1.passwordType === "password");
    report(6, "Submit button indicates 'Sign in as Student' and is not disabled", p1.submitText === "Sign in as Student" && !p1.submitDisabled);
    report(7, "Password eye toggle displays initial 'bi bi-eye' icon", p1.eyeClass === "bi bi-eye");
    report(8, "School brand 'Milky Way School' rendered in login header", p1.hasBrandMilkyWay);

    // ==========================================================================
    // PHASE 2: Role Switching & Credential Synchronization
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 2: Role Switching & Credential Synchronization ---${colors.reset}`);

    // Click Parent segmented button and query fresh DOM elements post-render
    const p2a = await cdp.evaluate(`(() => {
      const parentBtn = document.querySelector('.pm-seg-btn[data-role="parent"]');
      if (parentBtn) parentBtn.click();

      // Fresh query post synchronous render()
      const newParentBtn = document.querySelector('.pm-seg-btn[data-role="parent"]');
      const newStudentBtn = document.querySelector('.pm-seg-btn[data-role="student"]');
      const userInput = document.getElementById("pmLoginUsername");
      const passInput = document.getElementById("pmLoginPassword");
      const userLabel = userInput ? userInput.closest(".pm-input-wrap").querySelector(".pm-input-label").textContent.trim() : "";
      const submitBtn = document.getElementById("pmLoginSubmit");

      return {
        parentActive: newParentBtn ? newParentBtn.classList.contains("active") : false,
        parentAria: newParentBtn ? newParentBtn.getAttribute("aria-selected") : null,
        studentActive: newStudentBtn ? newStudentBtn.classList.contains("active") : false,
        username: userInput ? userInput.value : null,
        usernameLabel: userLabel,
        password: passInput ? passInput.value : null,
        submitText: submitBtn ? submitBtn.textContent.trim() : null
      };
    })()`);

    report(9, "Parent role active after clicking Parent tab", p2a.parentActive && p2a.parentAria === "true" && !p2a.studentActive);
    report(10, "Parent credentials prefilled with 'par_vibol'", p2a.username === "par_vibol", `Found '${p2a.username}'`);
    report(11, "Parent username label updated to 'Phone number or username'", p2a.usernameLabel === "Phone number or username");
    report(12, "Password preserved as 'demo1234'", p2a.password === "demo1234");
    report(13, "Submit button text updated to 'Sign in as Parent'", p2a.submitText === "Sign in as Parent");

    // Click back to Student segmented button
    const p2b = await cdp.evaluate(`(() => {
      const studentBtn = document.querySelector('.pm-seg-btn[data-role="student"]');
      if (studentBtn) studentBtn.click();

      const newStudentBtn = document.querySelector('.pm-seg-btn[data-role="student"]');
      const newParentBtn = document.querySelector('.pm-seg-btn[data-role="parent"]');
      const userInput = document.getElementById("pmLoginUsername");
      const userLabel = userInput ? userInput.closest(".pm-input-wrap").querySelector(".pm-input-label").textContent.trim() : "";
      const submitBtn = document.getElementById("pmLoginSubmit");

      return {
        studentActive: newStudentBtn ? newStudentBtn.classList.contains("active") : false,
        parentActive: newParentBtn ? newParentBtn.classList.contains("active") : false,
        username: userInput ? userInput.value : null,
        usernameLabel: userLabel,
        submitText: submitBtn ? submitBtn.textContent.trim() : null
      };
    })()`);

    report(14, "Student role active after clicking back to Student tab", p2b.studentActive && !p2b.parentActive);
    report(15, "Student credentials restored to 'stu_chanreaksa'", p2b.username === "stu_chanreaksa");
    report(16, "Submit button text restored to 'Sign in as Student'", p2b.submitText === "Sign in as Student");

    // ==========================================================================
    // PHASE 3: Password Visibility Eye Toggle
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 3: Password Visibility Eye Toggle ---${colors.reset}`);

    // Click toggle button -> text
    const p3a = await cdp.evaluate(`(() => {
      const toggle = document.querySelector(".pm-pw-toggle");
      if (toggle) toggle.click();

      const passInput = document.getElementById("pmLoginPassword");
      const icon = toggle ? toggle.querySelector("i") : null;
      return {
        type: passInput ? passInput.type : null,
        iconClass: icon ? icon.className : null
      };
    })()`);

    report(17, "Password input type switches to 'text' upon click", p3a.type === "text", `Type: '${p3a.type}'`);
    report(18, "Eye toggle icon updates to 'bi bi-eye-slash'", p3a.iconClass === "bi bi-eye-slash", `Icon: '${p3a.iconClass}'`);

    // Click toggle button again -> password
    const p3b = await cdp.evaluate(`(() => {
      const toggle = document.querySelector(".pm-pw-toggle");
      if (toggle) toggle.click();

      const passInput = document.getElementById("pmLoginPassword");
      const icon = toggle ? toggle.querySelector("i") : null;
      return {
        type: passInput ? passInput.type : null,
        iconClass: icon ? icon.className : null
      };
    })()`);

    report(19, "Password input type returns to 'password' upon second click", p3b.type === "password", `Type: '${p3b.type}'`);
    report(20, "Eye toggle icon returns to 'bi bi-eye'", p3b.iconClass === "bi bi-eye", `Icon: '${p3b.iconClass}'`);

    // ==========================================================================
    // PHASE 4: Validation & Inline Error Styling
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 4: Validation & Inline Error Styling ---${colors.reset}`);

    // 4.1 Empty Submission
    const p4a = await cdp.evaluate(`(() => {
      const userEl = document.getElementById("pmLoginUsername");
      const passEl = document.getElementById("pmLoginPassword");
      const form = document.querySelector(".pm-login-form");

      userEl.value = "";
      passEl.value = "";

      // Submit form
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      const userErr = document.getElementById("pmUserError");
      const passErr = document.getElementById("pmPassError");
      const appShell = document.querySelector(".pm-header");

      const userStyle = window.getComputedStyle(userEl);
      const passStyle = window.getComputedStyle(passEl);

      return {
        userHasError: userEl.classList.contains("error"),
        passHasError: passEl.classList.contains("error"),
        userErrorText: userErr ? userErr.textContent.trim() : "",
        passErrorText: passErr ? passErr.textContent.trim() : "",
        userBorderColor: userStyle.borderColor,
        passBorderColor: passStyle.borderColor,
        submissionBlocked: !appShell
      };
    })()`);

    report(21, "Empty credentials: submission blocked and stayed on login view", p4a.submissionBlocked);
    report(22, "Empty credentials: username input receives .error class", p4a.userHasError);
    report(23, "Empty credentials: password input receives .error class", p4a.passHasError);
    report(24, "Empty credentials: username error text indicates 'Please enter your username'", p4a.userErrorText === "Please enter your username");
    report(25, "Empty credentials: password error text indicates 'Please enter your password'", p4a.passErrorText === "Please enter your password");
    report(26, "Empty credentials: red border styling applied (#d92d20 / rgb(217, 45, 32))", p4a.userBorderColor === "rgb(217, 45, 32)");

    // 4.2 Adversarial Whitespace Credentials
    const p4b = await cdp.evaluate(`(() => {
      const userEl = document.getElementById("pmLoginUsername");
      const passEl = document.getElementById("pmLoginPassword");
      const form = document.querySelector(".pm-login-form");

      userEl.value = "     ";
      passEl.value = ""; // empty password

      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      const userErr = document.getElementById("pmUserError");
      const appShell = document.querySelector(".pm-header");

      return {
        userHasError: userEl.classList.contains("error"),
        userErrorText: userErr ? userErr.textContent.trim() : "",
        submissionBlocked: !appShell
      };
    })()`);

    report(27, "Adversarial: Whitespace-only username ('     ') blocked with .error class", p4b.userHasError && p4b.submissionBlocked);

    // 4.3 Real-time error clearing on input
    const p4c = await cdp.evaluate(`(() => {
      const userEl = document.getElementById("pmLoginUsername");
      userEl.value = "s";
      userEl.dispatchEvent(new Event("input", { bubbles: true }));

      const userErr = document.getElementById("pmUserError");
      return {
        errorRemoved: !userEl.classList.contains("error"),
        errorTextCleared: userErr.textContent.trim() === ""
      };
    })()`);

    report(28, "Typing into input automatically clears .error and error message", p4c.errorRemoved && p4c.errorTextCleared);

    // ==========================================================================
    // PHASE 5: Sign-In Loading Transition & App Entry
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 5: Sign-In Loading Transition & App Entry ---${colors.reset}`);

    // Fill valid credentials and submit
    const p5a = await cdp.evaluate(`(() => {
      const userEl = document.getElementById("pmLoginUsername");
      const passEl = document.getElementById("pmLoginPassword");
      const form = document.querySelector(".pm-login-form");

      userEl.value = "stu_chanreaksa";
      passEl.value = "demo1234";

      // Trigger submit
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      // Fresh query post synchronous render() inside loading phase
      const newSubmitBtn = document.getElementById("pmLoginSubmit");
      const newUserEl = document.getElementById("pmLoginUsername");
      const newPassEl = document.getElementById("pmLoginPassword");
      const spinner = newSubmitBtn ? newSubmitBtn.querySelector(".pm-spinner") : null;
      const isSubmitting = newSubmitBtn ? newSubmitBtn.disabled : false;
      const inputsDisabled = newUserEl && newPassEl && newUserEl.disabled && newPassEl.disabled;
      const text = newSubmitBtn ? newSubmitBtn.textContent.trim() : "";

      return {
        hasSpinner: !!spinner,
        submitDisabled: isSubmitting,
        inputsDisabled,
        loadingText: text
      };
    })()`);

    report(29, "Immediate loading state: submit button displays spinner (.pm-spinner)", p5a.hasSpinner);
    report(30, "Immediate loading state: submit button is disabled", p5a.submitDisabled);
    report(31, "Immediate loading state: text changes to 'Signing in…'", p5a.loadingText.includes("Signing in"));
    report(32, "Immediate loading state: credential inputs are disabled", p5a.inputsDisabled);

    // Wait 850ms (simulated delay is 700ms)
    await sleep(850);

    const p5b = await cdp.evaluate(`(() => {
      const app = document.getElementById("pmApp");
      const header = app ? app.querySelector(".pm-header") : null;
      const title = header ? header.querySelector(".pm-title").textContent.trim() : "";
      const eyebrow = header ? header.querySelector(".pm-eyebrow").textContent.trim() : "";
      const avatar = header ? header.querySelector(".pm-avatar").textContent.trim() : "";
      const form = app ? app.querySelector(".pm-login-form") : null;
      const tabBar = app ? app.querySelector(".pm-tabbar") : null;
      const tabs = tabBar ? Array.from(tabBar.querySelectorAll(".pm-tab")).map(b => b.dataset.tab) : [];
      const activeTab = tabBar ? tabBar.querySelector(".pm-tab.active") : null;

      return {
        headerExists: !!header,
        loginFormGone: !form,
        title,
        eyebrow,
        avatar,
        tabBarExists: !!tabBar,
        tabCount: tabs.length,
        tabs,
        activeTab: activeTab ? activeTab.dataset.tab : null
      };
    })()`);

    report(33, "Transition completed: Login form removed from DOM", p5b.loginFormGone);
    report(34, "Transition completed: App shell header rendered", p5b.headerExists);
    report(35, "Student header displays greeting with student name ('Chanreaksa')", p5b.title.includes("Chanreaksa"), `Title: '${p5b.title}'`);
    report(36, "Student header eyebrow displays 'Tuesday, 3 November'", p5b.eyebrow === "Tuesday, 3 November");
    report(37, "Student avatar displays 'SC' initials", p5b.avatar === "SC");
    report(38, "Student navigation renders 6 mobile tabs", p5b.tabCount === 6, `Tabs: ${p5b.tabs.join(", ")}`);
    report(39, "Default active tab is 'home'", p5b.activeTab === "home");

    // ==========================================================================
    // PHASE 6: Account Bottom Sheet & Sign Out (Role Preserved)
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 6: Account Bottom Sheet & Sign Out ---${colors.reset}`);

    // Click Avatar to open Account Sheet
    const p6a = await cdp.evaluate(`(() => {
      const avatar = document.querySelector(".pm-avatar");
      if (avatar) avatar.click();

      const sheet = document.querySelector(".pm-sheet");
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      const signoutBtn = sheet ? sheet.querySelector('[data-action="signout"]') : null;
      const sheetText = sheet ? sheet.textContent : "";

      return {
        sheetVisible: !!sheet,
        backdropVisible: !!backdrop,
        hasSignoutBtn: !!signoutBtn,
        hasStudentName: sheetText.includes("Sok Chanreaksa"),
        hasCardId: sheetText.includes("STU-2026-001"),
        hasGrade: sheetText.includes("Grade 12-A"),
        hasPortalPill: sheetText.includes("Student Portal")
      };
    })()`);

    report(40, "Clicking avatar opens Account bottom sheet with backdrop", p6a.sheetVisible && p6a.backdropVisible);
    report(41, "Account sheet displays student details: Sok Chanreaksa (STU-2026-001, Grade 12-A)", p6a.hasStudentName && p6a.hasCardId && p6a.hasGrade && p6a.hasPortalPill);
    report(42, "Account sheet contains 'Sign Out' action button", p6a.hasSignoutBtn);

    // Click Sign Out
    const p6b = await cdp.evaluate(`(() => {
      const signoutBtn = document.querySelector('[data-action="signout"]');
      if (signoutBtn) signoutBtn.click();

      const app = document.getElementById("pmApp");
      const form = app ? app.querySelector(".pm-login-form") : null;
      const sheet = document.querySelector(".pm-sheet");
      const studentBtn = app ? app.querySelector('.pm-seg-btn[data-role="student"]') : null;
      const parentBtn = app ? app.querySelector('.pm-seg-btn[data-role="parent"]') : null;
      const userInput = document.getElementById("pmLoginUsername");
      const toast = document.querySelector(".pm-toast");

      return {
        returnedToLogin: !!form,
        sheetDismissed: !sheet,
        studentActive: studentBtn ? studentBtn.classList.contains("active") : false,
        parentActive: parentBtn ? parentBtn.classList.contains("active") : false,
        username: userInput ? userInput.value : null,
        toastMessage: toast ? toast.textContent.trim() : null
      };
    })()`);

    report(43, "Sign Out transitions view back to Login screen", p6b.returnedToLogin);
    report(44, "Account bottom sheet is completely dismissed", p6b.sheetDismissed);
    report(45, "CRITICAL: Student role is PRESERVED upon signing out", p6b.studentActive && !p6b.parentActive);
    report(46, "Username prefilled with 'stu_chanreaksa'", p6b.username === "stu_chanreaksa");
    report(47, "Toast notification confirms 'Signed out successfully'", p6b.toastMessage === "Signed out successfully");

    // ==========================================================================
    // PHASE 7: Parent Portal Lifecycle & iOS Push Banner Simulation
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 7: Parent Portal Lifecycle & iOS Push Banner Simulation ---${colors.reset}`);

    // Switch to Parent role & Sign In
    const p7a = await cdp.evaluate(`(() => {
      const parentBtn = document.querySelector('.pm-seg-btn[data-role="parent"]');
      if (parentBtn) parentBtn.click();

      const form = document.querySelector(".pm-login-form");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      return true;
    })()`);

    // Wait 850ms for transition
    await sleep(850);

    const p7b = await cdp.evaluate(`(() => {
      const header = document.querySelector(".pm-header");
      const title = header ? header.querySelector(".pm-title").textContent.trim() : "";
      const avatar = header ? header.querySelector(".pm-avatar").textContent.trim() : "";
      const tabs = Array.from(document.querySelectorAll(".pm-tab")).map(b => b.dataset.tab);
      const pushBannerPresentImmediately = !!document.querySelector(".pm-push");

      return {
        title,
        avatar,
        tabs,
        pushBannerPresentImmediately
      };
    })()`);

    report(48, "Parent login transitions to Parent Portal with 'SV' avatar", p7b.title === "Parent Portal" && p7b.avatar === "SV");
    report(49, "Parent portal contains 6 tabs: home, alerts, scores, schedule, payments, news", p7b.tabs.join(",") === "home,alerts,scores,schedule,payments,news");
    report(50, "Push banner is NOT present immediately upon login (timer scheduled for 1.5s)", !p7b.pushBannerPresentImmediately);

    // Wait 1600ms to allow 1.5s post-transition timer to fire
    await sleep(1600);

    const p7c = await cdp.evaluate(`(() => {
      const banner = document.querySelector(".pm-push");
      const text = banner ? banner.textContent : "";
      const role = banner ? banner.getAttribute("role") : "";

      return {
        bannerExists: !!banner,
        isAlertRole: role === "alert",
        hasCheckoutAlert: text.includes("Check-out alert"),
        hasGateInfo: text.includes("Gate 01") && text.includes("11:32 AM")
      };
    })()`);

    report(51, "Simulated iOS push banner (.pm-push) appears 1.5s post parent login", p7c.bannerExists);
    report(52, "Push banner has role='alert' and details Chanreaksa campus checkout at 11:32 AM", p7c.isAlertRole && p7c.hasCheckoutAlert && p7c.hasGateInfo);

    // Click push banner -> switches to alerts tab and dismisses banner
    const p7d = await cdp.evaluate(`(() => {
      const banner = document.querySelector(".pm-push");
      if (banner) banner.click();

      const activeTab = document.querySelector(".pm-tab.active");
      const bannerGone = !document.querySelector(".pm-push");
      const headerTitle = document.querySelector(".pm-title");

      return {
        bannerDismissed: bannerGone,
        tabSwitchedToAlerts: activeTab ? activeTab.dataset.tab === "alerts" : false,
        headerTitle: headerTitle ? headerTitle.textContent.trim() : ""
      };
    })()`);

    report(53, "Tapping push banner dismisses the banner", p7d.bannerDismissed);
    report(54, "Tapping push banner navigates to 'alerts' tab", p7d.tabSwitchedToAlerts && p7d.headerTitle === "Gate Alerts");

    // Parent Sign Out -> preserves Parent role!
    const p7e = await cdp.evaluate(`(() => {
      const avatar = document.querySelector(".pm-avatar");
      if (avatar) avatar.click();

      const signoutBtn = document.querySelector('[data-action="signout"]');
      if (signoutBtn) signoutBtn.click();

      const app = document.getElementById("pmApp");
      const form = app ? app.querySelector(".pm-login-form") : null;
      const parentBtn = app ? app.querySelector('.pm-seg-btn[data-role="parent"]') : null;
      const studentBtn = app ? app.querySelector('.pm-seg-btn[data-role="student"]') : null;
      const userInput = document.getElementById("pmLoginUsername");

      return {
        returnedToLogin: !!form,
        parentActive: parentBtn ? parentBtn.classList.contains("active") : false,
        studentActive: studentBtn ? studentBtn.classList.contains("active") : false,
        username: userInput ? userInput.value : null
      };
    })()`);

    report(55, "Parent sign out transitions back to Login view", p7e.returnedToLogin);
    report(56, "CRITICAL: Parent role is PRESERVED upon signing out as Parent", p7e.parentActive && !p7e.studentActive);
    report(57, "Parent username restored with 'par_vibol'", p7e.username === "par_vibol");

    // ==========================================================================
    // PHASE 8: Storage Isolation & Fresh Reload
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 8: Storage Isolation & Fresh Reload Verification ---${colors.reset}`);

    const p8a = await cdp.evaluate(`(() => {
      const localKeys = Object.keys(window.localStorage);
      const sessionKeys = Object.keys(window.sessionStorage);
      const mockupLocalKeys = localKeys.filter(k => k.toLowerCase().includes("pm_") || k.toLowerCase().includes("auth") || k.toLowerCase().includes("user") || k.toLowerCase().includes("role"));

      return {
        localStorageLen: window.localStorage.length,
        sessionStorageLen: window.sessionStorage.length,
        localKeys,
        sessionKeys,
        mockupLocalKeys
      };
    })()`);

    report(58, "Zero mockup session or auth keys written to window.localStorage", p8a.mockupLocalKeys.length === 0, `Mockup keys found: ${p8a.mockupLocalKeys.length}`);
    report(59, "Zero items stored in window.sessionStorage", p8a.sessionStorageLen === 0, `Session keys: [${p8a.sessionKeys.join(", ")}]`);

    // Reload page
    await cdp.evaluate(`location.reload()`);
    await sleep(800);

    const p8b = await cdp.evaluate(`(() => {
      const app = document.getElementById("pmApp");
      const form = app ? app.querySelector(".pm-login-form") : null;
      const studentBtn = app ? app.querySelector('.pm-seg-btn[data-role="student"]') : null;
      const parentBtn = app ? app.querySelector('.pm-seg-btn[data-role="parent"]') : null;
      const userInput = document.getElementById("pmLoginUsername");

      return {
        loginScreenRendered: !!form,
        defaultStudentActive: studentBtn ? studentBtn.classList.contains("active") : false,
        parentInactive: parentBtn ? !parentBtn.classList.contains("active") : false,
        usernamePrefilledStudent: userInput ? userInput.value === "stu_chanreaksa" : false,
        sessionStorageLen: window.sessionStorage.length
      };
    })()`);

    report(60, "Page reload resets state completely to pristine Login screen", p8b.loginScreenRendered);
    report(61, "Page reload resets active role to default Student (no persistence across reloads)", p8b.defaultStudentActive && p8b.parentInactive);
    report(62, "Page reload pre-fills Student credentials ('stu_chanreaksa')", p8b.usernamePrefilledStudent);
    report(63, "SessionStorage remains 100% clean after page reload (0 items)", p8b.sessionStorageLen === 0);

    // ==========================================================================
    // PHASE 9: Adversarial Security & Stress Invariants
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.magenta}--- PHASE 9: Adversarial Security & Stress Invariants ---${colors.reset}`);

    // 9.1 XSS Injection Escape Test
    const p9a = await cdp.evaluate(`(() => {
      window.__XSS_TRIGGERED = false;
      const userEl = document.getElementById("pmLoginUsername");
      const form = document.querySelector(".pm-login-form");

      // Inject malicious string
      userEl.value = '"><script>window.__XSS_TRIGGERED=true;</script><img src=invalid onerror="window.__XSS_TRIGGERED=true;">';
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      return {
        xssTriggered: window.__XSS_TRIGGERED
      };
    })()`);

    // Wait a brief moment to catch any async onerror
    await sleep(200);

    const xssCheck = await cdp.evaluate(`window.__XSS_TRIGGERED === false`);
    report(64, "Adversarial: XSS payload in login inputs safely escaped (PM_HELPERS.esc)", xssCheck);

    // 9.2 Rapid Multi-Click Submit Protection (Idempotency)
    const p9b = await cdp.evaluate(`(() => {
      const userEl = document.getElementById("pmLoginUsername");
      const passEl = document.getElementById("pmLoginPassword");
      const submitBtn = document.getElementById("pmLoginSubmit");
      const form = document.querySelector(".pm-login-form");

      userEl.value = "stu_chanreaksa";
      passEl.value = "demo1234";

      // Spam submit 6 times rapidly
      for (let i = 0; i < 6; i++) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        submitBtn.click();
      }

      return {
        isSubmitting: submitBtn.disabled
      };
    })()`);

    report(65, "Adversarial: Rapid submission spamming handled gracefully without duplicate timers", p9b.isSubmitting);

    // Wait for transition to complete
    await sleep(850);
    const p9c = await cdp.evaluate(`document.querySelectorAll(".pm-header").length === 1 && document.querySelectorAll(".pm-tabbar").length === 1`);
    report(66, "Adversarial: Exactly ONE app shell and ONE tab bar rendered despite submit spam", p9c);

    // 9.3 Backdrop Click Closes Bottom Sheet
    const p9d = await cdp.evaluate(`(() => {
      const avatar = document.querySelector(".pm-avatar");
      avatar.click();

      let sheet = document.querySelector(".pm-sheet");
      const backdrop = document.querySelector(".pm-sheet-backdrop");

      // Click backdrop
      if (backdrop) backdrop.click();

      sheet = document.querySelector(".pm-sheet");
      const appShell = document.querySelector(".pm-header");

      return {
        sheetClosed: !sheet,
        remainedOnAppShell: !!appShell
      };
    })()`);

    report(67, "Clicking sheet backdrop closes bottom sheet and remains on current view", p9d.sheetClosed && p9d.remainedOnAppShell);

    // 9.4 "Forgot Password" Toast Interaction
    // Return to login
    await cdp.evaluate(`(() => {
      const avatar = document.querySelector(".pm-avatar");
      if (avatar) avatar.click();
      const signout = document.querySelector('[data-action="signout"]');
      if (signout) signout.click();
    })()`);
    await sleep(100);

    const p9e = await cdp.evaluate(`(() => {
      const forgotBtn = document.querySelector(".pm-forgot-btn");
      if (forgotBtn) forgotBtn.click();

      const toast = document.querySelector(".pm-toast");
      return {
        toastExists: !!toast,
        toastText: toast ? toast.textContent : ""
      };
    })()`);

    report(68, "'Forgot password?' button triggers registrar office support toast", p9e.toastExists && p9e.toastText.includes("012 998 877"));

    // 9.5 Rapid Role Toggling Stress Test (20 iterations)
    const p9f = await cdp.evaluate(`(() => {
      let roleSwitches = 0;
      for (let i = 0; i < 20; i++) {
        const targetRole = i % 2 === 0 ? "parent" : "student";
        const btn = document.querySelector('.pm-seg-btn[data-role="' + targetRole + '"]');
        if (btn) {
          btn.click();
          roleSwitches++;
        }
      }

      // After 20 iterations (0..19), last iteration is i=19 (student)
      const finalStudent = document.querySelector('.pm-seg-btn[data-role="student"]');
      const finalParent = document.querySelector('.pm-seg-btn[data-role="parent"]');
      const userInput = document.getElementById("pmLoginUsername");

      return {
        roleSwitches,
        studentActive: finalStudent ? finalStudent.classList.contains("active") : false,
        parentInactive: finalParent ? !finalParent.classList.contains("active") : false,
        username: userInput ? userInput.value : null
      };
    })()`);

    report(69, "Adversarial: 20 rapid role toggles execute without desynchronization", p9f.roleSwitches === 20 && p9f.studentActive && p9f.parentInactive);
    report(70, "Adversarial: Final state after rapid toggles cleanly restores student credentials", p9f.username === "stu_chanreaksa");

    // 9.6 Extreme Length Credential Input (500 chars)
    const p9g = await cdp.evaluate(`(() => {
      const userInput = document.getElementById("pmLoginUsername");
      const longStr = "A".repeat(500);
      userInput.value = longStr;
      userInput.dispatchEvent(new Event("input", { bubbles: true }));

      const form = document.querySelector(".pm-login-form");
      const app = document.getElementById("pmApp");

      return {
        storedLength: userInput.value.length,
        formIntact: !!form,
        hasOverflow: app.scrollWidth > app.clientWidth
      };
    })()`);

    report(71, "Adversarial: 500-char extreme input tolerated without layout break or overflow", p9g.storedLength === 500 && p9g.formIntact && !p9g.hasOverflow);

    // 9.7 Reduced Motion Media Query Verification
    const p9h = await cdp.evaluate(`(() => {
      let foundReducedMotionRule = false;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.media && rule.media.mediaText.includes("prefers-reduced-motion")) {
              foundReducedMotionRule = true;
              break;
            }
          }
        } catch (e) {}
      }
      return { foundReducedMotionRule };
    })()`);

    report(72, "Accessibility: prefers-reduced-motion media query present in loaded stylesheets", p9h.foundReducedMotionRule);

    // 9.8 Zero Unhandled Runtime Errors
    const p9i = await cdp.evaluate(`(() => {
      return {
        windowErrors: window.__CAPTURED_ERRORS || []
      };
    })()`);

    report(73, "Robustness: Zero unhandled runtime exceptions recorded during full session", p9i.windowErrors.length === 0);

  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill();
  }
}

async function main() {
  try {
    await runTestSuite();

    console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`${colors.bold}                 ADVERSARIAL TEST SUMMARY REPORT                      ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`Total Invariant Checks: ${totalChecks}`);
    console.log(`Checks Passed:          ${colors.green}${passedChecks}${colors.reset}`);
    console.log(`Checks Failed:          ${colors.red}${failedChecks}${colors.reset}`);

    if (failedChecks === 0 && totalChecks > 0) {
      console.log(`\n${colors.green}${colors.bold}OVERALL VERDICT: APPROVE (100% of adversarial M2 invariants verified empirically)${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}${colors.bold}OVERALL VERDICT: REQUEST_CHANGES (${failedChecks} invariant check(s) failed)${colors.reset}\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n${colors.red}${colors.bold}FATAL TEST EXECUTION ERROR:${colors.reset}`, err);
    process.exit(1);
  }
}

main();
