import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
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
  outputFormat?: "jpeg" | "png" | "webp";
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
  convertPath(
    path: string,
    options?: NativeConvertOptions,
    pdfiumLibraryPath?: string,
  ): Promise<ConvertedPage[]>;
  convertBytes(
    bytes: Buffer,
    options?: NativeConvertOptions,
    pdfiumLibraryPath?: string,
  ): Promise<ConvertedPage[]>;
};

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const workspaceRoot = resolve(packageRoot, "..", "..");
const loadErrors: unknown[] = [];

function isMusl(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  try {
    return require("node:fs")
      .readFileSync("/usr/bin/ldd", "utf8")
      .includes("musl");
  } catch {
    try {
      const report = process.report?.getReport?.() as ProcessReport | undefined;
      if (report?.header?.glibcVersionRuntime) {
        return false;
      }

      return (
        report?.sharedObjects?.some((file: string) => file.includes("musl")) ??
        false
      );
    } catch {
      return false;
    }
  }
}

function ensureBundledPdfiumPath(): void {
  if (process.env.PDFIUM_LIB_PATH) {
    return;
  }

  const candidates = getPdfiumCandidates();

  const bundled = candidates.find((candidate) => existsSync(candidate));
  if (bundled) {
    process.env.PDFIUM_LIB_PATH = bundled;
  }
}

function getBundledPdfiumPath(): string | undefined {
  return getPdfiumCandidates().find((candidate) => existsSync(candidate));
}

function getPdfiumFileName(): string {
  if (process.platform === "win32") {
    return "pdfium.dll";
  }

  if (process.platform === "darwin") {
    return "libpdfium.dylib";
  }

  return "libpdfium.so";
}

function getPdfiumCacheKey(): string {
  const linuxTarget = `${process.platform}-${process.arch}`;

  if (process.platform !== "linux") {
    return process.platform === "win32"
      ? `win32-${process.arch}-msvc`
      : linuxTarget;
  }

  return isMusl() ? `${linuxTarget}-musl` : `${linuxTarget}-gnu`;
}

function getPdfiumReleaseSegment(): string {
  return (process.env.PDFIUM_RELEASE || "latest").replaceAll(
    /[^a-zA-Z0-9._-]+/g,
    "-",
  );
}

function getPdfiumCandidates(): string[] {
  const fileName = getPdfiumFileName();
  const cacheRoot = process.env.PDFIUM_CACHE_DIR
    ? resolve(process.env.PDFIUM_CACHE_DIR)
    : join(workspaceRoot, ".cache", "pdfium");

  return [
    join(packageRoot, fileName),
    join(packageRoot, "lib", fileName),
    join(cacheRoot, getPdfiumReleaseSegment(), getPdfiumCacheKey(), fileName),
  ];
}

function requireLocalDarwinArm64(): NativeBinding | null {
  try {
    return require("../pdf-to-images.darwin-arm64.node") as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function requireLocalDarwinX64(): NativeBinding | null {
  try {
    return require("../pdf-to-images.darwin-x64.node") as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function requireLocalLinuxArm64Gnu(): NativeBinding | null {
  try {
    return require("../pdf-to-images.linux-arm64-gnu.node") as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function requireLocalLinuxX64Gnu(): NativeBinding | null {
  try {
    return require("../pdf-to-images.linux-x64-gnu.node") as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function requireLocalWin32Arm64Msvc(): NativeBinding | null {
  try {
    return require("../pdf-to-images.win32-arm64-msvc.node") as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function requireLocalWin32X64Msvc(): NativeBinding | null {
  try {
    return require("../pdf-to-images.win32-x64-msvc.node") as NativeBinding;
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
        requireLocalDarwinArm64() ??
        requirePackage("@omsimos/pdf-to-images-darwin-arm64") ??
        failToLoad()
      );
    }

    if (process.arch === "x64") {
      return (
        requireLocalDarwinX64() ??
        requirePackage("@omsimos/pdf-to-images-darwin-x64") ??
        failToLoad()
      );
    }
  }

  if (process.platform === "linux") {
    if (isMusl()) {
      throw new Error(
        "Failed to load the native @omsimos/pdf-to-images binding for linux musl. Prebuilt musl artifacts are not published for this package.",
      );
    }

    if (process.arch === "arm64") {
      return (
        requireLocalLinuxArm64Gnu() ??
        requirePackage("@omsimos/pdf-to-images-linux-arm64-gnu") ??
        failToLoad()
      );
    }

    if (process.arch === "x64") {
      return (
        requireLocalLinuxX64Gnu() ??
        requirePackage("@omsimos/pdf-to-images-linux-x64-gnu") ??
        failToLoad()
      );
    }
  }

  if (process.platform === "win32") {
    if (process.arch === "arm64") {
      return (
        requireLocalWin32Arm64Msvc() ??
        requirePackage("@omsimos/pdf-to-images-win32-arm64-msvc") ??
        failToLoad()
      );
    }

    if (process.arch === "x64") {
      return (
        requireLocalWin32X64Msvc() ??
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
