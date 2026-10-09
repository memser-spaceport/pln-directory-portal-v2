# AGENTS.md

## Repository Scope

Treat this repository as a **Next.js frontend monolith** using the App Router.

## Tech Stack

- **Node.js:** **22** (`.nvmrc`). `package.json` `engines` requires `>=20.9.0` (the Next 16 minimum); the Docker image builds on `node:20-alpine`.
- **Package manager:** npm (`package-lock.json`). `.npmrc` sets `legacy-peer-deps=true`.
- **Next.js:** `16.2.3` (App Router)
- **React / React DOM:** `19.2.5`
- **TypeScript:** `^5` with `strict: true`
- **Styling:** Sass (`sass`), CSS/SCSS modules, global SCSS in `app/globals.scss` and `styles/index.scss`
- **Data fetching/cache:** native `fetch`, Next cache controls (`cache`, `next.tags`), TanStack Query (`@tanstack/react-query` v5)
- **State:** Zustand (`^5`); URL query state with `nuqs`
- **Validation/Form:** Zod, Yup, React Hook Form
- **Testing:** Jest 29 (`npm test`, jsdom); Storybook 9 stories run as Vitest 3 browser tests (Playwright, Chromium) via `vitest.config.ts`
- **Lint/Format:** ESLint 9 flat config in `eslint.config.mjs` (`eslint-config-next/core-web-vitals`, Storybook plugin; ignores `pl-design-system/`), Prettier (`singleQuote: true`, `printWidth: 120`)

## Directory Map

- `app/`
  - Next App Router routes (`page.tsx`, `layout.tsx`, `loading.tsx`)
  - Route handlers under `app/api/**/route.ts`
  - Route groups and parallel routes (example: `app/members/(members-page)/@filters`, `@content`)
  - Dynamic segments (examples: `[id]`, `[demoDayId]`, `[slug]`)
- `components/`
  - `components/page/`: feature/page-specific UI
  - `components/core/`: cross-page app shell and shared flows
  - `components/ui/`: reusable presentational primitives
  - `components/common/`: shared building blocks (`Badge`, `Button`, `Modal`, `Tabs`, ...)
  - `components/form/`: form-specific building blocks
  - `components/icons/`: icon components
- `services/`
  - Primary business/data access layer (`*.service.ts`)
  - Domain folders with hooks/types/store where needed
- `hooks/`: shared React hooks (`use...`)
- `utils/`: cross-cutting helpers (`fetch-wrapper`, auth helpers, common utilities)
- `providers/`: app-level providers (`QueryProvider`, `StoreInitializer`, analytics, push notifications)
- `constants/`: route constants and shared fixed values
- `types/`: shared TypeScript domain models
- `analytics/`: tracking/event helpers
- `schema/`: Zod form schemas
- `styles/`: global SCSS (`colors.scss`, `media.scss`, `mixins.scss`)
- `__tests__/`: Jest tests
- `stories/`: Storybook stories
- `public/`: static assets
- `prototypes/`: isolated AI UI previews (mocked data only); see [prototypes/README.md](prototypes/README.md)
- `app/prototypes/`: routes for `/prototypes` index and `/prototypes/[key]` detail pages
- `proxy.ts`: auth and route protection (Next 16 name for the former `middleware.ts`)
- `ai-apps-bridge/`: AI Apps bridge source; `scripts/build-ai-apps-bridge.mjs` builds it before `dev` and `build`
- `design-canvas/`: dev-only design canvas tooling; see [design-canvas/README.md](design-canvas/README.md)
- `pl-design-system/`: separate Next 14 / React 18 design-system app with its own `package.json` and `CLAUDE.md`; excluded from this app's `tsconfig.json`, ESLint and Jest

## Next.js App Router Setup

- Keep global providers in `app/layout.tsx`.
- Use route-group layouts for list pages that need parallel routes (`filters`, `content`).
- Keep BFF/proxy logic in `app/api/**/route.ts`; keep upstream service calls in `services/`.
- Use `next/headers` on server boundaries; `cookies()` and `headers()` are async (`await cookies()`); avoid client-only APIs in server route handlers.
- Page and layout `params` and `searchParams` are Promises: type them as `params: Promise<{ id: string }>` and `await` them.

## Build, Lint, Test, and Run

