# First Release Guide

This repository is set up for two release modes:

- `v0.1.0`: one-time manual publish from your local machine
- all later releases: Changesets + GitHub Actions trusted publishing

The first release must be manual because npm trusted publishing can only be
enabled after the package already exists on npm.

## Prerequisites

- npm account or org access for the `@omsimos` scope
- npm publish auth already working locally:
  - `npm whoami`
  - `npm access ls-packages omsimos` if you are publishing under an org
- npm 2FA configured if your account/org requires it
- GitHub Actions permissions to run workflows and download artifacts

## First release workflow (`v0.1.0`)

1. Create a release branch from `main`.

```bash
git checkout main
git pull --ff-only
git checkout -b codex/release-v0.1.0
```

2. Version the packages locally with Changesets.

```bash
bun run version-packages
```

This should update `@omsimos/pdf-raster` from `0.0.0` to `0.1.0`.

3. Commit the versioned release files on the release branch.

4. Push the branch and run the `Native Artifacts` workflow for that branch.

This workflow builds all six platform artifacts and uploads them as:

- `native-darwin-x64`
- `native-darwin-arm64`
- `native-linux-x64-gnu`
- `native-linux-arm64-gnu`
- `native-win32-x64-msvc`
- `native-win32-arm64-msvc`

5. Download all uploaded artifacts into `core/artifacts`.

After extraction, you should have:

- `core/artifacts/darwin-x64`
- `core/artifacts/darwin-arm64`
- `core/artifacts/linux-x64-gnu`
- `core/artifacts/linux-arm64-gnu`
- `core/artifacts/win32-x64-msvc`
- `core/artifacts/win32-arm64-msvc`

Each directory must contain the matching `.node` file plus the bundled PDFium
shared library.

6. Prepare the npm package directories locally.

```bash
bun run --cwd core prepare-npm-packages
```

7. Dry-run pack the root package and generated target packages.

```bash
npm pack --dry-run ./core
for dir in core/npm/*; do
  npm pack --dry-run "$dir"
done
```

8. Publish the first release from your local machine.

```bash
bun run release:publish:manual
```

This command enforces that all six platform artifacts are present and publishes
the target packages first, then publishes `@omsimos/pdf-raster` last.

9. Smoke-test the published package on your local platform from a clean temp
project.

Minimum acceptance path:

- install `@omsimos/pdf-raster` from npm
- import `convert`
- convert a known PDF fixture
- confirm no manual PDFium setup is required

10. Merge the release branch after npm publish and smoke testing succeed.

## Important notes

- The first manual publish does **not** produce npm provenance.
- Do not merge the versioned release branch before the manual npm publish
  succeeds.
- Do not use `bun run release:publish` for the first release. That command is
  reserved for trusted publishing in GitHub Actions.

## After `v0.1.0`

1. Configure npm trusted publishers for:

- `@omsimos/pdf-raster`
- `@omsimos/pdf-raster-darwin-x64`
- `@omsimos/pdf-raster-darwin-arm64`
- `@omsimos/pdf-raster-linux-x64-gnu`
- `@omsimos/pdf-raster-linux-arm64-gnu`
- `@omsimos/pdf-raster-win32-x64-msvc`
- `@omsimos/pdf-raster-win32-arm64-msvc`

2. In GitHub repository variables, set:

```text
NPM_TRUSTED_PUBLISHING_ENABLED=true
```

3. After that, future releases can use the existing Changesets + GitHub Actions
release workflow with provenance.
