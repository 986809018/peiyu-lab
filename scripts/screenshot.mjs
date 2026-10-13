#!/usr/bin/env node
/**
 * Minimal screenshot helper: drives headless Chrome over the DevTools Protocol
 * using the --remote-debugging-pipe transport (no WebSocket layer).
 *
 *   node .review/shot.mjs <url> <out.png> <width> [--click=SELECTOR]...
 *                          [--eval=JS] [--settle=MS]
 *
 * Renders the full page (captureBeyondViewport) so layout regressions anywhere
 * on the page are visible in one image, and prints a small DOM report.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const [url, out, widthArg, ...flags] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: shot.mjs <url> <out.png> <width> [flags]");
  process.exit(2);
}
const width = Number(widthArg || 1440);
const opt = (name, fallback) => {
  const hit = flags.find((f) => f.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const clicks = flags.filter((f) => f.startsWith("--click=")).map((f) => f.slice(8));
const evalJs = opt("eval", "");
const settle = Number(opt("settle", 400));

// Chrome must run with a writable HOME and without its own sandbox: the harness
// file sandbox denies the Crashpad/keychain paths under the real HOME.
const home = mkdtempSync(join(tmpdir(), "chrome-home-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--remote-debugging-pipe",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-breakpad",
    "--disable-crash-reporter",
    `--user-data-dir=${join(home, "profile")}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${width},1000`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"], env: { ...process.env, HOME: home } },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toChrome = chrome.stdio[3];
const fromChrome = chrome.stdio[4];

let buffer = Buffer.alloc(0);
const pending = new Map();
const eventWaiters = [];

fromChrome.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  let sep;
  while ((sep = buffer.indexOf(0)) !== -1) {
    const raw = buffer.subarray(0, sep).toString("utf8");
    buffer = buffer.subarray(sep + 1);
    if (!raw.trim()) continue;
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.method || "cdp"}: ${msg.error.message}`)) : resolve(msg.result);
    } else if (msg.method) {
      for (let i = eventWaiters.length - 1; i >= 0; i--) {
        if (eventWaiters[i].method === msg.method) {
          eventWaiters.splice(i, 1)[0].resolve(msg.params);
        }
      }
    }
  }
});

let seq = 0;
function send(method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    toChrome.write(JSON.stringify({ id, method, params, sessionId }) + "\0");
    setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`${method}: timed out`));
    }, 20000);
  });
}
function once(method) {
  return new Promise((resolve) => eventWaiters.push({ method, resolve }));
}

try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width < 600,
  }, sessionId);

  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url }, sessionId);
  await Promise.race([loaded, sleep(9000)]);
  await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true }, sessionId);
  await sleep(settle);

  for (const selector of clicks) {
    const res = await send("Runtime.evaluate", {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(
        selector,
      )}); if (!el) return "missing"; el.click(); return "clicked"; })()`,
      returnByValue: true,
    }, sessionId);
    if (res.result.value !== "clicked") throw new Error(`click target not found: ${selector}`);
    await sleep(settle);
  }

  if (evalJs) {
    await send("Runtime.evaluate", { expression: evalJs, awaitPromise: true }, sessionId);
    await sleep(settle);
  }

  const metrics = await send("Page.getLayoutMetrics", {}, sessionId);
  const { width: cw, height: ch } = metrics.cssContentSize;
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: cw, height: ch, scale: 1 },
  }, sessionId);

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, "base64"));

  const report = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      lang: document.documentElement.lang,
      title: document.title,
      height: Math.round(${ch}),
      cards: document.querySelectorAll(".project-card").length,
      expanded: document.querySelectorAll(".project-card.is-expanded").length,
      details: document.querySelectorAll(".project-detail").length,
      detailLabels: [...document.querySelectorAll(".detail-label")].map((el) => el.textContent),
      overflowX: document.documentElement.scrollWidth > ${width} + 1,
      smallestFont: Math.min(...[...document.querySelectorAll("*")]
        .filter(el => el.textContent.trim() && el.children.length === 0)
        .map(el => parseFloat(getComputedStyle(el).fontSize)))
    })`,
    returnByValue: true,
  }, sessionId);
  console.log(`${out}  ${report.result.value}`);
} finally {
  chrome.kill("SIGKILL");
}
