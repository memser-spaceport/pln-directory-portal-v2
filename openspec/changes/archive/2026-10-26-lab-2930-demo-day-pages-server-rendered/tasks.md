# Tasks

One PR from `lab-2930` into `develop`. Server-HTML checks fetch the page without cookies and strip scripts and styles before reading the text.

## 1. Completed view in the server HTML (D1, D4)

- [x] 1.1 Drop the `isLoading` skeleton from `DemodayCompletedView`. Verify: `__tests__/page/demo-day/demoday-completed-view-server-render.test.tsx` renders the name, description and team links with every client query pending, and fails with the early return restored.
- [x] 1.2 Render the description in a `<div>`. Verify: `demoday-completed-view-hydration.test.tsx` hydrates the server HTML with no recoverable error, and reports one with the `<p>` restored.
- [x] 1.3 Render the team card's news badge from hydration on (D6). Verify: the hydration test, with a team that has news and the real card, reports a recoverable error with the badge back in the server HTML.

## 2. Landing page in the server HTML (D2, D4, D5)

- [x] 2.1 Add `placeholderData` to `useGetDemoDayState` and use it in `Landing`. Verify: `demoday-landing-server-render.test.tsx` renders the name with the real React Query and a reader mounted first, and fails with `initialData` restored.
- [x] 2.2 Render the countdown from hydration on, and guard the reload to the browser. Verify: the countdown test fails with the server guard removed.

## 3. Unknown Demo Days are 404s (D3)

- [x] 3.1 `notFound()` on an API 404 in both pages. Verify: `__tests__/app/demoday-pages-not-found.test.tsx` covers 404, 500 and a thrown fetch.

## 4. Check it

- [x] 4.1 Local `next dev` and `next start` against the dev API: completed and landing pages carry their `<h1>` and content, unknown ids answer 404 with `noindex`. Result (2026-10-26): `/demoday/plw26/completed` has its name, the "Participating teams" section and 5 team links; `/demoday/pl-demo-day-june` and `/demoday/partner26-1` have their names and descriptions; both unknown-id URLs answer 404.
- [x] 4.2 Browser pass: signed out, the landing page hydrates and the countdown appears; signed in, an investor is still redirected to their view. Result (2026-10-26): with dev React, `/demoday/plw26/completed`, `/demoday/pl-demo-day-june` and `/demoday/partner26-1` hydrate with no error. The completed view's news badges appear after hydration.
- [x] 4.3 Add Demo Day checks to `npm run seo:check`. Result (2026-10-26): they pass on the local build and fail on `os.pl.xyz` for the three reasons above.

## Follow-up

- After release, run `npm run seo:check -- https://os.pl.xyz` and Search Console's URL Inspection live test on one completed Demo Day, then validate the duplicates report again.
- Restructure `PastTeamCard` so its news badge is not a link inside the card's link (D6).
