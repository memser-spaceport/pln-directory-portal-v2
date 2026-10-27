# Design

## Context

Reproduced on a local `next dev` against the dev API on 2026-10-26, code at `9ad04f6ea`:

- **Completed view.** `app/demoday/[demoDayId]/completed/page.tsx` already fetches the Demo Day on the server and passes it to `DemodayCompletedView`. The view returned `<DemoDayPageSkeleton />` while `useGetDemoDaysList()` loaded. A client query never resolves during server rendering, so the server HTML was always the skeleton. That list only picks the next open Demo Day for the apply modal, which already renders only once it has one.
- **Landing page.** `Landing` passed its server-fetched state to `useGetDemoDayState` as `initialData`. `DemoDayStats`, in the root layout above `<main>`, reads the same query first with no data, and React Query applies `initialData` only for the observer that creates the query. So `data` was undefined and the page rendered its skeleton on the server, and in the browser until it fetched.
- **Unknown id.** The dev API answers 404 for an unknown slug. The landing page caught that as "no state" and rendered the skeleton, under its own canonical.
- **Rich-text description.** Demo Day descriptions are HTML with their own `<p>`s. `PageTitle` and the completed view injected them into a `<p>`. A browser's HTML parser cannot nest paragraphs, so the parsed DOM no longer matched React's tree and hydration failed. Nobody saw this while the server sent a skeleton.
- **Countdown.** The landing page's countdown counts from the current time, so a server render cannot match the browser's first render.
- **Team cards.** A completed Demo Day's team card is a link to the team profile, and a team with news shows an "updates" badge, a second link inside the first. The HTML parser cannot nest links either, so the card came apart from server HTML and hydration failed (React error #418, found in a browser pass).
- **Shared cache.** The server `QueryClient` is a process-wide singleton (`providers/QueryProvider.tsx`), so server data must reach components as props, never through the cache.

## Decisions

### D1. The completed view never waits for the Demo Days list

The `isLoading` early return goes. The page's content comes from the server state it already receives.

### D2. The landing page shows its server state as `placeholderData`

`useGetDemoDayState` takes an optional `placeholderData`, and `Landing` passes its server state there instead of `initialData`. Placeholder data is per observer, so it works whoever created the query, and it never enters the shared cache. The browser still fetches the viewer's own state on mount, as before. `window.location.reload()` for a non-`none` access is now reachable on the server and is guarded to the browser.

_Alternative:_ render from `data ?? initialDemoDayState` in `Landing`. Rejected: the same pattern as LAB-2922, and it keeps feeding `initialData` toward a process-wide cache.

### D3. 404 only for an API 404

A small helper, `isDemoDayMissing`, reads the server action's result. Both pages call `notFound()` when it is true. These routes have no `loading.tsx`, so the page's `notFound()` is still a real 404 status (checked locally). The helper lives beside the routes because `demo-day.actions.ts` is a `'use server'` module, which may only export async functions.

### D4. Rich-text descriptions render in a `<div>`

`PageTitle` and the completed view render the description into a `<div>` with the same class. Both class rules are class-only, so nothing changes visually.

### D5. The countdown renders from hydration on

`CountdownComponent` renders nothing until hydration, using the existing `useIsClient` hook. It has no SEO value, and its other two hosts are client-rendered dashboards.

### D6. The team card's news badge renders from hydration on

`PastTeamCard` shows its news badge only after hydration (`useIsClient`), so the server HTML has no link inside a link. That is when it appeared before, when the whole page rendered in the browser. Restructuring the card so the two links are siblings (a stretched card link) would remove the nesting itself, along with React's development warning about it. It is a design change, so it is left as a follow-up.

## Risks / Trade-offs

- [A signed-in investor or founder sees a different first paint] → The server still redirects them before rendering, as before.
- [The landing page shows the server state until the viewer's fetch lands] → It is the same API response, fetched with the viewer's cookie on the server.
