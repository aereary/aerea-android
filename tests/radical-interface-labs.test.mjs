import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/styles/interface-labs.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");
const marker = "AEREA_RADICAL_INTERFACE_LABS_20260929";
const blockStart = css.indexOf(marker);
const labCss = css.slice(blockStart);

test("offers three opt-in interface labs instead of three classic recolors", () => {
  for (const [id, name, lab] of [
    ["blueprintrelay", "Blueprint Relay", "blueprint"],
    ["sundaypress", "Sunday Press", "press"],
    ["popcircuit", "Pop Circuit", "circuit"],
  ]) {
    assert.match(page, new RegExp(`\\| "${id}"`));
    assert.match(
      page,
      new RegExp(
        `id: "${id}",[\\s\\S]{0,180}name: "${name}"[\\s\\S]{0,700}interfaceLab: "${lab}"`,
      ),
    );
    assert.match(nativeHtml, new RegExp(`"${id}"`));
  }
});

test("switches real interface language and navigation without changing tab behavior", () => {
  assert.match(page, /const interfaceLabByTheme/);
  assert.match(page, /const interfaceLabCopy/);
  assert.match(page, /blueprint:[\s\S]*DAY RELAY 01[\s\S]*ACTIVE QUEUE/);
  assert.match(page, /press:[\s\S]*SUNDAY PRESS[\s\S]*TODAY'S LEDGER/);
  assert.match(page, /circuit:[\s\S]*POP CIRCUIT![\s\S]*WHAT'S ON/);
  assert.match(page, /data-interface-lab=\{activeInterfaceLab \?\? "classic"\}/);
  assert.match(page, /activeInterfaceCopy\?\.nav\[tab\.id\] \?\? tab\.label/);
  assert.match(page, /if \(tab\.id === "add"\)[\s\S]{0,100}setQuickCaptureOpen\(true\)/);
  assert.match(page, /changeTab\(tab\.id\)/);
});

test("keeps the radical CSS isolated from every established theme", () => {
  assert.ok(blockStart >= 0, "radical interface CSS marker is present");
  assert.match(layout, /import "\.\/styles\/interface-labs\.css"/);
  assert.match(nativeEntry, /import "\.\/styles\/interface-labs\.css"/);
  assert.match(labCss, /data-interface-lab="blueprint"/);
  assert.match(labCss, /data-interface-lab="press"/);
  assert.match(labCss, /data-interface-lab="circuit"/);
  assert.match(labCss, /data-interface-lab="blueprint"[\s\S]*--cream:#07131f/);
  assert.match(labCss, /data-interface-lab="press"[\s\S]*--cream:#f1ead9/);
  assert.match(labCss, /data-interface-lab="circuit"[\s\S]*--cream:#ece9ff/);
  assert.doesNotMatch(labCss, /data-theme="storybook"/);
  assert.doesNotMatch(labCss, /data-theme="otter"/);
  assert.doesNotMatch(labCss, /data-theme="littlesheets"/);
  assert.doesNotMatch(labCss, /data-interface-lab="classic"[^\n]*\{/);
});

test("gives every lab a different composition and motion model", () => {
  assert.match(
    labCss,
    /data-interface-lab="blueprint"[\s\S]*\.bottom-nav[\s\S]*flex-direction:column!important/,
  );
  assert.match(labCss, /@keyframes blueprint-panel-in[\s\S]*translateX\(100%\)/);
  assert.match(
    labCss,
    /data-interface-lab="press"[\s\S]*\.day-grid[\s\S]*grid-template-columns:minmax\(0,1\.25fr\) minmax\(270px,\.75fr\)/,
  );
  assert.match(labCss, /@keyframes press-page-in[\s\S]*rotateX\(5deg\)/);
  assert.match(
    labCss,
    /data-interface-lab="circuit"[\s\S]*\.welcome-row[\s\S]*box-shadow:8px 8px 0 var\(--lab-ink\)/,
  );
  assert.match(labCss, /@keyframes circuit-pop-in[\s\S]*scale\(\.72\) rotate\(-5deg\)/);
});

test("uses geometric previews and never injects demo content", () => {
  assert.match(page, /theme\.interfaceLab \? \(/);
  assert.match(page, /className="interface-lab-preview"/);
  assert.match(page, /data-interface-preview=\{theme\.interfaceLab\}/);
  assert.match(page, /className="settings-lab-mark"/);
  assert.doesNotMatch(page, /Blueprint demo|Sunday Press demo|Pop Circuit demo/);
  assert.doesNotMatch(page, /starterEvents|sampleEvents|demoEvents/);
});
