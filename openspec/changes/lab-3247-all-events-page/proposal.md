# Proposal

## Why

All Events (`/events/all`) is an iframe of the separate events app. Members leave LabOS to browse events, and the iframe has no event drawer, so they can't see who's going or say they're going. Goal [LAB-3247](https://linear.app/protocollabs/issue/LAB-3247) replaces it with a native LabOS page, designed in the prototype `events-page-redesign` (Polina, LAB-3248). Slices: [LAB-3317](https://linear.app/protocollabs/issue/LAB-3317) (page, List view, filters), [LAB-3320](https://linear.app/protocollabs/issue/LAB-3320) (Calendar), [LAB-3321](https://linear.app/protocollabs/issue/LAB-3321) (Map) and [LAB-3283](https://linear.app/protocollabs/issue/LAB-3283) (drawer: gathering block out, fact rows in).

## What Changes

- `/events/all` renders a native page behind a new build flag, `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2`. With the flag off, the iframe stays exactly as today.
- Header with "Submit an event" (production's submit link) and a link to the events app.
- **Near you in <city>**: up to 3 upcoming events in the signed-in member's profile city. A member with no location sees an "Add location" row that leads to their profile.
- **Browse by city**: the top 5 cities by upcoming events, with "All N cities". A city scopes the page.
- A sticky **Coming up** toolbar with a count, a Filters button and the view switch **List · Calendar · Map**.
- A filter rail, closed by default, with chips while it is closed and a bottom sheet on phones. Filters in this phase: search, City, Mode and "Events I'm going to". Filters stay in the URL and survive switching view.
- **List** view (default): date column, timeline, event cards.
- **Calendar** view: Week board (default) and Month grid.
- **Map** view: Google Maps with one pin per city and its event count, plus a list of online events. It appears only when a Maps key is configured.
- Every event opens the existing event drawer. `?event=<uid>` opens the page with that event's drawer open and the event marked in the active view.
- One "Going" pill marks the viewer's events on this page.
- Event drawer: the gathering block (the "<city> gathering" label, the gathering's schedule, resources and event count) is removed. Mode and access become fact rows instead of badges.
- Analytics: `event-drawer-opened` gains the source `all-events`. New events: `events-view-changed`, `events-filters-applied`, `events-city-selected`.
- Data comes from the existing endpoints only: upcoming events, event detail, the member's upcoming events and IRL locations. No backend change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`: adds the All Events page requirements (flag, sections, filters, three views, link to one event, analytics). Changes the drawer requirements: no gathering links, and mode and access shown as fact rows. Adds the `all-events` drawer source.

## Impact

- **Code:** `app/events/all/page.tsx`, a new `components/page/events/all-events/` tree, `services/events/` (a server loader for the page's events and city coordinates), `components/page/events/EventDrawer/` (gathering block, fact rows), `analytics/events.analytics.ts`, `utils/constants.ts`. The production pieces from `prototypes/entries/events-page-redesign`, `events-shared` and `event-drawer-redesign` are ported out of `prototypes/`.
- **Config:** new public build vars `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (in `.env.example`; values set by a human in Vercel). A Google Maps JS loader is added. `@types/google.maps` is already a dependency.
- **APIs read (unchanged):** `GET /v1/irl/events/upcoming`, `GET /v1/irl/events/:uid`, `GET /v1/members/:uid/events?group=upcoming`, `GET /v1/irl/locations`.
- **Out of scope:** a backend list endpoint with filters, venue-level map pins, and the Host, Access, Focus area and Featured filters (phase 2, with LAB-3281). Also out: past events; the Going pill outside this page; the events app's own drawer and admin; the PLRS embed; the old events app pages; the submit form (LAB-3282).
