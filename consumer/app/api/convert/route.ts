import {
  convert,
  PdfToImagesError,
  type PdfToImagesErrorCode,
} from "@omsimos/pdf-raster";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

function isPdfToImagesError(
  error: unknown,
): error is PdfToImagesError & { code: PdfToImagesErrorCode } {
  return error instanceof PdfToImagesError;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const upload = formData.get("file");

    if (!(upload instanceof File)) {
      return errorResponse(
        "INVALID_INPUT",
        "Attach a PDF file before running the consumer test.",
        400,
      );
    }

    if (upload.size === 0) {
      return errorResponse("INVALID_INPUT", "The uploaded PDF is empty.", 400);
    }

    if (upload.size > MAX_UPLOAD_BYTES) {
      return errorResponse(
        "INVALID_INPUT",
        "Use a PDF smaller than 20 MB for this consumer test app.",
        400,
      );
    }

    const lowerName = upload.name.toLowerCase();
    const isPdf =
      upload.type === "application/pdf" || lowerName.endsWith(".pdf");

    if (!isPdf) {
      return errorResponse(
        "INVALID_INPUT",
        "Only PDF uploads are supported in this consumer test app.",
        400,
      );
    }

    const buffer = Buffer.from(await upload.arrayBuffer());
    const pages = await convert(buffer);

    return NextResponse.json({
      pages: pages.map((page) => ({
        pageIndex: page.pageIndex,
        width: page.width,
        height: page.height,
        dpi: page.dpi,
        mimeType: page.mimeType,
        bytes: page.data.byteLength,
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
      error instanceof Error
        ? error.message
        : "Unexpected server error while converting the PDF.",
      500,
    );
  }
}
