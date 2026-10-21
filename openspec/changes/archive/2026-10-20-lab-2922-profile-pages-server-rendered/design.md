# Design

## Context

See proposal.md for the motivation. These facts shape the approach (code at `e8115f8`, reproduced on a local dev server against the dev API on 2026-10-20):

- **Project profile.** `app/projects/[id]/page.tsx` is a Server Component and fetches the project, but its server render throws `ReferenceError: document is not defined`. The stack runs from `components/page/project-details/description.tsx` through `components/ui/RichTextEditor/RichTextEditor.tsx` to `quill`, which touches `document` at module evaluation. React then renders the route's boundary in the browser only, so production HTML has nothing but the `<title>`. Team profiles escape this only because their editor component (`TeamDetails/components/About/About.tsx`) is never imported.
- **Editor callers.** `RichTextEditor` is imported by 15 components. Three already wrap it in `dynamic(..., { ssr: false })`: `FormEditor`, `BioInput` and `FeedCommentsThread`. The rest import it statically, including four the member profile renders: `ProfileBioInput`, `ExperienceDescriptionInput`, `ContributionsDescriptionInput` and `bio.tsx`.
- **Member profile.** `app/members/[id]/page.tsx` is a `'use client'` page. It loads the member with `useQuery`, keyed on `[GET_MEMBER, id, isLoggedIn, userInfo?.uid]`, from the `useCurrentUserStore` Zustand store. That store starts `null` on the server and in the hydrating render; `UserInfoChecker` fills it in an effect. `layout.tsx`'s `generateMetadata` already fetches the public member, signed out (`getMember(id, { with: 'image' }, false, undefined, true)`).
- **`getMember` and 404s.** `getMember` returns `{ error: { status } }` on any non-OK response. It also returns a made-up 404 when the viewer may not see the member (not directory-visible and not the owner or an admin). Fetched signed out, a pending member therefore looks "not found". `getTeam` and `getProject` return `{ error: { statusText } }` with no status. The dev API answers 404 for unknown member, team and project ids.
- **Streaming and status.** All three profile routes have a `loading.tsx`. A `notFound()` thrown in the page after the shell has streamed cannot change the status from 200; Next then only injects `noindex`. A `notFound()` from `generateMetadata` runs before the shell for crawlers, whose metadata Next renders blocking rather than streamed.
- **Teams list.** `TeamsFilterUrlSync` wraps the whole teams layout and withholds its children until it has copied the URL into `useTeamFilterStore` in a layout effect. The list reads its filters from that store (`useGetTeamsFilterAsObjectFromStore`). The store keeps every URL param, not just the tracked ones. `useInfiniteTeamsList` has an `initialData` seed option that no caller uses. `TeamsContent` shows a skeleton until both the list and the filter-values queries have loaded. The sync writes the URL with `history.pushState` (`strategy="history"`), so the server page never re-renders on a filter change.
- **Shared cache.** The `QueryClient` is a module-level singleton during server rendering (LAB-2888, `providers/QueryProvider.tsx`), so server-fetched data must never be written into the cache.

## Goals / Non-Goals

**Goals:**

- Server HTML for member profiles, project profiles and the teams list matches what a signed-out visitor sees after hydration.
- No hydration mismatch and no change in signed-in behaviour beyond earlier first paint.
- A crawler gets a real 404 for an unknown profile.

**Non-Goals:**

- Server rendering of viewer-specific data (follow state, private fields, edit controls).
- Changing the teams filter state model (store plus `history` URL writes).
- Refactoring the member page beyond what moving its data fetch to the server needs.

## Decisions

### D1. The rich-text editor loads in the browser only, at its source

`RichTextEditor.tsx` becomes a thin `'use client'` module whose default export is `dynamic(() => import('./RichTextEditorClient'), { ssr: false })`. The current implementation moves to `RichTextEditorClient.tsx` unchanged. The editor only appears in edit mode, after a click, so nothing visible changes.

*Alternative:* wrap each of the 12 static importers in `dynamic`, as three already do. Rejected: the next importer will forget, and the failure is silent (the page still works in a browser and only crawlers lose it). The three existing wrappers become redundant but harmless; they are left alone to keep the diff small.

*Ref forwarding:* no caller passes a `ref` to `RichTextEditor` (checked with grep). Under React 19, `ref` is a regular prop and passes through `next/dynamic` anyway.

### D2. 404 only for an API 404, decided on the server, before streaming

- `getTeam` and `getProject` add `status` to their error object, as `getMember` already has.
- Each profile route calls `notFound()` when the API says 404, from a **route layout** (`app/{members,teams,projects}/[id]/layout.tsx`) and again in the page. The page renders inside `loading.tsx`'s boundary, after the 200 has been streamed, so a page-level `notFound()` can only add `noindex` and the not-found UI. A layout renders outside that boundary, so its `notFound()` is a real 404 status. Calling it from `generateMetadata` was tried first and still gave 200 locally, for plain requests and for Googlebot. The layout shares its lookup with `generateMetadata`: React `cache` for teams (`services/teams/teamProfileLookup.ts`), and the fetch cache for projects and members. So the check adds no request. Old Airtable team ids skip the check, because the page redirects them.
- **Member:** `notFound()` only when the signed-out fetch is 404 **and** the request has no auth cookie (`getCookiesFromHeaders().isLoggedIn`). The check sits in the member layout (body and `generateMetadata`), which is already a server component. A cached 404 is confirmed with an uncached fetch first, so a member approved since the cache filled is never served a 404. A signed-in viewer is left to the browser, as today, because the made-up 404 also covers a pending owner viewing their own profile.
- Any other error keeps today's behaviour: the `<Error />` component, or for the member page the browser fetch.

