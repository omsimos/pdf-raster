"use client";

import { Button } from "@omsimos/ui/button";
import { Badge } from "@omsimos/ui/components/badge";
import { Input } from "@omsimos/ui/input";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import {
  DEFAULT_DPI,
  DEFAULT_PAGE_INPUT,
  DPI_OPTIONS,
  MAX_SELECTED_PAGES,
  parsePageSelection,
  type SupportedDpi,
} from "@/app/lib/demo-config";

type ConvertedPreviewPage = {
  pageIndex: number;
  width: number;
  height: number;
  dpi: number;
  src: string;
};

type ConvertResponse = {
  pages: ConvertedPreviewPage[];
};

type ErrorResponse = {
  code?: string;
  message?: string;
};

function isConvertResponse(payload: unknown): payload is ConvertResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "pages" in payload &&
      Array.isArray((payload as { pages?: unknown }).pages),
  );
}

function isErrorResponse(payload: unknown): payload is ErrorResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string",
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

function buildConvertSnippet(pageInput: string, dpi: SupportedDpi) {
  const parsedPages = parsePageSelection(pageInput);

  if (!parsedPages.ok) {
    return `// ${parsedPages.message}\nawait convert(fileBuffer, {\n  pages: [0],\n  dpi: ${dpi},\n});`;
  }

  return [
    'import { convert } from "@omsimos/pdf-to-images";',
    "",
    "const pages = await convert(fileBuffer, {",
    `  pages: [${parsedPages.pages.join(", ")}],`,
    `  dpi: ${dpi},`,
    "});",
  ].join("\n");
}

