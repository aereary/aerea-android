// Isolated Android bridge simulation. No accounts, live release downloads or installs.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.AEREA_QA_NODE_MODULES
  ? path.join(process.env.AEREA_QA_NODE_MODULES, "playwright") : "playwright");
const root = fileURLToPath(new URL("../native-shell", import.meta.url));
const output = process.env.AEREA_QA_OUTPUT || fileURLToPath(new URL("../outputs/update-qa", import.meta.url));
fs.mkdirSync(output, { recursive: true });
const launchBrowser = () => chromium.launch({ executablePath: process.env.AEREA_QA_BROWSER || undefined,
  headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
let browser;
const results = [];
try {
  for (const theme of ["otter", "samsungminimal", "samsungao3"]) for (const mode of ["light", "dark"]) for (const width of [393, 800]) {
    browser = await launchBrowser();
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 852 : 1100 }, serviceWorkers: "block" });
    await context.addInitScript(({ theme, mode }) => {
      const release = { tag: "aerea-v0.113", version: "0.113", versionCode: 260827113, size: 10443470 };
      const state = { appTheme: theme, colorMode: mode, postIts: [{ id: 123, text: "Keep my note", color: "pink", x: 80, y: 100, page: "today" }] };
      window.updateFixture = { calls: [], latest: true, offline: false, ready: false, permissionDenied: false, cancelled: false,
        saved: state, checkTimes: [] };
      const listeners = new Map();
      window.androidBridge = {};
      const header = (name, methods) => ({ name, methods: methods.map(name => ({ name, rtype: "promise" })) });
      const updates = header("AereaUpdates", ["getStatus", "check", "download", "cancelDownload", "install", "removeListener"]);
      updates.methods.push({ name: "addListener", rtype: "callback" });
      window.Capacitor = {
        PluginHeaders: [updates, header("AereaStorage", ["getState", "putState", "listSketches", "listDocuments", "finishLaunch"]),
          header("AereaWidget", ["update"]), header("AereaAuth", ["consumePendingLink"]),
          header("AereaEventNotifications", ["schedule", "status"]), header("AereaSportsNotifications", ["schedule", "status"]),
          header("SystemBars", ["setStyle"]), header("AereaNavigation", ["exitApp", "showExitHint"])],
        nativeCallback(plugin, method, options, callback) {
          if (plugin === "AereaUpdates" && method === "addListener") listeners.set(options.eventName, callback);
          return Promise.resolve("qa-listener");
        },
        async nativePromise(plugin, method, options) {
          const f = window.updateFixture;
          f.calls.push(`${plugin}.${method}`);
          if (plugin === "AereaStorage") {
            if (method === "getState") return { state: JSON.stringify({ state: f.saved }) };
            if (method === "putState") f.saved = JSON.parse(options.state).state;
            if (method === "listSketches") return { pages: [] };
            if (method === "listDocuments") return { files: [] };
            return {};
          }
          if (plugin === "AereaUpdates") {
            const status = () => ({ installedVersion: "0.112", installedCode: 260827112, available: f.latest ? release : null, ready: f.ready });
            if (method === "getStatus") return status();
            if (method === "check") {
              f.checkTimes.push(performance.now());
              if (f.offline) throw new Error("Offline");
              return status();
            }
            if (method === "cancelDownload") { f.cancelled = true; return {}; }
            if (method === "download") {
              f.cancelled = false;
              for (const percent of [10, 50, 100]) {
                await new Promise(resolve => setTimeout(resolve, 200));
                if (f.cancelled) throw new Error("Download cancelled.");
                listeners.get("downloadProgress")?.({ percent });
              }
              f.ready = true;
              return status();
            }
            if (method === "install") {
              if (f.permissionDenied) throw new Error("Allow updates from aérea to install this version.");
              return {};
            }
          }
          return {};
        },
      };
    }, { theme, mode });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "qa.local") return route.abort();
      const file = path.join(root, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: "Not found" });
      return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".html") ? "text/html" : "application/octet-stream" });
    });
    await page.goto("https://qa.local/");
    await page.getByRole("button", { name: "Habits", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "A new version of aérea is here" });
    await dialog.waitFor();
    const delay = await page.evaluate(() => window.updateFixture.checkTimes[0]);
    assert.ok(delay >= 2500, "check waits until after first usable frame");
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y >= 0);
    assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false);
    // Text/background must remain readable across all tested themes/modes.
    const contrast = await dialog.evaluate(el => {
      const lum = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255)
        .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
        .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const s = getComputedStyle(el); const a = lum(s.color); const b = lum(s.backgroundColor);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    });
    assert.ok(contrast >= 4.5, `${theme}/${mode} contrast ${contrast}`);
    await page.screenshot({ path: path.join(output, `${theme}-${mode}-${width}.png`) });
    await page.evaluate(() => window.dispatchEvent(new Event("aereaAndroidBack")));
    await dialog.waitFor({ state: "detached" });
    assert.ok(await page.locator(".habits-list").count() || await page.getByRole("button", { name: "Open daily health routine" }).isVisible());
    assert.equal(await page.evaluate(() => window.updateFixture.calls.includes("AereaNavigation.exitApp")), false);
    await page.getByRole("button", { name: "Open appearance settings", exact: true }).click();
    await page.getByRole("button", { name: "Check for updates", exact: true }).click();
    await dialog.waitFor();
    await page.getByRole("button", { name: "Download & install", exact: true }).click();
    await page.getByRole("button", { name: "Cancel download", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    await page.waitForFunction(() => window.updateFixture.cancelled);
    await page.getByRole("button", { name: "Check for updates", exact: true }).click();
    await dialog.waitFor();
    await page.getByRole("button", { name: "Download & install", exact: true }).click();
    await page.waitForFunction(() => window.updateFixture.calls.includes("AereaUpdates.install"));
    await page.getByRole("button", { name: "Install update", exact: true }).waitFor();
    await page.evaluate(() => window.updateFixture.permissionDenied = true);
    await page.getByRole("button", { name: "Install update", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.match(await page.getByRole("alert").innerText(), /Allow updates/);
    await page.getByRole("button", { name: "Later", exact: true }).click();
    assert.equal(await page.getByRole("dialog", { name: "Appearance settings" }).count(), 1, "underlying settings stay open");
    await page.evaluate(() => { window.updateFixture.latest = false; window.updateFixture.ready = false; });
    await page.getByRole("button", { name: "Check for updates", exact: true }).click();
    await page.getByText("You have the latest version.", { exact: true }).waitFor();
    assert.equal(await dialog.count(), 0, "never prompts to reinstall current version");
    await page.evaluate(() => window.updateFixture.offline = true);
    await page.getByRole("button", { name: "Check for updates", exact: true }).click();
    await page.getByText("Could not check for updates. Try again when you are online.", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.updateFixture.saved.postIts[0].text), "Keep my note");
    assert.deepEqual(errors, []);
    results.push({ theme, mode, width, contrast, delayedCheckMs: Math.round(delay), checks: "Back, cancel, retry, permission error, same version, offline, saved note" });
    await context.close();
    await browser.close();
  }
  // A normal web build must not expose Android installation controls.
  browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/*", route => {
    const url = new URL(route.request().url()); if (url.hostname !== "qa.local") return route.abort();
    const file = path.join(root, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "Not found" });
    return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html" });
  });
  await page.goto("https://qa.local/");
  await page.getByRole("button", { name: "Open appearance settings", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Check for updates" }).count(), 0);
  await context.close();
  fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  console.log(`${results.length} phone/tablet/theme update flows passed; web controls hidden.`);
} finally { if (browser?.isConnected()) await browser.close(); }
