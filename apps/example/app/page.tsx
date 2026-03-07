import { Badge } from "@omsimos/ui/components/badge";

import { ConversionWorkbench } from "./workbench";

const trackList = [
  {
    label: "Library surface",
    value: "convert(pdf, { pages, dpi })",
    detail: "Same package call as the production API.",
  },
  {
    label: "Native stack",
    value: "Rust + napi-rs + PDFium",
    detail: "Server-side conversion stays in Node runtime.",
  },
  {
    label: "Output shape",
    value: "PNG buffers with metadata",
    detail: "Directly usable for OCR, VLMs, and review tooling.",
  },
];

const pipeline = [
  "Upload a PDF into the Next.js route handler.",
  "Convert selected pages to PNG with @omsimos/pdf-to-images.",
  "Inspect the image payload before handing it to OCR or a VLM.",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="lab-shell rounded-[2.2rem] p-6 sm:p-8">
          <div className="relative flex h-full flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-none border border-[var(--example-border)] bg-[var(--example-panel-strong)] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--example-muted)]">
                Example app
              </Badge>
              <p className="lab-kicker">omsimos / pdf-to-images</p>
            </div>

            <div className="max-w-4xl space-y-5">
              <p className="lab-grid-label">
                Technical lab / server-rendered preview
              </p>
              <h1 className="max-w-4xl text-balance text-[clamp(3rem,8vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.08em]">
                Convert PDFs into clean PNG pages without leaving your Next.js
                stack.
              </h1>
              <p className="max-w-2xl text-balance text-base leading-7 text-[var(--example-muted)] sm:text-lg">
                This example app shows the real product loop: upload a PDF,
                choose pages and DPI, run conversion on the server, and inspect
                the exact image output you would pass into OCR or a multimodal
                model.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {trackList.map((item) => (
                <div
                  key={item.label}
                  className="border border-[var(--example-border)] bg-[var(--example-panel-strong)] p-4"
                >
                  <p className="lab-grid-label">{item.label}</p>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.04em]">
                    {item.value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--example-muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lab-shell rounded-[2.2rem] p-6 sm:p-8">
          <div className="relative flex h-full flex-col gap-6">
            <div>
              <p className="lab-grid-label">Signal chain</p>
              <h2 className="lab-section-title mt-2">What this demo proves</h2>
            </div>
            <div className="lab-rule" />
            <ol className="grid gap-4">
              {pipeline.map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[auto_1fr] gap-4 border border-[var(--example-border)] bg-[var(--example-panel-strong)] p-4"
                >
                  <span className="lab-grid-label text-[var(--example-accent)]">
                    0{index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--example-muted)]">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
            <div className="border border-[var(--example-border)] bg-[var(--example-accent-soft)] p-4">
              <p className="lab-grid-label text-[var(--example-ink)]">
                Defaults in this preview
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--example-muted)]">
                First page by default, 300 DPI selected, and a narrow page cap
                so the route can stay instant and inspectable.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <ConversionWorkbench />
    </main>
  );
}
