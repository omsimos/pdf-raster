import { copyFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

import { getTargetDescriptor, resolvePdfiumSourcePath } from "./pdfium.ts";

const packageDir = process.cwd();
const { targetFileName } = getTargetDescriptor();
const bundledTarget = resolve(packageDir, targetFileName);

try {
  const sourcePath = await resolvePdfiumSourcePath();
  if (existsSync(bundledTarget) && resolve(sourcePath) === bundledTarget) {
    console.log(`using bundled ${targetFileName}`);
    process.exit(0);
  }

  copyFileSync(sourcePath, bundledTarget);
  console.log(`copied ${basename(sourcePath)} -> ${targetFileName}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
