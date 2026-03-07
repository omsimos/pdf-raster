import { bundledPdfiumPath, nativeBinding } from "./native.js";
import {
  type ConvertedPage,
  type ConvertInput,
  type ConvertOptions,
  type Crop,
  PdfToImagesError,
  type PdfToImagesErrorCode,
} from "./types.js";

function normalizeInput(input: ConvertInput): string | Buffer {
  if (typeof input === "string") {
    return input;
  }

  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return Buffer.from(input);
  }

  if (ArrayBuffer.isView(input)) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }

  throw new PdfToImagesError(
    "INVALID_INPUT",
    "Expected a file path, Buffer, Uint8Array, or ArrayBuffer.",
  );
}

function normalizeCrop(crop: Crop | undefined): Crop | undefined {
  if (!crop) {
    return undefined;
  }

  const values = [crop.x, crop.y, crop.width, crop.height];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new PdfToImagesError(
      "INVALID_CROP",
      "Crop values must be finite numbers.",
    );
  }

  if (crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0) {
    throw new PdfToImagesError(
      "INVALID_CROP",
      "Crop values must be non-negative and width/height must be greater than zero.",
    );
  }

  return {
    x: Math.trunc(crop.x),
    y: Math.trunc(crop.y),
    width: Math.trunc(crop.width),
    height: Math.trunc(crop.height),
  };
}

function normalizeOptions(options: ConvertOptions = {}): ConvertOptions {
  if (options.outputFormat && options.outputFormat !== "png") {
    throw new PdfToImagesError(
      "INVALID_OPTIONS",
      "Only PNG output is supported in v1.",
    );
  }

  if (options.dpi !== undefined) {
    if (!Number.isFinite(options.dpi) || options.dpi <= 0) {
      throw new PdfToImagesError(
        "INVALID_OPTIONS",
        "DPI must be a positive number.",
      );
    }
  }

  if (options.pages) {
    if (!Array.isArray(options.pages)) {
      throw new PdfToImagesError(
        "INVALID_OPTIONS",
        "`pages` must be an array of zero-based page indices.",
      );
    }

    for (const pageIndex of options.pages) {
      if (!Number.isInteger(pageIndex) || pageIndex < 0) {
        throw new PdfToImagesError(
          "INVALID_PAGE_INDEX",
          "Page indices must be non-negative integers.",
        );
      }
    }
  }

  return {
    pages: options.pages?.map((pageIndex) => Math.trunc(pageIndex)),
    dpi: options.dpi !== undefined ? Math.trunc(options.dpi) : undefined,
    outputFormat: "png",
    password: options.password,
    crop: normalizeCrop(options.crop),
    renderAnnotations: options.renderAnnotations,
  };
}

function mapNativeError(error: unknown): never {
  if (error instanceof PdfToImagesError) {
    throw error;
  }

  if (error instanceof Error) {
    const separatorIndex = error.message.indexOf(":");
    if (separatorIndex > 0) {
      const code = error.message.slice(
        0,
        separatorIndex,
      ) as PdfToImagesErrorCode;
      const message = error.message.slice(separatorIndex + 1).trim();

      if (
        code === "INVALID_INPUT" ||
        code === "INVALID_OPTIONS" ||
        code === "INVALID_PAGE_INDEX" ||
        code === "INVALID_CROP" ||
        code === "PASSWORD_ERROR" ||
        code === "MALFORMED_PDF" ||
        code === "PDFIUM_UNAVAILABLE" ||
        code === "RENDER_ERROR"
      ) {
        throw new PdfToImagesError(code, message, { cause: error });
      }
    }

    throw new PdfToImagesError("RENDER_ERROR", error.message, { cause: error });
  }

  throw new PdfToImagesError("RENDER_ERROR", "Unknown native error.", {
    cause: error,
  });
}

export async function convert(
  input: ConvertInput,
  options: ConvertOptions = {},
): Promise<ConvertedPage[]> {
  const normalizedInput = normalizeInput(input);
  const normalizedOptions = normalizeOptions(options);

  try {
    if (typeof normalizedInput === "string") {
      return await nativeBinding.convertPath(
        normalizedInput,
        normalizedOptions,
        bundledPdfiumPath,
      );
    }

    return await nativeBinding.convertBytes(
      normalizedInput,
      normalizedOptions,
      bundledPdfiumPath,
    );
  } catch (error) {
    mapNativeError(error);
  }
}

export { PdfToImagesError };
export type {
  ConvertedPage,
  ConvertInput,
  ConvertOptions,
  Crop,
  OutputFormat,
  PdfToImagesErrorCode,
} from "./types.js";
