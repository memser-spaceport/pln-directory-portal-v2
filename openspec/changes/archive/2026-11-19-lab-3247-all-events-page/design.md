# Design

## Context

See proposal.md for why. The constraints that shape the approach, checked on 2026-11-18:

- **No list endpoint.** The backend has `GET /v1/irl/events/upcoming` (uid, name, externalId, websiteUrl, logo, gathering name as `location`, `locationUid`, flag, dates, `goingCount`; optional `days`, `limit`, `sort=soonest`) and `GET /v1/irl/events/:uid` (adds `type`, `details`, `hosts`, `faces`, the gathering's `timezone`, banner, description). Prod has **7** upcoming events, so loading every event's detail is cheap. Phase 1 makes no backend change (Goal decision).
- **Thin data on prod.** `details` (tags, access, format, host, sponsors, agenda) is empty for every prod event until the backend runs the details backfill (`POST /v1/irl/events/sync {"detailsOnly":true}`, LAB-3214). `type` (`IN_PERSON` / `VIRTUAL` / `HYBRID`) is set. So mode is filterable now; host, access and tags are not.
- **City coordinates are only on `GET /v1/irl/locations`.** It is 2.6 MB and takes about 2.7 s. Its values are messy: `"15.8700° N"` strings, Berlin stored at `51.23, 6.77` (Düsseldorf), and a placeholder gathering named "Others". The gathering name is free text in mixed case ("new york", "abu dhabi").
- **The drawer exists** (`components/page/events/EventDrawer`, flag `NEXT_PUBLIC_SHOW_EVENT_DRAWER`). Each host keeps its own `eventUid` state and renders `<EventDrawer eventUid source onClose />`. Home loads it with `next/dynamic` and prefetches the detail on hover (`usePrefetchEventDetail`).
- **Filter parts exist.** `createFilterStore` + `FilterStoreUrlSync` (`services/filters`), `FiltersSidePanel`, `FilterSection`, `GenericCheckboxList`, `GenericFilterToggle`, `FilterSearchInput`, `MobileFilterWrapper` (`components/common/filters`). The prototype's rail (`prototypes/entries/events-page-redesign/EventsFilterView.tsx`) already uses them over a mock store with the same `FilterState` shape.
- **The prototype is on develop**, with mocked data: `events-page-redesign/*`, `events-shared/GoingTag`, `EventImage`, and `event-drawer-redesign/AccessIcon` and `EventDrawer`. Its map is a hand-made slippy map over Esri tiles; production uses Google Maps.
- **Viewer data.** The member's going events: `getMyUpcomingEventUids(memberUid)` (`GET /v1/members/:uid/events?group=upcoming`). The member's place is the most specific of `location.city`, `metroArea`, `region` and `country` on the member record (the picker can store a location with no city: about one member in nine on dev; a city-state such as Singapore is saved as a country only, and still matches its events).

## Goals / Non-Goals

**Goals:**

- One server loader shapes every upcoming event once, so all three views, Near you and Browse by city read the same array.
- Filtering, grouping and view switching happen in the browser over that array, with no request per filter.
- The page code lives outside `prototypes/`. The prototype stays as the design reference and is not imported by production code.

**Non-Goals:**

- No backend change, no new list endpoint, and no venue coordinates (phase 2, LAB-3281).
- No change to the drawer's going, plans or attendees behaviour beyond removing the gathering block and adding fact rows.
- No Going pill outside `/events/all`.

## Decisions

### D1. Flag at the route, iframe kept

`utils/events-page.ts` exports `SHOW_EVENTS_PAGE_V2 = process.env.NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2 === 'true'`, the same pattern as `utils/event-drawer.ts`. `app/events/all/page.tsx` renders `AllEventsPage` when it is on, and `ScheduleSection` (the iframe) when it is off. The new page needs the drawer, so it also requires `SHOW_EVENT_DRAWER`, which is already on in prod. Turning the flag off is the rollback.
*Alternative:* replace the iframe outright. Rejected: the page would show fewer events than the iframe until the backend runs a full sync (LAB-3247 Q10).

### D2. One server loader, cached

`services/events/all-events.service.ts` → `getAllEventsPageEvents(): Promise<AllEventsItem[]>`:

1. `GET /v1/irl/events/upcoming` with no `limit` (every upcoming event).
2. `GET /v1/irl/events/:uid` for each, with a concurrency cap of 6, signed-out (public fields only). A failed detail keeps the event with its list fields; one bad event never fails the page.
3. Each event maps to an `AllEventsItem`: `uid`, `name`, `startDate`, `endDate`, `timezone` (the gathering's; this matches the drawer and is the answer to LAB-3224 for this page), `city` (the display name made from the gathering name, `null` for "Others"), `cityKey` (lower-cased), `mode` (`toEventMode(details.format, type)`), `access` (`toEventAccess`), `host`, `tags`, `picture` (banner, then logo), `goingCount`, `faces`. Neither endpoint returns `isFeatured`, so the Featured filter waits for phase 2.

The loader is wrapped in `unstable_cache` with `revalidate: 300` and tag `all-events`. It filters out events whose `endDate` has passed at read time, so a cached list never shows a finished event.
*Alternatives:* fetch details in the browser (7+ requests per visit, and a layout shift); add `?expand=details` to `/upcoming` (a backend change, out of phase 1).
*Limit:* N detail calls grow with the events. At more than 60 events the loader logs a warning; the backend list endpoint (phase 2) is the real fix.

### D3. City coordinates: trimmed, cached separately, Map only

`services/events/city-coords.service.ts` → `getCityCoords(): Promise<Record<cityKey, [lat, lng]>>`. It fetches `/v1/irl/locations` with `cache: 'no-store'`, because the 2.6 MB body exceeds Next's 2 MB fetch-cache entry limit. It parses both number strings and `"15.87° N"` / `"…° S|W"` forms, applies a small `CITY_COORD_FIXES` table (on 2026-11-19: Berlin stored in Düsseldorf, Lisbon in Virginia, Healdsburg in Argentina, Colorado in Chicago, California at Singapore's longitude; add any city found wrong in review), drops "Others" and anything that doesn't parse, and caches the small result with `unstable_cache` (`revalidate: 86400`). Only the Map view calls it, through a route handler `GET /api/events/city-coords`, so the List and Calendar never pay the 2.7 s.
*Alternative:* a hand-kept table of every city. Rejected: new gatherings would silently have no pin.

### D4. Filters and view in the URL, filtering in the browser

A store from `createFilterStore()` (`services/events/all-events-filters.store.ts`) with keys `search`, `city`, `mode`, `going`, `view`, `cal` and `event`, synced with `FilterStoreUrlSync`, the same pattern as Teams and Members. `filterEvents(items, state, goingUids)` is a pure function, unit-tested. City tiles write the same `city` key, so the tile and the filter are one selection. A facet with fewer than 2 distinct values in the loaded events is not rendered: Mode with only in-person events, or Host and Access later. The `event` key opens the drawer; closing it deletes the key through the same store, never through raw `history.replaceState` (Next's `__NA` state trap).

### D5. Viewer data in the browser

The page server component passes whether the viewer is signed in and their uid. Going uids come from a React Query hook over `getMyUpcomingEventUids`, enabled only when signed in (an ungated query would turn the `customFetch` reload into a loop). The member's city is read on the server (`getMemberProfileCity`, `GET /v1/members/:uid` with the viewer's token, uncached) only when signed in, so Near you renders with the page and never flashes in. `null` means the profile has no location at all (the Add location row); `undefined` means it couldn't be read (neither shows). After "I'm going" in the drawer, the hook's key is invalidated so the Going pill and the going filter update. The event list itself is not viewer-specific, so the shared cache is safe.

### D6. Components, ported out of the prototype

```
components/page/events/all-events/
  AllEventsPage.tsx         client root: store, URL sync, drawer host, sections, phone filter bar
  AllEventsHeader.tsx       title, Open PL Events, Submit an event (getSubmitEventUrl)
  NearYou.tsx               NearYou + AddLocationRow
  CityBand.tsx              CityBand + CityHeader
  EventsToolbar.tsx         count, Filters button, view switch (sticky under --app-header-height)
  AllEventsFilters.tsx      rail (FilterSearchInput, going switch, Mode, City) + chips
  ListView.tsx, EventCard.tsx (EventCard + EventTile)
  icons.tsx
  calendar/WeekBoard.tsx, calendar/MonthGrid.tsx, calendar/weeks.ts
  map/EventsMap.tsx, map/loadGoogleMaps.ts, map/CityPinCard.tsx
  states.tsx                loading skeleton, empty, error
components/page/events/GoingPill/   (from prototypes/entries/events-shared/GoingTag, its filled green version)
components/page/events/EventImage/  (from events-shared/EventImage, brand fallback)
```

The Calendar (LAB-3320) is `calendar/EventsCalendar.tsx` (the frame, Week | Month, Today and previous / next) over `WeekBoard` and `MonthGrid`, with `weeks.ts` holding the date maths on the items' `startDay` / `endDay`, which are already in each event's own time zone, so the calendar only counts ISO days (Monday-first, noon-anchored so daylight saving never shifts a day). Which week or month shows is the calendar's own state; the page keys it on its anchor (the event a link landed on, kept for the page's life, else the scoped city's first event, else today), so a link or a new city reopens it while opening cards does not. The mode is the `cal` param. Each item gains `tagColor` (the first topic's colour) for the cards' faint wash; only a `#rrggbb` value reaches a style.

