// Isolated browser fixtures only. Never connects to the owner's real account.
import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const { chromium } = createRequire(process.env.AEREA_QA_NODE_MODULES + "/package.json")("playwright");
const output = new URL("../outputs/ask-qa/", import.meta.url); fs.mkdirSync(output, { recursive: true });
const account = fs.readFileSync(new URL("../app/supabase-sync.ts", import.meta.url), "utf8").match(/AEREA_ACCOUNT = "([^"]+)"/)[1];
const fixtureWork = { work_id: 9999, title: "QA archive work", author: "QA author", summary: "A post-apocalyptic story.", fandoms: ["Formula 1"], warnings: [], characters: ["Oscar Piastri", "Lando Norris"], relationships: ["Oscar Piastri/Lando Norris"], tags: ["Happy Ending", "Explicit"], words: 70000, rating: "Explicit", chapters: "2/2", complete: true, series: [], updated_on: null, bookmarked_on: null, source_url: "https://archiveofourown.org/works/9999", archived: false, categories: [], bookmarker_tags: [] };
function epubFixture() {
  const entries = { "META-INF/container.xml": '<container><rootfile full-path="book.opf"/></container>', "book.opf": '<package><manifest><item id="chapter" href="chapter.xhtml"/></manifest><spine><itemref idref="chapter"/></spine></package>', "chapter.xhtml": '<html><h1>Chapter One</h1><p>He prepared a nest in the quiet room.</p><script>private fake instruction</script></html>' };
  const local = [], central = []; let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const filename = Buffer.from(name), data = Buffer.from(text), header = Buffer.alloc(30), directory = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    local.push(header, filename, data); central.push(directory, filename); offset += header.length + filename.length + data.length;
  }
  const index = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(entries).length, 10); end.writeUInt32LE(index.length, 12); end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...local, index, end]); return { size: zip.length, dataUrl: "data:application/epub+zip;base64," + zip.toString("base64") };
}
const themeCases = [["samsungao3", "dark", 393, false], ["samsungminimal", "dark", 393, false], ["otter", "light", 393, false], ["storybook", "light", 800, false], ["samsungao3", "dark", 800, true]];
const facts = [];
for (const [theme, mode, width, reduced] of themeCases) {
  const browser = await chromium.launch({ executablePath: process.env.AEREA_QA_BROWSER, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 852 : 1100 }, reducedMotion: reduced ? "reduce" : "no-preference", serviceWorkers: "block" });
  await context.addInitScript(({ theme, mode, account, work, epub }) => {
    const payload = btoa(JSON.stringify({ sub: "qa-user", role: "authenticated", email: account, exp: 2100000000 }));
    const token = btoa('{}') + '.' + payload + '.test';
    localStorage.setItem("sb-wislppgaikbxgibrjizz-auth-token", JSON.stringify({ access_token: token, refresh_token: "qa-only", expires_at: 2100000000, expires_in: 99999999, token_type: "bearer", user: { id: "qa-user", email: account } }));
    const state = { appTheme: theme, colorMode: mode, calendarEvents: [{ id: "qa-exam", title: "Examen de Termodinámica", date: "2026-10-15", time: "17:45", endTime: "19:00", color: "pink", calendar: "Exams" }], studyNotes: [{ id: "qa-note", title: "Primera ley", body: "Termodinámica: conservación de energía", pinned: false, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" }], entries: [{ id: 123, date: "October 9, 2026", mood: "", text: "PRIVATE QA journal content" }] };
    state.studyFiles = [{ id: "qa-epub", name: "QA.epub", kind: "epub", mediaType: "application/epub+zip", size: epub.size, dataUrl: epub.dataUrl, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" }];
    localStorage.setItem("aerea-private-state-v1", JSON.stringify({ state }));
    localStorage.setItem("aerea-ao3-library-cache-v1", JSON.stringify({ works: [work], epubs: [{ work_id: 9999, drive_file_id: "qa_drive_123456789", filename: "QA.epub", label: "Primary", is_primary: true }], savedAt: Date.now() }));
  }, { theme, mode, account, work: fixtureWork, epub: epubFixture() });
  const page = await context.newPage(); const errors = [], networkWrites = [];
  page.on("pageerror", error => errors.push(error.message));
  await context.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === "qa.local") {
      const path = new URL("../native-shell" + (url.pathname === "/" ? "/index.html" : url.pathname), import.meta.url);
      if (!fs.existsSync(path)) return route.fulfill({ status: 404, body: "Not found" });
      return route.fulfill({ status: 200, contentType: url.pathname.endsWith(".js") ? "text/javascript" : url.pathname.endsWith(".css") ? "text/css" : url.pathname.endsWith(".html") || url.pathname === "/" ? "text/html" : "application/octet-stream", body: fs.readFileSync(path) });
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) networkWrites.push({ host: url.hostname, method: request.method(), path: url.pathname });
    return route.abort();
  });
  await page.goto("https://qa.local/");
  await page.waitForSelector(`[data-theme="${theme}"]`); await page.waitForTimeout(700);
  await page.evaluate(() => document.documentElement.dataset.native = "true");
  await page.getByRole("button", { name: "Open Ask aérea", exact: true }).first().click();
  await page.getByRole("dialog", { name: "Ask aérea", exact: true }).waitFor(); await page.waitForTimeout(450);
  const bounds = await page.locator(".ask-panel").evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, width: r.width, viewport: innerWidth, overflow: el.scrollWidth > el.clientWidth + 1, animation: getComputedStyle(el).animationName }; });
  assert.ok(bounds.top >= 0 && !bounds.overflow); assert.ok(bounds.width <= width);
  if (reduced) assert.equal(bounds.animation, "none");
  const search = async query => { await page.locator("#ask-query").fill(query); await page.getByRole("button", { name: "Search", exact: true }).click(); await page.getByRole("button", { name: "Stop", exact: true }).waitFor({ state: "hidden" }); await page.waitForTimeout(100); };
  await search("Busca todo lo relacionado con Termodinámica");
  assert.equal(await page.locator(".ask-exchange").last().locator(".ask-result").count(), 2);
  assert.ok((await page.locator(".ask-transcript").textContent()).includes("Primera ley"));
  assert.ok(!(await page.locator(".ask-transcript").textContent()).includes("PRIVATE QA"));
  await search("Busca mis fanfics de Oscar Piastri y Lando Norris terminados largos");
  assert.equal(await page.locator(".ask-exchange").last().locator(".ask-result").count(), 1);
  assert.ok((await page.locator(".ask-exchange").last().textContent()).includes("QA archive work"));
  await page.screenshot({ path: new URL(`ask-${theme}-${width}${reduced ? "-reduced" : ""}.png`, output).pathname });
  const cache = await page.evaluate(() => JSON.parse(localStorage.getItem("aerea-ao3-library-cache-v1")));
  assert.deepEqual(cache.works, [fixtureWork]);
  await page.locator(".ask-permissions > summary").click();
  await page.getByLabel("Search EPUB text available on this device").check();
  await search("Busca fanfics nido");
  const textResult = page.locator(".ask-exchange").last();
  assert.ok((await textResult.textContent()).includes("Chapter One"));
  assert.ok((await textResult.textContent()).includes("prepared a nest"));
  assert.ok(!(await textResult.textContent()).includes("private fake instruction"));
  await page.getByLabel("Search EPUB text available on this device").uncheck();
  await page.locator(".ask-permissions > summary").click();
  await search('Crea un evento "Repasar Termodinámica" mañana a las 5:45 PM');
  await page.getByRole("button", { name: "Review in Calendar" }).click();
  await page.locator(".ask-backdrop").waitFor({ state: "hidden" });
  await page.locator(".calendar-event-mode").waitFor();
  assert.ok((await page.locator(".calendar-event-mode").textContent()).includes("Save"));
  // Review handoff must not silently create an event.
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("aerea-private-state-v1")).state);
  assert.ok(!state.calendarEvents.some(event => event.title === "Repasar Termodinámica"));
  await page.locator('.calendar-event-mode input[type="time"]').nth(1).fill("18:45");
  await page.locator(".calendar-event-mode .event-save-button").click();
  await page.waitForTimeout(800);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("aerea-private-state-v1")).state.calendarEvents.filter(event => event.title === "Repasar Termodinámica"));
  assert.equal(saved.length, 1); assert.equal(saved[0].time, "17:45");
  await page.evaluate(() => window.dispatchEvent(new Event("aereaAndroidBack")));
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Open Ask aérea", exact: true }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "＋ Quick Capture" }).click();
  await page.locator(".quick-capture-modal").waitFor();
  assert.ok(!networkWrites.some(write => /ao3_|library_items|library_item_versions|storage\//.test(write.path)), JSON.stringify(networkWrites)); assert.deepEqual(errors, []);
  facts.push({ theme, width, reduced, bounds, tests: "retrieval, metadata, private journal opt-out, real EPUB worker, event review/save, original capture, no catalog writes" });
  console.log(`Passed ${theme} · ${width}px · reduced motion ${reduced}`);
  await browser.close();
}
fs.writeFileSync(new URL("report.json", output), JSON.stringify(facts, null, 2));
console.log(`Ask aérea QA passed in ${facts.length} phone/tablet/theme/motion cases.`);
