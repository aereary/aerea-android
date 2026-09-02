import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const generalLibraryDirectory = path.join(projectRoot, "app", "general-library");
const routeEntry = path.join(projectRoot, "app", "general-library", "page.tsx");
const moduleExtensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs"];

async function resolveRelativeModule(importer, specifier) {
  const unresolved = path.resolve(path.dirname(importer), specifier);
  for (const extension of moduleExtensions) {
    const candidate = `${unresolved}${extension}`;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep looking for the matching source module.
    }
  }
  return null;
}

async function collectRelativeModuleGraph(entry) {
  const pending = [entry];
  const sources = new Map();

  while (pending.length > 0) {
    const filename = pending.pop();
    if (!filename || sources.has(filename)) continue;
    const source = await readFile(filename, "utf8");
    sources.set(filename, source);

    const specifiers = [
      ...source.matchAll(/\bfrom\s+["']([^"']+)["']/g),
      ...source.matchAll(/\bimport\s+["']([^"']+)["']/g),
    ].map((match) => match[1]);

    for (const specifier of specifiers) {
      if (!specifier.startsWith(".") || specifier.endsWith(".css")) continue;
      const resolved = await resolveRelativeModule(filename, specifier);
      if (resolved) pending.push(resolved);
    }
  }

  return sources;
}

async function collectGeneralLibrarySources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = new Map();

  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nestedSources = await collectGeneralLibrarySources(filename);
      for (const [nestedFilename, source] of nestedSources) {
        sources.set(nestedFilename, source);
      }
      continue;
    }
    if (/\.(?:[cm]?[jt]sx?|css)$/.test(entry.name)) {
      sources.set(filename, await readFile(filename, "utf8"));
    }
  }

  return sources;
}

const routeSource = await readFile(routeEntry, "utf8");
const routeGraph = await collectRelativeModuleGraph(routeEntry);
const generalLibrarySources = await collectGeneralLibrarySources(
  generalLibraryDirectory,
);
const generalLibrarySource = [...generalLibrarySources.values()].join("\n");

test("General Library reads only its dedicated Supabase tables", () => {
  assert.match(routeSource, /supabase\s*\.from\("library_items"\)/);
  assert.match(routeSource, /supabase\s*\.from\("library_item_versions"\)/);
  assert.match(routeSource, /GENERAL_LIBRARY_BUCKET\s*=\s*"aerea-drive-library"/);
  assert.match(routeSource, /\.download\(item\.storagePath\)/);
  assert.match(routeSource, /auth\.getUser\(\)/);
  assert.equal(
    [...routeSource.matchAll(/\.eq\("owner_user_id",\s*user\.id\)/g)].length,
    2,
    "Both General Library queries must be scoped to the authenticated user",
  );

  const selectedTables = [
    ...generalLibrarySource.matchAll(/supabase\s*\.from\("([^"]+)"\)/g),
  ].map((match) => match[1]);
  assert.deepEqual(
    [...new Set(selectedTables)].sort(),
    ["library_item_versions", "library_items"],
  );

  for (const writeMethod of ["insert", "update", "upsert", "delete"]) {
    assert.doesNotMatch(
      generalLibrarySource,
      new RegExp(`\\.${writeMethod}\\s*\\(`),
      `General Library must not call ${writeMethod}()`,
    );
  }
  assert.doesNotMatch(
    generalLibrarySource,
    /\.storage\s*\.from\([^)]*\)\s*\.remove\s*\(/s,
  );
  assert.doesNotMatch(
    generalLibrarySource,
    /\.storage\s*\.from\([^)]*\)\s*\.upload\s*\(/s,
  );
  assert.doesNotMatch(generalLibrarySource, /service[_-]?role/i);
});

test("General Library has no direct or transitive AO3 dependency", () => {
  const forbiddenTables = [
    "ao3_works",
    "ao3_epub_versions",
    "ao3_epub_snapshots",
    "ao3_work_sync_state",
  ];

  for (const [filename, source] of generalLibrarySources) {
    assert.doesNotMatch(
      source,
      /(?:from|import\()\s*["'][^"']*ao3-library/i,
      `${path.relative(projectRoot, filename)} must not import app/ao3-library.tsx`,
    );
    for (const table of forbiddenTables) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${table}\\b`),
        `${path.relative(projectRoot, filename)} must not reference ${table}`,
      );
    }
  }

  for (const [filename, source] of routeGraph) {
    const normalizedFilename = filename.replaceAll("\\", "/");
    assert.doesNotMatch(
      normalizedFilename,
      /\/app\/ao3-library\.tsx$/,
      "General Library must not import app/ao3-library.tsx",
    );
    for (const table of forbiddenTables) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${table}\\b`),
        `${path.relative(projectRoot, filename)} must not reference ${table}`,
      );
    }
  }
});

test("General Library remains separate from the main app route", () => {
  assert.doesNotMatch(routeSource, /(?:from|import\s+)["']\.\.\/page["']/);
  assert.doesNotMatch(routeSource, /(?:from|import\s+)["']\.\.\/ao3-library["']/);
});
