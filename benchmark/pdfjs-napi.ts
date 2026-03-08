import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

import { runPdfjsBenchmark } from "./pdfjs-shared";
import type { BenchOptions, BenchRunResult } from "./types";

export const PDFJS_NAPI_BACKEND = "pdfjs-dist + @napi-rs/canvas";

function installGlobals(): void {
  Object.assign(globalThis, {
    DOMMatrix,
    ImageData,
    Path2D,
  });
}

export function runPdfjsNapiBenchmark(
  inputPath: string,
  options: BenchOptions,
): Promise<BenchRunResult> {
  return runPdfjsBenchmark(
    {
      name: PDFJS_NAPI_BACKEND,
      installGlobals,
      createCanvas: (width, height) => createCanvas(width, height),
    },
    inputPath,
    options,
  );
}
