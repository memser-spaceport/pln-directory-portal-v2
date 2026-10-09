# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Protocol Labs Directory frontend — a Next.js 16.2.3 (App Router) application for browsing and managing members, teams, projects, events, and forum content in the Protocol Labs network. Uses React 19.2.5, TypeScript, SCSS modules, and Zustand/React Query for state management. Node 22 (`.nvmrc`), npm (`package-lock.json`; `.npmrc` sets `legacy-peer-deps=true`).

## Commands

- **Dev server:** `npm run dev` (runs on http://localhost:4200; `predev` builds the AI Apps bridge first)
- **Build:** `npm run build` (`prebuild` builds the AI Apps bridge first)
- **Lint:** `npm run lint` (ESLint 9 CLI, `eslint . --ext .ts,.tsx`, flat config in `eslint.config.mjs`)
- **Format:** `npm run prettier:all` (single quotes, 120 char width)
- **Format check:** `npm run prettier:check`
- **Run all tests:** `npm run test` (Jest with jsdom)
- **Run single test:** `npx jest <path-to-test-file>` or `npx jest --testPathPattern <pattern>`
- **Watch tests:** `npm run test:watch`
- **Storybook:** `npm run storybook` (port 6006)

## Architecture

### App Router Structure (`app/`)

Uses Next.js App Router with route groups. The root page (`/`) redirects to `/home`. Key routes:
- `/home`, `/members`, `/teams`, `/projects`, `/events`, `/forum`, `/jobs` — main listing pages
- `/members/[id]`, `/teams/[id]`, `/projects/[id]` — detail pages
- `/settings`, `/notifications`, `/sign-up`, `/ai-search` (AI Search; old `/husky` URLs redirect) — utility pages
- `/demoday`, `/alignment-asset`, `/changelog` — feature pages
- `/api/` — Next.js API routes (ai-apps, contact-support, design-canvas, forum, jobs, members-search, og, plaa, revalidate, spotlight, teams)

Route groups use parenthesized folders (e.g., `members/(members-page)/@content`, `@filters`) for parallel routes and layout composition.

Next 16 request APIs are async: `await cookies()` / `await headers()`, and page/layout `params` and `searchParams` are Promises (`params: Promise<{ id: string }>`).

### Authentication Flow

- **Proxy** (`proxy.ts`, the Next 16 name for middleware): Server-side auth via cookies (`authToken`, `refreshToken`, `userInfo`). Validates tokens on every request, refreshes expired tokens, and passes auth state via response headers.
- **Client-side**: `getCookiesFromHeaders()` in `utils/next-helpers.ts` reads auth state from headers in Server Components. Client components use `getCookiesFromClient()` from `utils/third-party.helper.ts`.
- **Fetch wrapper** (`utils/fetch-wrapper.ts`): `customFetch()` handles authenticated API calls with automatic token refresh and retry on 401.
- **Auth provider**: Privy (`@privy-io/react-auth`) for login.

### State Management

Two patterns coexist:
1. **Zustand stores** (`services/*/store.ts`) — lightweight client state (user profile image, filter state). Filter stores use a generic factory `createFilterStore()` from `services/filters/`.
2. **React Query** (`@tanstack/react-query`) — server state, data fetching, and cache invalidation. Hooks live in `services/*/hooks/use*.ts`. Query keys are defined as enums in `services/*/constants.ts`. The `QueryProvider` wraps the app in `providers/QueryProvider.tsx`.

### Services Layer (`services/`)

Organized by domain (members, teams, events, projects, forum, demo-day, search, notifications, etc.). Each domain typically has:
- `*.service.ts` — API call functions (server-side compatible, use `fetch` directly with `process.env.DIRECTORY_API_URL`)
- `hooks/use*.ts` — React Query hooks wrapping service functions
- `constants.ts` — query key enums
- `store.ts` — Zustand store (if needed)

Backend API base URL: `process.env.DIRECTORY_API_URL` (e.g., `/v1/members`, `/v1/teams`).

### Component Organization (`components/`)

- **`ui/`** — Reusable, stateless UI primitives (tooltips, spinners, tabs, modals, tags, dialogs)
- **`core/`** — App-wide components (navbar, login, register dialogs, toast, loader, mobile nav, office-hours rating)
- **`form/`** — Form-specific components
- **`page/`** — Page-specific components organized by feature (members, teams, projects, events, forum, demo-day, onboarding, settings, etc.)
- **`icons/`** — Icon components

### Styling

- **SCSS Modules** — components use co-located `.module.scss` files
- **Global styles** — `styles/colors.scss` (CSS custom properties), `styles/media.scss` (responsive breakpoint mixins), `styles/mixins.scss`
- **Breakpoints**: mobile (<640px), tablet-portrait (640-959px), tablet-landscape (960-1199px), desktop (1200px+)
- **Responsive mixins**: `@include mobile-only`, `@include tablet-portrait`, `@include tablet-landscape`, `@include desktop`, etc. (defined in `styles/media.scss`)

### Form Validation

Uses both **Zod** (`schema/`) and **Yup** for form validation, with **react-hook-form** (`@hookform/resolvers`) for form state management.

### Analytics

PostHog integration. Analytics event functions are in `analytics/*.analytics.ts`, organized by feature domain.

To comment current-cycle Linear issues with related PostHog events, run the `posthog-linear-events` skill (`.claude/skills/posthog-linear-events/`). Requires Linear MCP.

### Testing

- **Jest 29** with `@testing-library/react` — tests live in `__tests__/` and mirror the source structure (e.g. `core/`, `page/`, `ui/`, `services/`, `utils/`, `hooks/`); `proxy.test.ts` covers `proxy.ts`. Jest ignores `pl-design-system/`, `prototypes/` and `design-canvas/`.
- **Storybook 9 + Vitest 3** — `vitest.config.ts` runs Storybook stories as browser tests via Playwright (Chromium)
- Global mocks for `next/navigation`, `next/image`, `next/cache`, `@tanstack/react-query`, `nuqs`, `react-quill-new`, and `quill-image-uploader` are in `jest.setup.js`

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/services/...`, `@/utils/...`, etc.

### Environment

Copy `.env.example` to `.env` for local setup. Key env vars: `DIRECTORY_API_URL`, `AUTH_API_URL`, `PRIVY_AUTH_ID`, `APPLICATION_BASE_URL`, `COOKIE_DOMAIN`.

## Conventions

- ESLint flat config extends `eslint-config-next/core-web-vitals` and the Storybook plugin — `@next/next/no-img-element` and `jsx-a11y/alt-text` rules are disabled
- Prettier: single quotes, 120 char print width
- Client-only components for the root layout are `dynamic(..., { ssr: false })` exports in `app/ClientDynamics.tsx` (a `'use client'` module; `ssr: false` is not allowed in Server Components)
- React Query hooks follow the pattern: fetcher function + `useQuery`/`useMutation` wrapper with query keys from domain constants

## Agent skills

### Issue tracker

GitHub Issues on this repo (`memser-spaceport/pln-directory-portal-v2`), via the `gh` CLI. Planned work is specced in Linear as `LAB-####`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root, neither of which exists yet — the skills create them lazily. See `docs/agents/domain.md`.

## Keep this file current

When a PR changes the stack (framework or runtime versions, package manager, scripts, test or lint tooling, folder conventions), the same PR updates this file and `AGENTS.md`. Specs under `openspec/specs/` describe product behaviour; this file describes how to work in the repo.
