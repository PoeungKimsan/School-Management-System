#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-mobile-stage-padding.js
 * Milestone 1 Empirical Challenger: Mobile Stage Padding & Scrollbar Harness
 *
 * Directly launches headless Chromium and uses CDP (Chrome DevTools Protocol)
 * to test live rendering across multiple viewports:
 * - 375x667 (iPhone SE/8 - mandated)
 * - 360x640 (Android small - mandated)
 * - 320x480 (iPhone legacy / minimum - mandated)
 * - 390x844 (iPhone 12/13/14/15 standard - mandated)
 * - 320x568 (iPhone 5/SE1)
 * - 412x915 (Pixel 7)
 * - 414x896 (iPhone XR)
 * - 430x932 (iPhone 15 Pro Max)
 * - 639x800 (Mobile threshold boundary - 1px)
 * - 640x800 (Mobile threshold boundary exact)
 * - 641x800 (Desktop boundary + 1px)
 * - 1024x768 (Tablet)
 * - 1440x900 (Desktop standard)
 *
 * Verifies:
 * 1. .pm-home-btn vertical clearance above .pm-device on mobile (no collision)
 * 2. Stage padding exact values (64px top + 16px bottom = 80px for <=640px; 40px+40px=80px for >640px)
 * 3. Document scrollbar elimination (hasVScroll: false, hasHScroll: false)
 * 4. Full frame containment within viewport boundaries
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
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m"
};

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;

console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   CHALLENGER M1: MOBILE STAGE PADDING & SCROLLBAR ELIMINATION SUITE  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`Target URL: ${BASE_URL}`);

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(id, desc, passed, detail = "") {
  totalChecks++;
  const idStr = id.toString().padStart(2, "0");
  if (passed) {
    passedChecks++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} [${idStr}] ${desc}${detail ? ` ${colors.dim}(${detail})${colors.reset}` : ""}`);
  } else {
    failedChecks++;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} [${idStr}] ${desc}: ${detail}`);
  }
}

const VIEWPORTS = [
  // Mandated mobile viewports under 640px
  { label: "375×667 (iPhone SE/8)", width: 375, height: 667, mobile: true, isMandated: true },
  { label: "360×640 (Android small)", width: 360, height: 640, mobile: true, isMandated: true },
  { label: "320×480 (iPhone legacy/min)", width: 320, height: 480, mobile: true, isMandated: true },
  { label: "390×844 (iPhone 12-15 std)", width: 390, height: 844, mobile: true, isMandated: true },
  // Extended mobile viewports
  { label: "320×568 (iPhone 5/SE1)", width: 320, height: 568, mobile: true, isMandated: false },
  { label: "412×915 (Pixel 7)", width: 412, height: 915, mobile: true, isMandated: false },
  { label: "414×896 (iPhone XR/11)", width: 414, height: 896, mobile: true, isMandated: false },
  { label: "430×932 (iPhone 15 Pro Max)", width: 430, height: 932, mobile: true, isMandated: false },
  // Boundary tests around 640px breakpoint
  { label: "639×800 (Threshold - 1px)", width: 639, height: 800, mobile: true, isMandated: false },
  { label: "640×800 (Threshold exact)", width: 640, height: 800, mobile: true, isMandated: false },
  { label: "641×800 (Desktop + 1px)", width: 641, height: 800, mobile: false, isMandated: false },
  // Desktop controls
  { label: "1024×768 (iPad landscape)", width: 1024, height: 768, mobile: false, isMandated: false },
  { label: "1440×900 (Desktop standard)", width: 1440, height: 900, mobile: false, isMandated: false }
];