export function ConversionWorkbench() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pagesInput, setPagesInput] = useState(DEFAULT_PAGE_INPUT);
  const [dpi, setDpi] = useState<SupportedDpi>(DEFAULT_DPI);
  const [results, setResults] = useState<ConvertedPreviewPage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastRunFileName, setLastRunFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const snippet = buildConvertSnippet(pagesInput, dpi);
  const parsedPages = parsePageSelection(pagesInput);

  function acceptFile(file: File | null) {
    setSelectedFile(file);
    setErrorMessage(null);
  }

  async function runConversion() {
    if (!selectedFile) {
      setErrorMessage("Choose a PDF before running the demo.");
      return;
    }

    setErrorMessage(null);
    setResults([]);

    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("pages", pagesInput);
    formData.set("dpi", String(dpi));

    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setLastRunFileName(null);
      setErrorMessage(
        isErrorResponse(payload)
          ? (payload.message ??
              "Conversion failed before the preview could render.")
          : "Conversion failed before the preview could render.",
      );
      return;
    }

    setResults(isConvertResponse(payload) ? payload.pages : []);
    setLastRunFileName(selectedFile.name);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="lab-shell rounded-[2rem] p-5 sm:p-6">
        <div className="relative flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="lab-grid-label">Workbench</p>
              <h2 className="lab-section-title mt-2">
                Preview conversion inputs
              </h2>
            </div>
            <Badge className="rounded-none border border-[var(--example-border)] bg-[var(--example-panel-strong)] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--example-muted)]">
              Node runtime
            </Badge>
          </div>

          <label
            htmlFor="example-pdf-upload"
            className={`relative overflow-hidden border border-[var(--example-border)] bg-[var(--example-panel-strong)] p-5 transition ${
              isDragging
                ? "border-[var(--example-accent)] bg-[var(--example-accent-soft)]"
                : ""
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              acceptFile(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <input
              id="example-pdf-upload"
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) =>
                acceptFile(event.currentTarget.files?.[0] ?? null)
              }
            />
            <div className="flex flex-col gap-4">
              <div>
                <p className="lab-grid-label">01 / Source PDF</p>
                <p className="mt-2 text-balance text-sm leading-6 text-[var(--example-muted)]">
                  Upload a document and keep the demo focused on a few pages.
                  The route stays in-memory and returns PNG previews straight
                  back to the browser.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-8 items-center justify-center border border-[var(--example-ink)] bg-[var(--example-ink)] px-5 text-sm font-medium text-[var(--example-canvas)] transition-colors hover:bg-[var(--example-accent)]">
                  Select PDF
                </span>
                <div className="text-sm text-[var(--example-muted)]">
                  {selectedFile ? (
                    <>
                      <span className="font-medium text-[var(--example-ink)]">
                        {selectedFile.name}
                      </span>{" "}
                      <span>· {formatFileSize(selectedFile.size)}</span>
                    </>
                  ) : (
                    "Drag a PDF here or browse your files."
                  )}
                </div>
              </div>
            </div>
          </label>

          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                void runConversion();
              });
            }}
          >
            <div className="grid gap-2">
              <label
                htmlFor="page-selection"
                className="lab-grid-label text-[var(--example-ink)]"
              >
                02 / Page selection
              </label>
              <Input
                id="page-selection"
                value={pagesInput}
                onChange={(event) => setPagesInput(event.target.value)}
                placeholder="1,2,4"
                className="rounded-none border-[var(--example-border)] bg-[var(--example-panel-strong)] font-mono"
              />
              <p className="text-sm leading-6 text-[var(--example-muted)]">
                Use comma-separated page numbers like <code>1,2,4</code>. This
                preview allows up to {MAX_SELECTED_PAGES} pages.
              </p>
            </div>

            <div className="grid gap-3">
              <span className="lab-grid-label text-[var(--example-ink)]">
                03 / Raster density
              </span>
              <div className="grid grid-cols-3 gap-2">
                {DPI_OPTIONS.map((option) => {
                  const active = option === dpi;
                  return (
                    <Button
                      key={option}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className={`rounded-none px-0 font-mono ${
                        active
                          ? "border-[var(--example-ink)] bg-[var(--example-ink)] text-[var(--example-canvas)] hover:bg-[var(--example-accent)]"
                          : "border-[var(--example-border)] bg-[var(--example-panel-strong)] text-[var(--example-ink)] hover:bg-[var(--example-accent-soft)]"
                      }`}
                      onClick={() => setDpi(option)}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="lab-rule" />

            <Button
              type="submit"
              disabled={isPending || !selectedFile}
              className="rounded-none border border-[var(--example-ink)] bg-[var(--example-accent)] px-5 text-[var(--example-ink)] hover:bg-[var(--example-ink)] hover:text-[var(--example-canvas)] disabled:border-[var(--example-border)] disabled:bg-[var(--example-panel)] disabled:text-[var(--example-muted)]"
            >
              {isPending
                ? "Rendering PNG previews..."
                : "Convert selected pages"}
            </Button>
          </form>

          {errorMessage ? (
            <div className="border border-[#b93c0d]/25 bg-[#fff1eb] p-4 text-sm leading-6 text-[#7a2704]">
              <div className="lab-grid-label text-[#7a2704]">
                Conversion error
              </div>
              <p className="mt-2">{errorMessage}</p>
            </div>
          ) : null}

          <div className="border border-[var(--example-border)] bg-[#121418] p-4 text-[0.82rem] leading-6 text-[#c7d2da] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="lab-grid-label text-[#8ea0ad]">
              Live convert() call
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap">
              {snippet}
            </pre>
          </div>
        </div>
      </div>

      <div className="lab-shell rounded-[2rem] p-5 sm:p-6">
        <div className="relative flex h-full flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="lab-grid-label">Result gallery</p>
              <h2 className="lab-section-title mt-2">
                PNG pages ready for OCR or VLMs
              </h2>
            </div>
            {lastRunFileName ? (
              <div className="text-right">
                <p className="lab-grid-label">Last run</p>
                <p className="mt-2 text-sm text-[var(--example-muted)]">
                  {lastRunFileName}
                </p>
              </div>
            ) : null}
          </div>

          {results.length === 0 ? (
            <div className="grid flex-1 place-items-center border border-dashed border-[var(--example-border)] bg-[var(--example-panel-strong)] p-8 text-center">
              <div className="max-w-md space-y-4">
                <div className="lab-grid-label">Awaiting output</div>
                <p className="text-2xl font-semibold tracking-[-0.05em]">
                  Upload a PDF and render a few pages.
                </p>
                <p className="text-sm leading-6 text-[var(--example-muted)]">
                  The preview grid will show lossless PNG pages, their
                  dimensions, and the DPI you selected. Ideal input for OCR or
                  multimodal extraction.
                </p>
                <div className="border border-[var(--example-border)] bg-[var(--example-accent-soft)] p-4 text-left">
                  <p className="lab-grid-label text-[var(--example-ink)]">
                    Parsed page indices
                  </p>
                  <p className="mt-2 font-mono text-sm">
                    {parsedPages.ok
                      ? `[${parsedPages.pages.join(", ")}]`
                      : parsedPages.message}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {results.map((page) => (
                <article
                  key={`${page.pageIndex}-${page.width}-${page.height}`}
                  className="overflow-hidden border border-[var(--example-border)] bg-[var(--example-panel-strong)]"
                >
                  <div className="flex items-center justify-between border-b border-[var(--example-border)] px-4 py-3">
                    <div>
                      <p className="lab-grid-label">
                        Page {page.pageIndex + 1}
                      </p>
                      <p className="mt-1 text-sm text-[var(--example-muted)]">
                        {page.width} × {page.height}px
                      </p>
                    </div>
                    <Badge className="rounded-none border border-[var(--example-border)] bg-transparent px-2 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--example-muted)]">
                      {page.dpi} DPI
                    </Badge>
                  </div>
                  <div className="bg-[#f6f2e7] p-4">
                    <Image
                      alt={`Converted preview for page ${page.pageIndex + 1}`}
                      className="w-full border border-[var(--example-border)] bg-white shadow-[0_14px_35px_rgba(16,17,20,0.08)]"
                      height={page.height}
                      src={page.src}
                      unoptimized
                      width={page.width}
                    />
                  </div>
                  <dl className="grid grid-cols-3 border-t border-[var(--example-border)] text-sm">
                    <div className="border-r border-[var(--example-border)] px-4 py-3">
                      <dt className="lab-grid-label">Index</dt>
                      <dd className="mt-2 font-mono">{page.pageIndex}</dd>
                    </div>
                    <div className="border-r border-[var(--example-border)] px-4 py-3">
                      <dt className="lab-grid-label">Width</dt>
                      <dd className="mt-2 font-mono">{page.width}</dd>
                    </div>
                    <div className="px-4 py-3">
                      <dt className="lab-grid-label">Height</dt>
                      <dd className="mt-2 font-mono">{page.height}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
