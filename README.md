# `@omsimos/pdf-to-images`

Native PDF-to-images conversion for Node.js and Bun.

`@omsimos/pdf-to-images` renders PDF pages into encoded image buffers with a
small server-side API. Use it for page previews, document pipelines, API
uploads, OCR handoff, VLM input, or any workflow that needs page images instead
of raw PDF bytes.

## Features

- Native rendering with Rust, `napi-rs`, and PDFium
- One public API: `convert(input, options?)`
- File path and in-memory PDF input support
- Multi-page conversion in a single call
- Encoded image output with `png` default and `jpeg` / `webp` support
- Works in Node.js and Bun on supported server platforms

## Install

```bash
bun add @omsimos/pdf-to-images
```

```bash
pnpm add @omsimos/pdf-to-images
```

```bash
npm install @omsimos/pdf-to-images
```

## Quick usage

```ts
import { convert } from "@omsimos/pdf-to-images";

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

Example:

```ts
const pages = await convert("./report.pdf", {
  outputFormat: "webp",
});

console.log(pages[0].mimeType);
// "image/webp"
```

## Supported runtimes and platforms

Server-side only:

- Node.js
- Bun

Current target matrix:

- macOS x64 / arm64
- Linux x64 / arm64 (`gnu`)
- Windows x64 / arm64

Do not import this package into browser bundles, React client components, or
Edge runtimes.

## Common uses

- Generate page previews from uploaded PDFs
- Feed OCR or VLM pipelines with rendered page images
- Convert PDFs inside API routes, workers, or batch jobs
- Process documents from object storage, queues, or other backend systems

## Examples

- Basic server-side usage: see [`apps/docs/content/docs/quickstart.mdx`](./apps/docs/content/docs/quickstart.mdx)
- Node.js examples: see [`apps/docs/content/docs/examples-node.mdx`](./apps/docs/content/docs/examples-node.mdx)
- Next.js route handler example: see [`apps/docs/content/docs/examples-nextjs.mdx`](./apps/docs/content/docs/examples-nextjs.mdx)
- OCR / VLM handoff examples: see [`apps/docs/content/docs/examples-ocr-vlm.mdx`](./apps/docs/content/docs/examples-ocr-vlm.mdx)

If you want the full documentation set, see [`apps/docs`](./apps/docs) in this
repository.

The repo also includes:

- [`apps/example`](./apps/example): interactive demo app using `@omsimos/pdf-to-images`
- [`apps/docs`](./apps/docs): Fumadocs-based documentation app

## Local development

This repository is a Bun + Turborepo monorepo with a Rust + `napi-rs` native
package backed by PDFium.

Common commands:

```bash
bun install
bun run pdfium:download
bun run dev
bun run build
bun run test
```

Apps:

- `example`: local demo app
- `docs`: documentation site

## License

MIT
