## Why

The digest page looked like the email (LAB-3264). Polina's v2 design (LAB-3287, prototype `prototypes/entries/digest-web`, commit 543035513) makes it read as a LabOS page: an open layout, a team header with Follow, every source, Comments and Share, a clear end of the issue, a call for team news, and a side column.

## What Changes

- Open layout: dateline, greeting as the page title, stories as open sections with hairlines, a hero first story, images alternating sides, a Sources line instead of "Read on <source>".
- Team header with Follow; Comments and Share in the actions row.
- "You're all caught up" with the next digest date, "Got news from your team?" with the Post news modal, and the side cards ("How personalization works").
- Uses the page API's new fields from the backend (LAB-3288): `teamLogoUrl`, `followsTeam`, `sources`, `commentCount`, `isTeamMember`, `nextSendAt`. Missing fields fall back to the old look.

Not here: Add topics and the topics modal (LAB-3289), Past issues (LAB-3294), More from the network (LAB-3291), Upcoming events (LAB-3292), From the forum list (LAB-3293).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: the page layout, story actions, end of the issue and side cards.

## Impact

- `components/page/digest/*`, `services/digest/*`, `analytics/team-news.analytics.ts` and `analytics/follow.analytics.ts` (a `digest` source), `NewsShareMenu` (takes the fields it needs, not a whole feed item).
