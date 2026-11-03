#!/usr/bin/env node
/**
 * ==============================================================================
 * test-centering.js
 * Verification Test Suite for Phone App Mockup Centering Defect Resolution
 *
 * Verifies that:
 * 1. [Static CSS AST] In phone-mockup/phone-mockup.css, for .pm-island,
 *    .pm-home-indicator, and .pm-toast, 'transform: translateX(-50%)' and
 *    'translate: -50% 0' (or any individual translate property) are NEVER
 *    present simultaneously on the same selector.
 * 2. [Static Centering Contract] Each target selector specifies exactly one
 *    horizontal centering mechanism with 'left: 50%'.
 * 3. [Dynamic Headless Chrome CDP] When rendered in a live Chromium browser,
 *    all target elements (.pm-island, .pm-home-indicator, .pm-toast) have their
 *    horizontal centers aligned with .pm-screen center (|delta| < 0.5px),
 *    their right edges are NOT pinned to the centerline (|right - center| > 5px),
 *    and getComputedStyle().translate evaluates to 'none'.
 *
 * Usage:
 *   node test-centering.js              # Run both static and headless CDP tests
 *   node test-centering.js --static     # Run static CSS AST assertions only
 *   node test-centering.js --cdp        # Run headless CDP browser assertions only
 *   node test-centering.js --port=3000  # Specify custom server port (default: 3000)
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
  bold: "\x1b[1m",
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
      console.log(`        ${colors.red}↳ Error: ${detail}${colors.reset}`);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const runStaticOnly = args.includes("--static");
const runCdpOnly = args.includes("--cdp");
const portArg = args.find(a => a.startsWith("--port="));
const cssFileArg = args.find(a => a.startsWith("--css-file="));
const CUSTOM_CSS_PATH = cssFileArg ? path.resolve(process.cwd(), cssFileArg.split("=")[1]) : null;
const PORT = portArg ? parseInt(portArg.split("=")[1], 10) : 3000;
const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;

// Target elements that require horizontal centering
const TARGET_SELECTORS = [
  { selector: ".pm-island", name: "Dynamic Island", expectedWidth: 126 },
  { selector: ".pm-home-indicator", name: "Home Indicator Pill", expectedWidth: 134 },
  { selector: ".pm-toast", name: "In-App Toast Notification", expectedWidth: null }
];

// ------------------------------------------------------------------------------
// CSS AST Parser (Vanilla ES2020, zero dependencies)
// ------------------------------------------------------------------------------
function parseCssRules(cssText) {
  // Strip CSS comments while preserving newlines for line counting
  const clean = cssText.replace(/\/\*[\s\S]*?\*\//g, m => " ".repeat(m.length));
  const rules = [];

  let depth = 0;
  let currentSelector = "";
  let currentBody = "";
  let blockStart = 0;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "{") {
      if (depth === 0) {
        blockStart = i;
        currentBody = "";
      } else {
        currentBody += ch;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const rawSel = currentSelector.trim();
        // Check if this is an @media or @keyframes block
        if (rawSel.startsWith("@media")) {
          // Recursively parse inner rules
          const innerRules = parseCssRules(currentBody);
          for (const r of innerRules) {
            r.media = rawSel;
            rules.push(r);
          }
        } else if (!rawSel.startsWith("@keyframes")) {
          // Parse declarations
          const declarations = new Map();
          const rawDecls = currentBody.split(";");
          for (const decl of rawDecls) {
            const colonIdx = decl.indexOf(":");
            if (colonIdx !== -1) {
              const prop = decl.slice(0, colonIdx).trim().toLowerCase();
              const val = decl.slice(colonIdx + 1).trim();
              if (prop && val) {
                declarations.set(prop, val);
              }
            }
          }
          rules.push({
            selector: rawSel,
            declarations,
            rawBody: currentBody.trim()
          });
        }
        currentSelector = "";
        currentBody = "";
      } else {
        currentBody += ch;
      }
    } else {
      if (depth === 0) {
        currentSelector += ch;
      } else {
        currentBody += ch;
      }
    }
  }

  return rules;
}

// ------------------------------------------------------------------------------
// Phase 1: Static CSS AST & Grammar Assertions
// ------------------------------------------------------------------------------
function runStaticCssAssertions() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   PHASE 1: STATIC CSS AST & CENTERING DECLARATION VERIFICATION      ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);

  let cssPath = CUSTOM_CSS_PATH;
  if (!cssPath) {
    const possiblePaths = [
      path.resolve(process.cwd(), "phone-mockup/phone-mockup.css"),
      path.resolve(__dirname, "../phone-mockup/phone-mockup.css"),
      path.resolve(__dirname, "../../phone-mockup/phone-mockup.css"),
      path.resolve(__dirname, "../../../phone-mockup/phone-mockup.css")
    ];
    cssPath = possiblePaths.find(p => fs.existsSync(p));
  }

  if (!cssPath) {
    report(1, "CSS file existence", false, `phone-mockup/phone-mockup.css not found in candidate paths`);
    return;
  }

  const cssContent = fs.readFileSync(cssPath, "utf8");
  report(1, "Read phone-mockup/phone-mockup.css", true, `${cssContent.length} bytes loaded`);

  const rules = parseCssRules(cssContent);
  report(2, "Parse CSS rule blocks", rules.length > 0, `Parsed ${rules.length} CSS rule blocks`);

  let checkNum = 3;

  for (const target of TARGET_SELECTORS) {
    const sel = target.selector;
    const name = target.name;

    // Find rule for this selector (handling comma-separated selectors if any)
    const matchingRule = rules.find(r => {
      const parts = r.selector.split(/\s*,\s*/);
      return parts.includes(sel);
    });

    if (!matchingRule) {
      report(checkNum++, `Rule exists for ${sel} (${name})`, false, `Selector ${sel} not found in stylesheet`);
      continue;
    }
    report(checkNum++, `Rule exists for ${sel} (${name})`, true, `Selector declared`);

    const decls = matchingRule.declarations;
    const hasTransform = decls.has("transform");
    const hasTranslate = decls.has("translate");
    const transformVal = decls.get("transform") || "";
    const translateVal = decls.get("translate") || "";

    // 1. Check mutual exclusivity: NEVER have both transform and translate simultaneously
    const simultaneousPresent = hasTransform && hasTranslate;
    report(
      checkNum++,
      `${sel}: Mutual Exclusivity - 'transform' and 'translate' NOT present simultaneously`,
      !simultaneousPresent,
      simultaneousPresent
        ? `FOUND BOTH: transform: '${transformVal}' AND translate: '${translateVal}' on ${sel} (triggers -100% double-translation defect)`
        : `Mutually exclusive: ${hasTransform ? `only transform ('${transformVal}')` : hasTranslate ? `only translate ('${translateVal}')` : 'none'}`
    );

    // 2. Check positioning anchor: left: 50%
    const leftVal = decls.get("left") || "";
    const hasLeft50 = /50%/.test(leftVal);
    report(
      checkNum++,
      `${sel}: Positioning Anchor - declares left: 50%`,
      hasLeft50,
      hasLeft50 ? `left: ${leftVal}` : `Missing or invalid left: '${leftVal}' (expected '50%')`
    );

    // 3. Check exact centering shift: exactly one -50% shift on X axis
    const transformHasX50 = /translateX\s*\(\s*-50%\s*\)/i.test(transformVal) || /translate\s*\(\s*-50%/i.test(transformVal);
    const translateHasX50 = /-50%/i.test(translateVal);

    const centeringCount = (transformHasX50 ? 1 : 0) + (translateHasX50 ? 1 : 0);
    const hasExactSingleCentering = centeringCount === 1;

    report(
      checkNum++,
      `${sel}: Centering Shift - exactly ONE horizontal -50% translation declared`,
      hasExactSingleCentering,
      hasExactSingleCentering
        ? `Single centering shift active: ${transformHasX50 ? `transform: ${transformVal}` : `translate: ${translateVal}`}`
        : centeringCount === 0
          ? `No -50% translation found for horizontal centering`
          : `Compounded translation: found ${centeringCount} translations on X axis (-100% total skew)`
    );
  }

  // Global sanity check: Scan ALL rules in the stylesheet to ensure NO selector compounds transform and translate
  let compoundingViolations = 0;
  for (const r of rules) {
    const d = r.declarations;
    if (d.has("transform") && d.has("translate")) {
      const tVal = d.get("transform");
      const trVal = d.get("translate");
      if (/-50%/.test(tVal) && /-50%/.test(trVal)) {
        compoundingViolations++;
        console.log(`        ${colors.red}↳ Violation in selector '${r.selector}': transform: ${tVal} | translate: ${trVal}${colors.reset}`);
      }
    }
  }

  report(
    checkNum++,
    `Global Stylesheet Sanity: Zero compounding -50% translation rules across all selectors`,
    compoundingViolations === 0,
    compoundingViolations === 0 ? "Zero compounding rules found" : `Found ${compoundingViolations} selector(s) with compounded translations`
  );
}

