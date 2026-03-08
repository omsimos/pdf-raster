import { existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const patterns = process.argv.slice(2);

function matches(name: string, pattern: string): boolean {
  if (pattern.startsWith("*.")) {
    return name.endsWith(pattern.slice(1));
  }

  return name === pattern;
}

function removeTarget(targetPath: string): void {
  if (!existsSync(targetPath)) {
    return;
  }

  rmSync(targetPath, { force: true, recursive: true });
  console.log(`removed ${targetPath}`);
}

for (const pattern of patterns) {
  if (pattern.includes("*")) {
    const cwd = process.cwd();
    for (const entry of readdirSync(cwd)) {
      if (matches(entry, pattern)) {
        removeTarget(join(cwd, entry));
      }
    }
    continue;
  }

  removeTarget(resolve(pattern));
}
