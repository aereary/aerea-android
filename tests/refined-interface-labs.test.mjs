import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/styles/interface-labs.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");
const marker = "AEREA_REFINED_INTERFACE_LABS_20260929";
const blockStart = css.indexOf(marker);
const labCss = css.slice(blockStart);

test("offers three opt-in interface systems instead of classic recolors", () => {
  for (const [id, name, lab] of [
    ["quietglass", "Quiet Glass", "glass"],
    ["softreach", "Soft Reach", "reach"],
    ["dayline", "Dayline", "dayline"],
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

test("switches interface language without changing navigation behavior", () => {
  assert.match(page, /const interfaceLabByTheme/);
  assert.match(page, /const interfaceLabCopy/);
  assert.match(page, /glass:[\s\S]*Quiet Glass[\s\S]*Your plans, with room to breathe/);
  assert.match(page, /reach:[\s\S]*My day[\s\S]*Everything important is close at hand/);
  assert.match(page, /dayline:[\s\S]*Dayline[\s\S]*Following the selected day/);
  assert.match(page, /data-interface-lab=\{activeInterfaceLab \?\? "classic"\}/);
  assert.match(page, /activeInterfaceCopy\?\.nav\[tab\.id\] \?\? tab\.label/);
  assert.match(page, /if \(tab\.id === "add"\)[\s\S]{0,100}setQuickCaptureOpen\(true\)/);
  assert.match(page, /changeTab\(tab\.id\)/);
});

test("keeps the new CSS isolated from every established theme", () => {
  assert.ok(blockStart >= 0, "refined interface CSS marker is present");
  assert.match(layout, /import "\.\/styles\/interface-labs\.css"/);
  assert.match(nativeEntry, /import "\.\/styles\/interface-labs\.css"/);
  assert.match(labCss, /data-interface-lab="glass"/);
  assert.match(labCss, /data-interface-lab="reach"/);
  assert.match(labCss, /data-interface-lab="dayline"/);
  assert.doesNotMatch(labCss, /data-theme="storybook"/);
  assert.doesNotMatch(labCss, /data-theme="otter"/);
  assert.doesNotMatch(labCss, /data-theme="littlesheets"/);
  assert.doesNotMatch(labCss, /data-interface-lab="classic"[^\n]*\{/);
});

test("gives each system a distinct mobile composition", () => {
  assert.match(labCss, /data-interface-lab="glass"[^}]*--lab-canvas:radial-gradient/);
  assert.match(labCss, /data-interface-lab="glass"[^}]*\.topbar|data-interface-lab="glass"\] \.topbar/);
  assert.match(labCss, /data-interface-lab="reach"[^}]*--lab-canvas:linear-gradient/);
  assert.match(labCss, /data-interface-lab="reach"\] \.topbar\{[^}]*min-height:132px/);
  assert.match(labCss, /data-interface-lab="dayline"\] \.schedule-card\{[^}]*border-left:2px solid/);
  assert.match(labCss, /@keyframes lab-sheet-in[\s\S]*translateY\(28px\)/);
});

test("uses platform-sized controls, calm palettes and no demo content", () => {
  assert.match(labCss, /button\{min-height:44px/);
  assert.match(page, /theme\.interfaceLab \? \(/);
  assert.match(page, /className="interface-lab-preview"/);
  assert.match(page, /data-interface-preview=\{theme\.interfaceLab\}/);
  assert.doesNotMatch(page, /starterEvents|sampleEvents|demoEvents/);
});
