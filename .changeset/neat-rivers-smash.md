---
"@omsimos/pdf-raster": patch
---

Fix the published native loader for Next.js and Turbopack server routes.

The package now resolves its platform binding at runtime without triggering the
`Cannot find module as expression is too dynamic` failure in published
Next.js consumers.
