import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packageDir = resolve(repoRoot, "core");
const npmDir = resolve(packageDir, "npm");
const publishWithProvenance = process.env.NPM_PUBLISH_PROVENANCE === "true";

function run(command: string, args: string[], cwd: string): void {
  const output = execFileSync(command, args, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });

  if (output.length > 0) {
    process.stdout.write(output);
  }
}

function getErrorOutput(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const withStreams = error as Error & {
    stdout?: Buffer | string;
    stderr?: Buffer | string;
  };

  return [
    error.message,
    withStreams.stdout ? String(withStreams.stdout) : "",
    withStreams.stderr ? String(withStreams.stderr) : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function publishDir(cwd: string): void {
  try {
    const args = ["publish", "--access", "public", "--ignore-scripts"];
    if (publishWithProvenance) {
      args.push("--provenance");
    }

    run("npm", args, cwd);
  } catch (error) {
    const message = getErrorOutput(error);
    if (
      message.includes("previously published versions") ||
      message.includes(
        "cannot publish over the previously published version",
      ) ||
      message.includes("cannot publish over the previously published versions")
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
