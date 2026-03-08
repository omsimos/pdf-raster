import { existsSync, statSync } from "node:fs";
import { parseArgs } from "node:util";

import { getDefaultBenchmarkInputs, runPdfiumBenchmark } from "./pdfium";
import { PDFJS_NAPI_BACKEND, runPdfjsNapiBenchmark } from "./pdfjs-napi";
import {
  PDFJS_NODE_CANVAS_BACKEND,
  runPdfjsNodeCanvasBenchmark,
} from "./pdfjs-node-canvas";
import { createReport, printHumanReport, summarizeRuns } from "./report";
import type {
  BenchOptions,
  BenchRunResult,
  FileBenchmarkReport,
} from "./types";

function printHelp(): void {
  console.log(`Usage: bun run benchmark [pdf-path ...] [options]

Options:
  --dpi <number>          Render DPI (default: 300)
  --output <format>       Output format: png | jpeg | webp (default: png)
  --pages <list>          Comma-separated zero-based page indices
  --warmups <number>      Warmup runs before measuring (default: 1)
  --runs <number>         Measured runs per library (default: 5)
  --json                  Print JSON report instead of the table output
  --help                  Show this help message
`);
}

function parsePages(value: string | undefined): number[] | undefined {
  if (!value) {
    return undefined;
  }

  const pages = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry));

  if (
    pages.length === 0 ||
    pages.some((page) => !Number.isInteger(page) || page < 0)
  ) {
    throw new Error(
      "Expected --pages to be a comma-separated list of zero-based page indices.",
    );
  }

  return pages;
}

function parseOptions(argv: string[]): BenchOptions {
  const sanitizedArgs = argv.filter((argument) => argument !== "--");
  const { values, positionals } = parseArgs({
    args: sanitizedArgs,
    allowPositionals: true,
    options: {
      dpi: {
        type: "string",
      },
      output: {
        type: "string",
      },
      pages: {
        type: "string",
      },
      warmups: {
        type: "string",
      },
      runs: {
        type: "string",
      },
      json: {
        type: "boolean",
      },
      help: {
        type: "boolean",
      },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const dpi = values.dpi ? Number(values.dpi) : 300;
  const warmups = values.warmups ? Number(values.warmups) : 1;
  const runs = values.runs ? Number(values.runs) : 5;
  const output = (values.output ?? "png") as BenchOptions["outputFormat"];

  if (!Number.isInteger(dpi) || dpi <= 0) {
    throw new Error("Expected --dpi to be a positive integer.");
  }

  if (!Number.isInteger(warmups) || warmups < 0) {
    throw new Error("Expected --warmups to be a non-negative integer.");
  }

  if (!Number.isInteger(runs) || runs <= 0) {
    throw new Error("Expected --runs to be a positive integer.");
  }

  if (output !== "png" && output !== "jpeg" && output !== "webp") {
    throw new Error("Expected --output to be one of png, jpeg, or webp.");
  }

  const inputs =
    positionals.length > 0 ? positionals : getDefaultBenchmarkInputs();
  if (inputs.length === 0) {
    throw new Error("No benchmark input PDFs were found.");
  }

  for (const inputPath of inputs) {
    if (!existsSync(inputPath)) {
      throw new Error(`Benchmark input does not exist: ${inputPath}`);
    }
  }

  return {
    inputs,
    dpi,
    outputFormat: output,
    pages: parsePages(values.pages),
    warmups,
    runs,
    json: values.json ?? false,
  };
}

async function measureLibrary(
  run: (inputPath: string, options: BenchOptions) => Promise<BenchRunResult>,
  inputPath: string,
  options: BenchOptions,
): Promise<BenchRunResult[]> {
  for (let index = 0; index < options.warmups; index += 1) {
    await run(inputPath, options);
  }

  const results: BenchRunResult[] = [];
  for (let index = 0; index < options.runs; index += 1) {
    results.push(await run(inputPath, options));
  }

  return results;
}

async function benchmarkFile(
  inputPath: string,
  options: BenchOptions,
): Promise<FileBenchmarkReport> {
  const inputBytes = statSync(inputPath).size;
  const ourRuns = await measureLibrary(runPdfiumBenchmark, inputPath, options);
  const pdfjsNapiRuns = await measureLibrary(
    runPdfjsNapiBenchmark,
    inputPath,
    options,
  );
  const pdfjsNodeCanvasRuns = await measureLibrary(
    runPdfjsNodeCanvasBenchmark,
    inputPath,
    options,
  );

  return {
    inputPath,
    inputBytes,
    settings: {
      dpi: options.dpi,
      outputFormat: options.outputFormat,
      pages: options.pages,
      warmups: options.warmups,
      runs: options.runs,
    },
    summaries: [
      summarizeRuns(ourRuns),
      summarizeRuns(pdfjsNapiRuns),
      summarizeRuns(pdfjsNodeCanvasRuns),
    ],
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const files: FileBenchmarkReport[] = [];

  for (const inputPath of options.inputs) {
    files.push(await benchmarkFile(inputPath, options));
  }

  const report = createReport(files, [
    PDFJS_NAPI_BACKEND,
    PDFJS_NODE_CANVAS_BACKEND,
  ]);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReport(report);
}

await main();
