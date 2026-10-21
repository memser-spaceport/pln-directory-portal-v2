# Tasks

## plaa-service (branch `BW-Feedback-Feature`)

- [x] T-1 Schema: five tables, three enums, §4 CHECK constraints and partial indexes, with `down.sql`.
- [x] T-1 Verify up and down against a real Postgres 16, including the duplicate-vote, duplicate-without-target, self-duplicate, title-length, non-https-link, 4th-screenshot, 6 MB and non-allowed-MIME rejections.
- [x] T-2 Linear client (`fileUpload`, `issueCreate` with a client-supplied id, single issue read), description template, backoff, 24h sweep.
- [x] T-2 Retry job on the existing `setInterval().unref()` pattern — no new dependency.
- [x] T-3 `/api/v1/feedback/*` behind `AuthGuard` + `PlaaAccessGuard`, one visibility helper, admin allowlist that fails closed.
- [x] T-3 Transactions for create, status change and duplicate merge; Linear push starts after commit.
- [x] Config: `PLAA_FEEDBACK_ADMIN_MEMBER_UIDS`, `LINEAR_*`, `PLAA_SITE_BASE_URL`, all optional.
- [x] `npx tsc --noEmit` clean; `eslint src/feedback/**` clean; `npx jest` 36 suites green.
- [ ] Deploy to `plaa-uat` with a Linear test label and run the §9 end-to-end check.

## pln-directory-portal-v2 (branch `BW-edits-2`)

- [x] T-4 Catch-all proxy at `app/api/plaa/feedback/[...path]/route.ts`; status codes and `Retry-After` pass through; viewer-specific responses marked `private, no-store`.
- [x] T-4 Types, API client and TanStack hooks with optimistic vote and rollback.
- [x] T-5 Give feedback modal with focus management, discard confirmation, per-file errors and canvas EXIF stripping.
- [x] T-6 Ideas list and item detail with timeline, duplicate banner and comments.
- [x] T-7 Roadmap Kanban (tabs under 768px), Completed by month, My submissions, admin Move to, Triage with Linear state and Retry.
- [x] T-8 Nav swap behind `NEXT_PUBLIC_PLAA_FEEDBACK_BOARD`, PostHog events with only the §10 properties.
- [x] `npx tsc --noEmit` clean for all feedback files.
- [x] Jest: 93 tests across 6 suites; full portal suite shows no new failures.
- [ ] Enable the flag on `plaa-uat` and run the manual QA script below.

## Manual QA script (no E2E runner in this repo)

Run on `plaa-uat` with two members and one admin, flag on:

1. Member A submits a feature with 2 screenshots → lands on the item page, receipt toast shown.
2. A Linear issue appears in team PLAA within 5 minutes, with both images and the labels.
3. Member B votes and comments → both appear for member A without a reload.
4. Member A submits a bug → lands on My submissions, bug marked private. Member B cannot open it by URL (404).
5. Admin moves the feature to In Progress with a note → the card moves column, the note shows on the timeline for both members.
6. Admin moves it to Completed → it appears in the Completed column and tab, grouped by month.
7. Admin declines another item with no note → Confirm stays disabled.
8. Resize below 768px → the Roadmap renders as tabs.
9. Flag off → the nav link returns to the Google Form and both board routes 404.

## Gates

- [x] No new lint errors in changed files.
- [x] `tsc` passes in both repos.
- [ ] `openspec validate` passes.
- [ ] Posting guidelines and moderation policy reviewed by Legal (Javier) — the guidelines render marked `data-pending-legal-review`.
- [ ] Linear labels and admin uids set in config.
- [ ] Archive this change in the same PR as the code.
