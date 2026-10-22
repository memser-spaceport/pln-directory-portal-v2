# Design

## Context

See proposal.md for why we upgrade. This section covers the parts of the current setup that decide how we do it. Each fact was checked on `develop` at 78fb88453 and pl-infra-pipeline `main` at 8ed1481 on 2026-10-22.

| Where the app runs | How Node is chosen today | Version today |
|---|---|---|
| Feature envs (k8s, `*-lab-<n>.os.pl.xyz`) | pl-infra-pipeline `deploy-feature-env.yaml` runs `docker buildx build .` on this repo's `Dockerfile` as-is, without overriding the base image | `node:20-alpine`, which is end-of-life |
| Vercel: previews, dev (`develop`), staging, prod (`main`, `os.pl.xyz`) | `dev-deploy.yml` calls Vercel deploy hooks. Vercel takes `engines.node` before the project's Node setting | `engines` is `>=20.9.0`, an open range. Vercel then warns "will automatically upgrade" and may pick its newest major (24.x). **The actual version is unknown until we read a build log** |
| Jest CI (`jest-coverage.yml`) | `node-version-file: .nvmrc` | `.nvmrc` is `22`, so 22.23.3 on the last run (LAB-2810) |
| Local | nvm reads `.nvmrc` | 22.23.3 |

Other facts:

- The ticket's AC "Dev runs the new image (check `node -v` in the pod)" does not match how we deploy. Dev and prod are not k8s pods; they are Vercel deployments (`os.pl.xyz` answers `server: Vercel`). Only feature envs run the image. We check dev and prod through the Vercel build log and smoke checks instead, and we report this to the ticket.
- `node:22.23.4-alpine` is on Docker Hub. Node's release index marks v22.23.4 (2026-10-21) as a security release.
- The image uses native code: `sharp@^0.33.5` for `next/image` in standalone mode. sharp ships prebuilt musl binaries built on N-API, which do not depend on the Node major. We still check this at runtime because a broken sharp only fails when an image is requested.
- Next 16.2.3 needs Node `>=20.9`. `@posthog/nextjs-config` needs `>=22.22.0`, so we already run on 22.x locally and in CI. Jest has run on Node 22 in CI since LAB-2810.
- The search found no code that uses APIs removed between Node 20 and 22 (import `assert {type}`, `punycode`, `url.parse`, `new Buffer`, `process.binding`). Server code that uses Node built-ins: `utils/auth.utils.ts` (jsonwebtoken), `app/api/plaa/activity-bot/route.ts`, and the `runtime = "nodejs"` routes under `app/api/design-canvas/*`.
- Known red baseline: two Jest suites (`article-content-utils` formatDate and `experience-cv-import-mount` date range) fail outside UTC. They have nothing to do with Node, so we always run Jest with `TZ=UTC`. Storybook stories that import `@/styles` do not compile in Storybook (alias gap), so the Storybook Vitest project probably has failures before the upgrade too.

## Goals / Non-Goals

**Goals:**
- Every runtime from the table runs Node 22 at 22.23.4 or later, and we prove it per environment.
- Show there is no regression by running the same checks on the old and the new runtime for the same commit, then comparing the results.

**Non-Goals:**
- Do not refresh dependencies or the lockfile. Fewer moving parts makes before/after comparison possible.
- Do not change the pl-infra-pipeline workflow.
- Do not fix test failures that already exist before the upgrade.

## Decisions

1. **Pin exactly `22.23.4` in `.nvmrc` and the Dockerfile `ARG NODE_VERSION`.** The alternative was a floating `22` / `22-alpine`. A floating tag is not reproducible: the feature-env cache could reuse an old layer, and nothing would prove which patch release we ship. With an exact pin, CI tests the same release the image runs, and the next security bump is one visible diff. The cost is that later 22.x patches need a manual bump. We accept that because the same applies to the backend (LAB-2946).

2. **`engines.node` becomes `22.x`, not `>=22.23.4 <23`.** Vercel only uses the major from `engines`, and `22.x` is the form its docs show, so we avoid a parse surprise. The patch floor comes from the exact pins in decision 1. For Vercel, Vercel patches its 22.x runtime itself. npm still warns when someone uses 20 or 24 locally.

3. **Before/after comparison on one commit, not "tests are green".** First we capture a baseline on `develop` with the old runtimes: Node 22.23.3 for lint, Jest, build and Storybook tests, and the current Node 20 image for the container smoke. Then we run the same commands on 22.23.4 and the new image. The pass criterion is "same results", so failures that already exist before the upgrade do not hide new ones and do not block the change on their own.

4. **Smoke check as a script stored in the change folder** (`openspec/changes/node-22-security-upgrade/smoke.sh`). The script takes a base URL, requests the main pages, the API routes, image optimisation, OG images and SEO files, and prints the status, content type and a data marker for each. We run it against the old and the new local container, the feature env, the Vercel preview, dev and prod, and diff the output. Keeping it in the change folder means it is archived with the change and adds no app code.

5. **Vercel version is read from the build log, not assumed.** Before merging we read the current dev and prod build logs to learn the Node version they really use today. If they run 24.x, this change is a 24 → 22 move on Vercel, not 20 → 22. It still satisfies the ticket, but then the Vercel preview smoke must pass before we merge.

## Risks / Trade-offs

- [Vercel runs 24.x today, so `22.x` is a downgrade there] → Read the build logs first (decision 5). The preview deployment of the PR must pass the full smoke and the signed-in checks before merge. The ticket requires 22, and 24 would be a separate decision.
- [Vercel's 22.x runtime may still be on 22.23.3 for some days] → The build log shows the full version. If it is below 22.23.4, record it on the ticket and check again later. We do not control Vercel's patch rollout.
- [sharp or another native binary fails on the new base image] → The local container smoke requests `/_next/image`. The build stage compiles native packages from source with `python3 make g++` on the new base, so a failed compile breaks the build early, not at runtime.
- [Behaviour change in the bundled undici/fetch, TLS or zlib breaks outbound calls] → This is the reason for the upgrade, but stricter TLS hostname checks could reject a misconfigured upstream. The smoke checks pages that use live data from the Directory API, forum (NodeBB), PLAA and Husky against dev, and we compare server logs between the old and new container.
- [Old Docker layers mask the change in feature envs] → The `node` version is in the `FROM` tag, so the base layer changes and every later layer is rebuilt. We confirm with `node -v` in the pod.
- [The other-authors check on the develop → main push] → This follows the lab-ticket-workflow prod push rules. It is not specific to this change.

## Migration Plan

1. Open the PR to `develop` from branch `lab-2947`. It must have CI green, a passing Vercel preview smoke, and a passing feature env `lab-2947` smoke.
2. Set Node 22.x in each Vercel project's settings, so it stays correct even if `engines` is removed later.
3. Merge. Then check the dev Vercel build log and run the smoke on dev.
4. Push to prod through the normal develop → main PR. Then check the prod build log and run the smoke on prod.

**Rollback:** revert the PR, which brings back `node:20-alpine`, `.nvmrc 22` and `engines >=20.9.0`. Then redeploy (a Vercel redeploy or a new feature-env deploy). No data or schema changes, so rollback is safe at any point.

## Open Questions

- Which Vercel projects serve preview, dev, staging and prod? There may be one project or several, and the user needs dashboard access to check. This does not change the code. It only decides how many projects need the setting.
- Is the final list of CVEs in the official Node.js security post the same as the advance notice the ticket used? This only affects the wording on the ticket, not the target version.