async function run() {
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe") : ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);
  const chromeBin = chromePaths.find(p => fs.existsSync(p));

  if (!chromeBin) {
    console.error("Chrome binary not found");
    process.exit(1);
  }

  // Ensure server is reachable
  const serverUp = await new Promise(resolve => {
    const req = http.get(BASE_URL, res => resolve(res.statusCode === 200));
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });

  if (!serverUp) {
    console.error(`Server not responding at ${BASE_URL}`);
    process.exit(1);
  }

  const CDP_PORT = 9338;
  const chromeProcess = spawn(chromeBin, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1440,900",
    BASE_URL
  ]);

  const cleanup = () => {
    try { chromeProcess.kill("SIGKILL"); } catch (e) {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    // Connect to CDP
    let tabs = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        tabs = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
            let data = "";
            res.on("data", c => data += c);
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        if (tabs && tabs.length > 0) break;
      } catch (e) {}
    }

    if (!tabs || tabs.length === 0) {
      console.error("Failed to connect to Chrome CDP");
      process.exit(1);
    }

    const tab = tabs.find(t => t.url && t.url.includes("phone-mockup")) || tabs[0];
    const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function cdpSend(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const onMsg = evt => {
          const m = JSON.parse(evt.data);
          if (m.id === id) {
            ws.removeEventListener("message", onMsg);
            if (m.error) reject(m.error);
            else resolve(m.result);
          }
        };
        ws.addEventListener("message", onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await cdpSend("Page.enable");
    await cdpSend("Runtime.enable");

    console.log(`\n${colors.bold}--- Phase 1: Static Stylesheet Media Query Assertion ---${colors.reset}`);
    const cssContent = fs.readFileSync("phone-mockup/phone-mockup.css", "utf8");
    const mqMatch = cssContent.match(/@media\s*\(\s*max-width\s*:\s*640px\s*\)\s*\{([^}]+)\}/);
    const hasMedia640 = !!mqMatch;
    report(1, "phone-mockup.css contains @media (max-width: 640px) block", hasMedia640);

    const hasStagePaddingInMQ = mqMatch && /padding\s*:\s*64px\s+16px\s+16px\s*;/.test(mqMatch[1]);
    report(2, "@media (max-width: 640px) sets .pm-stage { padding: 64px 16px 16px; }", !!hasStagePaddingInMQ);

    console.log(`\n${colors.bold}--- Phase 2: Live Browser Headless CDP Viewport Sweeps ---${colors.reset}`);

    const tableRows = [];

    let checkNum = 3;

    for (const vp of VIEWPORTS) {
      // 1. Set emulation metrics
      await cdpSend("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      // 2. Dispatch resize event to trigger fitDevice()
      await cdpSend("Runtime.evaluate", {
        expression: `window.dispatchEvent(new Event("resize"));`
      });

      // Brief layout stabilization
      await new Promise(r => setTimeout(r, 60));

      // 3. Measure DOM metrics
      const evalResult = await cdpSend("Runtime.evaluate", {
        expression: `(() => {
          const stage = document.querySelector(".pm-stage");
          const homeBtn = document.querySelector(".pm-home-btn");
          const device = document.querySelector(".pm-device");
          const wrap = document.querySelector(".pm-device-wrap");
          const docEl = document.documentElement;

          const stageStyle = window.getComputedStyle(stage);
          const pt = parseFloat(stageStyle.paddingTop) || 0;
          const pb = parseFloat(stageStyle.paddingBottom) || 0;
          const pl = parseFloat(stageStyle.paddingLeft) || 0;
          const pr = parseFloat(stageStyle.paddingRight) || 0;

          const hRect = homeBtn.getBoundingClientRect();
          const dRect = device.getBoundingClientRect();
          const wRect = wrap.getBoundingClientRect();

          const hasVScroll = (docEl.scrollHeight - window.innerHeight) > 1;
          const hasHScroll = (docEl.scrollWidth - window.innerWidth) > 1;

          const verticalClearance = dRect.top - hRect.bottom;
          const horizontalClearance = dRect.left - hRect.right;
          const intersects = !(
            hRect.right < dRect.left ||
            hRect.left > dRect.right ||
            hRect.bottom < dRect.top ||
            hRect.top > dRect.bottom
          );

          return {
            vpWidth: window.innerWidth,
            vpHeight: window.innerHeight,
            paddingTop: pt,
            paddingBottom: pb,
            paddingLeft: pl,
            paddingRight: pr,
            totalVerticalPad: pt + pb,
            homeBottom: hRect.bottom,
            homeTop: hRect.top,
            homeLeft: hRect.left,
            homeRight: hRect.right,
            deviceTop: dRect.top,
            deviceBottom: dRect.bottom,
            deviceLeft: dRect.left,
            deviceRight: dRect.right,
            verticalClearance: verticalClearance,
            horizontalClearance: horizontalClearance,
            intersects: intersects,
            scrollHeight: docEl.scrollHeight,
            scrollWidth: docEl.scrollWidth,
            clientHeight: docEl.clientHeight,
            clientWidth: docEl.clientWidth,
            hasVScroll: hasVScroll,
            hasHScroll: hasHScroll,
            scrollY: window.scrollY,
            scrollX: window.scrollX
          };
        })()`,
        returnByValue: true
      });

      const m = evalResult.result.value;

      const isMobile = vp.width <= 640;
      const expectedPt = isMobile ? 64 : 40;
      const expectedPb = isMobile ? 16 : 40;
      const expectedVPad = 80;

      const padCorrect = (m.paddingTop === expectedPt) && (m.paddingBottom === expectedPb) && (m.totalVerticalPad === expectedVPad);
      const noOverlap = !m.intersects;
      // On mobile (<=640px), Home button sits vertically above device: require vertical clearance > 0
      // On desktop (>640px), Home button sits horizontally to the left of device: require horizontal clearance > 0
      const clearSeparation = isMobile ? (m.verticalClearance > 0) : (m.horizontalClearance > 0);
      const noScroll = !m.hasVScroll && !m.hasHScroll;

      const clearanceDisplay = isMobile
        ? `+${m.verticalClearance.toFixed(1)}px (vert)`
        : `+${m.horizontalClearance.toFixed(1)}px (horiz)`;

      tableRows.push({
        label: vp.label,
        size: `${vp.width}×${vp.height}`,
        pt: m.paddingTop,
        pb: m.paddingBottom,
        totalVPad: m.totalVerticalPad,
        homeBottom: m.homeBottom.toFixed(1),
        deviceTop: m.deviceTop.toFixed(1),
        clearance: clearanceDisplay,
        intersects: m.intersects ? "YES" : "NO",
        hasVScroll: m.hasVScroll ? "YES" : "NO",
        hasHScroll: m.hasHScroll ? "YES" : "NO",
        pass: padCorrect && noOverlap && clearSeparation && noScroll
      });

      // Individual test reports
      report(
        checkNum++,
        `Viewport ${vp.label}: Stage padding ($pt=${m.paddingTop}px, $pb=${m.paddingBottom}px, total=${m.totalVerticalPad}px)`,
        padCorrect,
        `Expected ${expectedPt}px + ${expectedPb}px = 80px`
      );

      report(
        checkNum++,
        `Viewport ${vp.label}: Zero 2D collision & clear clearance (${clearanceDisplay})`,
        noOverlap && clearSeparation,
        isMobile
          ? `Mobile: Home bottom=${m.homeBottom.toFixed(1)}px, Device top=${m.deviceTop.toFixed(1)}px, Vertical clearance=+${m.verticalClearance.toFixed(1)}px, Intersects=${m.intersects}`
          : `Desktop: Home right=${m.homeRight.toFixed(1)}px, Device left=${m.deviceLeft.toFixed(1)}px, Horizontal clearance=+${m.horizontalClearance.toFixed(1)}px, Intersects=${m.intersects}`
      );

      report(
        checkNum++,
        `Viewport ${vp.label}: Zero document scrollbars (hasVScroll: ${m.hasVScroll}, hasHScroll: ${m.hasHScroll})`,
        noScroll,
        `scroll: ${m.scrollWidth}x${m.scrollHeight}, client: ${m.clientWidth}x${m.clientHeight}`
      );
    }

    // Format results table
    console.log(`\n${colors.bold}Measured Viewport Collision & Scrollbar Matrix:${colors.reset}`);
    console.log(`┌──────────────────────────────┬──────────┬──────────┬────────────┬─────────────┬────────────┬──────────────────┬───────────┬─────────┬────────┐`);
    console.log(`│ Viewport                     │ WxH      │ Padding  │ Total VPad │ Home Bottom │ Device Top │ Clearance        │ Intersect │ VScroll │ Status │`);
    console.log(`├──────────────────────────────┼──────────┼──────────┼────────────┼─────────────┼────────────┼──────────────────┼───────────┼─────────┼────────┤`);
    for (const r of tableRows) {
      const padStr = `${r.pt}/${r.pb}px`.padEnd(8);
      const vpadStr = `${r.totalVPad}px`.padEnd(10);
      const hbStr = `${r.homeBottom}px`.padStart(11);
      const dtStr = `${r.deviceTop}px`.padStart(10);
      const clrStr = r.clearance.padStart(16);
      const intStr = r.intersects.padEnd(9);
      const vsStr = r.hasVScroll.padEnd(7);
      const stColor = r.pass ? colors.green : colors.red;
      const stStr = r.pass ? "PASS  " : "FAIL  ";
      console.log(`│ ${r.label.padEnd(28)} │ ${r.size.padEnd(8)} │ ${padStr} │ ${vpadStr} │ ${hbStr} │ ${dtStr} │ ${clrStr} │ ${intStr} │ ${vsStr} │ ${stColor}${stStr}${colors.reset} │`);
    }
    console.log(`└──────────────────────────────┴──────────┴──────────┴────────────┴─────────────┴────────────┴──────────────────┴───────────┴─────────┴────────┘`);

    ws.close();
    chromeProcess.kill("SIGKILL");

    console.log(`\n======================================================================`);
    console.log(`                     CHALLENGER VERDICT SUMMARY                       `);
    console.log(`======================================================================`);
    console.log(`Total Checks Executed: ${totalChecks}`);
    console.log(`Checks Passed:         ${colors.green}${passedChecks}${colors.reset}`);
    console.log(`Checks Failed:         ${failedChecks > 0 ? colors.red : colors.green}${failedChecks}${colors.reset}`);

    if (failedChecks === 0) {
      console.log(`\n${colors.bold}${colors.green}>>> OVERALL VERDICT: APPROVE (Mobile stage padding & scrollbar elimination verified)${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.bold}${colors.red}>>> OVERALL VERDICT: REJECT (${failedChecks} checks failed)${colors.reset}\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    cleanup();
    process.exit(1);
  }
}

run();
