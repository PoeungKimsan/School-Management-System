const http = require("http");
const { spawn } = require("child_process");

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
      throw new Error("Evaluation error: " + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function findChrome() {
  const paths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  ];
  const fs = require("fs");
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome not found");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const chromePath = await findChrome();
  const cdpPort = 9445;
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank"
  ]);

  await sleep(600);

  const list = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${cdpPort}/json`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const page = list.find((p) => p.type === "page");
  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  await cdp.send("Page.navigate", { url: "http://localhost:3000/phone-mockup/" });
  await sleep(800);

  const pageState0 = await cdp.evaluate(`(() => {
    return {
      title: document.title,
      appContent: document.getElementById("pmApp")?.innerHTML.substring(0, 100)
    };
  })()`);
  console.log("Initial state:", pageState0);

  // Switch role to parent
  await cdp.evaluate(`(() => {
    const pBtn = document.querySelector(".pm-seg-btn[data-role='parent']");
    if (pBtn) pBtn.click();
  })()`);
  await sleep(200);

  const formStatus = await cdp.evaluate(`(() => {
    const form = document.querySelector(".pm-login-form");
    const u = document.getElementById("pmLoginUsername");
    const p = document.getElementById("pmLoginPassword");
    return {
      hasForm: !!form,
      username: u ? u.value : null,
      password: p ? p.value : null
    };
  })()`);
  console.log("Form status:", formStatus);

  // Submit form
  await cdp.evaluate(`(() => {
    const form = document.querySelector(".pm-login-form");
    if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  })()`);

  await sleep(1000); // login transition is 700ms

  const afterLogin = await cdp.evaluate(`(() => {
    return {
      title: document.querySelector(".pm-title")?.textContent,
      tab: document.querySelector(".pm-tab.active")?.dataset.tab
    };
  })()`);
  console.log("After login:", afterLogin);

  // Wait 1700ms for push banner (timeout is 1500ms)
  await sleep(1700);

  const pushCheck = await cdp.evaluate(`(() => {
    const banner = document.querySelector(".pm-push");
    if (!banner) return { found: false };
    const grabber = banner.querySelector(".pm-push-grabber");
    const content = banner.querySelector(".pm-push-content");
    const cs = window.getComputedStyle(banner);
    const br = banner.getBoundingClientRect();
    const gr = grabber ? grabber.getBoundingClientRect() : null;
    const cr = content ? content.getBoundingClientRect() : null;
    return {
      found: true,
      display: cs.display,
      flexDirection: cs.flexDirection,
      bannerRect: { top: br.top, left: br.left, width: br.width, height: br.height },
      grabberRect: gr ? { top: gr.top, left: gr.left, width: gr.width, height: gr.height } : null,
      contentRect: cr ? { top: cr.top, left: cr.left, width: cr.width, height: cr.height } : null
    };
  })()`);
  console.log("Push check:", pushCheck);

  // Check what happens when render() is triggered while banner is showing
  const reRenderCheck = await cdp.evaluate(`(() => {
    // Check if banner exists now
    const beforeBanner = !!document.querySelector(".pm-push");
    // Click child switcher to open sheet
    const sw = document.querySelector(".pm-child-switcher");
    if (sw) sw.click();
    const afterOpen = !!document.querySelector(".pm-push");
    // Close sheet
    const closeBtn = document.querySelector(".pm-sheet-close");
    if (closeBtn) closeBtn.click();
    const afterClose = !!document.querySelector(".pm-push");
    return {
      beforeBanner,
      afterOpen,
      afterClose
    };
  })()`);
  console.log("Re-render test:", reRenderCheck);

  // Go to alerts tab and inspect switch
  await cdp.evaluate(`(() => {
    const tab = document.querySelector(".pm-tab[data-tab='alerts']");
    if (tab) tab.click();
  })()`);
  await sleep(300);

  const switchDetails = await cdp.evaluate(`(() => {
    const sw = document.querySelector(".pm-switch");
    if (!sw) return { error: "No .pm-switch found" };
    const span = sw.querySelector("span");
    if (!span) return { error: "No span found in .pm-switch" };
    const spanCs = window.getComputedStyle(span);
    const beforeCs = window.getComputedStyle(span, "::before");
    const swCs = window.getComputedStyle(sw);

    // Also check if .pm-switch-slider exists in stylesheet
    let cssRuleFound = false;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes("pm-switch-slider")) {
            cssRuleFound = true;
          }
        }
      } catch (e) {}
    }

    return {
      switchRect: sw.getBoundingClientRect(),
      spanClass: span.className,
      spanRect: span.getBoundingClientRect(),
      spanDisplay: spanCs.display,
      spanPosition: spanCs.position,
      spanBg: spanCs.backgroundColor,
      spanWidth: spanCs.width,
      spanHeight: spanCs.height,
      beforeDisplay: beforeCs.display,
      beforeContent: beforeCs.content,
      cssHasSwitchSliderRule: cssRuleFound
    };
  })()`);
  console.log("Switch details:", switchDetails);

  chromeProc.kill("SIGTERM");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
