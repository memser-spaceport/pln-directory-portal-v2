# PLAA Module — Developer Guide

This document is the entry point for developers working on the **PL Alignment Asset (PLAA)** module in the Protocol Labs Directory portal.

PLAA is a shared rewards program that connects network-wide contributions to monthly snapshot periods. Participants collect points through incentivized activities; points may convert into PLAA1 tokens. This frontend module exposes program information, round dashboards, activity catalogs, legal pages, and authenticated participant views (points and leaderboards).

---

## Table of Contents

1. [Naming & Routes](#naming--routes)
2. [Architecture Overview](#architecture-overview)
3. [Directory Map](#directory-map)
4. [Pages & Navigation](#pages--navigation)
5. [Data Sources](#data-sources)
6. [Backend Integration](#backend-integration)
7. [Round System](#round-system)
8. [Authentication & Guest Access](#authentication--guest-access)
9. [Styling Conventions](#styling-conventions)
10. [Analytics](#analytics)
11. [Botpress Webchat](#botpress-webchat)
12. [Environment Variables](#environment-variables)
13. [Common Developer Tasks](#common-developer-tasks)

---

## Naming & Routes

There are two naming conventions in the codebase — be aware of both:

| Context | Name | Example |
|---------|------|---------|
| Public URL | `alignment-asset` | `/alignment-asset/overview` |
| Component folder | `aligement-assets` *(historical typo)* | `components/page/aligement-assets/` |
| Code/constants | `plaa` | `constants/plaa.ts`, `services/plaa/` |

All user-facing routes live under **`/alignment-asset`**. Component imports use the `@/components/page/aligement-assets/...` path alias.

---

## Architecture Overview

The module follows the repository's standard Next.js App Router pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│  app/alignment-asset/          Route entry points (SSR)         │
│    layout.tsx                  Shared layout + Botpress chat    │
│    page.tsx                    Current round (default landing)  │
│    [feature]/page.tsx          Static content pages             │
│    rounds/[round]/page.tsx     Past round pages (SSG)           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  components/page/aligement-assets/   Feature UI                 │
│    plaa-layout-wrapper.tsx       Sidebar, mobile menu, guest UX │
│    rounds/                       Round dashboards & sections      │
│    activities/                   Activity catalog               │
│    points-dashboard/             Authenticated points view      │
│    overview/, faqs/, etc.        Content pages                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  services/plaa/    services/points/    app/api/plaa/
  (leaderboard)     (React Query)       (API proxy)
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                    PLAA Backend API
                  (PLAA_API_URL env var)
```

**Server vs client split**

- **Server components** (`app/alignment-asset/**/page.tsx`) fetch leaderboard data via `getLeaderboard()` and pass it as props.
- **Client components** handle interactivity: round selector, points dashboard, activity modals, analytics, mobile navigation.
- **Static data files** (`rounds/data/*.data.ts`, `activities/data/activities.data.ts`) hold copy, stats, charts, and fallback leaderboard rows until fully API-driven.

---

## Directory Map

```
app/alignment-asset/
├── layout.tsx                 # Metadata, PlaaLayoutWrapper, BotpressWebchat
├── page.tsx                   # Current round page (SSR leaderboard)
├── plaa.module.css            # Shared layout styles (sidebar, mobile menu)
├── overview/page.tsx
├── activities/page.tsx
├── incentive-model/page.tsx
├── faqs/page.tsx
├── product-versions/page.tsx
├── terms-of-use/page.tsx
├── privacy-policy/page.tsx
├── disclosure/page.tsx
└── rounds/[round]/page.tsx    # Past rounds (generateStaticParams)

components/page/aligement-assets/
├── plaa-layout-wrapper.tsx    # Shell: sidebar, mobile drawer, scroll reset
├── plaa-menu.tsx              # Left nav + round selector slot
├── plaa-round-selector.tsx    # Round dropdown / prev-next navigation
├── plaa-back-btn.tsx
├── guest-access-modal/        # One-time guest prompt per session
├── rounds/
│   ├── current-round-component.tsx
│   ├── past-round-component.tsx
│   ├── sections/              # Reusable round page sections
│   ├── data/
│   │   ├── current-round.data.ts   # Active round master data
│   │   ├── round-{n}.data.ts       # Past round static data (1–16)
│   │   └── past-rounds-registry.ts # round number → data lookup
│   └── types/current-round.types.ts
├── activities/
│   ├── activities-component.tsx
│   ├── data/activities.data.ts
│   └── sections/              # Hero, table, detail modal
├── points-dashboard/
│   ├── points-dashboard.tsx
│   └── points-round-selector.tsx
├── overview/overview-page.tsx
├── faqs/faqs.tsx
├── incentive-model/incentive-model.tsx
├── product-versions/product-versions.tsx
├── terms-of-use/terms-of-use.tsx
├── privacy-policy/privacy-policy.tsx
└── disclosure/disclosure.tsx

services/plaa/
├── leaderboard.service.ts     # Server-side fetch to PLAA API
└── leaderboard.utils.ts       # Entry mapping & type splitting

services/points/hooks/usePoints.ts   # Client hooks → /api/plaa/points

app/api/plaa/points/route.ts   # Server-side API proxy for authenticated points

constants/plaa.ts              # Shared URLs and contact email
utils/plaa-round.utils.ts      # Round ↔ calendar month mapping
analytics/alignment-assets.analytics.ts
components/core/navbar/components/PlaaBanner/   # In-module promo carousel
```

---

## Pages & Navigation

### Sidebar menu (`plaa-menu.tsx`)

| Label | Route | Notes |
|-------|-------|-------|
| *(Round selector)* | `/alignment-asset` or `/alignment-asset/rounds/{n}` | Current round uses root URL |
| Overview | `/alignment-asset/overview` | Program introduction |
| Incentive Model | `/alignment-asset/incentive-model` | Point-to-token mechanics |
| Activities | `/alignment-asset/activities` | Searchable activity catalog |
| Product Versions | `/alignment-asset/product-versions` | Release history |
| FAQ | `/alignment-asset/faqs` | Searchable accordion |
| Feedback | External Google Form | Opens in new tab |
| Terms of Use | `/alignment-asset/terms-of-use` | |
| Privacy Policy | `/alignment-asset/privacy-policy` | |
| Disclosure | `/alignment-asset/disclosure` | |

The round selector and layout wrapper hard-code `currentRound` and `totalRounds` (currently **17**). Update these in **`plaa-layout-wrapper.tsx`** and **`plaa-menu.tsx`** when advancing to a new round.

### Round URLs

| URL | Purpose |
|-----|---------|
| `/alignment-asset` | **Current round** dashboard |
| `/alignment-asset/rounds/5` | **Past round** 5 (static params 1–16) |

Requesting the current round number at `/alignment-asset/rounds/{n}` redirects to `/alignment-asset`.

---

## Data Sources

### 1. Static master data (primary for round content)

Each round's copy, stats, charts, buyback tables, and fallback leaderboard rows live in typed data files:

- **Current round:** `rounds/data/current-round.data.ts` → exports `currentRoundData`
- **Past rounds:** `rounds/data/round-{n}.data.ts` → registered in `past-rounds-registry.ts`

Types are defined in `rounds/types/current-round.types.ts` (`CurrentRoundData`, `IPastRoundData`, section-specific interfaces).

When updating round content (paragraphs, chart values, buyback bids, stats), edit the relevant `.data.ts` file. The section components in `rounds/sections/` consume these structures.

### 2. PLAA Backend API (live leaderboard & points)

| Endpoint (via env) | Used by | Purpose |
|--------------------|---------|---------|
| `GET /api/v1/leaderboard?roundNumber={n}` | `leaderboard.service.ts` | Leaderboard entries (server-side, 5 min revalidate) |
| `GET /api/v1/points/me` | `/api/plaa/points` API proxy | User lifetime points |
| `GET /api/v1/points/me?snapshotPeriod=YYYY-MM` | `/api/plaa/points` API proxy | Per-snapshot activity records |

Leaderboard entries are split by `type`:

| API `type` | UI usage |
|------------|----------|
| `CURRENT_SNAPSHOT` | Current-round leaderboard tab |
| `CUMULATIVE` | All-time leaderboard tab |


### 3. Activities catalog

All incentivized activities are defined in `activities/data/activities.data.ts`. The activities page supports deep-linking via URL hash (`#activity-id`).

---

## Backend Integration

### Leaderboard (server)

```typescript
// app/alignment-asset/page.tsx
import { getLeaderboard } from '@/services/plaa/leaderboard.service';

const { data: leaderboardResponse } = await getLeaderboard(roundNumber);
```

`getLeaderboard()` reads the `authToken` cookie when present (optional auth). Responses are cached with `next: { revalidate: 300 }`.

### Points (client → API proxy → PLAA API)

Client hooks in `services/points/hooks/usePoints.ts` call the local API proxy at `/api/plaa/points`, which forwards the `Authorization: Bearer` header to the PLAA API. Returns `null` on 403/404 (user not enrolled or no data).

The points dashboard is rendered only when an `authToken` cookie exists (`current-round-component.tsx`, `past-round-component.tsx`).

---

## Round System

### Round ↔ calendar mapping

Defined in `utils/plaa-round.utils.ts`:

- **Round 1** = February 2025
- Each round = one calendar month
- `getRoundDateInfo(roundNumber)` returns `{ snapshotPeriod: "YYYY-MM", label, ... }`

Use `snapshotPeriod` when calling the points API for a specific round.

### Adding a new round (monthly release checklist)

When a new snapshot period begins:

1. **Archive current round**
   - Copy `current-round.data.ts` → `round-{n}.data.ts` (adjust `meta.isCurrentRound`, hero badge, etc.)
   - Register the new file in `past-rounds-registry.ts`

2. **Create new current round data**
   - Update `current-round.data.ts` with new round number, dates, stats, chart, buyback data, copy

3. **Update round counters**
   - `plaa-layout-wrapper.tsx`: `totalRounds`, `currentRound`
   - `plaa-menu.tsx`: default props for `PlaaRoundSelector`

4. **Verify routing**
   - `/alignment-asset` shows the new round
   - `/alignment-asset/rounds/{previous}` renders archived data
   - Redirect from `/alignment-asset/rounds/{current}` → `/alignment-asset`

5. **Update banners / promos** (if applicable)
   - `components/core/navbar/components/PlaaBanner/PlaaBanner.tsx`

6. **Smoke-test API integration**
   - Leaderboard loads for new `roundNumber`
   - Authenticated points dashboard shows correct `snapshotPeriod`

---

## Authentication & Guest Access

| State | Behavior |
|-------|----------|
| **Guest** (no `authToken`) | Public pages visible; points dashboard and leaderboard hidden; one-time `GuestAccessModal` per browser session |
| **Authenticated** | Points dashboard + leaderboard sections visible; API calls include Bearer token |

Guest modal logic: `guest-access-modal/GuestAccessModalController.tsx` uses `sessionStorage` key `plaa_guest_modal_shown`.

Most PLAA pages are **public** — no middleware gate on `/alignment-asset`. Participant-specific data is gated in components and API responses.

---

## Styling Conventions

The module uses a mix of styling approaches — follow existing patterns per area:

| Area | Approach |
|------|----------|
| Layout shell | CSS module — `app/alignment-asset/plaa.module.css` (BEM: `plaa__sidebar`, `plaa__content`, …) |
| Sidebar menu | `styled-jsx` in `plaa-menu.tsx` (BEM: `plaa-menu__item`, …) |
| Round selector | `styled-jsx` in `plaa-round-selector.tsx` |
| Points dashboard | CSS module — `points-dashboard.module.css` |
| Round sections | `styled-jsx` scoped per section component |
| Content pages (FAQ, terms, overview) | `styled-jsx` with BEM class names |
| PlaaBanner | SCSS module — `PlaaBanner.module.scss` |

When adding new UI:

- Use **BEM** naming (`block__element--modifier`)
- Prefer **styled-jsx** for new section components unless the area already uses a CSS module
- Do not import styles across unrelated feature directories

---

## Analytics

All PLAA events are centralized in `analytics/alignment-assets.analytics.ts` via the `useAlignmentAssetsAnalytics()` hook.

**Event naming:** `alignment-assets-{context}-{action}` (PostHog)

Examples:

- `alignment-assets-nav-menu-clicked`
- `alignment-assets-leaderboard-view-toggle-clicked`
- `alignment-assets-activities-row-clicked`

Scroll depth tracking uses `hooks/useScrollDepthTracking.ts` on key pages (`current-round`, `activities`, past rounds).

When adding interactive elements, wire analytics through the existing hook rather than calling PostHog directly.

---

## Botpress Webchat

The **Activity Assistant** is a Botpress-powered chat widget embedded on all PLAA routes. It helps participants find answers about activities, rounds, and program mechanics without leaving the module.

### Scope & mounting

The widget is mounted once in `app/alignment-asset/layout.tsx` via a dynamically imported client component (`BotpressWebchat` from `app/ClientDynamics.tsx`, `ssr: false`). It appears on every page under `/alignment-asset/**` and is **not** loaded elsewhere in the portal.

### Feature flag

Webchat is **opt-in**. Nothing loads unless:

```bash
NEXT_PUBLIC_BOTPRESS_WEBCHAT_ENABLED=true
```

When disabled or unset, `BotpressWebchat` renders nothing and skips script injection.

### How it loads

On mount, `components/core/botpress/BotpressWebchat.tsx` injects two scripts in order:

1. **Inject script** — Botpress webchat runtime (`inject.js` from Botpress CDN)
2. **Config script** — Bot-specific configuration hosted on Botpress Cloud

URLs are defined in `components/core/botpress/constants.ts` and can be overridden with env vars (see [Environment Variables](#environment-variables)). Script loading and DOM cleanup live in `components/core/botpress/botpress-webchat.utils.ts`.

On unmount (e.g. navigating away from PLAA), `unloadBotpressWebchat()` removes widget nodes, both script tags, and the `window.botpress` global so the chat does not leak into other routes.

### Styling

Botpress injects its launcher onto `document.body`, outside React and CSS module scope. Mobile positioning is adjusted globally in `styles/botpress-webchat.scss` so the launcher sits above the PLAA mobile navigation bar (`bottom: calc(64px + safe-area-inset-bottom)`).


---

## Environment Variables

Add to `.env.local` (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `PLAA_API_URL` | Yes (for live data) | Base URL for PLAA backend (leaderboard + points) |
| `NEXT_PUBLIC_BOTPRESS_WEBCHAT_ENABLED` | No | Set to `true` to enable the Activity Assistant on PLAA pages (see [Botpress Webchat](#botpress-webchat)) |
| `NEXT_PUBLIC_BOTPRESS_INJECT_SCRIPT_URL` | No | Override Botpress inject script URL (default in `constants.ts`) |
| `NEXT_PUBLIC_BOTPRESS_CONFIG_SCRIPT_URL` | No | Override Botpress bot config script URL (default in `constants.ts`) |
| `APPLICATION_BASE_URL` | Yes | Used in layout metadata / OG tags |

Without `PLAA_API_URL`, the points API proxy returns 500; leaderboard service logs errors and components use static fallback data.

---

## Common Developer Tasks

### Update FAQ content

Edit `faqs/faqs.tsx`. FAQs support search, expand/collapse all, and anchor links (e.g. `#point-to-token-conversion`).

### Add or edit an activity

Edit `activities/data/activities.data.ts`. Each activity needs a unique `id` (used for URL hash deep links). Update the activity table and modal via `activities-component.tsx`.

### Change support / disclosure links

Shared constants in `constants/plaa.ts`:

```typescript
export const DISCLOSURE_URL = '/alignment-asset/disclosure';
export const SUPPORT_URL = '...';
export const SUPPORT_EMAIL = 'plaa-wg@plrs.xyz';
export const ACTIVITY_FORM_URL = '...';
```

Round data files import these for consistent linking.

### Update the promo banner carousel

Edit `BANNER_CONTENTS` in `components/core/navbar/components/PlaaBanner/PlaaBanner.tsx`. The banner renders only when `pathname` includes `alignment-asset`.

### Run locally

```bash
npm install
npm run dev   # http://localhost:4200
```

Visit `http://localhost:4200/alignment-asset`. Set `PLAA_API_URL` for live leaderboard/points. Set `NEXT_PUBLIC_BOTPRESS_WEBCHAT_ENABLED=true` to test the Activity Assistant.

---