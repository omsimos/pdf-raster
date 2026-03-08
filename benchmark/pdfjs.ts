import { readFile } from "node:fs/promises";

import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import type { BenchOptions, BenchRunResult } from "./types";

type RenderTask = {
  promise: Promise<void>;
};

type PdfPage = {
  getViewport(options: { scale: number }): { width: number; height: number };
  render(options: {
    canvasContext: unknown;
    viewport: { width: number; height: number };
    background: string;
  }): RenderTask;
  cleanup(): void;
};

type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  cleanup(): void;
  destroy(): Promise<void>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocument>;
  destroy(): Promise<void>;
};

const PDFJS_BACKEND = "pdfjs-dist + @napi-rs/canvas";

function installCanvasGlobals(): void {
  Object.assign(globalThis, {
    DOMMatrix,
    ImageData,
    Path2D,
  });
}

function encodeCanvas(
  canvas: CanvasLike,
  outputFormat: BenchOptions["outputFormat"],
): Buffer {
  const mimeType =
    outputFormat === "jpeg"
      ? "image/jpeg"
      : outputFormat === "webp"
        ? "image/webp"
        : "image/png";

  return canvas.toBuffer(mimeType);
}

function resolvePageSelection(pageCount: number, pages?: number[]): number[] {
  if (!pages || pages.length === 0) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  for (const pageIndex of pages) {
    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(
        `Requested page index ${pageIndex} is out of range for ${pageCount} page(s).`,
      );
    }
  }

  return pages;
}

export async function runPdfjsBenchmark(
  inputPath: string,
  options: BenchOptions,
): Promise<BenchRunResult> {
  installCanvasGlobals();

  const pdfBytes = new Uint8Array(await readFile(inputPath));
  const totalStart = performance.now();
  const documentOptions = {
    data: pdfBytes,
    disableWorker: true,
    useSystemFonts: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  } as Parameters<typeof getDocument>[0];
  const loadingTask = getDocument(documentOptions) as PdfLoadingTask;
  const document = await loadingTask.promise;
  const pages = resolvePageSelection(document.numPages, options.pages);
  const scale = options.dpi / 72;
  let rasterMs = 0;
  let encodeMs = 0;
  let outputBytes = 0;
  const pageResults: BenchRunResult["pages"] = [];

  try {
    for (const pageIndex of pages) {
      const pageStart = performance.now();
      const page = await document.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const width = Math.max(1, Math.ceil(viewport.width));
      const height = Math.max(1, Math.ceil(viewport.height));
      const canvas = createCanvas(width, height) as CanvasLike;
      const context = canvas.getContext("2d");
      const rasterStart = performance.now();
      const renderTask = page.render({
        canvasContext: context,
        viewport,
        background: "#ffffff",
      });

      await renderTask.promise;

      const pageRasterMs = performance.now() - rasterStart;
      const encodeStart = performance.now();
      const output = encodeCanvas(canvas, options.outputFormat);
      const pageEncodeMs = performance.now() - encodeStart;
      const pageTotalMs = performance.now() - pageStart;

      rasterMs += pageRasterMs;
      encodeMs += pageEncodeMs;
      outputBytes += output.byteLength;
      pageResults.push({
        pageIndex,
        width,
        height,
        rasterMs: pageRasterMs,
        encodeMs: pageEncodeMs,
        totalMs: pageTotalMs,
        outputBytes: output.byteLength,
      });
      page.cleanup();
    }
  } finally {
    document.cleanup();
    await document.destroy();
    await loadingTask.destroy();
  }

  const mimeType =
    options.outputFormat === "jpeg"
      ? "image/jpeg"
      : options.outputFormat === "webp"
        ? "image/webp"
        : "image/png";
  const totalMs = performance.now() - totalStart;

  return {
    library: "pdfjs-dist",
    backend: PDFJS_BACKEND,
    pageCount: pageResults.length,
    dpi: options.dpi,
    mimeType,
    rasterMs,
    encodeMs,
    totalMs,
    outputBytes,
    msPerPage: pageResults.length > 0 ? totalMs / pageResults.length : 0,
    outputBytesPerPage:
      pageResults.length > 0 ? outputBytes / pageResults.length : 0,
    pages: pageResults,
  };
}

export { PDFJS_BACKEND };
type CanvasLike = {
  getContext(type: "2d"): unknown;
  toBuffer(mimeType: string): Buffer;
};
