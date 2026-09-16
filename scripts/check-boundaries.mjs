import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const safeFiles = [
  "app/config/app-config.ts",
  "app/styles/manual-customization.css",
];

const forbiddenPatterns = [
  { pattern: /from\s+["'][^"']*supabase-sync["']/, label: "Supabase import" },
  { pattern: /from\s+["'][^"']*ao3-library["']/, label: "AO3 import" },
  { pattern: /from\s+["'][^"']*chatgpt-auth["']/, label: "authentication import" },
  { pattern: /registerPlugin\s*</, label: "native plugin registration" },
  { pattern: /\b(?:localStorage|sessionStorage)\b/, label: "browser storage" },
  { pattern: /\bfetch\s*\(/, label: "network request" },
  { pattern: /\b(?:process|Deno)\.env\b/, label: "environment access" },
];

const violations = [];

for (const relativePath of safeFiles) {
  const source = readFileSync(resolve(repositoryRoot, relativePath), "utf8");
  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(source)) violations.push(`${relativePath}: ${label}`);
  }
}

const globalStyles = readFileSync(
  resolve(repositoryRoot, "app/globals.css"),
  "utf8",
);
if (!globalStyles.includes('@import "./styles/manual-customization.css";')) {
  violations.push(
    "app/globals.css: safe manual customization tokens are not imported",
  );
}

if (violations.length > 0) {
  console.error("Architecture boundary check failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("Architecture boundaries are intact.");
}
