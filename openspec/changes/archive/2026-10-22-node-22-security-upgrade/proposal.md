# Proposal

## Why

[LAB-2947](https://linear.app/protocollabs/issue/LAB-2947): Node.js shipped security fixes on 2026-10-21 in 22.23.4, 24.22.1 and 26.12.1. The fixes include a Brotli out-of-bounds write (CVE-2026-111497, High) and TLS hostname verification bypasses (CVE-2026-106069, CVE-2026-106072). The v2 Next.js server makes outbound HTTPS calls to the Directory API, NodeBB and others, and it can decompress `br` responses, so these fixes matter. Today the feature-env Docker image runs Node 20, which is end-of-life and gets no fixes. `engines.node` is `>=20.9.0`, so Vercel does not pin a major. The upgrade must not cause regressions: we prove it with the same tests and smoke checks before and after.

## What Changes

- The `Dockerfile` builds and runs all three stages on `node:22.23.4-alpine`. Today it uses `node:20-alpine`.
- `.nvmrc` pins `22.23.4`, so local runs and the Jest CI run use the patched release that the image ships.
- `package.json` `engines.node` becomes `22.x`. Vercel reads this field and it takes priority over the project setting, so previews, dev and prod all run Node 22.
- In the Vercel dashboard, each project (preview, dev, staging, prod) is set to Node 22.x. This is a manual step outside the repo.
- `AGENTS.md` and `CLAUDE.md` are updated to state the new runtime. The repo rule requires this for stack changes.
- A smoke-check script is added for the regression check. It lives in this change folder, not in app code.
- No app code, dependency or lockfile changes. If an incompatibility forces one, it must be explained in design.md before it lands.

**Out of scope**
- Node 24 or 26. Both have fixes, but a major jump means a larger regression risk.
- The backend upgrade. That is [LAB-2946](https://linear.app/protocollabs/issue/LAB-2946).
- The back-office image. pl-infra-pipeline builds it inline on `node:20.19-bookworm`. Track it as a separate follow-up.
- `pl-design-system/`, which is a separate app with its own `package.json`.
- Changes to the deploy pipeline in pl-infra-pipeline. It builds this repo's `Dockerfile` as-is and does not override the base image.
- Fixing test failures that already fail on `develop` before the upgrade. We record them in the baseline but do not fix them.

## Capabilities

### New Capabilities
- `runtime-platform`: the Node.js runtime the v2 app is built, tested and served on in every environment, and the no-regression bar for changing it.

### Modified Capabilities
None.

## Impact

- **Files:** `Dockerfile`, `.nvmrc`, `package.json` (`engines` only), `AGENTS.md`, `CLAUDE.md`.
- **CI:** the Jest coverage workflow picks up `.nvmrc`, so it moves from 22.23.3 to 22.23.4 with no workflow edit.
- **Deployments:** the feature-env image changes its base image (deploy-feature-env in pl-infra-pipeline). Vercel previews, dev (`develop`), staging and prod (`main`) all use the `engines` field and the project Node setting.
- **Risk areas** to cover by tests: server rendering with outbound HTTPS, `next/image` optimisation through `sharp` (native, musl), API routes (`/api/og`, `/api/forum`, `/api/revalidate`, …), JWT handling in `utils/auth.utils.ts`, and the AI Apps bridge prebuild script.
