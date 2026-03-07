import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isMusl() {
  if (process.platform !== "linux") {
    return false;
  }

  try {
    return readFileSync("/usr/bin/ldd", "utf8").includes("musl");
  } catch {
    return false;
  }
}

function sanitizePathSegment(value) {
  return value.replaceAll(/[^a-zA-Z0-9._-]+/g, "-");
}

function getConfiguredRelease() {
  return process.env.PDFIUM_RELEASE?.trim() || "latest";
}

function getTargetDescriptor() {
  const musl = isMusl();

  if (process.platform === "darwin" && process.arch === "arm64") {
    return {
      archiveName: "pdfium-mac-arm64.tgz",
      cacheKey: "darwin-arm64",
      targetFileName: "libpdfium.dylib",
    };
  }

  if (process.platform === "darwin" && process.arch === "x64") {
    return {
      archiveName: "pdfium-mac-x64.tgz",
      cacheKey: "darwin-x64",
      targetFileName: "libpdfium.dylib",
    };
  }

  if (process.platform === "linux" && process.arch === "arm64") {
    return {
      archiveName: musl
        ? "pdfium-linux-musl-arm64.tgz"
        : "pdfium-linux-arm64.tgz",
      cacheKey: musl ? "linux-arm64-musl" : "linux-arm64-gnu",
      targetFileName: "libpdfium.so",
    };
  }

  if (process.platform === "linux" && process.arch === "x64") {
    return {
      archiveName: musl ? "pdfium-linux-musl-x64.tgz" : "pdfium-linux-x64.tgz",
      cacheKey: musl ? "linux-x64-musl" : "linux-x64-gnu",
      targetFileName: "libpdfium.so",
    };
  }

  if (process.platform === "win32" && process.arch === "arm64") {
    return {
      archiveName: "pdfium-win-arm64.tgz",
      cacheKey: "win32-arm64-msvc",
      targetFileName: "pdfium.dll",
    };
  }

  if (process.platform === "win32" && process.arch === "x64") {
    return {
      archiveName: "pdfium-win-x64.tgz",
      cacheKey: "win32-x64-msvc",
      targetFileName: "pdfium.dll",
    };
  }

  throw new Error(
    `Unsupported platform for PDFium download: ${process.platform} ${process.arch}`,
  );
}

function getPdfiumCacheRoot() {
  if (process.env.PDFIUM_CACHE_DIR?.trim()) {
    return resolve(process.env.PDFIUM_CACHE_DIR.trim());
  }

  return resolve(repoRoot, ".cache", "pdfium");
}

function getCachedPdfiumPath() {
  const target = getTargetDescriptor();
  const release = sanitizePathSegment(getConfiguredRelease());

  return resolve(
    getPdfiumCacheRoot(),
    release,
    target.cacheKey,
    target.targetFileName,
  );
}

function getPdfiumDownloadUrl() {
  if (process.env.PDFIUM_DOWNLOAD_URL?.trim()) {
    return process.env.PDFIUM_DOWNLOAD_URL.trim();
  }

  const target = getTargetDescriptor();
  const release = getConfiguredRelease();
  const releasePath =
    release === "latest"
      ? "latest/download"
      : `download/${encodeURIComponent(release)}`;

  return `https://github.com/bblanchon/pdfium-binaries/releases/${releasePath}/${target.archiveName}`;
}

function readNullTerminatedString(buffer, start, length) {
  const value = buffer
    .subarray(start, start + length)
    .toString("utf8")
    .replace(/\0.*$/, "")
    .trim();

  return value;
}

function extractMatchingFileFromTar(tarBuffer, targetFileName) {
  let offset = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    const isEmptyHeader = header.every((byte) => byte === 0);

    if (isEmptyHeader) {
      break;
    }

    const name = readNullTerminatedString(header, 0, 100);
    const prefix = readNullTerminatedString(header, 345, 155);
    const typeFlag = readNullTerminatedString(header, 156, 1) || "0";
    const sizeValue = readNullTerminatedString(header, 124, 12);
    const size = sizeValue ? Number.parseInt(sizeValue, 8) : 0;
    const fullName = prefix ? `${prefix}/${name}` : name;
    const normalizedName = fullName.replaceAll("\\", "/");
    const baseName = normalizedName.split("/").at(-1);
    const fileStart = offset + 512;
    const fileEnd = fileStart + size;

    if (
      (typeFlag === "0" || typeFlag === "\0") &&
      baseName === targetFileName &&
      fileEnd <= tarBuffer.length
    ) {
      return tarBuffer.subarray(fileStart, fileEnd);
    }

    offset = fileStart + Math.ceil(size / 512) * 512;
  }

  throw new Error(
    `Could not find ${targetFileName} in the downloaded archive.`,
  );
}

async function downloadPdfiumToCache() {
  const cachedPdfiumPath = getCachedPdfiumPath();

  if (existsSync(cachedPdfiumPath)) {
    return cachedPdfiumPath;
  }

  mkdirSync(dirname(cachedPdfiumPath), { recursive: true });

  const response = await fetch(getPdfiumDownloadUrl(), {
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download PDFium archive (${response.status} ${response.statusText}).`,
    );
  }

  const target = getTargetDescriptor();
  const compressedArchive = Buffer.from(await response.arrayBuffer());
  const extractedArchive = gunzipSync(compressedArchive);
  const libraryBuffer = extractMatchingFileFromTar(
    extractedArchive,
    target.targetFileName,
  );

  writeFileSync(cachedPdfiumPath, libraryBuffer);
  return cachedPdfiumPath;
}

async function resolvePdfiumSourcePath() {
  const configuredSource = process.env.PDFIUM_LIB_PATH?.trim();

  if (configuredSource) {
    const explicitPath = resolve(configuredSource);

    if (existsSync(explicitPath)) {
      return explicitPath;
    }

    console.warn(
      `warning: PDFIUM_LIB_PATH does not exist, falling back to cache/download: ${explicitPath}`,
    );
  }

  const cachedPdfiumPath = getCachedPdfiumPath();
  if (existsSync(cachedPdfiumPath)) {
    return cachedPdfiumPath;
  }

  return downloadPdfiumToCache();
}

function getWorkspacePdfiumCandidates() {
  const packageDir = resolve(repoRoot, "packages", "pdf-to-images");
  const target = getTargetDescriptor();
  const candidates = [
    join(packageDir, target.targetFileName),
    join(packageDir, "lib", target.targetFileName),
    getCachedPdfiumPath(),
  ];

  return Array.from(new Set(candidates));
}

export {
  getCachedPdfiumPath,
  getConfiguredRelease,
  getPdfiumCacheRoot,
  getPdfiumDownloadUrl,
  getTargetDescriptor,
  getWorkspacePdfiumCandidates,
  repoRoot,
  resolvePdfiumSourcePath,
};
