export const DPI_OPTIONS = [150, 300, 450] as const;
export const DEFAULT_DPI = 300;
export const DEFAULT_PAGE_INPUT = "1";
export const MAX_SELECTED_PAGES = 6;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type SupportedDpi = (typeof DPI_OPTIONS)[number];

type ParsedPageSelection =
  | { ok: true; pages: number[] }
  | { ok: false; message: string };

export function parsePageSelection(input: string): ParsedPageSelection {
  const raw = input.trim();

  if (raw.length === 0) {
    return { ok: true, pages: [0] };
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { ok: true, pages: [0] };
  }

  const pages: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return {
        ok: false,
        message: "Enter page numbers as comma-separated integers like 1, 2, 4.",
      };
    }

    const pageNumber = Number(part);
    if (pageNumber < 1) {
      return {
        ok: false,
        message: "Page numbers start at 1 in this example app.",
      };
    }

    const zeroBasedPage = pageNumber - 1;
    if (!seen.has(zeroBasedPage)) {
      pages.push(zeroBasedPage);
      seen.add(zeroBasedPage);
    }

    if (pages.length > MAX_SELECTED_PAGES) {
      return {
        ok: false,
        message: `Select up to ${MAX_SELECTED_PAGES} pages for this preview demo.`,
      };
    }
  }

  return { ok: true, pages };
}
