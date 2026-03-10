"use client";

import { useState } from "react";

type ConvertResponse = {
  pages: Array<{
    pageIndex: number;
    width: number;
    height: number;
    dpi: number;
    mimeType: string;
    bytes: number;
  }>;
};

type ConvertError = {
  code: string;
  message: string;
};

export function ConsumerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [error, setError] = useState<ConvertError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError({
        code: "INVALID_INPUT",
        message: "Choose a PDF file before testing the route.",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ConvertError | ConvertResponse;

      if (!response.ok) {
        setError(payload as ConvertError);
        return;
      }

      setResult(payload as ConvertResponse);
    } catch (caughtError) {
      setError({
        code: "RENDER_ERROR",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unexpected client error while submitting the test request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid rgba(17, 17, 17, 0.12)",
        background: "rgba(255, 255, 255, 0.78)",
        padding: "24px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: "16px", maxWidth: "560px" }}
      >
        <label style={{ display: "grid", gap: "8px" }}>
          <span style={{ fontWeight: 600 }}>PDF file</span>
          <input
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>

        <button
          disabled={isSubmitting}
          style={{
            alignItems: "center",
            background: "#111111",
            border: 0,
            color: "#f6f6f0",
            cursor: isSubmitting ? "progress" : "pointer",
            display: "inline-flex",
            fontWeight: 600,
            gap: "8px",
            justifyContent: "center",
            minHeight: "44px",
            opacity: isSubmitting ? 0.7 : 1,
            padding: "0 18px",
          }}
          type="submit"
        >
          {isSubmitting ? "Testing package..." : "Test published package"}
        </button>
      </form>

      {error ? (
        <pre
          style={{
            background: "#1a1a1a",
            color: "#ffb4b4",
            margin: "24px 0 0",
            overflowX: "auto",
            padding: "16px",
          }}
        >
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : null}

      {result ? (
        <pre
          style={{
            background: "#1a1a1a",
            color: "#e8f4e8",
            margin: "24px 0 0",
            overflowX: "auto",
            padding: "16px",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
