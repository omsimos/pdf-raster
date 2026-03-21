# docs

This app is the documentation site for `pdf-raster`, built with
Fumadocs and Next.js.

## Commands

```bash
bun run dev
bun run check-types
bun run build
```

The docs app runs on port `3001` in local development.

## Content layout

- `app/(home)`: landing page
- `app/docs`: documentation routes
- `content/docs`: MDX content for the library
- `lib/source.ts`: Fumadocs content source loader
- `lib/layout.shared.tsx`: shared docs metadata and repo links

## Notes

- the app stays standalone on Fumadocs UI
- `check-types` runs Fumadocs MDX generation, Next type generation, and `tsc`
- docs content is currently focused on `pdf-raster`
