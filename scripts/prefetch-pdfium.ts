import { resolvePdfiumSourcePath } from "./pdfium.ts";

try {
  const pdfiumPath = await resolvePdfiumSourcePath();
  console.log(`ready ${pdfiumPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
