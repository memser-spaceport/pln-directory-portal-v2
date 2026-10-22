# Design

## Discovery record (PRD §3 Step 3)

Answered against `plaa-service` @ `5acbfd4` (origin/main) and `pln-directory-portal-v2` @ `bf6d677eb` (origin/develop), both read on 2026-10-21.

| Question | Answer |
|---|---|
| **Migration tool** | Prisma 5.1.1. Migrations are hand-written SQL under `prisma/migrations/<UTC timestamp>_<snake_name>/migration.sql`. Prisma has no native down migrations, so this change ships `down.sql` beside it, matching the PRD's up/down requirement. |
| **Member UID on the request** | `AuthGuard` resolves the caller's email from the token, looks the member up in the Directory, and attaches `request.memberUid`. Every handler reads it from there; it is never accepted from a body or query. |
| **Member display** | `MembersService.getActiveMembersByUids()` — exactly what `KudosService.enrich()` uses. Unknown uid falls back to `"Former member"` rather than leaking a raw uid, same as kudos. No new profile lookup. |
| **Scheduled work** | No `@nestjs/schedule`. `RecipientsWarmupService` schedules with `setInterval(...).unref()` and `OnModuleInit`. The Linear retry job reuses that pattern, so **no new dependency**. |
| **Multipart** | `@fastify/multipart` is registered in `main.ts` with a 10 MB file limit. The controller consumes `request.parts()` with its own tighter per-file limit of 5 MB. |
| **Outbound HTTP** | `@nestjs/axios` `HttpService` + `firstValueFrom`, as `MembersService` does. The Linear client follows it; tests mock the service, not the network. |
| **Rate limiting** | `@nestjs/throttler` is registered globally (`THROTTLE_TTL` / `THROTTLE_LIMIT`). That is a per-IP transport guard, not a per-member quota, so the PRD's 10-per-24h and 30-per-hour limits are counted in the service against the member's own rows. |
| **Feature flags (portal)** | No flag helper exists. This change follows the established `NEXT_PUBLIC_PLAA_BOT_ENABLED === 'true'` convention: `NEXT_PUBLIC_PLAA_FEEDBACK_BOARD`, off unless exactly `'true'`. |
| **PostHog helper (portal)** | `usePostHog()` wrapped per surface in `analytics/*.analytics.ts`. **Note:** `analytics/feedback.analytics.ts` already exists for the Directory-wide support widget, so this surface uses `analytics/plaa-feedback.analytics.ts`. |
| **E2E runner (portal)** | None found. Per the PRD, none was added. Coverage is route-level + component Jest tests, with the manual QA script in `tasks.md`. |
| **Foundations components** | No Modal, Tabs, Upload or Toast primitives are exported for PLAA pages to reuse; PLAA surfaces (leaderboard, trust-holdings) are self-contained components with scoped styles. This change follows that local convention rather than inventing a shared library. |

## Decisions

### One proxy route, not fourteen

`app/api/plaa/feedback/[...path]/route.ts` is a single catch-all. The upstream owns routing, validation, visibility and every rule; the proxy adds the `Authorization` header the browser cannot send cross-origin, and nothing else. Fourteen near-identical files would be fourteen places to forget a header.

It forwards an allowlist of query params, passes status codes and `Retry-After` through unchanged, and streams a multipart body as raw bytes so the boundary survives.

### Visibility lives in one helper

`FeedbackService.visibilityWhere()` / `canSee()` are the only place that decides who may read an item. List, detail, comments, votes and triage all route through them. A private bug cannot leak through a side path because there is no side path.

A hidden item returns **404, not 403**: a 403 would confirm the item exists.

### Admin allowlist fails closed

`AppConfigService.feedbackAdminMemberUids` trims whitespace and drops blanks, so a trailing comma in Parameter Store cannot mint an admin whose uid is the empty string. An empty or missing value yields **no admins at all**, and every admin endpoint 403s.

### Linear idempotency

`issueCreate` is called with `id = feedback_item.id`. A retry after a lost response hits Linear's duplicate-id error, which the client converts to `LinearDuplicateIdError`; the push then reads that issue back and treats it as success. One feedback item can only ever produce one issue.

### The image buffer is a buffer

`feedback_linear_pending_image` is the only place screenshot bytes touch the PLAA database. Rows are deleted in the same transaction that records a successful push, and the 24-hour sweep deletes them regardless. Nothing reads those bytes except the Linear push.

### Screenshots are sniffed, not trusted

`sniffImageMime()` checks PNG/JPEG/WebP magic bytes. The declared content-type is attacker-controlled; the bytes are not. Validation runs **before** any transaction opens, so a 422 saves nothing. The browser additionally re-encodes through a canvas, which drops EXIF including GPS.

## Risks

- **The service is not yet deployed.** The portal is built against the §5 contract. Until plaa-service ships to `plaa-uat`, the board's requests 404 — which is why the flag ships off.
- **Vote counts are computed, not stored.** Per §4 this is deliberate (ledger over snapshot). If list p95 exceeds 300 ms at 2,000 items / 50,000 votes, add a view, not a counter column.
- **Admins mirror Linear status by hand** in v1. That is the PRD's choice, not an oversight; sync-back is v2.
