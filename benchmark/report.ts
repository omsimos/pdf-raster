import { basename, resolve } from "node:path";

import type {
  BenchmarkReport,
  BenchRunResult,
  BenchSummary,
  FileBenchmarkReport,
  NumericSummary,
} from "./types";

function summarize(values: number[]): NumericSummary {
  const sorted = [...values].sort((left, right) => left - right);
  const avg =
    values.length === 0
      ? 0
      : values.reduce((total, value) => total + value, 0) / values.length;
  const middle = Math.floor(sorted.length / 2);
  const p50 =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];

  return {
    avg,
    min: sorted[0] ?? 0,
    max: sorted.at(-1) ?? 0,
    p50,
  };
}

function summarizeOptional(
  values: Array<number | null>,
): NumericSummary | null {
  const present = values.filter((value): value is number => value !== null);

  if (present.length === 0) {
    return null;
  }

  return summarize(present);
}

export function summarizeRuns(runs: BenchRunResult[]): BenchSummary {
  const first = runs[0];

  return {
    library: first.library,
    backend: first.backend,
    pageCount: first.pageCount,
    dpi: first.dpi,
    mimeType: first.mimeType,
    rasterMs: summarizeOptional(runs.map((run) => run.rasterMs)),
    encodeMs: summarizeOptional(runs.map((run) => run.encodeMs)),
    totalMs: summarize(runs.map((run) => run.totalMs)),
    msPerPage: summarize(runs.map((run) => run.msPerPage)),
    outputBytes: summarize(runs.map((run) => run.outputBytes)),
    outputBytesPerPage: summarize(runs.map((run) => run.outputBytesPerPage)),
    runs,
  };
}

export function createReport(
  files: FileBenchmarkReport[],
  pdfjsBackend: string,
): BenchmarkReport {
  return {
    generatedAt: new Date().toISOString(),
    pdfjsBackend,
    files,
  };
}

function formatMs(value: number): string {
  return `${value.toFixed(2)} ms`;
}

function formatOptionalMs(value: NumericSummary | null): string {
  return value ? formatMs(value.avg) : "n/a";
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value.toFixed(0)} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

function padCell(value: string, width: number): string {
  return value.padEnd(width, " ");
}

function relativeSpeed(left: number, right: number): string {
  if (left <= 0 || right <= 0) {
    return "n/a";
  }

  const ratio = right / left;
  return `${ratio.toFixed(2)}x`;
}

export function printHumanReport(report: BenchmarkReport): void {
  for (const file of report.files) {
    console.log("");
    console.log(
      `File: ${basename(file.inputPath)} (${resolve(file.inputPath)})`,
    );
    console.log(
      `Settings: dpi=${file.settings.dpi}, output=${file.settings.outputFormat}, pages=${file.settings.pages?.join(",") ?? "all"}, warmups=${file.settings.warmups}, runs=${file.settings.runs}`,
    );
    console.log(`Input size: ${formatBytes(file.inputBytes)}`);

    const showRaster = file.summaries.every((summary) => summary.rasterMs);
    const showEncode = file.summaries.every((summary) => summary.encodeMs);
    const rows = file.summaries.map((summary) => ({
      library: summary.library,
      pages: String(summary.pageCount),
      avgTotal: formatMs(summary.totalMs.avg),
      p50Total: formatMs(summary.totalMs.p50),
      ...(showRaster ? { avgRaster: formatOptionalMs(summary.rasterMs) } : {}),
      ...(showEncode ? { avgEncode: formatOptionalMs(summary.encodeMs) } : {}),
      avgPerPage: formatMs(summary.msPerPage.avg),
      avgBytes: formatBytes(summary.outputBytes.avg),
    }));
    const headers = {
      library: "Library",
      pages: "Pages",
      avgTotal: "Avg total",
      p50Total: "P50 total",
      ...(showRaster ? { avgRaster: "Avg raster" } : {}),
      ...(showEncode ? { avgEncode: "Avg encode" } : {}),
      avgPerPage: "Avg/page",
      avgBytes: "Avg bytes",
    };
    const widths = Object.fromEntries(
      Object.keys(headers).map((key) => {
        const header = headers[key as keyof typeof headers];
        const rowWidth = Math.max(
          ...rows.map((row) => row[key as keyof typeof row].length),
          header.length,
        );

        return [key, rowWidth];
      }),
    ) as Record<keyof typeof headers, number>;
    const headerLine = Object.entries(headers)
      .map(([key, label]) =>
        padCell(label, widths[key as keyof typeof headers]),
      )
      .join("  ");

    console.log(headerLine);
    console.log(
      Object.keys(headers)
        .map((key) => "-".repeat(widths[key as keyof typeof headers]))
        .join("  "),
    );

    for (const row of rows) {
      console.log(
        Object.keys(headers)
          .map((key) =>
            padCell(
              row[key as keyof typeof row],
              widths[key as keyof typeof headers],
            ),
          )
          .join("  "),
      );
    }

    const ours = file.summaries.find(
      (summary) => summary.library === "@omsimos/pdf-to-images",
    );
    const pdfjs = file.summaries.find(
      (summary) => summary.library === "pdfjs-dist",
    );

    if (ours && pdfjs) {
      console.log("");
      console.log(
        `Relative speed (${ours.library} vs ${pdfjs.library}): total ${relativeSpeed(ours.totalMs.avg, pdfjs.totalMs.avg)}`,
      );
      console.log(`pdfjs backend: ${pdfjs.backend}`);
    }
  }
}
