#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-viewport-scaling.js
 * Milestone 1 Empirical Challenger: Viewport Scaling & Responsiveness Test Suite
 *
 * Simulates viewports from extreme small (320x480) to 4K (3840x2160),
 * stress-tests dynamic scaling math, verifies wrap bounding box constraints,
 * tests boundary conditions, and executes against the live mockup-app.js implementation.
 * ==============================================================================
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  reset: "\x1b[0m"
};

console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   CHALLENGER M1: VIEWPORT DYNAMIC SCALING & RESPONSIVENESS HARNESS   ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function reportTest(name, passed, detail = "") {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} [${totalTests.toString().padStart(2, "0")}] ${name}${detail ? ` (${detail})` : ""}`);
  } else {
    failedTests++;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} [${totalTests.toString().padStart(2, "0")}] ${name}: ${detail}`);
  }
}

// Device frame reference constants
const W = 425;
const H = 876;
const MARGIN_X = 32; // .pm-stage padding: 16px left + 16px right
const MARGIN_Y = 80; // .pm-stage padding: 40px top + 40px bottom
const MIN_SCALE = 0.45;
const MAX_SCALE = 1.0;

// Theoretical scaling formula oracle
function theoreticalScale(innerWidth, innerHeight) {
  const availW = innerWidth - MARGIN_X;
  const availH = innerHeight - MARGIN_Y;
  const rawScale = Math.min(MAX_SCALE, availH / H, availW / W);
  return Math.max(MIN_SCALE, rawScale);
}

// ------------------------------------------------------------------------------
// Phase 1: Source Code & Implementation Contract Inspection
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}--- Phase 1: Implementation Source & DOM Binding Verification ---${colors.reset}`);

const appJsPath = path.resolve(__dirname, "../phone-mockup/mockup-app.js");
const appJsCode = fs.readFileSync(appJsPath, "utf8");

// Verify fitDevice() existence in source
const hasFitDevice = /function\s+fitDevice\s*\(\)/.test(appJsCode);
reportTest("mockup-app.js declares function fitDevice()", hasFitDevice);

// Verify scale formula in source: Math.max(0.45, Math.min(1, (innerHeight - 80) / H, (innerWidth - 32) / W))
const hasScaleFormula = /Math\.max\(\s*0\.45\s*,\s*Math\.min\(\s*1\s*,\s*\(innerHeight\s*-\s*80\)\s*\/\s*H\s*,\s*\(innerWidth\s*-\s*32\)\s*\/\s*W\s*\)\s*\)/.test(appJsCode);
reportTest("mockup-app.js implements canonical scale formula s = max(0.45, min(1, (innerHeight-80)/H, (innerWidth-32)/W))", hasScaleFormula);

// Verify W = 425 and H = 876 in source
const hasConstants = /const\s+W\s*=\s*425/.test(appJsCode) && /const\s+H\s*=\s*876/.test(appJsCode);
reportTest("mockup-app.js sets bounding box dimensions W=425, H=876", hasConstants);

// Verify wrap style width/height and dev transform assignment
const hasWrapWidth = /wrap\.style\.width\s*=\s*`\$\{W\s*\*\s*s\}px`/.test(appJsCode);
const hasWrapHeight = /wrap\.style\.height\s*=\s*`\$\{H\s*\*\s*s\}px`/.test(appJsCode);
const hasDevTransform = /dev\.style\.transform\s*=\s*`scale\(\$\{s\}\)`/.test(appJsCode);
reportTest("mockup-app.js mutates wrap width/height to (W*s)px and (H*s)px", hasWrapWidth && hasWrapHeight);
reportTest("mockup-app.js sets dev transform to scale(s)", hasDevTransform);

// Verify window resize listener attached
const hasResizeListener = /window\.addEventListener\(\s*["']resize["']\s*,\s*fitDevice\s*\)/.test(appJsCode);
reportTest("mockup-app.js binds fitDevice to window resize event", hasResizeListener);

// Verify boot invocation
const hasBootExecution = /fitDevice\(\)/.test(appJsCode);
reportTest("mockup-app.js invokes fitDevice() during boot sequence", hasBootExecution);

// ------------------------------------------------------------------------------
// Phase 2: Live Mocked VM Execution Harness
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}--- Phase 2: Mocked DOM Environment Execution Harness ---${colors.reset}`);

