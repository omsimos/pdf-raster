import { ConsumerClient } from "@/app/consumer-client";

export default function HomePage() {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "960px",
        minHeight: "100vh",
        padding: "48px 24px 80px",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "24px",
        }}
      >
        <header
          style={{
            border: "1px solid rgba(17, 17, 17, 0.12)",
            background: "rgba(255, 255, 255, 0.78)",
            padding: "24px",
          }}
        >
          <div
            style={{
              color: "rgba(17, 17, 17, 0.64)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            npm consumer validation
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Published package smoke test for Next.js.
          </h1>
          <p
            style={{
              color: "rgba(17, 17, 17, 0.72)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "16px 0 0",
              maxWidth: "720px",
            }}
          >
            This app imports <code>@omsimos/pdf-raster</code> directly from the
            published npm package inside a Node.js route handler. Its only goal
            is to confirm the packaged binding loads and converts PDFs correctly
            in a real Next.js consumer.
          </p>
        </header>

        <ConsumerClient />
      </div>
    </main>
  );
}
