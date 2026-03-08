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

type TargetBindingDescriptor = {
  localBinary: string;
  packageName: string;
};

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const workspaceRoot = resolve(packageRoot, "..", "..");
const loadErrors: unknown[] = [];
const TARGET_BINDINGS: Partial<
  Record<
    NodeJS.Platform,
    Partial<Record<NodeJS.Architecture, TargetBindingDescriptor>>
  >
> = {
  darwin: {
    arm64: {
      localBinary: "../pdf-raster.darwin-arm64.node",
      packageName: "@omsimos/pdf-raster-darwin-arm64",
    },
    x64: {
      localBinary: "../pdf-raster.darwin-x64.node",
      packageName: "@omsimos/pdf-raster-darwin-x64",
    },
  },
  linux: {
    arm64: {
      localBinary: "../pdf-raster.linux-arm64-gnu.node",
      packageName: "@omsimos/pdf-raster-linux-arm64-gnu",
    },
    x64: {
      localBinary: "../pdf-raster.linux-x64-gnu.node",
      packageName: "@omsimos/pdf-raster-linux-x64-gnu",
    },
  },
  win32: {
    arm64: {
      localBinary: "../pdf-raster.win32-arm64-msvc.node",
      packageName: "@omsimos/pdf-raster-win32-arm64-msvc",
    },
    x64: {
      localBinary: "../pdf-raster.win32-x64-msvc.node",
      packageName: "@omsimos/pdf-raster-win32-x64-msvc",
    },
  },
};

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

function requireBinding(specifier: string): NativeBinding | null {
  try {
    return require(specifier) as NativeBinding;
  } catch (error) {
    loadErrors.push(error);
    return null;
  }
}

function getTargetBinding(): TargetBindingDescriptor | null {
  return TARGET_BINDINGS[process.platform]?.[process.arch] ?? null;
}

function loadNativeBinding(): NativeBinding {
  ensureBundledPdfiumPath();

  if (process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
    const explicit = requireBinding(process.env.NAPI_RS_NATIVE_LIBRARY_PATH);
    if (explicit) {
      return explicit;
    }
  }

  if (process.platform === "linux") {
    if (isMusl()) {
      throw new Error(
        "Failed to load the native @omsimos/pdf-raster binding for linux musl. Prebuilt musl artifacts are not published for this package.",
      );
    }
  }

  const targetBinding = getTargetBinding();
  if (targetBinding) {
    return (
      requireBinding(targetBinding.localBinary) ??
      requireBinding(targetBinding.packageName) ??
      failToLoad()
    );
  }

  return failToLoad();
}

function failToLoad(): never {
  const details = loadErrors
    .map((error) => (error instanceof Error ? error.message : String(error)))
    .join("\n");
  throw new Error(
    `Failed to load the native @omsimos/pdf-raster binding for ${process.platform}/${process.arch}.${details ? `\n${details}` : ""}`,
  );
}

export const nativeBinding = loadNativeBinding();
export const bundledPdfiumPath = getBundledPdfiumPath();

export type { NativeBinding, NativeConvertOptions };
