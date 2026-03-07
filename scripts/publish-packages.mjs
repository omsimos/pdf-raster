import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packageDir = resolve(repoRoot, "packages", "pdf-to-images");
const npmDir = resolve(packageDir, "npm");

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

function publishDir(cwd) {
  try {
    run(
      "npm",
      ["publish", "--access", "public", "--provenance", "--ignore-scripts"],
      cwd,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("previously published versions") ||
      message.includes("cannot publish over the previously published version")
    ) {
      console.warn(`Skipping already published package in ${cwd}`);
      return;
    }

    throw error;
  }
}

run("bun", ["run", "--cwd", packageDir, "build:types"], repoRoot);
run("bun", ["run", "--cwd", packageDir, "prepare-npm-packages"], repoRoot);

const targetDirs = existsSync(npmDir)
  ? readdirSync(npmDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(npmDir, entry.name))
      .sort()
  : [];

for (const targetDir of targetDirs) {
  publishDir(targetDir);
}

publishDir(packageDir);
