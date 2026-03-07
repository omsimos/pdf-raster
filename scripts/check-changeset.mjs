import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function gitOrEmpty(args) {
  try {
    return git(args);
  } catch {
    return "";
  }
}

const baseRef = process.env.GITHUB_BASE_REF || "main";
const diffBase = `origin/${baseRef}`;

if (process.env.GITHUB_ACTIONS === "true") {
  try {
    git(["fetch", "origin", baseRef, "--depth=1"]);
  } catch {
    // The base ref may already exist locally in some CI contexts.
  }
}

const baseExists =
  process.env.GITHUB_ACTIONS === "true" &&
  Boolean(gitOrEmpty(["rev-parse", "--verify", diffBase]));
const changedFiles = (
  baseExists
    ? gitOrEmpty(["diff", "--name-only", `${diffBase}...HEAD`])
    : [
        gitOrEmpty(["diff", "--name-only", "HEAD"]),
        gitOrEmpty(["ls-files", "--others", "--exclude-standard"]),
      ].join("\n")
)
  .split("\n")
  .map((entry) => entry.trim())
  .filter(Boolean);

const packageAffectingPrefixes = [
  "packages/pdf-to-images/src/",
  "packages/pdf-to-images/Cargo.toml",
  "packages/pdf-to-images/package.json",
  "packages/pdf-to-images/build.rs",
  "scripts/pdfium.mjs",
  "scripts/bundle-pdfium.mjs",
  "scripts/publish-packages.mjs",
  "scripts/stage-pdfium-artifact.mjs",
  "scripts/copy-pdfium-to-npm.mjs",
];

const packageAffectingChange = changedFiles.some((file) =>
  packageAffectingPrefixes.some(
    (prefix) => file === prefix || file.startsWith(prefix),
  ),
);

if (!packageAffectingChange) {
  console.log(
    "No package-affecting changes detected; skipping changeset check.",
  );
  process.exit(0);
}

const hasChangeset = changedFiles.some(
  (file) =>
    file.startsWith(".changeset/") &&
    file.endsWith(".md") &&
    !file.endsWith("README.md"),
);

if (!hasChangeset) {
  console.error(
    "Package-affecting changes detected without a changeset. Add a .changeset/*.md file before merging.",
  );
  process.exit(1);
}

console.log("Changeset detected for package-affecting changes.");
