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
  const cdpPort = 9446;
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
  await sleep(600);

  // Login as parent
  await cdp.evaluate(`(() => {
    const pBtn = document.querySelector(".pm-seg-btn[data-role='parent']");
    if (pBtn) pBtn.click();
    const form = document.querySelector(".pm-login-form");
    if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  })()`);

  await sleep(900);

  // Navigate to Alerts
  await cdp.evaluate(`(() => {
    const tab = document.querySelector(".pm-tab[data-tab='alerts']");
    if (tab) tab.click();
  })()`);
  await sleep(200);

  // Test clicking the toggle switch
  const toggleTest = await cdp.evaluate(`(() => {
    const sw = document.querySelector(".pm-switch input[data-child='1']");
    const wasChecked = sw.checked;
    sw.click();
    const nowChecked = sw.checked;
    const toastEl = document.querySelector(".pm-toast");
    return {
      wasChecked,
      nowChecked,
      toastMsg: toastEl ? toastEl.textContent : null
    };
  })()`);
  console.log("Toggle click test:", toggleTest);

  // Test clicking on label / slider
  const labelClickTest = await cdp.evaluate(`(() => {
    const label = document.querySelector(".pm-switch[aria-label*='Chanreaksa']");
    const input = label.querySelector("input");
    const beforeVal = input.checked;
    label.click();
    const afterVal = input.checked;
    const toastEl = document.querySelector(".pm-toast");
    return {
      beforeVal,
      afterVal,
      toastMsg: toastEl ? toastEl.textContent : null
    };
  })()`);
  console.log("Label click test:", labelClickTest);

  chromeProc.kill("SIGTERM");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