function createMockEnvironment(initialW, initialH) {
  const resizeCallbacks = [];

  const pmDevice = {
    id: "pmDevice",
    style: { transform: "" }
  };

  const pmDeviceWrap = {
    id: "pmDeviceWrap",
    style: { width: "", height: "" }
  };

  const doc = {
    documentElement: {
      style: {
        setProperty: () => {}
      }
    },
    getElementById: (id) => {
      if (id === "pmDevice") return pmDevice;
      if (id === "pmDeviceWrap") return pmDeviceWrap;
      return null;
    }
  };

  const win = {
    innerWidth: initialW,
    innerHeight: initialH,
    document: doc,
    SMS_STATE: {},
    SMS_PRESETS: { "milky-way": { primaryColor: "#0077b6" } },
    addEventListener: (event, handler) => {
      if (event === "resize") resizeCallbacks.push(handler);
    },
    triggerResize: (newW, newH) => {
      win.innerWidth = newW;
      win.innerHeight = newH;
      // also update global innerWidth/innerHeight in sandbox context
      sandbox.innerWidth = newW;
      sandbox.innerHeight = newH;
      for (const cb of resizeCallbacks) {
        cb();
      }
    }
  };

  const sandbox = {
    window: win,
    document: doc,
    innerWidth: initialW,
    innerHeight: initialH,
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsCode, sandbox);

  return {
    window: win,
    sandbox,
    pmDevice,
    pmDeviceWrap,
    resizeCallbacks
  };
}

const mockEnv = createMockEnvironment(1440, 900);
reportTest("Script boots cleanly inside VM without exceptions", true);
reportTest("Resize listener successfully registered in VM", mockEnv.resizeCallbacks.length > 0);

// ------------------------------------------------------------------------------
// Phase 3: The 8 Mandated Viewports Stress-Test
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}--- Phase 3: Mandated Viewports (320x480 to 4K) Empirical Stress-Test ---${colors.reset}`);

const mandatedViewports = [
  { name: "320×480 (extreme small portrait)", w: 320, h: 480 },
  { name: "390×844 (iPhone standard)", w: 390, h: 844 },
  { name: "768×1024 (iPad portrait)", w: 768, h: 1024 },
  { name: "1024×768 (iPad landscape)", w: 1024, h: 768 },
  { name: "1280×720 (720p laptop)", w: 1280, h: 720 },
  { name: "1440×900 (standard desktop)", w: 1440, h: 900 },
  { name: "1920×1080 (1080p desktop)", w: 1920, h: 1080 },
  { name: "3840×2160 (4K display)", w: 3840, h: 2160 }
];

console.log(`  | Viewport                 | WxH         | Expected s | Actual s   | Wrap W (avail)  | Wrap H (avail)  | Overflows? | Status |`);
console.log(`  |--------------------------|-------------|------------|------------|-----------------|-----------------|------------|--------|`);

for (const vp of mandatedViewports) {
  mockEnv.window.triggerResize(vp.w, vp.h);

  const expS = theoreticalScale(vp.w, vp.h);
  const actualTransform = mockEnv.pmDevice.style.transform;
  const match = actualTransform.match(/scale\(([^)]+)\)/);
  const actualS = match ? parseFloat(match[1]) : NaN;

  const actualWrapW = parseFloat(mockEnv.pmDeviceWrap.style.width);
  const actualWrapH = parseFloat(mockEnv.pmDeviceWrap.style.height);

  const availW = vp.w - MARGIN_X;
  const availH = vp.h - MARGIN_Y;

  // Tolerance checks
  const scaleMatches = Math.abs(actualS - expS) < 1e-9;
  const wrapWMatches = Math.abs(actualWrapW - (W * actualS)) < 1e-6;
  const wrapHMatches = Math.abs(actualWrapH - (H * actualS)) < 1e-6;

  // Overflow checks against available viewport space
  // Wrap width must not exceed availW (+ 1e-4 tolerance for float representation)
  // Wrap height must not exceed availH (+ 1e-4 tolerance)
  const horizOverflow = actualWrapW - availW;
  const vertOverflow = actualWrapH - availH;
  const noOverflow = horizOverflow <= 1e-4 && vertOverflow <= 1e-4;

  const rowStatus = scaleMatches && wrapWMatches && wrapHMatches && noOverflow;
  const statusStr = rowStatus ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;

  const padName = vp.name.padEnd(24);
  const padDim = `${vp.w}x${vp.h}`.padEnd(11);
  const padExpS = expS.toFixed(4).padEnd(10);
  const padActS = actualS.toFixed(4).padEnd(10);
  const padWrapW = `${actualWrapW.toFixed(1)} (${availW})`.padEnd(15);
  const padWrapH = `${actualWrapH.toFixed(1)} (${availH})`.padEnd(15);
  const padOver = (noOverflow ? "None (0px)" : `+${Math.max(horizOverflow, vertOverflow).toFixed(1)}px`).padEnd(10);

  console.log(`  | ${padName} | ${padDim} | ${padExpS} | ${padActS} | ${padWrapW} | ${padWrapH} | ${padOver} | ${statusStr}   |`);

  reportTest(`Viewport ${vp.w}x${vp.h}: Scale accuracy, wrap bounds & zero-overflow`, rowStatus, `s=${actualS.toFixed(4)}, wrap=${actualWrapW.toFixed(1)}x${actualWrapH.toFixed(1)}`);
}

// ------------------------------------------------------------------------------
// Phase 4: Extreme Viewports & Boundary Conditions
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}--- Phase 4: Boundary & Stress Testing (Clamps, Ratios, Extremes) ---${colors.reset}`);

