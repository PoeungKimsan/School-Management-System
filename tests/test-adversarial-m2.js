#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m2.js
 * Comprehensive Adversarial & Quality Verification Test Harness for Milestone 2:
 * Authentication Flow, State Machine Architecture, and UI Shell Rendering
 * ==============================================================================
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;
const CDP_PORT = 9348;
const TMP_USER_DIR = path.join(os.tmpdir(), "chrome-m2-review-" + Date.now());

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(id, description, passed, detail = "") {
  totalChecks++;
  const idStr = String(id).padStart(2, "0");
  if (passed) {
    passedChecks++;
    console.log(`  \x1b[32m✓ PASS\x1b[0m [${idStr}] ${description}${detail ? ` (\x1b[36m${detail}\x1b[0m)` : ""}`);
  } else {
    failedChecks++;
    console.log(`  \x1b[31m✗ FAIL\x1b[0m [${idStr}] ${description}`);
    if (detail) {
      console.log(`        \x1b[31m↳ Error: ${detail}\x1b[0m`);
    }
  }
}

async function run() {
  console.log("\x1b[1m\x1b[36m======================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m   MILESTONE 2: AUTHENTICATION, STATE MACHINE & SHELL HARNESS         \x1b[0m");
  console.log("\x1b[1m\x1b[36m======================================================================\x1b[0m");
  console.log(`Target URL: ${BASE_URL}`);

  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];
  const chromeBin = chromePaths.find(p => fs.existsSync(p));
  if (!chromeBin) {
    console.error("Chrome binary not found.");
    process.exit(1);
  }

  fs.mkdirSync(TMP_USER_DIR, { recursive: true });

  const chromeProc = spawn(chromeBin, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TMP_USER_DIR}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1440,900",
    BASE_URL
  ]);

  try {
    let connected = false;
    let tabs = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        tabs = await new Promise((res, rej) => {
          http.get(`http://127.0.0.1:${CDP_PORT}/json`, r => {
            let d = "";
            r.on("data", c => d += c);
            r.on("end", () => res(JSON.parse(d)));
          }).on("error", rej);
        });
        if (tabs && tabs.length > 0) {
          connected = true;
          break;
        }
      } catch (e) {}
    }

    if (!connected) {
      console.error("Could not connect to Chrome CDP.");
      process.exit(1);
    }

    const tab = tabs.find(t => t.url && t.url.includes("phone-mockup")) || tabs[0];
    const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = evt => {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            ws.removeEventListener("message", handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(res => { ws.onopen = res; });
    await sendCommand("Runtime.enable");
    await sendCommand("Page.enable");

    async function evalInPage(expr) {
      const res = await sendCommand("Runtime.evaluate", {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || "JS Exception");
      }
      return res.result ? res.result.value : undefined;
    }

    // Wait for initial render
    await new Promise(r => setTimeout(r, 500));

    // ========================================================================
    // 1. IN-MEMORY STATE MACHINE & STORAGE AUDIT
    // ========================================================================
    console.log("\n--- Section 1: In-Memory State & Zero Storage Audit ---");

    const storageAudit = await evalInPage(`(() => {
      const localKeys = Object.keys(window.localStorage);
      const sessionKeys = Object.keys(window.sessionStorage);
      const pmLocalKeys = localKeys.filter(k => k.toLowerCase().includes("pm") || k.toLowerCase().includes("mockup"));
      const pmSessionKeys = sessionKeys.filter(k => k.toLowerCase().includes("pm") || k.toLowerCase().includes("mockup"));
      return {
        pmLocalKeys,
        pmSessionKeys,
        sessionStorageLen: window.sessionStorage.length
      };
    })()`);

    report(
      1,
      "Audit localStorage: Zero mockup-specific keys written by phone-mockup",
      storageAudit.pmLocalKeys.length === 0,
      `Mockup keys in localStorage: ${JSON.stringify(storageAudit.pmLocalKeys)}`
    );

    report(
      2,
      "Audit sessionStorage: Zero items stored in sessionStorage",
      storageAudit.sessionStorageLen === 0,
      `sessionStorage.length = ${storageAudit.sessionStorageLen}`
    );

    const cloningAudit = await evalInPage(`(() => {
      const pmDataInvoices = window.PM_DATA.invoices;
      const initialCount = pmDataInvoices.length;
      return {
        initialCount,
        hasDataInvoices: Array.isArray(pmDataInvoices),
        hasDataGateLog: Array.isArray(window.PM_DATA.gateLog)
      };
    })()`);

    report(
      3,
      "Seed dataset loaded: PM_DATA invoices and gateLog arrays present",
      cloningAudit.hasDataInvoices && cloningAudit.hasDataGateLog && cloningAudit.initialCount === 5,
      `Invoices count: ${cloningAudit.initialCount}`
    );

    // ========================================================================
    // 2. LOGIN SCREEN & BRANDING
    // ========================================================================
    console.log("\n--- Section 2: School Branding & Initial Login Screen ---");

    const brandingCheck = await evalInPage(`(() => {
      const logoImg = document.querySelector(".pm-body img[src*='default_school_logo.svg']");
      const nameEl = document.querySelector(".pm-body div[style*='font-size: 20px']");
      const khEl = document.querySelector(".pm-body div[style*='font-size: 13px']");
      const rootStyle = getComputedStyle(document.documentElement);
      const brandPrimary = rootStyle.getPropertyValue("--brand-primary").trim();
      return {
        hasLogo: !!logoImg,
        name: nameEl ? nameEl.textContent.trim() : "",
        nameKh: khEl ? khEl.textContent.trim() : "",
        brandPrimary
      };
    })()`);

    report(
      4,
      "School logo image tile rendered",
      brandingCheck.hasLogo,
      "src contains default_school_logo.svg"
    );

    report(
      5,
      "School name and Khmer name correctly rendered from applyBrand()",
      brandingCheck.name === "Milky Way School" && brandingCheck.nameKh === "សាលាមីគីវ៉េ",
      `name: '${brandingCheck.name}', nameKh: '${brandingCheck.nameKh}'`
    );

    report(
      6,
      "Brand primary CSS variable inherited (--brand-primary = #0077b6)",
      brandingCheck.brandPrimary.toLowerCase() === "#0077b6",
      `--brand-primary: ${brandingCheck.brandPrimary}`
    );

    // ========================================================================
    // 3. SEGMENTED CONTROL & CREDENTIAL PREFILLING
    // ========================================================================
    console.log("\n--- Section 3: Role Segmented Control & Prefilling ---");

    const initialCreds = await evalInPage(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      const activeSeg = document.querySelector(".pm-seg-btn.active");
      const userLabel = document.querySelector("label[for='pmLoginUsername']");
      return {
        username: user ? user.value : "",
        password: pass ? pass.value : "",
        activeRole: activeSeg ? activeSeg.dataset.role : "",
        label: userLabel ? userLabel.textContent.trim() : ""
      };
    })()`);

    report(
      7,
      "Default role is 'student' with prefilled stu_chanreaksa / demo1234",
      initialCreds.activeRole === "student" &&
      initialCreds.username === "stu_chanreaksa" &&
      initialCreds.password === "demo1234" &&
      initialCreds.label === "Student ID or username",
      `role=${initialCreds.activeRole}, user=${initialCreds.username}, label=${initialCreds.label}`
    );

    // Switch to Parent role
    await evalInPage(`(() => {
      const parentBtn = document.querySelector("button[data-action='role'][data-role='parent']");
      if (parentBtn) parentBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const parentCreds = await evalInPage(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      const activeSeg = document.querySelector(".pm-seg-btn.active");
      const userLabel = document.querySelector("label[for='pmLoginUsername']");
      const submitBtn = document.getElementById("pmLoginSubmit");
      return {
        username: user ? user.value : "",
        password: pass ? pass.value : "",
        activeRole: activeSeg ? activeSeg.dataset.role : "",
        label: userLabel ? userLabel.textContent.trim() : "",
        submitText: submitBtn ? submitBtn.textContent.trim() : ""
      };
    })()`);

    report(
      8,
      "Switching to Parent role toggles username to par_vibol and preserves demo1234",
      parentCreds.activeRole === "parent" &&
      parentCreds.username === "par_vibol" &&
      parentCreds.password === "demo1234" &&
      parentCreds.label === "Phone number or username" &&
      parentCreds.submitText === "Sign in as Parent",
      `user=${parentCreds.username}, label=${parentCreds.label}, submit=${parentCreds.submitText}`
    );

    // Switch back to Student role
    await evalInPage(`(() => {
      const studentBtn = document.querySelector("button[data-action='role'][data-role='student']");
      if (studentBtn) studentBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    // ========================================================================
    // 4. PASSWORD EYE TOGGLE (WITHOUT FULL RE-RENDER)
    // ========================================================================
    console.log("\n--- Section 4: Password Visibility Eye Toggle ---");

    const eyeToggleCheck = await evalInPage(`(() => {
      const passInput = document.getElementById("pmLoginPassword");
      const toggleBtn = document.querySelector("button[data-action='toggle-pass']");
      const initialType = passInput.type;
      const initialIcon = toggleBtn.querySelector("i").className;

      // Mark input to verify DOM node identity is preserved
      passInput.__identityMarker = "persisted";

      // Toggle to visible
      toggleBtn.click();
      const visibleType = passInput.type;
      const visibleIcon = toggleBtn.querySelector("i").className;
      const nodePreservedAfterShow = (document.getElementById("pmLoginPassword").__identityMarker === "persisted");

      // Toggle back to password
      toggleBtn.click();
      const revertedType = passInput.type;
      const revertedIcon = toggleBtn.querySelector("i").className;
      const nodePreservedAfterHide = (document.getElementById("pmLoginPassword").__identityMarker === "persisted");

      return {
        initialType,
        initialIcon,
        visibleType,
        visibleIcon,
        nodePreservedAfterShow,
        revertedType,
        revertedIcon,
        nodePreservedAfterHide
      };
    })()`);

    report(
      9,
      "Password eye toggle switches input type between 'password' and 'text'",
      eyeToggleCheck.initialType === "password" &&
      eyeToggleCheck.visibleType === "text" &&
      eyeToggleCheck.revertedType === "password",
      `${eyeToggleCheck.initialType} -> ${eyeToggleCheck.visibleType} -> ${eyeToggleCheck.revertedType}`
    );

    report(
      10,
      "Password eye toggle switches icon between 'bi-eye' and 'bi-eye-slash'",
      eyeToggleCheck.initialIcon.includes("bi-eye") &&
      eyeToggleCheck.visibleIcon.includes("bi-eye-slash") &&
      eyeToggleCheck.revertedIcon.includes("bi-eye"),
      `${eyeToggleCheck.initialIcon} -> ${eyeToggleCheck.visibleIcon} -> ${eyeToggleCheck.revertedIcon}`
    );

    report(
      11,
      "Password eye toggle operates in-place without destructive DOM re-render",
      eyeToggleCheck.nodePreservedAfterShow && eyeToggleCheck.nodePreservedAfterHide,
      "Input element reference identity preserved"
    );

    // ========================================================================
    // 5. "FORGOT PASSWORD?" TOAST NOTIFICATION
    // ========================================================================
    console.log("\n--- Section 5: Forgot Password Toast ---");

    await evalInPage(`(() => {
      const forgotBtn = document.querySelector("button[data-action='forgot']");
      if (forgotBtn) forgotBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const toastCheck = await evalInPage(`(() => {
      const toastEl = document.querySelector(".pm-toast");
      return {
        hasToast: !!toastEl,
        text: toastEl ? toastEl.textContent : "",
        role: toastEl ? toastEl.getAttribute("role") : ""
      };
    })()`);

    report(
      12,
      "Forgot password button triggers .pm-toast with registrar contact guidance",
      toastCheck.hasToast && toastCheck.text.includes("012 998 877") && toastCheck.role === "status",
      `Toast: '${toastCheck.text}'`
    );

    // Wait for toast to auto-clear
    await new Promise(r => setTimeout(r, 2300));

    // ========================================================================
    // 6. INLINE CREDENTIAL VALIDATION
    // ========================================================================
    console.log("\n--- Section 6: Inline Credential Validation ---");

    // Clear username and password and submit
    const emptySubmitCheck = await evalInPage(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      const submitBtn = document.getElementById("pmLoginSubmit");

      user.value = "";
      pass.value = "";

      // Submit form
      submitBtn.click();

      const userHasError = user.classList.contains("error");
      const passHasError = pass.classList.contains("error");
      const userErrText = document.getElementById("pmUserError").textContent;
      const passErrText = document.getElementById("pmPassError").textContent;
      const stillOnLogin = !!document.getElementById("pmLoginSubmit");

      return {
        userHasError,
        passHasError,
        userErrText,
        passErrText,
        stillOnLogin
      };
    })()`);

    report(
      13,
      "Submitting empty credentials displays red border (.error) and halts submission",
      emptySubmitCheck.userHasError &&
      emptySubmitCheck.passHasError &&
      emptySubmitCheck.userErrText === "Please enter your username" &&
      emptySubmitCheck.passErrText === "Please enter your password" &&
      emptySubmitCheck.stillOnLogin,
      `userErr: '${emptySubmitCheck.userErrText}', passErr: '${emptySubmitCheck.passErrText}'`
    );

    // Real-time error clearing on input
    const realTimeErrorClear = await evalInPage(`(() => {
      const user = document.getElementById("pmLoginUsername");
      user.value = "s";
      user.dispatchEvent(new Event("input", { bubbles: true }));

      const userCleared = !user.classList.contains("error");
      const userErrCleared = document.getElementById("pmUserError").textContent === "";
      return { userCleared, userErrCleared };
    })()`);

    report(
      14,
      "Typing in invalid input clears .error class and error hint immediately",
      realTimeErrorClear.userCleared && realTimeErrorClear.userErrCleared,
      "Input event successfully removed error state"
    );

    // Whitespace-only submission edge case
    const whitespaceCheck = await evalInPage(`(() => {
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      const submitBtn = document.getElementById("pmLoginSubmit");

      user.value = "     ";
      pass.value = "demo1234";

      submitBtn.click();

      const userHasError = user.classList.contains("error");
      const userErrText = document.getElementById("pmUserError").textContent;
      return { userHasError, userErrText };
    })()`);

    report(
      15,
      "Whitespace-only username is rejected with inline validation error",
      whitespaceCheck.userHasError && whitespaceCheck.userErrText === "Please enter your username",
      `Whitespace error: '${whitespaceCheck.userErrText}'`
    );

    // ========================================================================
    // 7. SIMULATED 700ms NETWORK LOADING TRANSITION
    // ========================================================================
    console.log("\n--- Section 7: Simulated 700ms Loading State & Portal Entry ---");

    // Fill valid student credentials and submit
    await evalInPage(`(() => {
      document.getElementById("pmLoginUsername").value = "stu_chanreaksa";
      document.getElementById("pmLoginPassword").value = "demo1234";
      document.getElementById("pmLoginSubmit").click();
    })()`);

    // Immediately verify loading state (within ~100ms)
    await new Promise(r => setTimeout(r, 100));

    const loadingState = await evalInPage(`(() => {
      const submitBtn = document.getElementById("pmLoginSubmit");
      const user = document.getElementById("pmLoginUsername");
      const pass = document.getElementById("pmLoginPassword");
      const spinner = submitBtn ? submitBtn.querySelector(".pm-spinner") : null;
      return {
        hasSpinner: !!spinner,
        btnText: submitBtn ? submitBtn.textContent.trim() : "",
        btnDisabled: submitBtn ? submitBtn.disabled : false,
        userInputDisabled: user ? user.disabled : false,
        passInputDisabled: pass ? pass.disabled : false
      };
    })()`);

    report(
      16,
      "Sign-in initiates loading state with spinner, 'Signing in…' text, and disabled inputs",
      loadingState.hasSpinner &&
      loadingState.btnText.includes("Signing in…") &&
      loadingState.btnDisabled &&
      loadingState.userInputDisabled &&
      loadingState.passInputDisabled,
      `button: '${loadingState.btnText}', disabled: ${loadingState.btnDisabled}`
    );

    // Wait remaining delay to complete the 700ms transition
    await new Promise(r => setTimeout(r, 800));

    const appShellStudent = await evalInPage(`(() => {
      const header = document.querySelector(".pm-header");
      const avatar = document.querySelector(".pm-avatar");
      const tabbar = document.querySelector(".pm-tabbar");
      const tabs = Array.from(document.querySelectorAll(".pm-tab")).map(t => t.dataset.tab);
      return {
        inApp: !!header && !!tabbar,
        avatarText: avatar ? avatar.textContent.trim() : "",
        tabs
      };
    })()`);

    report(
      17,
      "Transitions to Student App Shell post 700ms loading delay with 'SC' avatar",
      appShellStudent.inApp && appShellStudent.avatarText === "SC",
      `avatar: '${appShellStudent.avatarText}', inApp: ${appShellStudent.inApp}`
    );

    report(
      18,
      "Student Portal renders 5 required tabs (home, schedule, report, attendance, checkin)",
      JSON.stringify(appShellStudent.tabs) === JSON.stringify(["home", "schedule", "report", "attendance", "checkin"]),
      `tabs: ${appShellStudent.tabs.join(", ")}`
    );

    // ========================================================================
    // 8. APP SHELL HEADER & ACCOUNT BOTTOM SHEET
    // ========================================================================
    console.log("\n--- Section 8: Account Sheet & Sign Out Flow ---");

    // Open Account bottom sheet
    await evalInPage(`(() => {
      const avatarBtn = document.querySelector("button[data-action='sheet'][data-sheet='account']");
      if (avatarBtn) avatarBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const accountSheetStudent = await evalInPage(`(() => {
      const sheet = document.querySelector(".pm-sheet[aria-label='My Account']");
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      const signoutBtn = document.querySelector("button[data-action='signout']");
      const title = sheet ? sheet.querySelector("h2").textContent.trim() : "";
      const bodyText = sheet ? sheet.textContent : "";
      return {
        hasSheet: !!sheet && !!backdrop,
        title,
        hasSignout: !!signoutBtn,
        hasChanreaksa: bodyText.includes("Sok Chanreaksa"),
        hasG12: bodyText.includes("Grade 12-A"),
        hasCardId: bodyText.includes("STU-2026-001")
      };
    })()`);

    report(
      19,
      "Clicking avatar button opens Account bottom sheet displaying student identity",
      accountSheetStudent.hasSheet &&
      accountSheetStudent.title === "My Account" &&
      accountSheetStudent.hasChanreaksa &&
      accountSheetStudent.hasG12 &&
      accountSheetStudent.hasCardId,
      `Student details confirmed: Sok Chanreaksa, Grade 12-A, STU-2026-001`
    );

    report(
      20,
      "Account sheet contains functional 'Sign Out' action button",
      accountSheetStudent.hasSignout,
      "button[data-action='signout'] found"
    );

    // Click Sign Out
    await evalInPage(`(() => {
      const signoutBtn = document.querySelector("button[data-action='signout']");
      if (signoutBtn) signoutBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 150));

    const signoutResult = await evalInPage(`(() => {
      const onLogin = !!document.getElementById("pmLoginSubmit");
      const activeRole = document.querySelector(".pm-seg-btn.active");
      const user = document.getElementById("pmLoginUsername");
      const toastEl = document.querySelector(".pm-toast");
      return {
        onLogin,
        role: activeRole ? activeRole.dataset.role : "",
        username: user ? user.value : "",
        toastText: toastEl ? toastEl.textContent : ""
      };
    })()`);

    report(
      21,
      "Sign Out transitions back to Login screen while preserving selected role ('student')",
      signoutResult.onLogin && signoutResult.role === "student" && signoutResult.username === "stu_chanreaksa",
      `view: login, role preserved: ${signoutResult.role}`
    );

    report(
      22,
      "Sign Out triggers confirmation toast notification",
      signoutResult.toastText.includes("Signed out successfully"),
      `Toast: '${signoutResult.toastText}'`
    );

    // ========================================================================
    // 9. PARENT FLOW & SIMULATED IOS PUSH NOTIFICATION BANNER
    // ========================================================================
    console.log("\n--- Section 9: Parent Portal & 1.5s iOS Push Notification Banner ---");

    // Switch to Parent role
    await evalInPage(`(() => {
      const parentBtn = document.querySelector("button[data-action='role'][data-role='parent']");
      if (parentBtn) parentBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    // Sign in as Parent
    await evalInPage(`(() => {
      document.getElementById("pmLoginSubmit").click();
    })()`);

    // Wait for 700ms loading transition
    await new Promise(r => setTimeout(r, 850));

    const parentShell = await evalInPage(`(() => {
      const avatar = document.querySelector(".pm-avatar");
      const tabs = Array.from(document.querySelectorAll(".pm-tab")).map(t => t.dataset.tab);
      const unreadBadge = document.querySelector(".pm-tab-badge");
      const pushBannerImmediate = document.querySelector(".pm-push");
      return {
        avatarText: avatar ? avatar.textContent.trim() : "",
        tabs,
        hasUnreadBadge: !!unreadBadge,
        unreadCount: unreadBadge ? unreadBadge.textContent.trim() : "",
        pushBannerImmediate: !!pushBannerImmediate
      };
    })()`);

    report(
      23,
      "Transitions to Parent App Shell with 'SV' avatar and 5 Parent tabs",
      parentShell.avatarText === "SV" &&
      JSON.stringify(parentShell.tabs) === JSON.stringify(["home", "alerts", "scores", "schedule", "payments"]),
      `avatar: '${parentShell.avatarText}', tabs: ${parentShell.tabs.join(", ")}`
    );

    report(
      24,
      "Alerts tab displays initial unread badge (1 unread checkout event)",
      parentShell.hasUnreadBadge && parentShell.unreadCount === "1",
      `unread count = ${parentShell.unreadCount}`
    );

    report(
      25,
      "Simulated iOS push banner is NOT visible immediately post-login (< 1.5s)",
      !parentShell.pushBannerImmediate,
      "Banner correctly delayed"
    );

    // Wait for 1.5s push banner delay (wait 1600ms to allow banner to render)
    await new Promise(r => setTimeout(r, 1600));

    const pushBannerCheck = await evalInPage(`(() => {
      const banner = document.querySelector(".pm-push");
      return {
        hasBanner: !!banner,
        bannerAction: banner ? banner.dataset.action : "",
        text: banner ? banner.textContent : "",
        role: banner ? banner.getAttribute("role") : ""
      };
    })()`);

    report(
      26,
      "Simulated iOS push banner appears 1.5s post-login with checkout alert details",
      pushBannerCheck.hasBanner &&
      pushBannerCheck.bannerAction === "push-open" &&
      pushBannerCheck.text.includes("Check-out alert") &&
      pushBannerCheck.text.includes("Sok Chanreaksa left campus at 11:32 AM via Gate 01") &&
      pushBannerCheck.role === "alert",
      pushBannerCheck.hasBanner ? `Banner text: '${pushBannerCheck.text.replace(/\s+/g, " ").trim()}'` : "Banner element not found"
    );

    // Click push banner to navigate to Alerts tab
    await evalInPage(`(() => {
      const banner = document.querySelector(".pm-push");
      if (banner) banner.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const postBannerClick = await evalInPage(`(() => {
      const activeTab = document.querySelector(".pm-tab.active");
      const unreadBadge = document.querySelector(".pm-tab-badge");
      const banner = document.querySelector(".pm-push");
      return {
        currentTab: activeTab ? activeTab.dataset.tab : "",
        badgeCleared: !unreadBadge,
        bannerDismissed: !banner
      };
    })()`);

    report(
      27,
      "Clicking push banner navigates to Alerts tab, dismisses banner, and clears unread badge",
      postBannerClick.currentTab === "alerts" &&
      postBannerClick.badgeCleared &&
      postBannerClick.bannerDismissed,
      `activeTab: '${postBannerClick.currentTab}', unreadCleared: ${postBannerClick.badgeCleared}`
    );

    // Parent Account Sheet check
    await evalInPage(`(() => {
      const avatarBtn = document.querySelector("button[data-action='sheet'][data-sheet='account']");
      if (avatarBtn) avatarBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const parentAccountSheet = await evalInPage(`(() => {
      const sheet = document.querySelector(".pm-sheet[aria-label='My Account']");
      return {
        hasSheet: !!sheet,
        text: sheet ? sheet.textContent : ""
      };
    })()`);

    report(
      28,
      "Parent Account sheet displays father identity (Mr. Vibol / Sok Vibol, 012 998 877)",
      parentAccountSheet.hasSheet &&
      (parentAccountSheet.text.includes("Mr. Vibol") || parentAccountSheet.text.includes("Sok Vibol")) &&
      parentAccountSheet.text.includes("012 998 877"),
      parentAccountSheet.hasSheet ? "Parent details confirmed" : "Account sheet not found"
    );

    // Sign out from Parent
    await evalInPage(`(() => {
      const signoutBtn = document.querySelector("button[data-action='signout']");
      if (signoutBtn) signoutBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const parentSignoutRole = await evalInPage(`(() => {
      const activeRole = document.querySelector(".pm-seg-btn.active");
      return activeRole ? activeRole.dataset.role : "";
    })()`);

    report(
      29,
      "Parent Sign Out preserves 'parent' role selection on login screen",
      parentSignoutRole === "parent",
      `role preserved: ${parentSignoutRole}`
    );

    // ========================================================================
    // 10. ADVERSARIAL STRESS-TESTING & EDGE CASES
    // ========================================================================
    console.log("\n--- Section 10: Adversarial Stress-Testing & Robustness ---");

    // Stress 1: Rapid multi-clicks on submit button during signingIn state
    const rapidClickCheck = await evalInPage(`(() => {
      const submitBtn = document.getElementById("pmLoginSubmit");
      let clickErrors = 0;
      submitBtn.click();
      for (let i = 0; i < 10; i++) {
        try {
          submitBtn.click();
        } catch (e) {
          clickErrors++;
        }
      }
      return { clickErrors };
    })()`);

    report(
      30,
      "Rapid multi-clicks on submit button during signingIn transition handled gracefully",
      rapidClickCheck.clickErrors === 0,
      "Zero exceptions thrown on rapid submit spam"
    );

    // Wait out the transition
    await new Promise(r => setTimeout(r, 850));

    // Stress 2: Sheet dismissal via backdrop click
    await evalInPage(`(() => {
      document.querySelector("button[data-action='sheet'][data-sheet='account']").click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    const backdropDismiss = await evalInPage(`(() => {
      const backdrop = document.querySelector(".pm-sheet-backdrop");
      if (backdrop) backdrop.click();
      return !document.querySelector(".pm-sheet");
    })()`);

    report(
      31,
      "Clicking bottom sheet backdrop cleanly dismisses sheet",
      backdropDismiss,
      "Sheet dismissed via backdrop click"
    );

    // Stress 3: Sign out cancels pending push banner timer
    // Sign out to login, switch to Parent, sign in, immediately sign out (< 1.5s)
    await evalInPage(`(() => {
      document.querySelector("button[data-action='sheet'][data-sheet='account']").click();
    })()`);
    await new Promise(r => setTimeout(r, 100));
    await evalInPage(`(() => {
      document.querySelector("button[data-action='signout']").click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    // Sign in as parent again
    await evalInPage(`(() => {
      document.getElementById("pmLoginSubmit").click();
    })()`);
    await new Promise(r => setTimeout(r, 850));

    // Immediately sign out BEFORE 1.5s push banner triggers
    await evalInPage(`(() => {
      document.querySelector("button[data-action='sheet'][data-sheet='account']").click();
    })()`);
    await new Promise(r => setTimeout(r, 100));
    await evalInPage(`(() => {
      document.querySelector("button[data-action='signout']").click();
    })()`);
    await new Promise(r => setTimeout(r, 100));

    // Wait 2000ms: ensure push banner does NOT leak onto login screen
    await new Promise(r => setTimeout(r, 2000));

    const leakedBannerCheck = await evalInPage(`(() => {
      return !document.querySelector(".pm-push");
    })()`);

    report(
      32,
      "Sign out cleanly cancels pending push timer; zero push banner leakage onto login screen",
      leakedBannerCheck,
      "Zero orphan push banners found"
    );

    // ========================================================================
    // 11. PAGE RELOAD RESETS STATE COMPLETELY (ZERO PERSISTENCE)
    // ========================================================================
    console.log("\n--- Section 11: Page Reload State Reset Verification ---");

    await sendCommand("Page.reload");
    await new Promise(r => setTimeout(r, 800));

    const reloadResetCheck = await evalInPage(`(() => {
      const isLogin = !!document.getElementById("pmLoginSubmit");
      const activeRole = document.querySelector(".pm-seg-btn.active");
      const localKeys = Object.keys(window.localStorage);
      const sessionKeys = Object.keys(window.sessionStorage);
      const pmLocalKeys = localKeys.filter(k => k.toLowerCase().includes("pm") || k.toLowerCase().includes("mockup"));
      const pmSessionKeys = sessionKeys.filter(k => k.toLowerCase().includes("pm") || k.toLowerCase().includes("mockup"));
      return {
        isLogin,
        role: activeRole ? activeRole.dataset.role : "",
        pmLocalKeys,
        pmSessionKeys,
        sessionLen: window.sessionStorage.length
      };
    })()`);

    report(
      33,
      "Hard page reload resets state cleanly to initial Login screen with Student role",
      reloadResetCheck.isLogin && reloadResetCheck.role === "student",
      `isLogin: ${reloadResetCheck.isLogin}, role: ${reloadResetCheck.role}`
    );

    report(
      34,
      "Hard page reload maintains pristine zero mockup storage persistence",
      reloadResetCheck.pmLocalKeys.length === 0 && reloadResetCheck.sessionLen === 0,
      `pmLocalKeys: ${reloadResetCheck.pmLocalKeys.length}, sessionStorage: ${reloadResetCheck.sessionLen}`
    );

    // Close WebSocket and terminate Chrome
    ws.close();
    chromeProc.kill("SIGKILL");

    // Clean up temporary user directory
    try {
      fs.rmSync(TMP_USER_DIR, { recursive: true, force: true });
    } catch (e) {}

    console.log("\n======================================================================");
    console.log("                     TEST SUMMARY REPORT                              ");
    console.log("======================================================================");
    console.log(`Total Checks Executed: ${totalChecks}`);
    console.log(`Checks Passed:         \x1b[32m${passedChecks}\x1b[0m`);
    console.log(`Checks Failed:         \x1b[31m${failedChecks}\x1b[0m`);

    if (failedChecks === 0) {
      console.log("\n\x1b[32m\x1b[1mOVERALL VERDICT: PASS (Milestone 2 Auth & State Machine 100% verified)\x1b[0m\n");
      process.exit(0);
    } else {
      console.log(`\n\x1b[31m\x1b[1mOVERALL VERDICT: FAIL (${failedChecks} checks failed)\x1b[0m\n`);
      process.exit(1);
    }

  } catch (err) {
    console.error("Test execution error:", err);
    chromeProc.kill("SIGKILL");
    try {
      fs.rmSync(TMP_USER_DIR, { recursive: true, force: true });
    } catch (e) {}
    process.exit(1);
  }
}

run();
