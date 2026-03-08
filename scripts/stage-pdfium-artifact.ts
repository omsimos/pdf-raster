import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { getTargetDescriptor, resolvePdfiumSourcePath } from "./pdfium.ts";

const destination = process.argv[2];

if (!destination) {
  console.error("Usage: bun scripts/stage-pdfium-artifact.ts <artifact-dir>");
  process.exit(1);
}

const artifactDir = resolve(destination);
const { targetFileName } = getTargetDescriptor();
const sourcePath = await resolvePdfiumSourcePath();
const stagedFile = resolve(artifactDir, targetFileName);

mkdirSync(artifactDir, { recursive: true });

if (!existsSync(sourcePath)) {
  console.error(`PDFium library not found at ${sourcePath}`);
  process.exit(1);
}

copyFileSync(sourcePath, stagedFile);
console.log(`staged ${targetFileName} -> ${stagedFile}`);
