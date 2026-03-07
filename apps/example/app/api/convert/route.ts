import { NextResponse } from "next/server";

import {
  DEFAULT_DPI,
  DEFAULT_PAGE_INPUT,
  DPI_OPTIONS,
  MAX_UPLOAD_BYTES,
  parsePageSelection,
  type SupportedDpi,
} from "@/app/lib/demo-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supportedDpi = new Set<SupportedDpi>(DPI_OPTIONS);
const runtimeImport = new Function("specifier", "return import(specifier)") as <
  T,
>(
  specifier: string,
) => Promise<T>;

type PdfToImagesModule = typeof import("@omsimos/pdf-to-images");
type PdfToImagesErrorCode =
  | "INVALID_INPUT"
  | "INVALID_OPTIONS"
  | "INVALID_PAGE_INDEX"
  | "INVALID_CROP"
  | "PASSWORD_ERROR"
  | "MALFORMED_PDF"
  | "PDFIUM_UNAVAILABLE"
  | "RENDER_ERROR";

type BenchmarkSummary = {
  serverMs: number;
  convertMs: number;
  pagesRendered: number;
  inputBytes: number;
  outputBytes: number;
};

function isPdfToImagesError(
  error: unknown,
): error is Error & { code: PdfToImagesErrorCode } {
  return (
    error instanceof Error &&
    error.name === "PdfToImagesError" &&
    "code" in error &&
    typeof error.code === "string"
  );
}

async function loadPdfToImages(): Promise<PdfToImagesModule> {
  return runtimeImport<PdfToImagesModule>("@omsimos/pdf-to-images");
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

function parseDpi(input: FormDataEntryValue | null): SupportedDpi | null {
  if (typeof input !== "string" || input.trim().length === 0) {
    return DEFAULT_DPI;
  }

  const parsed = Number(input);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return supportedDpi.has(parsed as SupportedDpi)
    ? (parsed as SupportedDpi)
    : null;
}

export async function POST(request: Request) {
  const requestStart = performance.now();

  try {
    const formData = await request.formData();
    const upload = formData.get("file");

    if (!(upload instanceof File)) {
      return errorResponse(
        "INVALID_INPUT",
        "Attach a PDF file before running conversion.",
        400,
      );
    }

    if (upload.size === 0) {
      return errorResponse("INVALID_INPUT", "The uploaded PDF is empty.", 400);
    }

    if (upload.size > MAX_UPLOAD_BYTES) {
      return errorResponse(
        "INVALID_INPUT",
        "Use a PDF smaller than 20 MB for this preview app.",
        400,
      );
    }

    const lowerName = upload.name.toLowerCase();
    const isPdf =
      upload.type === "application/pdf" || lowerName.endsWith(".pdf");

    if (!isPdf) {
      return errorResponse(
        "INVALID_INPUT",
        "Only PDF uploads are supported in this example.",
        400,
      );
    }

    const parsedPages = parsePageSelection(
      String(formData.get("pages") ?? DEFAULT_PAGE_INPUT),
    );
    if (!parsedPages.ok) {
      return errorResponse("INVALID_PAGE_INDEX", parsedPages.message, 400);
    }

    const dpi = parseDpi(formData.get("dpi"));
    if (dpi === null) {
      return errorResponse(
        "INVALID_OPTIONS",
        `Use one of the supported DPI values: ${DPI_OPTIONS.join(", ")}.`,
        400,
      );
    }

    const { convert } = await loadPdfToImages();
    const buffer = Buffer.from(await upload.arrayBuffer());
    const convertStart = performance.now();
    const pages = await convert(buffer, {
      pages: parsedPages.pages,
      dpi,
    });
    const convertMs = performance.now() - convertStart;
    const outputBytes = pages.reduce(
      (total, page) => total + page.data.byteLength,
      0,
    );
    const benchmark: BenchmarkSummary = {
      serverMs: performance.now() - requestStart,
      convertMs,
      pagesRendered: pages.length,
      inputBytes: buffer.byteLength,
      outputBytes,
    };

    return NextResponse.json({
      benchmark,
      pages: pages.map((page) => ({
        pageIndex: page.pageIndex,
        width: page.width,
        height: page.height,
        dpi: page.dpi,
        src: `data:${page.mimeType};base64,${page.data.toString("base64")}`,
      })),
    });
  } catch (error) {
    if (isPdfToImagesError(error)) {
      const status =
        error.code === "PDFIUM_UNAVAILABLE" || error.code === "RENDER_ERROR"
          ? 500
          : 400;

      return errorResponse(error.code, error.message, status);
    }

    return errorResponse(
      "RENDER_ERROR",
      "Unexpected server error while converting the PDF.",
      500,
    );
  }
}