const boundaryCases = [
  // Upper clamp boundary (s = 1.0 threshold: W >= 457, H >= 956)
  { name: "Exact upper boundary (457x956)", w: 457, h: 956, expectS: 1.0, desc: "Exact s=1.0 threshold" },
  { name: "Just below upper height (457x955)", w: 457, h: 955, expectS: 875 / 876, desc: "Height limits s=0.9989" },
  { name: "Just below upper width (456x956)", w: 456, h: 956, expectS: 424 / 425, desc: "Width limits s=0.9976" },

  // Lower clamp boundary (s = 0.45 threshold: H <= 474.2, W <= 223.25)
  { name: "Just above lower height threshold (425x475)", w: 425, h: 475, expectS: 395 / 876, desc: "s=0.45091 (unclamped)" },
  { name: "Just below lower height threshold (425x474)", w: 425, h: 474, expectS: 0.45, desc: "s clamped to 0.45" },
  { name: "Just above lower width threshold (224x876)", w: 224, h: 876, expectS: 192 / 425, desc: "s=0.45176 (unclamped)" },
  { name: "Just below lower width threshold (223x876)", w: 223, h: 876, expectS: 0.45, desc: "s clamped to 0.45" },

  // Extreme Small Viewports
  { name: "Extreme small 240x320 (smartwatch)", w: 240, h: 320, expectS: 0.45, desc: "Clamped to min scale 0.45" },
  { name: "Sub-minimal 160x160", w: 160, h: 160, expectS: 0.45, desc: "Clamped to min scale 0.45" },
  { name: "Degenerate zero viewport 0x0", w: 0, h: 0, expectS: 0.45, desc: "Clamped to min scale 0.45 without NaN" },

  // Aspect Ratio Stress
  { name: "Ultra-wide 5120x1440 (32:9 Super Ultrawide)", w: 5120, h: 1440, expectS: 1.0, desc: "Ultra-wide capped at 1.0" },
  { name: "Ultra-tall portrait 1080x1920 (Pivot monitor)", w: 1080, h: 1920, expectS: 1.0, desc: "Ultra-tall capped at 1.0" },
  { name: "Ultra-short ribbon 1920x400 (Banner display)", w: 1920, h: 400, expectS: 0.45, desc: "Height 400 limits to 0.45" },
  { name: "Ultra-thin phone 300x900", w: 300, h: 900, expectS: 268 / 425, desc: "Width limits s=0.6306" },

  // Fractional / Non-integer Viewports
  { name: "Windows 150% scaled 1536x864", w: 1536, h: 864, expectS: 784 / 876, desc: "Laptop 150% scaling s=0.8950" },
  { name: "Sub-pixel float viewport 1366.5x768.25", w: 1366.5, h: 768.25, expectS: (768.25 - 80) / 876, desc: "Fractional precision support" }
];

for (const b of boundaryCases) {
  mockEnv.window.triggerResize(b.w, b.h);

  const actualTransform = mockEnv.pmDevice.style.transform;
  const match = actualTransform.match(/scale\(([^)]+)\)/);
  const actualS = match ? parseFloat(match[1]) : NaN;

  const scaleMatches = Math.abs(actualS - b.expectS) < 1e-7;
  const isFiniteNum = Number.isFinite(actualS);

  reportTest(`${b.name}: ${b.desc}`, scaleMatches && isFiniteNum, `expected=${b.expectS.toFixed(5)}, actual=${actualS.toFixed(5)}`);
}

