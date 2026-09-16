import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const study = readFileSync("app/study-library.tsx", "utf8");

test("Library selection mode turns file taps into selection toggles instead of opening", () => {
  assert.match(
    study,
    /const openFile = \(file: StudyFileItem\) => \{[\s\S]{0,220}if \(selectedFileIds\.length > 0\)[\s\S]{0,180}toggleFileSelection\(file\.id\)[\s\S]{0,100}return;/,
  );
});

test("only one file action menu can stay open", () => {
  assert.match(study, /openFileActionId/);
  assert.match(
    study,
    /<details[\s\S]{0,180}open=\{openFileActionId === file\.id\}[\s\S]{0,280}setOpenFileActionId/,
  );
});

test("Select and Unselect close the three-dot menu immediately", () => {
  assert.match(
    study,
    /toggleFileSelection\(file\.id\);[\s\S]{0,80}setOpenFileActionId\(null\);[\s\S]{0,180}\{selectedFileIds\.includes\(file\.id\) \? "Unselect" : "Select"\}/,
  );
});

test("Done exits selection mode and closes open menus", () => {
  assert.match(
    study,
    /const finishFileSelection = \(\) => \{[\s\S]{0,120}setSelectedFileIds\(\[\]\);[\s\S]{0,80}setOpenFileActionId\(null\);/,
  );
  assert.match(study, /onClick=\{finishFileSelection\}>Done/);
});

test("long press toggles selection without opening a file", () => {
  assert.match(
    study,
    /onContextMenu=\{\(event\) => \{[\s\S]{0,180}toggleFileSelection\(file\.id\);[\s\S]{0,80}setOpenFileActionId\(null\);/,
  );
});

test("favorite and trash actions close their file menu", () => {
  assert.match(
    study,
    /toggleFavorite\(file\);[\s\S]{0,80}setOpenFileActionId\(null\);/,
  );
  assert.match(
    study,
    /setOpenFileActionId\(null\);[\s\S]{0,80}onDeleteFile\(file\);/,
  );
});
