import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-16 md:px-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_320px] lg:items-start">
        <section className="space-y-6">
          <p className="text-sm font-medium text-fd-muted-foreground">
            omsimos / native pdf rasterization
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Documentation for @omsimos/pdf-to-images
            </h1>
            <p className="max-w-2xl text-lg text-fd-muted-foreground">
              Convert PDFs into page images with a small native API. This site
              covers installation, the `convert()` API, and practical usage
              patterns for backend and document workflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
            >
              Open docs
            </Link>
            <Link
              href="https://github.com/omsimos/pdf-to-images"
              className="inline-flex items-center rounded-md border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground"
            >
              GitHub repo
            </Link>
          </div>
        </section>

        <aside className="rounded-lg border border-fd-border bg-fd-card p-5">
          <h2 className="text-sm font-semibold text-fd-foreground">
            Start here
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              href="/docs/installation"
              className="block rounded-md px-3 py-2 text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Installation
            </Link>
            <Link
              href="/docs/quickstart"
              className="block rounded-md px-3 py-2 text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Quickstart
            </Link>
            <Link
              href="/docs/api-reference"
              className="block rounded-md px-3 py-2 text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              API reference
            </Link>
            <Link
              href="/docs/examples-ocr-vlm"
              className="block rounded-md px-3 py-2 text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Integration examples
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
