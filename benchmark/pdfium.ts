import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { BenchOptions, BenchRunResult } from "./types";

type PdfToImagesModule = typeof import("@omsimos/pdf-to-images");

const runtimeImport = new Function("specifier", "return import(specifier)") as <
  T,
>(
  specifier: string,
) => Promise<T>;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const coreRoot = resolve(repoRoot, "core");

function getNativeBinaryName(): string {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "pdf-to-images.darwin-arm64.node";
  }

  if (process.platform === "darwin" && process.arch === "x64") {
    return "pdf-to-images.darwin-x64.node";
  }

  if (process.platform === "linux" && process.arch === "arm64") {
    return "pdf-to-images.linux-arm64-gnu.node";
  }

  if (process.platform === "linux" && process.arch === "x64") {
    return "pdf-to-images.linux-x64-gnu.node";
  }

  if (process.platform === "win32" && process.arch === "arm64") {
    return "pdf-to-images.win32-arm64-msvc.node";
  }

  if (process.platform === "win32" && process.arch === "x64") {
    return "pdf-to-images.win32-x64-msvc.node";
  }

  throw new Error(
    `Benchmark CLI does not support ${process.platform}/${process.arch}.`,
  );
}

function getBundledPdfiumName(): string {
  if (process.platform === "darwin") {
    return "libpdfium.dylib";
  }

  if (process.platform === "win32") {
    return "pdfium.dll";
  }

  return "libpdfium.so";
}

async function ensureCoreBuilt(): Promise<void> {
  const distEntry = resolve(coreRoot, "dist", "index.js");
  const nativeBinary = resolve(coreRoot, getNativeBinaryName());
  const bundledPdfium = resolve(coreRoot, getBundledPdfiumName());

  if (
    existsSync(distEntry) &&
    existsSync(nativeBinary) &&
    existsSync(bundledPdfium)
  ) {
    return;
  }

  const exitCode = await new Promise<number>((resolvePromise, reject) => {
    const child = spawn("bun", ["run", "build"], {
      cwd: coreRoot,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => resolvePromise(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(
      `Failed to build core before benchmarking (exit ${exitCode}).`,
    );
  }
}

async function loadPdfToImages(): Promise<PdfToImagesModule> {
  await ensureCoreBuilt();
  return runtimeImport<PdfToImagesModule>("@omsimos/pdf-to-images");
}

function getMimeType(outputFormat: BenchOptions["outputFormat"]): string {
  if (outputFormat === "jpeg") {
    return "image/jpeg";
  }

  if (outputFormat === "webp") {
    return "image/webp";
  }

  return "image/png";
}

export function getDefaultBenchmarkInputs(): string[] {
  const fixturesDir = resolve(coreRoot, "test", "fixtures");

  return readdirSync(fixturesDir)
    .filter((entry) => entry.endsWith(".pdf"))
    .map((entry) => resolve(fixturesDir, entry))
    .filter(
      (entry) => readFileSync(entry).subarray(0, 5).toString() === "%PDF-",
    )
    .sort();
}

export async function runPdfiumBenchmark(
  inputPath: string,
  options: BenchOptions,
): Promise<BenchRunResult> {
  const { convert } = await loadPdfToImages();
  const totalStart = performance.now();
  const pages = await convert(inputPath, {
    dpi: options.dpi,
    outputFormat: options.outputFormat,
    pages: options.pages,
  });
  const totalMs = performance.now() - totalStart;
  const outputBytes = pages.reduce(
    (total, page) => total + page.data.byteLength,
    0,
  );

  return {
    library: "@omsimos/pdf-to-images",
    backend: "public convert() API",
    pageCount: pages.length,
    dpi: options.dpi,
    mimeType: pages[0]?.mimeType ?? getMimeType(options.outputFormat),
    rasterMs: null,
    encodeMs: null,
    totalMs,
    outputBytes,
    msPerPage: pages.length > 0 ? totalMs / pages.length : 0,
    outputBytesPerPage: pages.length > 0 ? outputBytes / pages.length : 0,
    pages: pages.map((page) => ({
      pageIndex: page.pageIndex,
      width: page.width,
      height: page.height,
      rasterMs: null,
      encodeMs: null,
      totalMs: null,
      outputBytes: page.data.byteLength,
    })),
  };
}
