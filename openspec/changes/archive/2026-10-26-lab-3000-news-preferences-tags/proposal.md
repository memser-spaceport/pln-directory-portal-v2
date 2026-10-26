# Proposal

## Why

[LAB-3000](https://linear.app/protocollabs/issue/LAB-3000), part of Goal [LAB-2969](https://linear.app/protocollabs/issue/LAB-2969): members want news about topics ("neurotech and AI"), not the six event categories News preferences offers today. News items already carry tags, and on dev 25 of the 49 distinct tags are slugs of the network's focus areas (checked 2026-10-26). So the page can let members pick topics from a vocabulary the news already uses, starting from their teams' focus areas.

## What Changes

- News preferences has two sections: **Tags** and **Teams you follow** (unchanged).
- The **Categories** section and the read-only **Suggested from your profile** section are removed.
- **Tags** lists the focus areas that tagged news in the last 90 days, by title, grouped under their parent focus area. Choosing a tag saves at once and shows "Saved". Every tag can be removed.
- A member who never chose tags sees their teams' focus areas already chosen, with a note saying where they came from. Their first change saves the list.
- With no tags chosen, the section explains that For You and the digest then show only their own and followed teams.
- For You on Home stops filtering by category. Matching For You by tags comes with LAB-3001, behind the same flag.
- Arriving from the digest or the feed outlines Tags (or Teams you follow, when the member follows none), as it outlined Categories.
- Analytics: `settings-news-preferences-tag-toggled` replaces `settings-news-preferences-category-toggled`.
- Everything stays behind `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES`, which is off in production.

Out of scope:

- For You matching by tags (LAB-3001).
- Tags on news posts (LAB-3003).
- The digest link and the network-wide section (LAB-3002).
- The backend tag list and `newsTags` storage (LAB-3000 consumes LAB-2998).
- Deleting `newsCategories` from stored preferences.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `team-news`: News preferences changes from categories to tags; For You no longer filters by category.
