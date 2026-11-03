#!/usr/bin/env node
/**
 * tests/test-centering-adversarial.js
 * Empirical Challenger: Adversarial Stress Test Suite for Mockup Centering & Viewport Resilience
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;
const CDP_PORT = 9336;

const VIEWPORTS = [
  { name: "1920x1080 (1080p Desktop)", w: 1920, h: 1080 },
  { name: "1440x900 (Standard Desktop)", w: 1440, h: 900 },
  { name: "1280x720 (720p Laptop)", w: 1280, h: 720 },
  { name: "1024x768 (iPad Landscape)", w: 1024, h: 768 },
  { name: "768x1024 (iPad Portrait)", w: 768, h: 1024 },
  { name: "414x896 (iPhone XR/11)", w: 414, h: 896 },
  { name: "390x844 (iPhone 12/13/14)", w: 390, h: 844 },
  { name: "375x667 (iPhone SE 2/3)", w: 375, h: 667 },
  { name: "360x640 (Android Compact)", w: 360, h: 640 },
  { name: "320x568 (iPhone 5/SE1)", w: 320, h: 568 }
];

const TOAST_VARIATIONS = [
  { label: "Short Toast", text: "OK" },
  { label: "Standard Toast", text: "Midterm Report PDF ready" },
  { label: "Long Toast", text: "Your payment of $1,710.00 for Sok Chanreaksa was successfully processed via Bakong KHQR" },
  { label: "Khmer Unicode Toast", text: "ពាក្យស្នើសុំត្រូវបានអនុម័ត" }
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(description, passed, detail = "") {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`  ✓ PASS [${String(totalChecks).padStart(3, "0")}] ${description}${detail ? ` (${detail})` : ""}`);
  } else {
    failedChecks++;
    console.log(`  ✗ FAIL [${String(totalChecks).padStart(3, "0")}] ${description}: ${detail}`);
  }
}

async function run() {
  console.log("======================================================================");
  console.log("   CHALLENGER: ADVERSARIAL MULTI-VIEWPORT CENTERING & STRESS TEST    ");
  console.log("======================================================================");

  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium"
  ];
  const chromeBin = chromePaths.find(p => fs.existsSync(p));
  if (!chromeBin) {
    console.error("Chrome binary not found.");
    process.exit(1);
  }

  const chromeProc = spawn(chromeBin, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
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

    // Enable Runtime & Emulation
    await sendCommand("Runtime.enable");
    await sendCommand("Emulation.setFocusEmulationEnabled", { enabled: true });

    console.log("\n--- Section 1: Multi-Viewport Dynamic Centering & Bounding Box Inspection ---");

    for (const vp of VIEWPORTS) {
      // Set viewport metrics
      await sendCommand("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w <= 640
      });

      // Dispatch resize inside page
      await sendCommand("Runtime.evaluate", {
        expression: `(() => {
          window.dispatchEvent(new Event('resize'));
          if (typeof fitDevice === 'function') fitDevice();
        })()`
      });

      // Small delay for DOM layout reflow
      await new Promise(r => setTimeout(r, 100));

      const evalResult = await sendCommand("Runtime.evaluate", {
        expression: `(() => {
          const screen = document.querySelector(".pm-screen");
          const sRect = screen.getBoundingClientRect();
          const screenCenter = sRect.left + sRect.width / 2;

          function getMetrics(sel) {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const c = r.left + r.width / 2;
            const style = window.getComputedStyle(el);
            return {
              left: r.left,
              right: r.right,
              width: r.width,
              top: r.top,
              bottom: r.bottom,
              center: c,
              delta: c - screenCenter,
              rightOffset: Math.abs(r.right - screenCenter),
              translate: style.translate,
              transform: style.transform
            };
          }

          const island = getMetrics(".pm-island");
          const home = getMetrics(".pm-home-indicator");

          // Test Home Button clearance
          const homeBtn = document.querySelector(".pm-home-btn");
          const dev = document.querySelector(".pm-device");
          const hbR = homeBtn ? homeBtn.getBoundingClientRect() : null;
          const devR = dev ? dev.getBoundingClientRect() : null;
          const hbRect = hbR ? { top: hbR.top, bottom: hbR.bottom, left: hbR.left, right: hbR.right } : null;
          const devRect = devR ? { top: devR.top, bottom: devR.bottom, left: devR.left, right: devR.right } : null;

          const hasHScroll = document.documentElement.scrollWidth > window.innerWidth + 1;
          const hasVScroll = document.documentElement.scrollHeight > window.innerHeight + 1;

          return {
            screen: { left: sRect.left, right: sRect.right, width: sRect.width, center: screenCenter },
            island,
            home,
            homeBtnRect: hbRect,
            devRect,
            hasHScroll,
            hasVScroll,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
          };
        })()`,
        returnByValue: true
      });

      const data = evalResult.result.value;

      // Assertions for Island
      const islandCentered = Math.abs(data.island.delta) < 0.5;
      const islandRightSafe = data.island.rightOffset > 5.0;
      const islandTranslateClean = data.island.translate === "none" || !data.island.translate;

      report(`[${vp.name}] .pm-island centered (|Δ| < 0.5px)`, islandCentered, `Δ = ${data.island.delta.toFixed(3)}px`);
      report(`[${vp.name}] .pm-island right edge offset > 5px`, islandRightSafe, `offset = ${data.island.rightOffset.toFixed(2)}px`);
      report(`[${vp.name}] .pm-island computed translate === 'none'`, islandTranslateClean, `translate: '${data.island.translate}'`);

      // Assertions for Home Indicator
      const homeCentered = Math.abs(data.home.delta) < 0.5;
      const homeRightSafe = data.home.rightOffset > 5.0;
      const homeTranslateClean = data.home.translate === "none" || !data.home.translate;

      report(`[${vp.name}] .pm-home-indicator centered (|Δ| < 0.5px)`, homeCentered, `Δ = ${data.home.delta.toFixed(3)}px`);
      report(`[${vp.name}] .pm-home-indicator right edge offset > 5px`, homeRightSafe, `offset = ${data.home.rightOffset.toFixed(2)}px`);
      report(`[${vp.name}] .pm-home-indicator computed translate === 'none'`, homeTranslateClean, `translate: '${data.home.translate}'`);

      // Document scrollbars
      report(`[${vp.name}] Document horizontal scrollbar absent`, !data.hasHScroll);
      report(`[${vp.name}] Document vertical scrollbar absent`, !data.hasVScroll);

      // Mobile clearance assertion
      if (vp.w <= 640 && data.homeBtnRect && data.devRect) {
        const clearance = data.devRect.top - data.homeBtnRect.bottom;
        report(`[${vp.name}] Mobile Home button top clearance > 0`, clearance >= 0, `clearance = ${clearance.toFixed(2)}px`);
      }
    }

    console.log("\n--- Section 2: Dynamic Toast Variations & Content Length Stress Test ---");
    // Use desktop viewport for toast tests
    await sendCommand("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    for (const tv of TOAST_VARIATIONS) {
      const toastEval = await sendCommand("Runtime.evaluate", {
        expression: `(() => {
          const screen = document.querySelector(".pm-screen");
          const sRect = screen.getBoundingClientRect();
          const screenCenter = sRect.left + sRect.width / 2;

          let toast = document.createElement("div");
          toast.className = "pm-toast";
          toast.textContent = ${JSON.stringify(tv.text)};
          screen.appendChild(toast);

          const r = toast.getBoundingClientRect();
          const c = r.left + r.width / 2;
          const style = window.getComputedStyle(toast);

          const res = {
            width: r.width,
            left: r.left,
            right: r.right,
            center: c,
            delta: c - screenCenter,
            rightOffset: Math.abs(r.right - screenCenter),
            translate: style.translate,
            transform: style.transform
          };

          toast.remove();
          return res;
        })()`,
        returnByValue: true
      });

      const tData = toastEval.result.value;
      const tCentered = Math.abs(tData.delta) < 0.5;
      const tRightSafe = tData.rightOffset > 5.0;
      const tTranslateClean = tData.translate === "none" || !tData.translate;

      report(`Toast [${tv.label}] centered (|Δ| < 0.5px)`, tCentered, `width=${tData.width.toFixed(1)}px, Δ=${tData.delta.toFixed(3)}px`);
      report(`Toast [${tv.label}] right edge offset > 5px`, tRightSafe, `right offset=${tData.rightOffset.toFixed(2)}px`);
      report(`Toast [${tv.label}] computed translate === 'none'`, tTranslateClean, `translate='${tData.translate}'`);
    }

    ws.close();
  } finally {
    chromeProc.kill();
  }

  console.log("\n======================================================================");
  console.log("                     ADVERSARIAL TEST SUMMARY                         ");
  console.log("======================================================================");
  console.log(`Total Checks Executed: ${totalChecks}`);
  console.log(`Checks Passed:         ${passedChecks}`);
  console.log(`Checks Failed:         ${failedChecks}`);

  if (failedChecks === 0) {
    console.log("\n>>> EMPIRICAL VERDICT: APPROVE (Centering robust across all viewports and toast variations)\n");
    process.exit(0);
  } else {
    console.log("\n>>> EMPIRICAL VERDICT: REJECT (Failure detected in adversarial tests)\n");
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Adversarial runner exception:", err);
  process.exit(1);
});
