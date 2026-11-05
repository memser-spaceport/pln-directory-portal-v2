# Proposal

## Why

[LAB-3126](https://linear.app/protocollabs/issue/LAB-3126), part of Goal [LAB-3070](https://linear.app/protocollabs/issue/LAB-3070) (the new Home).

"See all news" on the signed-in Home and "See all updates" on the signed-out Home both link to `/home?view=news`, but nothing reads `view`. A click re-renders the same Home, so the link looks broken. The page they should open is designed in the prototype `homepage-redesign-v0` with `?view=news` (`NewsGrid.tsx`, as Polina changed it on 2026-11-04 in PR #3465).

## What Changes

With `NEXT_PUBLIC_SHOW_HOME_V2` on, `/home?view=news` becomes the news page, for members and signed-out visitors alike:

- **Head:** "← Home", the title "Network news" (the page's one `<h1>`), "N stories from network teams", and production's news search held open beside the title. On phones the search is the full-width field under the head.
- **Filter bar:** the stream's pills with counts, without Discussions: For You (only when it has stories) · All · Top · Funding · Launch · Announcement. Empty pills hide, and pressing the active pill resets to All. Phones get "Type:". Sort by: Latest / Following / Most popular. The page opens on All.
- **Hashtags:** the stream's scope row. Clicks stack, a story must carry every tag, and the row reads "Filter: #tag ✕ · N stories" with Clear all and Narrow by.
- **Search:** it matches team, headline, summary and tags, with a leading `#` dropped, the same way as the stream. It narrows on top of the pill and the tags, and the pill counts and the scope count follow it. A miss shows "No stories match … Clear search".
- **Grid:** 2 columns from 640px, 1 on phones. Each story is production's boxed `NewsCard` with its `#tag` links and its image (`NewsImage`, `wide`) on the card's floor, so a row's images line up.
- **Data:** the Home feed's 14-day grouped news. No forum posts, roll-ups or deals.
- **Signed out:** Follow and Like are the sign-up door. The card still opens the story.
- With the flag off, `?view=news` is ignored.

## Capabilities

### Modified Capabilities

- `home`: the flag requirement gains the news page; a new "The news page" requirement; "News stories show their image" gains the news page's card.

## Impact

- `app/home/page.tsx`: a `view=news` branch and its data loader; the tab title "Network news".
- `components/page/home/HomeV2/NewsPage.tsx` (new), plus `FeedFilterBar` and `TagScopeRow`, extracted from `NetworkUpdates` so both pages draw the same bar and scope row.
- `useHomeFeed`: a `newsOnly` option for the stream (no forum posts, opens on All, pill counts follow the search).
- `NewsCard` (boxed variant): opt-in `#tag` links, image, grid-fill mode and a sign-up hook. Its other uses are unchanged.
- No new analytics events: the link that opens the page already sends `home-see-all-clicked`, and the cards send the existing team-news events.
