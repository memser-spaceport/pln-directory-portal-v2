# Proposal

## Why

Most members never set news tags: 1 member changed tags in 2 weeks. They do not know which tags we use for For You and the digest. [LAB-3250](https://linear.app/protocollabs/issue/LAB-3250/news-show-the-suggested-tags-card-on-home) (Task of Goal [LAB-3244](https://linear.app/protocollabs/issue/LAB-3244/news-home-card-that-suggests-tags-for-for-you)) adds a Home card that shows the member their default tags, so they approve or change them without opening a settings page. The design is Polina's prototype `for-you-starter-topics` ([LAB-3245](https://linear.app/protocollabs/issue/LAB-3245/news-design-the-home-suggested-tags-card), PR #3561). The API is [LAB-3249](https://linear.app/protocollabs/issue/LAB-3249/news-api-for-suggested-news-tags-ai-tags-for-members-without-an) (pln-directory-portal PR #3709).

## What Changes

- New tag card on Home for a signed-in member whose default news tags are not approved and not set by the member. It takes the place of the "For you" line, on the For You view and on the resting All view.
- The card reads `GET /v1/team-news/default-tags` and shows the tags as News preferences chips, all on. The member turns chips off and on in place.
- Title "We picked these topics for you", and one line that names the source: interest profile, AI tags, or team focus areas.
- Buttons, as in the design: "Looks good" approves the tags as shown; it reads "Save topics" once a chip is off and then saves the chips that are on as the member's own tags. "See all topics" approves and opens News preferences. A "Topics saved" toast follows a save.
- Saving is a button press, not automatic. This follows the design and differs from the LAB-3250 text ("the selection saves on its own"); the card shows tags the member has not agreed to yet.
- After an answer the card goes away and the "For you" line comes back. The card does not show again, because the API then returns `approved: true`.
- The LAB-3080 set-up line shows only when the card does not.
- New PostHog events: `team-news-tags-card-shown`, `team-news-tags-card-tag-toggled`, `team-news-tags-card-approved`, `team-news-tags-card-saved`, `team-news-tags-card-see-all-clicked`. LAB-3250 names `team-news-tags-card-tag-removed`; with chips that turn off and on, one toggled event with the state replaces it.
- Both Home layouts (production Home and the new Home behind `NEXT_PUBLIC_SHOW_HOME_V2`) get the card; it follows `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES`. No new flag.

Out of scope:

- A switch to turn off personalization.
- Adding tags that are not on the card: that is News preferences.
- Any change to News preferences, the For You match or the digest.
- The API and the AI tags (LAB-3249).
- Separate frames for the state with every chip off: "Save topics" is disabled there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `team-news`: four new requirements for the tag card (who sees it, its content, its answers, what follows an answer); "Ways in" (the "See all topics" button; the set-up row shows only when the card is not shown); "Analytics" (the card's events).
- `home`: "One stream of news and forum posts" (the card takes the place of the "For you" line on For You and on the resting All view).

## Impact

- New: `components/page/home/TeamNews/components/NewsTagCard/` (component, SCSS module, pure helpers), `services/team-news/hooks/useNewsDefaultTags.ts` and `useApproveNewsDefaultTags.ts` with their service calls and query key, tests under `__tests__/page/home/`.
- Changed: `components/page/home/TeamNews/TeamNews.tsx`, `components/page/home/HomeV2/NetworkUpdates.tsx` (render the card, pass "card shown" to the set-up line rule and the caption), `ForYouSetupPrompt.tsx` (one more input), `analytics/team-news.analytics.ts`, `utils/constants.ts`.
- Reused, not changed: the News preferences chip styles and icons, `Button`, the toast, `MembersQueryKeys.GET_MEMBER_PREFERENCES` (invalidated after a save so News preferences shows the saved tags).
- API: `GET /v1/team-news/default-tags`, `POST /v1/team-news/default-tags/approve` (JSON body, `{}` to approve as shown). Blocked by LAB-3249 for real data; the card hides itself when the request fails, so it is safe to merge first.
- Design: built from the prototype in PR #3561 (branch `events-update`). The three source lines are new copy and need Polina's ok.
