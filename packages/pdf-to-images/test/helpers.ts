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