- Install dependencies: `npm install`
- Start dev server: `npm run dev` (runs on `http://localhost:4200`; `predev` builds the AI Apps bridge first)
- Build production bundle: `npm run build` (`prebuild` builds the AI Apps bridge first)
- Start production server: `npm run start` (port 4200)
- Run lint: `npm run lint` (`eslint . --ext .ts,.tsx`)
- Check formatting: `npm run prettier:check` (fix with `npm run prettier:all`)
- Run tests: `npm run test`
- Run tests in watch mode: `npm run test:watch`
- Run Storybook: `npm run storybook` (port 6006)

## Agent Rules

1. Keep route UI files inside `app/` and preserve App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`).
2. Keep business logic and upstream API calls in `services/`; keep rendering logic in `components/`.
3. Avoid deep relative import chains.
4. Avoid `any` by default; allow it only for documented edge cases where a safe type is impractical or would break required behavior.
5. Define and reuse domain types in `types/*.types.ts` before adding new service or component logic.
6. Keep route handlers in `app/api/**/route.ts` thin; delegate fetching and transformation to `services/`.
7. Standardize API errors to a consistent typed shape (`status`, `statusText` or `message`, optional payload).
8. Validate external inputs (query, body, cookies) at boundaries.
9. Name hooks with `use...` and keep side effects inside `useEffect` or dedicated service utilities.
10. Follow established naming patterns: `*.service.ts`, `*.types.ts`, `*.analytics.ts`, `*.module.scss`.
11. Keep shared UI primitives in `components/ui`, cross-feature shells in `components/core`, and feature UI in `components/page`.
12. Co-locate styles with components using CSS/SCSS modules; avoid new global styles unless they are truly cross-cutting.
13. Reuse existing auth and token utilities (`proxy.ts`, fetch wrapper, auth services) instead of duplicating auth flows.
14. Require tests for new service logic and critical UI behavior; run `npm run lint` and `npm run test` before merge.
15. One component per file. Never define multiple components in a single file. Co-locate SCSS modules with components: `ComponentName.tsx` + `ComponentName.module.scss` in the same directory. Never import styles from unrelated feature directories.
16. Follow the established service layer structure under `services/`: service functions in `services/{domain}/{domain}.service.ts`, TanStack Query hooks in `services/{domain}/hooks/use...ts`, and query keys as a typed enum in `services/{domain}/constants.ts` (e.g., `DealsQueryKeys`). Never use inline string query keys.
17. Always use `customFetch()` from `@/utils/fetch-wrapper` for authenticated API requests. Never use raw `fetch()` with `credentials: 'include'` directly — this bypasses automatic token refresh handling.
18. Before creating a new component, check for existing components that can be extended or adapted. Extract generic behavior into reusable components in `components/core/` or `components/ui/`. Never duplicate components with minor variations.
19. When adding navigation items, update both desktop (`navbar/`) and mobile (`MobileBottomNav/`) navigation. Include proper icons and selected states for mobile nav items.

## AI prototypes

Interactive mocked UIs live at `/prototypes` when enabled (`PROTOTYPES_ENABLED`; on in development by default, off in production). All prototype code stays under `prototypes/`; do not change production `components/`, `services/`, or feature routes to build one.

To add a prototype: create `prototypes/entries/<key>/` (component + `mocks.ts`), register it in `prototypes/registry.ts`, verify `/prototypes` and `/prototypes/<key>`. Full workflow and rules: [prototypes/README.md](prototypes/README.md).

## Analytics/Event Tracking Conventions

- **Event names:** kebab-case in format `{domain}-{action}` or `{domain}-{context}-{action}` (e.g., `job-clicked`, `jobs-page-viewed`, `jobs-filters-applied`)
- **Constants:** `ON_{DOMAIN}_{ACTION}` in `utils/constants.ts` (e.g., `ON_JOBS_PAGE_VIEWED: 'jobs-page-viewed'`)
- **Analytics hooks:** Create in `analytics/{domain}.analytics.ts`, prefix handlers with `on` (e.g., `onJobClicked`), include user properties (`is_authenticated`, `loggedInUserUid`, etc.)
- **Linear comments:** skill `posthog-linear-events` documents current-cycle tickets (past In Progress) with events from call sites. Requires Linear MCP. Dry-run supported.

## Keep This File Current

When a PR changes the stack (framework or runtime versions, package manager, scripts, test or lint tooling, folder conventions), the same PR updates this file and `CLAUDE.md`. Specs under `openspec/specs/` describe product behaviour; this file describes how to work in the repo.
