import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ConvertedPage } from "./types.js";

type ProcessReport = {
  header?: {
    glibcVersionRuntime?: string;
  };
  sharedObjects?: string[];
};

type NativeConvertOptions = {
  pages?: number[];
  dpi?: number;
  outputFormat?: "png";
  password?: string;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  renderAnnotations?: boolean;
};

type NativeBinding = {
  convertPath(path: string, options?: NativeConvertOptions, pdfiumLibraryPath?: string): Promise<ConvertedPage[]>;
  convertBytes(bytes: Buffer, options?: NativeConvertOptions, pdfiumLibraryPath?: string): Promise<ConvertedPage[]>;
};

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const loadErrors: unknown[] = [];

function isMusl(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  try {
    return require("node:fs").readFileSync("/usr/bin/ldd", "utf8").includes("musl");
  } catch {
    try {
      const report = process.report?.getReport?.() as ProcessReport | undefined;
      if (report?.header?.glibcVersionRuntime) {
        return false;
      }

      return report?.sharedObjects?.some((file: string) => file.includes("musl")) ?? false;
    } catch {
      return false;
    }
  }
}

function ensureBundledPdfiumPath(): void {
  if (process.env.PDFIUM_LIB_PATH) {
    return;
  }

  const candidates =
    process.platform === "win32"
      ? [join(packageRoot, "pdfium.dll"), join(packageRoot, "bin", "pdfium.dll")]
      : process.platform === "darwin"
        ? [join(packageRoot, "libpdfium.dylib"), join(packageRoot, "lib", "libpdfium.dylib")]
        : [join(packageRoot, "libpdfium.so"), join(packageRoot, "lib", "libpdfium.so")];

  const bundled = candidates.find((candidate) => existsSync(candidate));
  if (bundled) {
    process.env.PDFIUM_LIB_PATH = bundled;
  }
}

function getBundledPdfiumPath(): string | undefined {
  const candidates =
    process.platform === "win32"
      ? [join(packageRoot, "pdfium.dll"), join(packageRoot, "bin", "pdfium.dll")]
      : process.platform === "darwin"
        ? [join(packageRoot, "libpdfium.dylib"), join(packageRoot, "lib", "libpdfium.dylib")]
        : [join(packageRoot, "libpdfium.so"), join(packageRoot, "lib", "libpdfium.so")];

  return candidates.find((candidate) => existsSync(candidate));
}

function requireLocal(fileName: string): NativeBinding | null {
  try {
    return require(join(packageRoot, fileName)) as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function requirePackage(packageName: string): NativeBinding | null {
  try {
    return require(packageName) as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function loadNativeBinding(): NativeBinding {
  ensureBundledPdfiumPath();

  if (process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
    const explicit = requirePackage(process.env.NAPI_RS_NATIVE_LIBRARY_PATH);
    if (explicit) {
      return explicit;
    }
  }

  if (process.platform === "darwin") {
    if (process.arch === "arm64") {
      return (
        requireLocal("pdf-to-images.darwin-arm64.node") ??
        requirePackage("@omsimos/pdf-to-images-darwin-arm64") ??
        failToLoad()
      );
    }

    if (process.arch === "x64") {
      return (
        requireLocal("pdf-to-images.darwin-x64.node") ??
        requirePackage("@omsimos/pdf-to-images-darwin-x64") ??
        failToLoad()
      );
    }
  }

  if (process.platform === "linux") {
    if (process.arch === "arm64") {
      return (
        requireLocal(`pdf-to-images.linux-arm64-${isMusl() ? "musl" : "gnu"}.node`) ??
        requirePackage(`@omsimos/pdf-to-images-linux-arm64-${isMusl() ? "musl" : "gnu"}`) ??
        failToLoad()
      );
    }

    if (process.arch === "x64") {
      return (
        requireLocal(`pdf-to-images.linux-x64-${isMusl() ? "musl" : "gnu"}.node`) ??
        requirePackage(`@omsimos/pdf-to-images-linux-x64-${isMusl() ? "musl" : "gnu"}`) ??
        failToLoad()
      );
    }
  }

  if (process.platform === "win32") {
    if (process.arch === "arm64") {
      return (
        requireLocal("pdf-to-images.win32-arm64-msvc.node") ??
        requirePackage("@omsimos/pdf-to-images-win32-arm64-msvc") ??
        failToLoad()
      );
    }

    if (process.arch === "x64") {
      return (
        requireLocal("pdf-to-images.win32-x64-msvc.node") ??
        requirePackage("@omsimos/pdf-to-images-win32-x64-msvc") ??
        failToLoad()
      );
    }
  }

  return failToLoad();
}

function failToLoad(): never {
  const details = loadErrors
    .map((error) => (error instanceof Error ? error.message : String(error)))
    .join("\n");
  throw new Error(
    `Failed to load the native @omsimos/pdf-to-images binding for ${process.platform}/${process.arch}.${details ? `\n${details}` : ""}`,
  );
}

export const nativeBinding = loadNativeBinding();
export const bundledPdfiumPath = getBundledPdfiumPath();

export type { NativeBinding, NativeConvertOptions };
