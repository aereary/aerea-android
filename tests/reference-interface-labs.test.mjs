import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/styles/interface-labs.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");
const marker = "AEREA_REFERENCE_INTERFACE_LABS_20260929";
const blockStart = css.indexOf(marker);
const labCss = css.slice(blockStart);

const systems = [
  ["violetcosmos", "Violet Cosmos", "cosmos"],
  ["berryagenda", "Berry Agenda", "berry"],
  ["auroraglass", "Aurora Glass", "aurora"],
  ["blossomportal", "Blossom Portal", "bloom"],
  ["pastelatlas", "Pastel Atlas", "atlas"],
  ["ribbondesk", "Ribbon Desk", "ribbon"],
  ["glowplanner", "Glow Planner", "glow"],
];

test("offers seven opt-in reference-led interface systems", () => {
  for (const [id, name, lab] of systems) {
    assert.match(page, new RegExp("\\| \"" + id + "\""));
    assert.match(
      page,
      new RegExp(
        "id: \"" + id + "\",[\\s\\S]{0,180}name: \"" + name +
          "\"[\\s\\S]{0,700}interfaceLab: \"" + lab + "\"",
      ),
    );
    assert.match(nativeHtml, new RegExp("\"" + id + "\""));
  }
});

test("gives every system its own interface language without changing behavior", () => {
  assert.match(page, /const interfaceLabByTheme/);
  assert.match(page, /const interfaceLabCopy/);
  assert.match(page, /cosmos:[\s\S]*Violet Cosmos[\s\S]*quiet sky/);
  assert.match(page, /berry:[\s\S]*Berry Agenda[\s\S]*bold little overview/);
  assert.match(page, /aurora:[\s\S]*Aurora Glass[\s\S]*Light, time and plans/);
  assert.match(page, /bloom:[\s\S]*Blossom Portal[\s\S]*little garden/);
  assert.match(page, /atlas:[\s\S]*Pastel Atlas[\s\S]*calm route/);
  assert.match(page, /ribbon:[\s\S]*Ribbon Desk[\s\S]*precise desk/);
  assert.match(page, /glow:[\s\S]*Glow Planner[\s\S]*small win/);
  assert.match(page, /data-interface-lab=\{activeInterfaceLab \?\? "classic"\}/);
  assert.match(page, /activeInterfaceCopy\?\.nav\[tab\.id\] \?\? tab\.label/);
  assert.match(page, /if \(tab\.id === "add"\)[\s\S]{0,100}setQuickCaptureOpen\(true\)/);
  assert.match(page, /changeTab\(tab\.id\)/);
});

test("keeps all experimental CSS isolated from established themes", () => {
  assert.ok(blockStart >= 0, "reference interface CSS marker is present");
  assert.match(layout, /import "\.\/styles\/interface-labs\.css"/);
  assert.match(nativeEntry, /import "\.\/styles\/interface-labs\.css"/);
  for (const [, , lab] of systems) {
    assert.match(labCss, new RegExp("data-interface-lab=\"" + lab + "\""));
  }
  assert.doesNotMatch(labCss, /data-theme="storybook"/);
  assert.doesNotMatch(labCss, /data-theme="otter"/);
  assert.doesNotMatch(labCss, /data-theme="littlesheets"/);
  assert.doesNotMatch(labCss, /data-interface-lab="classic"[^\n]*\{/);
});

test("uses seven materially distinct compositions instead of recolors", () => {
  assert.match(labCss, /data-interface-lab="cosmos"\] \.lab-hero-shape-one[\s\S]{0,220}border-radius: 50%/);
  assert.match(labCss, /data-interface-lab="berry"\] \.week-strip[\s\S]{0,260}margin: -46px/);
  assert.match(labCss, /data-interface-lab="aurora"\] \.topbar[\s\S]{0,620}backdrop-filter: blur\(24px\)/);
  assert.match(labCss, /data-interface-lab="bloom"\] \.schedule-card::after/);
  assert.match(labCss, /data-interface-lab="atlas"\] \.welcome-row[\s\S]{0,400}min-height: 340px/);
  assert.match(labCss, /data-interface-lab="ribbon"\] \.schedule-card::before/);
  assert.match(labCss, /data-interface-lab="glow"\] \.reminder-row:nth-child/);
  assert.match(labCss, /@media \(min-width: 780px\)[\s\S]*data-interface-lab="bloom"/);
});

test("keeps motion light, optional and bottom-sheet based", () => {
  assert.match(labCss, /@keyframes lab-enter[\s\S]*translateY\(18px\)/);
  assert.match(labCss, /@keyframes lab-sheet-in[\s\S]*translateY\(32px\)/);
  assert.match(labCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(labCss, /button \{\s*min-height: 44px/);
  assert.match(page, /className="interface-lab-atmosphere"/);
  assert.match(page, /className="lab-hero-art"/);
});

test("uses actual user data and keeps the experimental selector previews", () => {
  assert.match(page, /theme\.interfaceLab \? \(/);
  assert.match(page, /className="interface-lab-preview"/);
  assert.match(page, /data-interface-preview=\{theme\.interfaceLab\}/);
  assert.doesNotMatch(page, /starterEvents|sampleEvents|demoEvents/);
});
