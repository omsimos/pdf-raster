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
    <section className="grid min-h-screen gap-4 p-4 sm:p-5 lg:h-full lg:min-h-0 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-5 lg:p-5">
      <aside className="lab-shell min-h-0 rounded-[2rem] p-5 sm:p-6">
        <div className="flex h-full flex-col gap-6 lg:overflow-y-auto lg:pr-1">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="lab-grid-label">Example / convert()</p>
              <h1 className="text-[clamp(2rem,2.8vw,3rem)] font-semibold tracking-[-0.08em]">
                PDF to PNG
              </h1>
            </div>
            <Badge className="rounded-none border border-[var(--example-border)] bg-[var(--example-panel-strong)] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--example-muted)]">
              Node
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
            <div className="space-y-4">
              <div>
                <p className="lab-grid-label">Upload</p>
                <p className="mt-3 text-sm leading-6 text-[var(--example-muted)]">
                  Drop a PDF here or browse. The file stays in-memory and the
                  route returns PNG previews directly.
                </p>
              </div>

              <button
                type="button"
                className="w-full border border-[var(--example-ink)] bg-[var(--example-ink)] px-4 py-3 text-left text-sm font-medium text-[var(--example-canvas)] transition-colors hover:bg-[var(--example-accent)]"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? "Replace PDF" : "Select PDF"}
              </button>

              <div className="border border-[var(--example-border)] bg-[var(--example-canvas)]/60 p-4">
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="truncate text-sm font-medium text-[var(--example-ink)]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-[var(--example-muted)]">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--example-muted)]">
                    No PDF selected yet.
                  </p>
                )}
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
                Pages
              </label>
              <Input
                id="page-selection"
                value={pagesInput}
                onChange={(event) => setPagesInput(event.target.value)}
                placeholder="All pages"
                className="rounded-none border-[var(--example-border)] bg-[var(--example-panel-strong)] font-mono"
              />
              <p className="text-sm leading-6 text-[var(--example-muted)]">
                Leave blank to render the full document, or enter
                comma-separated page numbers. Manual selection is capped at{" "}
                {MAX_SELECTED_PAGES} pages in the preview.
              </p>
            </div>

            <div className="grid gap-3">
              <span className="lab-grid-label text-[var(--example-ink)]">
                DPI
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

            <Button
              type="submit"
              disabled={isPending || !selectedFile}
              className="rounded-none border border-[var(--example-ink)] bg-[var(--example-accent)] px-5 text-[var(--example-ink)] hover:bg-[var(--example-ink)] hover:text-[var(--example-canvas)] disabled:border-[var(--example-border)] disabled:bg-[var(--example-panel)] disabled:text-[var(--example-muted)]"
            >
              {isPending ? "Rendering previews..." : "Convert"}
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
        </div>
      </aside>

      <section className="lab-shell min-h-[50vh] min-w-0 rounded-[2rem] p-5 sm:p-6 lg:h-full lg:min-h-0">
        <div className="flex h-full min-h-0 flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="lab-grid-label">Preview</p>
              <h2 className="lab-section-title mt-2">Converted pages</h2>
            </div>
            <div className="text-right">
              {lastRunFileName ? (
                <>
                  <p className="lab-grid-label">Last run</p>
                  <p className="mt-2 max-w-[18rem] truncate text-sm text-[var(--example-muted)]">
                    {lastRunFileName}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--example-muted)]">
                  Render a PDF to see previews.
                </p>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="grid flex-1 min-h-[26rem] place-items-center border border-dashed border-[var(--example-border)] bg-[var(--example-panel-strong)] p-8 text-center">
              <div className="max-w-sm space-y-3">
                <p className="lab-grid-label">Awaiting output</p>
                <p className="text-2xl font-semibold tracking-[-0.05em]">
                  Upload a PDF and convert a few pages.
                </p>
                <p className="text-sm leading-6 text-[var(--example-muted)]">
                  The preview pane will fill with PNG page images and their
                  render metadata.
                </p>
              </div>
            </div>
          ) : (
            <div className="lab-scroll flex-1 overflow-y-auto pr-1">
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
                        sizes="(max-width: 1279px) 100vw, 50vw"
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
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
