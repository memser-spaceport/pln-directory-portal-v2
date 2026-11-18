# Tasks

Slices: **A** = LAB-3317 (groups 1–5), **B** = LAB-3320 (group 6), **C** = LAB-3321 (group 7), **D** = LAB-3283 (group 8). Each slice is its own branch `lab-3247-<ticket#>` and PR into `lab-3247`. D can go first; B and C need A.

## 1. Flag, data and shared pieces (A)

- [ ] 1.1 Add `utils/events-page.ts` (`SHOW_EVENTS_PAGE_V2`) and `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2=`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=` to `.env.example`; `app/events/all/page.tsx` renders the iframe when off and the new page when on. Verify: a test renders the page with the flag off (iframe present) and on (no iframe).
- [ ] 1.2 `services/events/all-events.service.ts` `getAllEventsPageEvents()` per design D2 (upcoming + capped detail calls, `unstable_cache` 300 s, past events dropped at read time, a failed detail keeps the list fields, "Others" → `city: null`). Verify: unit tests for the mapping, a failed detail, an ended event, and "Others".
- [ ] 1.3 `services/events/all-events.filters.ts`: pure `filterEvents`, `groupByDay`, `topCities`, `nearYou(items, memberCity)` with case-insensitive city matching. Verify: unit tests for each filter key, the going filter, top-5 ordering and ties, and Near you matching "Lisbon" and "lisbon, portugal".
- [ ] 1.4 Filter store via `createFilterStore()` with keys `search`, `city`, `mode`, `going`, `view`, `cal`, `event`, plus `FilterStoreUrlSync`. Verify: a test that a URL with `?view=calendar&mode=Virtual` restores both.
- [ ] 1.5 Port `GoingPill` and `EventImage` (brand fallback) from `prototypes/entries/events-shared` to `components/page/events/`. Verify: Storybook story or render test for each.
- [ ] 1.6 Viewer hooks: going uids (`getMyUpcomingEventUids`) and the member's city, both `enabled` only when signed in; invalidate the going key after the drawer's going and not-going actions. Verify: tests show that a signed-out viewer makes no member request.

## 2. Page shell and sections (A)

- [ ] 2.1 `AllEventsPage` client root: drawer host (`next/dynamic` `EventDrawer`, `source="all-events"`, prefetch on hover), `?event=` opens the drawer and closing removes it through the store. Verify: a test that `?event=<uid>` opens the drawer on load and close clears the key.
- [ ] 2.2 `AllEventsHeader` with "Open PL Events" (new tab) and "Submit an event" (`getSubmitEventUrl()`). Verify: a test asserts both hrefs.
- [ ] 2.3 `NearYou` (3 tiles, plain landing only), `AddLocationRow` (signed-in, no location, links to the profile editor), hidden for signed-out visitors. Verify: tests for the four spec scenarios.
- [ ] 2.4 `CityBand` (top 5, "All N cities" / "Show fewer") and `CityHeader` ("← All cities", count, date range, time zone); tile and City filter share `city`. Verify: tests for choosing and leaving a city.
- [ ] 2.5 `EventsToolbar`: "Coming up" / "Coming up in <city>", count, Filters button with the applied count, view switch (no Map without a key), sticky under `--app-header-height`. Verify: a test that the count and the view switch follow the store; check sticky by hand in the browser.

## 3. Filters (A)

- [ ] 3.1 Desktop rail on `FiltersSidePanel` (closed by default, close control, Clear All) with search, City, Mode and "Events I'm going to" (signed-in only); a facet with fewer than 2 values is hidden. Verify: tests for open, close, clear and the hidden facet.
- [ ] 3.2 Chips under the toolbar while the rail is closed, each removable. Verify: the "Removing a chip" scenario as a test.
- [ ] 3.3 Phone: `MobileFilterWrapper` sheet on a white bar with the view menu. Verify: check at 375 px in the browser with no horizontal scroll.

## 4. List view and states (A)

- [ ] 4.1 `ListView` + `EventCard`: day groups with a sticky date label, timeline on desktop, time with UTC offset in the event's time zone, "Day n of m", host when known, place line ("Online", "also online"), Going pill, faces and count, picture. Verify: tests for the multi-day and online scenarios.
- [ ] 4.2 Loading skeleton, empty ("Clear filters") and error ("Try again", header kept) states, used by every view. Verify: tests for the empty and error scenarios.

## 5. Analytics and spec checks (A)

- [ ] 5.1 Add `all-events` to `EventDrawerSource`; add `events-view-changed`, `events-filters-applied` and `events-city-selected` (constants plus `useEventsAnalytics` methods); fire only on user changes. Verify: tests with the PostHog mock for each event, and none on the first load.
- [ ] 5.2 Compare the page with the prototype (`/prototypes/events-page-redesign` and its states) on the local dev server, desktop and 375 px. Verify: screenshots side by side; differences listed in the PR.

## 6. Calendar view (B)

- [ ] 6.1 `calendar/weeks.ts`: week and month maths in the event's time zone, with multi-day spans clipped to the week. Verify: unit tests for spans across week and month edges.
- [ ] 6.2 `WeekBoard` (default): day headers (today, past dimmed), span cards on top, day cards by start time, "city · UTC±n", previous and next week; phones stack by day and skip empty days. Verify: tests for the "Event across days" scenario and the phone stacking.
- [ ] 6.3 `MonthGrid`: per-week bars, today's disc, day number opens Week on that week, previous and next month. Verify: the "Day number opens its week" scenario as a test.
- [ ] 6.4 `?event=` in Calendar opens the event's week with the card marked. Verify: the "Link to one event in Calendar" scenario as a test.

## 7. Map view (C)

- [ ] 7.1 `services/events/city-coords.service.ts` + `GET /api/events/city-coords` per design D3 (parse the degree strings, fixes table, drop "Others", `unstable_cache` one day). Verify: unit tests for the parser with `"15.8700° N"`, `"77.5946° E"`, a south or west value and the Berlin fix.
- [ ] 7.2 `map/loadGoogleMaps.ts` (bootstrap once, `importLibrary`); no key → the view switch hides Map and `?view=map` falls back to List. Verify: tests for the no-key scenario.
- [ ] 7.3 `EventsMap`: city pins with counts (`AdvancedMarkerElement`), going ring, selected ring, "Show all" `fitBounds`, + / − and the slider (hidden on phones), `gestureHandling: 'greedy'`, `CityPinCard` for shared pins, online list below. Verify: on the feature env with a key, every upcoming city has a pin at the right place; wheel zoom doesn't scroll the page.
- [ ] 7.4 `?event=` in Map centres the event's city and marks its pin. Verify: by hand on the feature env, plus a unit test of the centre and zoom choice.

## 8. Drawer (D)

- [ ] 8.1 Remove the gathering block and its unused styles from `EventDrawerView`; keep the gathering data for going and plans. Verify: update `__tests__/page/events/event-drawer-view.test.tsx` and `event-drawer.test.tsx` (no "Lisbon gathering", going and plans unchanged).
- [ ] 8.2 `EventSummary`: place row (Online / address / "also online") and access row with `AccessIcon` and its copy; no mode or access badges. Verify: tests for the hybrid, access-unknown and agenda-and-tags scenarios.
- [ ] 8.3 Update the drawer story (`EventDrawerView.stories.tsx`) to the new rows. Verify: Storybook builds the story.

## 9. Close each slice

- [ ] 9.1 `npm run lint`, `npx tsc --noEmit`, `npm run test` and `npm run prettier:check` pass on each slice PR. Verify: the command output in the PR.
- [ ] 9.2 `npx -y @fission-ai/openspec@1.14.1 validate lab-3247-all-events-page --json` passes. Verify: `"valid": true`.

## Workflow follow-up

- Archive this change (`/opsx:archive`) in the PR of the last slice to merge into `lab-3247`, so `openspec/specs/events/spec.md` changes with the code.
- Feature env `lab-3247` with `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2=true` (and the Maps vars when available), then `/lab-goal test`.
- Prod flag only after the backend's full sync and details backfill (Mykyta).
