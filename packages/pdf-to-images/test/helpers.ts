import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function fixturePath(name: string): string {
  return join(here, "fixtures", name);
}

export function parsePngDimensions(data: Uint8Array): {
  width: number;
  height: number;
} {
  const png = Buffer.from(data);
  const signature = png.subarray(0, 8);
  const expectedSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  if (!signature.equals(expectedSignature)) {
    throw new Error("Expected a PNG signature.");
  }

  if (png.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("Expected a PNG IHDR chunk.");
  }

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

export function expectJpegSignature(data: Uint8Array): void {
  const jpeg = Buffer.from(data);

  if (
    jpeg.byteLength < 3 ||
    jpeg[0] !== 0xff ||
    jpeg[1] !== 0xd8 ||
    jpeg[2] !== 0xff
  ) {
    throw new Error("Expected a JPEG signature.");
  }
}

export function expectWebpSignature(data: Uint8Array): void {
  const webp = Buffer.from(data);

  if (
    webp.byteLength < 12 ||
    webp.subarray(0, 4).toString("ascii") !== "RIFF" ||
    webp.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    throw new Error("Expected a WebP signature.");
  }
}
