# `@omsimos/pdf-raster`

Native PDF-to-images conversion for Node.js and Bun.

`@omsimos/pdf-raster` renders PDF pages into encoded image buffers through a
small server-side API. It is built for backend workflows that need fast page
images from PDFs, whether that is previews, uploads, OCR handoff, VLM input, or
document processing in jobs and APIs.

## Features

- Native rendering with Rust, `napi-rs`, and PDFium
- One small API: `convert(input, options?)`
- Encoded image output with `png` default and `jpeg` / `webp` support
- File path and in-memory PDF input support
- Multi-page conversion in a single call
- Works in Node.js and Bun on supported server platforms

## Install

```bash
bun add @omsimos/pdf-raster
```

## Quick usage

```ts
import { convert } from "@omsimos/pdf-raster";

const [page] = await convert("./report.pdf", {
  pages: [0],
});

console.log({
  pageIndex: page.pageIndex,
  mimeType: page.mimeType,
  width: page.width,
  height: page.height,
  dpi: page.dpi,
});

// page.data is the encoded image buffer
```

Each returned page looks like:

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

## Output formats

- Default: `png`
- Supported: `png`, `jpeg`, `webp`

```ts
const pages = await convert("./report.pdf", {
  outputFormat: "webp",
});

console.log(pages[0].mimeType);
// "image/webp"
```

## Supported runtimes and platforms

This package is server-side only.

Supported runtimes:

- Node.js
- Bun

Current target matrix:

- macOS x64 / arm64
- Linux x64 / arm64 (`gnu`)
- Windows x64 / arm64

Do not import it into browser bundles, React client components, or Edge
runtimes.

## Common uses

- Generate page previews from uploaded PDFs
- Feed OCR or VLM pipelines with rendered page images
- Convert PDFs inside API routes, workers, and batch jobs
- Process documents from object storage, queues, or other backend systems

## Examples and docs

- Quickstart: [`docs/content/docs/quickstart.mdx`](./docs/content/docs/quickstart.mdx)
- Node.js usage: [`docs/content/docs/examples-node.mdx`](./docs/content/docs/examples-node.mdx)
- Next.js route handler: [`docs/content/docs/examples-nextjs.mdx`](./docs/content/docs/examples-nextjs.mdx)
- OCR / VLM handoff: [`docs/content/docs/examples-ocr-vlm.mdx`](./docs/content/docs/examples-ocr-vlm.mdx)
- Interactive demo app: [`example`](./example)
- Documentation app: [`docs`](./docs)

## Benchmark

You can run the internal benchmark locally with:

```bash
bun run benchmark
```

It compares:

- `@omsimos/pdf-raster`
- `pdfjs-dist + @napi-rs/canvas`
- `pdfjs-dist + node-canvas`

The benchmark defaults to:

- valid fixture PDFs in [`core/test/fixtures`](./core/test/fixtures)
- `dpi=300`
- `output=png`
- one warmup run
- repeated measured runs

The benchmark workspace now requires both canvas backends. `node-canvas` may
need native system prerequisites on the machine where you run it.

Sample local run:

```text
File: multi-page.pdf
Settings: dpi=300, output=png, pages=all, warmups=1, runs=5
Input size: 842 B
Library                       Pages  Avg total  P50 total  Avg/page  Avg bytes
----------------------------  -----  ---------  ---------  --------  ---------
@omsimos/pdf-raster           2      1.72 ms    1.70 ms    0.86 ms   36.2 KB
pdfjs-dist + @napi-rs/canvas  2      11.96 ms   11.91 ms   5.98 ms   22.6 KB
pdfjs-dist + node-canvas      2      14.37 ms   14.37 ms   7.19 ms   22.8 KB

Relative speed (@omsimos/pdf-raster vs pdfjs-dist + @napi-rs/canvas): total 6.94x
Relative speed (@omsimos/pdf-raster vs pdfjs-dist + node-canvas): total 8.35x

File: single-page.pdf
Settings: dpi=300, output=png, pages=all, warmups=1, runs=5
Input size: 583 B
Library                       Pages  Avg total  P50 total  Avg/page  Avg bytes
----------------------------  -----  ---------  ---------  --------  ---------
@omsimos/pdf-raster           1      1.29 ms    1.00 ms    1.29 ms   13.4 KB
pdfjs-dist + @napi-rs/canvas  1      5.81 ms    5.83 ms    5.81 ms   7.6 KB
pdfjs-dist + node-canvas      1      7.25 ms    7.26 ms    7.25 ms   7.8 KB

Relative speed (@omsimos/pdf-raster vs pdfjs-dist + @napi-rs/canvas): total 4.51x
Relative speed (@omsimos/pdf-raster vs pdfjs-dist + node-canvas): total 5.63x
```

On that local run, `@omsimos/pdf-raster` was roughly `4x–8x` faster than
both `pdfjs-dist` canvas backends on the included fixtures. Treat those numbers
as sample results, not universal guarantees.

## Local development

This repository is a Bun + Turborepo monorepo with:

- `core`: the publishable `@omsimos/pdf-raster` package
- `example`: the interactive demo app
- `docs`: the Fumadocs documentation app
- `benchmark`: the internal performance comparison CLI

Common commands:

```bash
bun install
bun run pdfium:download
bun run dev
bun run build
bun run test
bun run benchmark
```

## License

MIT