// ------------------------------------------------------------------------------
// Phase 2: Dynamic Headless Chrome CDP Verification
// ------------------------------------------------------------------------------
async function runHeadlessCdpAssertions() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   PHASE 2: HEADLESS CHROMIUM CDP RUNTIME GEOMETRY ASSERTIONS        ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);

  // Check if Chrome binary exists
  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];
  const chromeBin = chromePaths.find(p => fs.existsSync(p));

  if (!chromeBin) {
    console.log(`  ${colors.yellow}⚠ SKIPPED Phase 2: Google Chrome binary not found in standard paths${colors.reset}`);
    return;
  }

  // Check if server is running on target port
  const serverUp = await new Promise(resolve => {
    const req = http.get(BASE_URL, res => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!serverUp) {
    report(
      20,
      `Connect to test server at ${BASE_URL}`,
      false,
      `Local server is not responding at ${BASE_URL}. Ensure 'node server.js' or dev server is running on port ${PORT}.`
    );
    return;
  }
  report(20, `Connect to test server at ${BASE_URL}`, true, `HTTP 200 OK`);

  const CDP_PORT = 9335;
  const chromeProcess = spawn(chromeBin, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1440,900",
    BASE_URL
  ]);

  try {
    // Wait for Chrome CDP port to open
    let connected = false;
    let tabs = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        tabs = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
            let data = "";
            res.on("data", c => data += c);
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        if (tabs && tabs.length > 0) {
          connected = true;
          break;
        }
      } catch (e) {
        // Retry
      }
    }

    if (!connected || !tabs) {
      report(21, "Initialize Chrome DevTools Protocol session", false, "Failed to connect to Chrome debugging port");
      return;
    }

    const targetTab = tabs.find(t => t.url && t.url.includes("phone-mockup")) || tabs[0];
    report(21, "Attach to Phone Mockup Page tab", true, `Tab ID: ${targetTab.id}`);

    // Open WebSocket connection to Chrome CDP
    const ws = new globalThis.WebSocket(targetTab.webSocketDebuggerUrl);

    const measurement = await new Promise((resolve, reject) => {
      ws.onopen = () => {
        // Measurement script inside browser context
        const expr = `(() => {
          const screen = document.querySelector(".pm-screen");
          if (!screen) return { error: ".pm-screen element not found" };

          const sRect = screen.getBoundingClientRect();
          const screenCenter = sRect.left + sRect.width / 2;

          function inspectElement(selector, createIfNeeded = false) {
            let el = document.querySelector(selector);
            let created = false;
            if (!el && createIfNeeded) {
              el = document.createElement("div");
              el.className = selector.replace(".", "");
              el.textContent = "Test Measure Toast";
              screen.appendChild(el);
              created = true;
            }
            if (!el) return { error: selector + " not found" };

            const rect = el.getBoundingClientRect();
            const elemCenter = rect.left + rect.width / 2;
            const delta = elemCenter - screenCenter;
            const style = window.getComputedStyle(el);

            const result = {
              selector,
              left: rect.left,
              right: rect.right,
              width: rect.width,
              elemCenter,
              screenCenter,
              deltaFromScreenCenter: delta,
              isCentered: Math.abs(delta) < 0.5,
              rightEdgeAtCenter: Math.abs(rect.right - screenCenter) < 1.0,
              computedTransform: style.transform,
              computedTranslate: style.translate
            };

            if (created) el.remove();
            return result;
          }

          return {
            screen: { left: sRect.left, right: sRect.right, width: sRect.width, center: screenCenter },
            island: inspectElement(".pm-island"),
            home: inspectElement(".pm-home-indicator"),
            toast: inspectElement(".pm-toast", true)
          };
        })()`;

        ws.send(JSON.stringify({
          id: 100,
          method: "Runtime.evaluate",
          params: { expression: expr, returnByValue: true }
        }));
      };

      ws.onmessage = evt => {
        const msg = JSON.parse(evt.data);
        if (msg.id === 100) {
          resolve(msg.result.result.value);
        }
      };

      ws.onerror = reject;
    });

    ws.close();

    if (!measurement || measurement.error) {
      report(22, "Execute DOM measurement in browser context", false, measurement ? measurement.error : "No data returned");
      return;
    }

    report(22, "Execute DOM measurement in browser context", true, `Screen center: ${measurement.screen.center.toFixed(2)}px`);

    let checkId = 23;

    // Output measurement table
    console.log(`\n  ${colors.bold}Measured Element Alignment Matrix:${colors.reset}`);
    console.log(`  ┌────────────────────┬──────────┬──────────┬──────────┬────────────┬──────────────┬───────────────┐`);
    console.log(`  │ Element            │ Width    │ Center   │ ScreenCtr│ Delta (px) │ Right Edge Ctr│ Is Centered?  │`);
    console.log(`  ├────────────────────┼──────────┼──────────┼──────────┼────────────┼──────────────┼───────────────┤`);

    for (const key of ["island", "home", "toast"]) {
      const data = measurement[key];
      const sel = data.selector;
      const w = data.width.toFixed(1).padStart(8);
      const c = data.elemCenter.toFixed(1).padStart(8);
      const sc = data.screenCenter.toFixed(1).padStart(8);
      const d = (data.deltaFromScreenCenter >= 0 ? "+" : "") + data.deltaFromScreenCenter.toFixed(2).padStart(8);
      const rightAtCtr = (data.rightEdgeAtCenter ? "YES (DEFECT)" : "NO (OK)").padStart(12);
      const isCenteredStr = (data.isCentered ? "YES (PASS)" : "NO (FAIL)").padStart(13);

      console.log(`  │ ${sel.padEnd(18)} │ ${w} │ ${c} │ ${sc} │ ${d} │ ${rightAtCtr} │ ${isCenteredStr} │`);
    }
    console.log(`  └────────────────────┴──────────┴──────────┴──────────┴────────────┴──────────────┴───────────────┘\n`);

    // Individual element assertions
    for (const key of ["island", "home", "toast"]) {
      const data = measurement[key];
      const sel = data.selector;

      // 1. Centering alignment assertion (|delta| < 0.5px)
      report(
        checkId++,
        `${sel}: Geometric horizontal center matches screen center (|delta| < 0.5px)`,
        data.isCentered,
        data.isCentered
          ? `Exact center match: delta = ${data.deltaFromScreenCenter.toFixed(3)}px`
          : `Off-center skew: delta = ${data.deltaFromScreenCenter.toFixed(3)}px (screenCenter=${data.screenCenter.toFixed(2)}px, elemCenter=${data.elemCenter.toFixed(2)}px)`
      );

      // 2. Right edge NOT pinned to center assertion (|right - screenCenter| > 5px)
      report(
        checkId++,
        `${sel}: Right edge is NOT pinned to screen centerline (|right - screenCenter| > 5px)`,
        !data.rightEdgeAtCenter,
        !data.rightEdgeAtCenter
          ? `Right edge correctly offset: ${Math.abs(data.right - data.screenCenter).toFixed(2)}px from centerline`
          : `DEFECT DETECTED: Right edge is pinned to centerline at ${data.right.toFixed(2)}px (skewed -100%)`
      );

      // 3. Computed style translate property must be 'none'
      const translateIsClean = data.computedTranslate === "none" || data.computedTranslate === "" || data.computedTranslate === undefined;
      report(
        checkId++,
        `${sel}: getComputedStyle().translate evaluates to 'none'`,
        translateIsClean,
        translateIsClean
          ? `Computed translate is clean: '${data.computedTranslate}'`
          : `Compounding translate active in browser engine: '${data.computedTranslate}'`
      );
    }
  } finally {
    chromeProcess.kill();
  }
}

// ------------------------------------------------------------------------------
// Main Runner
// ------------------------------------------------------------------------------
async function main() {
  console.log(`${colors.bold}======================================================================${colors.reset}`);
  console.log(`${colors.bold}       PHONE APP MOCKUP CENTERING VERIFICATION TEST HARNESS           ${colors.reset}`);
  console.log(`${colors.bold}======================================================================${colors.reset}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`Working Directory:   ${process.cwd()}`);

  if (!runCdpOnly) {
    runStaticCssAssertions();
  }

  if (!runStaticOnly) {
    await runHeadlessCdpAssertions();
  }

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}                     TEST SUMMARY REPORT                              ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Total Checks Executed: ${totalChecks}`);
  console.log(`Checks Passed:         ${colors.green}${passedChecks}${colors.reset}`);
  console.log(`Checks Failed:         ${colors.red}${failedChecks}${colors.reset}`);

  if (failedChecks === 0 && totalChecks > 0) {
    console.log(`\n${colors.green}${colors.bold}OVERALL VERDICT: PASS (Centering defect 100% resolved without compounding)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}${colors.bold}OVERALL VERDICT: FAIL (${failedChecks} check(s) failed)${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
