# Tasks

All work happens in the `lab-2947` worktree (`~/Work/PLN/pln-directory-portal-v2-lab-2947`, branched from `origin/develop` at 78fb88453). Write each results file under `<scratchpad>/lab-2947/`. Run every Jest command with `TZ=UTC`. Run npm with `--cache <scratchpad>/npm-cache` because the sandbox blocks writes to `~/.npm`.

## 1. Baseline on the old runtimes (no code changes yet)

- [x] 1.1 Under Node 22.23.3 (`nvm use 22.23.3`), run `npm ci`, `npm run lint`, `TZ=UTC npm test -- --coverage`, `npm run build` and `npx vitest run --project storybook`. Save each exit code and the list of failing suites/tests to `baseline-22.23.3.txt`. Done when the file has all five results. Failures are expected and only recorded here.
- [x] 1.2 Write `openspec/changes/node-22-security-upgrade/smoke.sh <base-url> [cookie]`. It requests `/`, `/members`, `/teams`, `/projects`, `/events`, `/forum`, `/jobs`, `/ai-search`, `/explore-pl-network`, the first member/team/project detail link found on the list pages, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, an `/api/og/...` image, a `/_next/image?url=…&w=64&q=75` image, and an unknown path (404 expected). For each it prints `path status content-type data-marker`. With a cookie it also requests `/settings`, `/notifications` and `/pl-infra/ai-apps`. Done when `bash -n` passes and a run against `https://directoryv2.dev.os.pl.xyz` (the dev v2 host on Vercel) prints one line per path.
- [x] 1.3 Build the current image: `docker build -t v2:node20 .` with a `.env.production` that points at the dev APIs (copy the feature-env block in pl-infra-pipeline `deploy-feature-env.yaml` and use dev hosts). Run it on port 4200, then save `smoke.sh http://localhost:4200` to `smoke-node20.txt` and the container log to `log-node20.txt`. Done when both files exist and `docker run --rm v2:node20 node -v` prints `v20.x`.
- [ ] 1.4 Read the latest dev and prod Vercel build logs (the user has dashboard access), note the Node version each uses today, and note whether the "automatically upgrade" engines warning appears. Done when both versions are written in `baseline-vercel.txt`. If either is 24.x, flag it on the ticket (design.md decision 5).

## 2. Upgrade the runtime declarations

- [x] 2.1 Set `ARG NODE_VERSION=22.23.4` in `Dockerfile`, and update the header comment if it names a version. Done when `grep -n NODE_VERSION Dockerfile` shows `22.23.4` and all three `FROM` lines use the ARG.
- [x] 2.2 Set `.nvmrc` to `22.23.4` and `package.json` `engines.node` to `22.x`. Leave dependencies alone; in `package-lock.json` change only the root `packages[""].engines` copy so it matches `package.json`. Done when the lockfile diff is that one line and stays unchanged after `npm ci` on 22.23.4.
- [x] 2.3 Update the Node line in `AGENTS.md` (Node 22.23.4 pinned in `.nvmrc`, `engines` `22.x`, image on `node:22.23.4-alpine`) and the matching text in `CLAUDE.md`. Done when `grep -n "node:20\|>=20.9" AGENTS.md CLAUDE.md` finds nothing.

## 3. Same checks on the new runtime

- [x] 3.1 Under Node 22.23.4 (`nvm install 22.23.4`), rerun the five commands from 1.1 and save the output to `after-22.23.4.txt`. Done when `npm ci` shows no `EBADENGINE` for the Node version and the pass/fail set is identical to `baseline-22.23.3.txt`. If a check fails only on 22.23.4, stop and investigate before going on.
- [x] 3.2 Run `node scripts/build-ai-apps-bridge.mjs` on 22.23.4 and check that it writes the same output as on 22.23.3. Done when a diff of the generated bridge files is empty.
- [x] 3.3 Build `docker build --no-cache -t v2:node22 .` with the same `.env.production`. Done when the build passes and `docker run --rm v2:node22 node -v` prints `v22.23.4`.
- [x] 3.4 Run the new container on port 4200, then save `smoke.sh` output to `smoke-node22.txt` and the log to `log-node22.txt`. Done when `diff smoke-node20.txt smoke-node22.txt` shows no changes in status or content type, `/_next/image` answers 200 `image/*`, and `log-node22.txt` has no error lines that are missing from `log-node20.txt`.
- [x] 3.5 Run `npm run lint` and `TZ=UTC npm run test` once more on the final branch state. Done when the results match `after-22.23.4.txt`.
- [x] 3.6 Run `openspec validate node-22-security-upgrade --json`. Done when it reports `valid: true`.

## 4. Pull request, feature env and Vercel preview

- [x] 4.1 Commit the change (Conventional Commit, `chore(infra): run v2 on Node 22.23.4 (LAB-2947)`, stage only the files from group 2 and this change folder, never `git commit -a`). Push `lab-2947` and open the PR to `develop` with the before/after results in the body. Done when the PR exists and the Jest coverage check is green with `v22.23.4` in its setup-node log.
- [ ] 4.2 Deploy feature env `lab-2947` (feature-env skill, `frontend_ref=lab-2947`). Done when `kubectl exec` on the directory-portal pod prints `v22.23.4` for `node -v`, and `smoke.sh https://directory-portal-lab-2947.os.pl.xyz` matches `smoke-node22.txt` in status and content type.
- [ ] 4.3 Check the Vercel preview of the PR. Its build log must show Node.js 22.x with no auto-upgrade warning. Run `smoke.sh https://pr-<n>.preview.dev.os.pl.xyz`. Then sign in and run it with the cookie, and in a browser click through the signed-in pages from the spec (settings, notifications, AI Apps dashboard, AI search query, a forum thread). Done when all pass with no new console or server errors.
- [ ] 4.4 Set Node.js to 22.x in each Vercel project's settings (preview/dev/staging/prod; user action). Done when the user confirms each project.
- [x] 4.5 Archive the change in this PR before merging (repo rule: specs change only when the code merges). Group 5 is checked off before archiving if it is already done; otherwise its results go on the ticket. Done when `openspec/specs/runtime-platform/spec.md` exists and the change is under `openspec/changes/archive/`.

## 5. Release and environment checks

- [ ] 5.1 Merge the PR to `develop`. Done when the dev Vercel build log shows Node.js 22.x (record the full version; if it is below 22.23.4, note it on the ticket), and `smoke.sh https://directoryv2.dev.os.pl.xyz` with and without the cookie matches the preview results.
- [ ] 5.2 Push to prod through the develop → main PR, following the lab-ticket-workflow prod push and other-authors check. Done when the prod Vercel build log shows Node.js 22.x and `smoke.sh https://os.pl.xyz` passes with no 5xx.
- [ ] 5.3 Comment on LAB-2947. Explain that dev and prod run on Vercel, so the "node -v in the pod" check applies only to feature envs. Include the before/after results and the Vercel versions, mention the back-office image follow-up, then move the ticket to Done. Done when the comment is posted.
