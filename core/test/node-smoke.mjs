import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const moduleUrl = pathToFileURL(join(packageRoot, "dist", "index.js")).href;
const fixture = join(here, "fixtures", "single-page.pdf");

const { convert } = await import(moduleUrl);
const pages = await convert(fixture, {
  pages: [0],
  dpi: 300,
});

assert.equal(pages.length, 1, "expected a single converted page");
assert.equal(pages[0].mimeType, "image/png");
assert.ok(pages[0].data.byteLength > 8, "expected non-empty PNG data");
assert.equal(pages[0].pageIndex, 0);
