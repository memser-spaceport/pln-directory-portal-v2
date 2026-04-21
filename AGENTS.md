# AGENTS.md

## Repository Scope

Treat this repository as a **Next.js frontend monolith** using the App Router.

## Tech Stack

- **Node.js:** Use **18.x LTS** (CI workflow runs on Node 18.x).
- **Next.js:** `14.2.3`
- **React / React DOM:** `^18`
- **TypeScript:** `^5` with `strict: true`
- **Styling:** Sass (`sass`), CSS/SCSS modules, global SCSS in `app/globals.scss` and `styles/index.scss`
- **Data fetching/cache:** native `fetch`, Next cache controls (`cache`, `next.tags`), TanStack Query (`@tanstack/react-query` v5)
- **State:** Zustand (`^5`)
- **Validation/Form:** Zod, Yup, React Hook Form
- **Testing:** Jest (`npm test`), Storybook + Vitest integration
- **Lint/Format:** ESLint (`next/core-web-vitals`, Storybook plugin), Prettier (`singleQuote: true`, `printWidth: 120`)

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
  - `components/form/`: form-specific building blocks
- `services/`
  - Primary business/data access layer (`*.service.ts`)
  - Domain folders with hooks/types/store where needed
- `hooks/`: shared React hooks (`use...`)
- `utils/`: cross-cutting helpers (`fetch-wrapper`, auth helpers, common utilities)
- `providers/`: app-level providers (`QueryProvider`, `StoreInitializer`, analytics, push notifications)
- `constants/`: route constants and shared fixed values
- `types/`: shared TypeScript domain models
- `analytics/`: tracking/event helpers
- `__tests__/`: Jest tests
- `stories/`: Storybook stories
- `public/`: static assets
- `middleware.ts`: auth and route protection at edge boundary

## Next.js App Router Setup

- Keep global providers in `app/layout.tsx`.
- Use route-group layouts for list pages that need parallel routes (`filters`, `content`).
- Keep BFF/proxy logic in `app/api/**/route.ts`; keep upstream service calls in `services/`.
- Use `next/headers` and `cookies()` on server boundaries; avoid client-only APIs in server route handlers.

## Build, Lint, Test, and Run

- Install dependencies: `npm install`
- Start dev server: `npm run dev` (runs on `http://localhost:4200`)
- Build production bundle: `npm run build`
- Start production server: `npm run start`
- Run lint: `npm run lint`
- Run tests: `npm run test`
- Run tests in watch mode: `npm run test:watch`
- Run Storybook: `npm run storybook`

## Agent Rules

1. Keep route UI files inside `app/` and preserve App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`).
2. Keep business logic and upstream API calls in `services/`; keep rendering logic in `components/`.
3. Use `@/*` imports for internal modules; avoid deep relative import chains.
4. Avoid `any` by default; allow it only for documented edge cases where a safe type is impractical or would break required behavior.
5. Define and reuse domain types in `types/*.types.ts` before adding new service or component logic.
6. Keep route handlers in `app/api/**/route.ts` thin; delegate fetching and transformation to `services/`.
7. Standardize API errors to a consistent typed shape (`status`, `statusText` or `message`, optional payload).
8. Validate external inputs (query, body, cookies) at boundaries.
9. Name hooks with `use...` and keep side effects inside `useEffect` or dedicated service utilities.
10. Follow established naming patterns: `*.service.ts`, `*.types.ts`, `*.analytics.ts`, `*.module.scss`.
11. Keep shared UI primitives in `components/ui`, cross-feature shells in `components/core`, and feature UI in `components/page`.
12. Co-locate styles with components using CSS/SCSS modules; avoid new global styles unless they are truly cross-cutting.
13. Reuse existing auth and token utilities (`middleware`, fetch wrapper, auth services) instead of duplicating auth flows.
14. Require tests for new service logic and critical UI behavior; run `npm run lint` and `npm run test` before merge.
