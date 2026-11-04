# Proposal

## Why

[LAB-3125](https://linear.app/protocollabs/issue/LAB-3125), part of Goal [LAB-3070](https://linear.app/protocollabs/issue/LAB-3070) (the new Home).

The signed-in Home today puts first Quick Actions, then a grid of news grouped by focus area with All / focus-area tabs, then a rail. PostHog, 90 days to 2026-10-29: 163 signed-in people visited Home. Only 14 clicked a news card. "Teams to follow" was seen by 88 people and used by 6. Members went on to AI Apps, `/jobs`, member profiles, `/forum` and `/deals`.

The manager's direction:

- The priorities signed in are forum posts, deals (underused and hidden today) and a news selection.
- Open roles belong in both states.

The design was approved at the 2026-11-02 standup. It is prototype `homepage-redesign-v0` with `?state=signed-in`: one stream of news and forum posts in full, and one rail with roles, events, Teams to follow, deals and Popular this week.

## What Changes

With `NEXT_PUBLIC_SHOW_HOME_V2` on (from [LAB-3072](https://linear.app/protocollabs/issue/LAB-3072)), a signed-in member's `/home` becomes:

- **Network Updates.** One stream of news and forum posts, each shown in full.
  - There are no All / focus-area / Forum tabs and no Top stories band.
  - The pills are For You · All · Top · Discussions · Funding · Launch · Announcement, with counts. Empty pills hide, and pressing the active pill resets it. Phones get a "Type:" dropdown.
  - Sort by stays as in production.
  - Top stories are labelled in the stream with a Top pill.
- **Hashtags.**
  - News cards show their tags as `#tag` links.
  - Clicking tags stacks them: a story must carry every selected tag.
  - A scope row shows a chip per tag, the count, Follow (one tag) or Clear all (two or more), and "Narrow by" suggestions.
  - Search drops a leading `#`.
- **The cut.** The stream ends level with the bottom of the rail, with the last card fading under "See all news" (`?view=news`).
- **Rail** (one card):
  - open roles;
  - upcoming events, hidden when there are none (both shared with LAB-3072);
  - Teams to follow;
  - deals, only for members with deals access, with a value pill when the deal has an offer value from [LAB-3071](https://linear.app/protocollabs/issue/LAB-3071);
  - Popular this week.
- **Under the feed:** the focus-area cards from LAB-3072. They replace the old focus-area section.
- **Removed on this path:** Quick Actions, the grouped grid and its tabs, the old rail and the mobile scrollers. They stay in the code until cleanup.
- **PostHog:** the new events `home-deal-clicked` and `home-feed-tag-scope-changed`. The `home-role-clicked`, `home-event-clicked`, `home-see-all-clicked` and `home-focus-area-clicked` events from LAB-3072 are reused. The existing feed events keep firing.

## Capabilities

### New Capabilities

None. The `home` capability is added by `lab-3072-signed-out-home`, which is archived first.

### Modified Capabilities

- `home`: adds the signed-in view.
- `team-news`: with the flag on, "Filter the Home feed by tag" stacks tags, keeps the scope row, and drops a leading `#` in search.

## Impact

- **Code:**
  - `components/page/home/TeamNews/`: its data and state logic moves into a hook that the old layout and the new one share (see design).
  - New layout components go in `components/page/home/HomeV2/`.
  - `app/home/page.tsx`: the signed-in branch.
  - `utils/matchesTeamNewsQuery.ts`.
  - `analytics/home.analytics.ts`.
- **Backend:** LAB-3071, for `offerValue` and the events params.
- **Testing:** the feature env, then Roma and Polina. Forum posts need a member with forum access. Deals need `deals.read`, and the common case is a member without it.

### Out of scope

- See all news `?view=news` (LAB-3126).
- Open source picks (LAB-3128).
- Story images, waiting on Polina.
- Server-side tag filtering, which isn't needed because the feed is unpaginated.
- Removing the old layout.
