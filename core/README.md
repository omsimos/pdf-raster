# pdf-raster

[![NPM Version](https://img.shields.io/npm/v/pdf-raster)](https://www.npmjs.com/package/pdf-raster)
[![License](https://img.shields.io/github/license/joshxfi/pdf-raster)](https://github.com/joshxfi/pdf-raster/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%23282a36.svg?logo=bun&logoColor=white)](https://bun.sh)

**Blazing fast, native PDF-to-image conversion for Node.js and Bun.**

`pdf-raster` renders PDF pages into high-quality image buffers through
a small, high-performance server-side API. Built with Rust and PDFium, it is
roughly `4x–8x` faster than the included `pdfjs-dist` canvas backends in the
current local benchmark sample.

[**Documentation**](https://pdf-raster.omsimos.com/) | [**GitHub**](https://github.com/joshxfi/pdf-raster)

## 📦 Install

```bash
# Bun
bun add pdf-raster

# PNPM
pnpm add pdf-raster

# NPM
npm install pdf-raster
```

## 🚀 Quick Usage

```ts
import { convert } from "pdf-raster";

const [page] = await convert("./report.pdf", {
  pages: [0], // 0-indexed page numbers
  dpi: 300, // High resolution for OCR and VLM inputs
});

// page.data is the encoded image buffer (default: png)
console.log({
  pageIndex: page.pageIndex,
  mimeType: page.mimeType,
  width: page.width,
  height: page.height,
});
```

### Output Types

```ts
type ConvertedPage = {
  pageIndex: number;
  data: Buffer;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
  dpi: number;
};
```

## ⚡ Performance

Tested on **Apple Silicon (M4)** against the included fixture PDFs at `300 DPI`.

- **pdf-raster**: ~0.86 ms/page
- `pdfjs-dist + @napi-rs/canvas`: ~5.98 ms/page (`~6.9x` slower)
- `pdfjs-dist + node-canvas`: ~7.19 ms/page (`~8.4x` slower)

> [!NOTE]
> These are sample local benchmark results, not universal guarantees. Run
> `bun run benchmark` in the repository if you want to compare on your own
> machine.

## 🌍 Runtime Support

- **Server-side only**: Node.js and Bun.
- **Targets**: macOS (x64/arm64), Linux (x64/arm64), Windows (x64/arm64).
- **Format Support**: `png` (default), `jpeg`, `webp`.

> [!CAUTION]
> This package contains native bindings. It will **not** work in Browser bundles, React Client Components, or Edge runtimes.

## 📖 Links

- [Full Documentation](https://pdf-raster.omsimos.com/)
- [Quickstart Guide](https://pdf-raster.omsimos.com/docs/quickstart)
- [Example App](https://github.com/joshxfi/pdf-raster/tree/main/example)
