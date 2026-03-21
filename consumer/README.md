# consumer

Minimal Next.js app that validates the published `pdf-raster` npm
package in a real server-route consumer.

This app is a root-level verification app for the published npm package. It is
not part of the main workspace build graph, so the repo does not depend on the
currently published npm package for everyday development.

## Usage

```bash
bun install --cwd consumer
bun run --cwd consumer dev
bun run --cwd consumer build
```

`dev` and `build` both exercise a normal Next.js server-route import of the
published package, which makes this app useful as a release-confidence check.
