import { createCanvas, DOMMatrix, ImageData } from "canvas";

import { runPdfjsBenchmark } from "./pdfjs-shared";
import type { BenchOptions, BenchRunResult } from "./types";

export const PDFJS_NODE_CANVAS_BACKEND = "pdfjs-dist + node-canvas";

function installGlobals(): void {
  Object.assign(globalThis, {
    DOMMatrix,
    ImageData,
  });
}

export function runPdfjsNodeCanvasBenchmark(
  inputPath: string,
  options: BenchOptions,
): Promise<BenchRunResult> {
  return runPdfjsBenchmark(
    {
      name: PDFJS_NODE_CANVAS_BACKEND,
      installGlobals,
      createCanvas: (width, height) => createCanvas(width, height),
    },
    inputPath,
    options,
  );
}