An event's place line and access words live in one place, `services/events/event-facts.ts` (`eventPlace`, `ACCESS_COPY`), used by the List and Near you cards, the Week board and the drawer.

Copy and layout come from the prototype files the Linear tickets name. Mock-only pieces (review band, `VENUE_COORDS`, sample names) are not ported. Date maths use the event's `timezone` with the repo's existing date helpers. The sticky toolbar reads `--app-header-height`; it only reads that variable and never sets it (it is measured).

### D7. Google Maps with a small loader and a Map ID

No new npm dependency. `loadGoogleMaps()` injects Google's documented bootstrap once and resolves `google.maps.importLibrary('maps' | 'marker')`. The map uses `AdvancedMarkerElement` for HTML pins (count bubble, going ring), which needs a Map ID, so it reads two public vars: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`. With no key, the view switch hides Map (spec). With a key but no Map ID, the map uses Google's `DEMO_MAP_ID` (Google's value for testing); production sets a real one. Each pin is a React portal into its marker's content element, and presses come through `gmp-click`. In-person events whose city has no position are listed under the map ("Not on the map") with the online ones, so the Map never drops an event the other views show. The map has `disableDefaultUI: true` and `gestureHandling: 'greedy'`, so the wheel zooms the map and not the page. Our own + / − buttons and slider call `map.setZoom`, and "Show all" calls `fitBounds`.
*Alternatives:* keep the prototype's hand-made map on Esri tiles (Esri's terms don't cover production use without a key, and we'd own the gesture code); MapLibre with a keyed tile host (a new vendor and contract). Google was chosen in the Goal (Q3).