// ------------------------------------------------------------------------------
// Phase 5: CSS Scrollbar Prevention & Overflow Mechanics Verification
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}--- Phase 5: CSS Scrollbar Prevention & Overflow Mechanics ---${colors.reset}`);

const cssPath = path.resolve(__dirname, "../phone-mockup/phone-mockup.css");
const cssCode = fs.readFileSync(cssPath, "utf8");

// 1. Verify .pm-page overflow: hidden
const pmPageOverflow = /\.pm-page\s*\{[^}]*overflow:\s*hidden;?[^}]*\}/s.test(cssCode);
reportTest("CSS: .pm-page declares overflow: hidden to eliminate window scrollbars", pmPageOverflow);

// 2. Verify .pm-stage overflow: hidden
const pmStageOverflow = /\.pm-stage\s*\{[^}]*overflow:\s*hidden;?[^}]*\}/s.test(cssCode);
reportTest("CSS: .pm-stage declares overflow: hidden as secondary containment", pmStageOverflow);

// 3. Verify .pm-stage padding: 40px 16px matches MARGIN constants (80px vertical, 32px horizontal)
const pmStagePadding = /\.pm-stage\s*\{[^}]*padding:\s*40px\s+16px;?[^}]*\}/s.test(cssCode);
reportTest("CSS: .pm-stage padding is 40px 16px (matches 80px H and 32px W in fitDevice formula)", pmStagePadding);

// 4. Verify .pm-device transform-origin: top center
const pmDevTransformOrigin = /\.pm-device\s*\{[^}]*transform-origin:\s*top\s+center;?[^}]*\}/s.test(cssCode);
reportTest("CSS: .pm-device specifies transform-origin: top center for clean vertical scaling", pmDevTransformOrigin);

// 5. Verify .pm-device-wrap flex properties
const pmWrapFlex = /\.pm-device-wrap\s*\{[^}]*display:\s*flex;?[^}]*justify-content:\s*center;?[^}]*align-items:\s*flex-start;?[^}]*\}/s.test(cssCode);
reportTest("CSS: .pm-device-wrap centers device horizontally and aligns flex-start vertically", pmWrapFlex);

// 6. Verify universal box-sizing
const pmBoxSizing = /\*,\s*\*::before,\s*\*::after,\s*\.pm-page[^}]*box-sizing:\s*border-box;?[^}]*\}/s.test(cssCode);
reportTest("CSS: Universal box-sizing: border-box prevents unexpected margin/padding expansion", pmBoxSizing);

// ------------------------------------------------------------------------------
// Phase 6: Runtime Robustness & Stress Resilience
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}--- Phase 6: Rapid Continuous Resize & Graceful Failure Resilience ---${colors.reset}`);

// Rapid 100-cycle resize stress test
let resizeStressPassed = true;
try {
  for (let i = 0; i < 100; i++) {
    const randomW = Math.floor(Math.random() * 3500) + 200;
    const randomH = Math.floor(Math.random() * 2000) + 300;
    mockEnv.window.triggerResize(randomW, randomH);
  }
} catch (e) {
  resizeStressPassed = false;
  console.error("Rapid resize failed with exception:", e);
}
reportTest("Rapid continuous resize stress (100 random viewport cycles) executed without failure", resizeStressPassed);

// Missing DOM element resilience test
let missingElPassed = false;
try {
  const brokenSandbox = {
    window: { innerWidth: 1024, innerHeight: 768, addEventListener: () => {} },
    document: {
      documentElement: { style: { setProperty: () => {} } },
      getElementById: () => null // simulate elements missing
    },
    innerWidth: 1024,
    innerHeight: 768,
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };
  vm.createContext(brokenSandbox);
  vm.runInContext(appJsCode, brokenSandbox);
  missingElPassed = true; // didn't throw
} catch (e) {
  missingElPassed = false;
}
reportTest("Missing DOM element resilience (fitDevice returns gracefully if #pmDevice/#pmDeviceWrap missing)", missingElPassed);

// ------------------------------------------------------------------------------
// Summary & Verdict
// ------------------------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`${colors.bold}                     CHALLENGER EXECUTION SUMMARY                     ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`Total Assertions: ${totalTests}`);
console.log(`Passed:           ${colors.green}${passedTests}${colors.reset}`);
console.log(`Failed:           ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`);

if (failedTests === 0) {
  console.log(`\n${colors.bold}${colors.green}>>> VERDICT: APPROVE (Dynamic scaling & viewport responsiveness fully verified)${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.bold}${colors.red}>>> VERDICT: REJECT (${failedTests} test(s) failed)${colors.reset}\n`);
  process.exit(1);
}