*Alternative:* remove `loading.tsx` so the page itself decides the status before streaming. Rejected: it removes the loading skeleton for every visitor. *Verified locally (task 2.4):* unknown member, team and project ids answer 404 for plain `curl` and for `curl -A Googlebot`. Real profiles answer 200.

### D3. Member profile: Server Component page, public member as `placeholderData`

- `page.tsx` becomes an async Server Component. It awaits `params`, fetches the public member signed out, with the same `with` fields the client uses (`image,skills,location,teamMemberRoles.team`), applies D2, and renders `<MemberDetails memberId serverMember />`.
- The current client body moves to `components/page/member-details/MemberDetailsPage.tsx` (or similar). Its `useQuery` gets `placeholderData: serverMember`. That is the raw `getMember` result (`{ data: { formattedData } }`), because TanStack Query v5 runs `select` on placeholder data too (checked in `query-core` 5.83's `queryObserver`).
- **Public view while on placeholder.** While `isPlaceholderData` is true, the body renders as a signed-out visitor would: `isLoggedIn=false`, no `userInfo`, `isOwner=false`. This matches the server HTML in the hydrating render, and it stops an owner opening an edit form prefilled from the redacted public record. When the viewer's own fetch lands, edit controls and private fields appear.
- `useSearchParams` stays in the client body (`prefillEmail`/`returnTo`). The route is dynamic (it reads cookies), so this does not bail the page out to client rendering.

*Alternative:* `initialData` or `setQueryData` from the server. Rejected: the server `QueryClient` is a process-wide singleton (LAB-2888), and `initialData` would also outlive the placeholder and mask the viewer's own fetch.

*Hydration safety:* every hook in the body must render the same on the server and in the hydrating render. Hooks that read `window` or media queries (for example `useIsBelowTabletLandscape`) must return a stable server value. Task 4 checks each by rendering the page locally and looking for hydration warnings.

### D4. Teams list: LAB-2888's pattern, keyed on the exact query

- `TeamsFilterUrlSync` wraps only the filter rail, as on `/members` and `/jobs`.
- The query-string builder in `useInfiniteTeamsList`'s fetcher moves to a server-safe module, `services/teams/teamsListQuery.ts`. It turns a params object into `qs.stringify({...})` with the sort, investment-focus and priorities mapping.
- `app/teams/(teams-page)/@content/page.tsx` awaits `searchParams`, builds the query with that module, and fetches page 1 with `getTeamList(query, 1, ITEMS_PER_PAGE, authToken)` (the viewer's token, as the browser sends). It passes `serverPage = { key: query, items, total, followingTotal }` to `TeamsContent`, or `undefined` on failure.
- `useInfiniteTeamsList` drops the unused `initialData` seed. It takes `serverPage` and uses it as `placeholderData` when either:
    - the hook is in the hydrating render, or
    - the current query string equals `serverPage.key`.

    "Hydrating" uses `useSyncExternalStore` with a `true` server snapshot, the same technique as LAB-2888's saved-scope flag. In the hydrating render the store is still empty, but the HTML must match the server's page. Once the rail's layout effect has copied the URL into the store, the key equals `serverPage.key`, so the placeholder holds until the browser's own fetch lands. Any other filter set gets no placeholder.
- `TeamsContent` shows the list as soon as teams are available. The filter-values query no longer gates the skeleton.

*Alternative:* read the list's filters from `useSearchParams` instead of the store, as `/jobs` does. Rejected: teams writes the URL through `history.pushState` with a debounce, so the list would lag the rail by the debounce. That is a visible behaviour change this ticket does not need.

## Risks / Trade-offs

- [Some member-page hook breaks on the server, which is how the project page broke] → Task 4 renders `/members/<id>` locally and asserts that the server HTML has the name and bio and the console has no hydration warnings. Each server error found is fixed at its source.
- [The public placeholder hides edit controls for a moment on your own profile] → This is accepted. It replaces today's full-page loader, so it is still faster to first content.
- [`notFound()` in `generateMetadata` turns a metadata-only problem into a 404] → It is only called on an API 404 for the same id the page needs. Other metadata errors keep falling back to the default metadata, as today.
- [An extra server API call per profile and per `/teams` request] → One call per request. The backend's 10 req/s throttle (pln-directory-portal#3542) can answer 429: the server then passes no placeholder and the browser fetches, as today.
- [Skeleton no longer waits for filter values, so the toolbar may render with empty filter labels for a moment] → Task 5 checks `TeamList` and `TeamsToolbar` tolerate `filterValues` being undefined, and keeps a per-component fallback if not.

## Migration Plan

No data or config migration. Ships behind no flag: each part is independently revertible by reverting its commit. After release, run Search Console's URL Inspection live test on one member, project and teams URL (LAB-2890/LAB-2924).
