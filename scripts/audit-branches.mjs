import { execFileSync } from "node:child_process";

const stableRef =
  process.env.AEREA_STABLE_REF ??
  "origin/fix/restore-just-calendar-baseline-20260915";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

try {
  git("rev-parse", "--verify", stableRef);
} catch {
  console.error(`Stable ref not found: ${stableRef}`);
  console.error("Run `git fetch --all --prune` and try again.");
  process.exit(1);
}

const branches = git(
  "for-each-ref",
  "--format=%(refname:short)",
  "refs/remotes/origin",
)
  .split("\n")
  .filter(Boolean)
  .filter((branch) => branch !== "origin/HEAD");

const rows = branches.map((branch) => {
  let merged = true;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", branch, stableRef], {
      stdio: "ignore",
    });
  } catch {
    merged = false;
  }

  const [stableOnly, branchOnly] = git(
    "rev-list",
    "--left-right",
    "--count",
    `${stableRef}...${branch}`,
  ).split(/\s+/);

  return {
    branch: branch.replace(/^origin\//, ""),
    merged,
    stableOnly: Number(stableOnly),
    branchOnly: Number(branchOnly),
  };
});

console.log(`Stable reference: ${stableRef}`);
console.table(rows);

const mergedCount = rows.filter((row) => row.merged).length;
const uniqueCount = rows.length - mergedCount;
console.log(
  `${rows.length} remote branches: ${mergedCount} fully merged, ${uniqueCount} with unique history.`,
);
