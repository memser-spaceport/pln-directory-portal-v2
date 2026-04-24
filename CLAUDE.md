# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Protocol Labs Directory frontend — a Next.js 14.2.3 (App Router) application for browsing and managing members, teams, projects, events, and forum content in the Protocol Labs network. Uses React 18, TypeScript, SCSS modules, and Zustand/React Query for state management.

## Commands

- **Dev server:** `npm run dev` (runs on http://localhost:4200)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (uses next lint with eslint)
- **Format:** `npm run prettier:all` (single quotes, 120 char width)
- **Format check:** `npm run prettier:check`
- **Run all tests:** `npm run test` (Jest with jsdom)
- **Run single test:** `npx jest <path-to-test-file>` or `npx jest --testPathPattern <pattern>`
- **Watch tests:** `npm run test:watch`
- **Storybook:** `npm run storybook` (port 6006)

## Architecture

### App Router Structure (`app/`)

Uses Next.js App Router with route groups. The root page (`/`) redirects to `/members`. Key routes:
- `/members`, `/teams`, `/projects`, `/events`, `/forum` — main listing pages
- `/members/[id]`, `/teams/[id]`, `/projects/[id]` — detail pages
- `/settings`, `/notifications`, `/sign-up`, `/husky/chat` — utility pages
- `/demoday`, `/alignment-asset`, `/changelog` — feature pages
- `/api/` — Next.js API routes (proxy-pdf, revalidate, contact-support, members-search, forum, teams)

Route groups use parenthesized folders (e.g., `members/(members-page)/@content`, `@filters`) for parallel routes and layout composition.

### Authentication Flow

- **Middleware** (`middleware.ts`): Server-side auth via cookies (`authToken`, `refreshToken`, `userInfo`). Validates tokens on every request, refreshes expired tokens, and passes auth state via response headers.
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

### Testing

- **Jest** with `@testing-library/react` — tests mirror the component structure in `__tests__/` (subdirectories: `core/`, `form/`, `page/`, `utils/`)
- **Storybook + Vitest** — `vitest.config.ts` runs Storybook stories as browser tests via Playwright
- Global mocks for `next/navigation`, `next/image`, `@tanstack/react-query`, and `quill-image-uploader` are in `jest.setup.js`

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/services/...`, `@/utils/...`, etc.

### Environment

Copy `.env.example` to `.env` for local setup. Key env vars: `DIRECTORY_API_URL`, `AUTH_API_URL`, `PRIVY_AUTH_ID`, `APPLICATION_BASE_URL`, `COOKIE_DOMAIN`.

## Conventions

- ESLint extends `next/core-web-vitals` — `@next/next/no-img-element` and `jsx-a11y/alt-text` rules are disabled
- Prettier: single quotes, 120 char print width
- Dynamic imports with `{ ssr: false }` are used for client-only components in the root layout
- React Query hooks follow the pattern: fetcher function + `useQuery`/`useMutation` wrapper with query keys from domain constants
