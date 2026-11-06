# Design

## 1. One feed state, a news-only mode

The page runs on `useHomeFeed` with `layout: 'stream'` and the new `newsOnly: true`, so pills, counts, sort, search, the tag scope, the follow and like overlays, view tracking and the `?news=` dialog behave exactly as on the stream. `newsOnly` drops the hook's forum posts at the source (Discussions then counts 0 and hides like any empty pill), starts on All as the prototype's grid does, and makes the pill counts follow the search. The stream keeps counting the window: the ticket asks for following counts on this page only.

## 2. Shared filter bar and scope row

`FeedFilterBar` and `TagScopeRow` are lifted out of `NetworkUpdates` unchanged. The scope row takes its noun ("updates" on the stream, "stories" here) and a slot for what a one-tag scope offers: Follow the tag on the stream, nothing here (the prototype's grid has no Follow).

## 3. The card

The grid card is production's boxed `NewsCard` rather than a copy. Four opt-in props, all off by default so profiles and the previous Home don't change:

- `onTagSelect` / `activeTags`: the `#tag` links, as on the full card.
- `showImage`: `NewsImage` `wide`, capped at 592 × 333.
- `stretch`: fills the grid cell; the summary clamps to three lines; image and meta line sit on the floor.
- `onNeedsAccount`: a signed-out Follow or Like calls it (the new Home's sign-up door) instead of going to `#login`.

## 4. Routing and data

`app/home/page.tsx` reads `view` and, with the flag on, renders the page for anyone. Its loader asks only for the grouped news (with the member's token when signed in), For You's match, and a deep-linked story. A failed news call gives an "isn't available right now" line, never the error page. The page's canonical stays `/home`; only the tab title changes.

## Out of scope

Pagination past the 14-day window, video posters, resized images (LAB-3135) and forum posts.