### D8. Drawer: gathering block out, fact rows in

In `EventDrawerView`, the `{gathering && …}` block that renders the "<city> gathering" label with `GatheringDetails` goes, and so does its unused SCSS. The `gathering` data stays: it drives the going card, the plans and "Add your plans for <city>". `GatheringDetails` stays, because `IrlGatheringModal` uses it. `EventSummary` loses the mode and access badges and gains the place row and the access row (port `AccessIcon` and its copy table). The drawer's own analytics `source` type gets `all-events`.

### D9. Analytics

`analytics/events.analytics.ts`: add `all-events` to `EventDrawerSource`, and add `onEventsViewChanged`, `onEventsFiltersApplied` and `onEventsCitySelected`, with constants `ON_EVENTS_VIEW_CHANGED` and the others in `utils/constants.ts` (`events-view-changed`, `events-filters-applied`, `events-city-selected`). Filter analytics fire on a user change, not on the store's URL hydration (`setAllParams` reports nothing). The store's built-in debounce is one timer shared by every key, so a view switch or an opened event within 300ms would swallow a pending filter change; the All Events store sets `analyticsDebounceMs: 0` (which now reports each change at once) and the page settles each filter key on its own 300ms timer. A city tile records both `events-filters-applied` (a filter changed) and `events-city-selected` (where the city came from): two questions, not a double count.

## Risks / Trade-offs

- [The page shows fewer events than the iframe (only what the sync copied; Solana Breakpoint was missing on 2026-11-18)] → The flag stays off in prod until the backend owner runs a full sync and the details backfill (message drafted at Goal start).
- [The member's city text and the gathering name differ ("SF" vs "san francisco")] → Match case-insensitively on the city and on the gathering name up to its first comma. Near you simply doesn't show when nothing matches; no wrong events show.
- [Per-event detail calls grow linearly] → Concurrency cap, 5-minute cache, a warning past 60 events; the phase 2 endpoint replaces it.
- [City pins sit at city centroids, so two venues in one city share a pin] → That is the phase 1 design (LAB-3321). Venue pins come in phase 2.
- [`/irl/locations` coordinates can be wrong] → A fixes table, plus a check task that lists every upcoming city with its coordinates on the feature env.
- [Signed-out detail calls hide attendance for invite-only events] → The list follows the drawer's signed-out rule, as `/upcoming` already does.

## Migration Plan

1. Merge slices into `lab-3247`. The flag is off by default, so `develop` is unaffected until it is turned on.
2. Feature env `lab-3247` with `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2=true` and the Maps key (when Vova provides it) for Roma and Polina.
3. Prod: set the vars in Vercel only after the backend's full sync and details backfill. Rollback: unset `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` and redeploy; the iframe returns.

## Open Questions

- The Map ID: Vova creates it with the key, or we use one Map ID per environment. This doesn't change the code path.
