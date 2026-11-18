# Design

## Context

See proposal.md for motivation.

- Design: `prototypes/entries/for-you-starter-topics/` on branch `events-update` (PR #3561). The card sits in the For You intro slot of the new Home, where the For You caption is. It reuses the News preferences chips (check icon when on, plus icon when off), the glossy primary `Button` size `xs`, a neutral border `Button`, and `toast.success('Topics saved')`. Phone: buttons stack at full width. Card surface: white, subtle border, 16px radius, padding 16px 20px 20px.
- API (pln-directory-portal PR #3709): `GET /v1/team-news/default-tags` → `{ tags: [{ slug, title }], source, approved, approvedAt, generatedAt }`; `POST /v1/team-news/default-tags/approve` with `{ tags?: string[] }` → the same shape. `source` is `member-set`, `interest-profile`, `ai` or `team`. Approval never changes which tags For You uses. An empty or unknown `tags` list is a 400. The POST needs a JSON content type.
- `ForYouSetupPrompt` renders in `TeamNews.tsx` (above the Top stories band) and in `HomeV2/NetworkUpdates.tsx` (the `forYouLine` slot, where it replaces `ForYouCaption`). Its rule is `isForYouSetupVisible`. In production the caption shows on every filter; `ForYouHint` shows on the For You category of the previous Home.
- Both layouts read their state from `useHomeFeed` (`currentUser`, `activeTab`, `activeCategory`, `query`, `topicScope`).
- Production chips live in `components/page/news-preferences/NewsPreferences.tsx` and its SCSS module.
- Analytics: `useTeamNewsAnalytics`, names in `TEAM_NEWS_ANALYTICS_EVENTS`.

## Goals / Non-Goals

**Goals:**

- One card component and one visibility helper for both Home layouts.
- The API decides who sees the card (`approved`, `source`, `tags`); the card keeps no rule of its own about profiles or flags.
- Match the prototype's look by reusing the production pieces it mirrors.

**Non-Goals:**

- No change to `useHomeFeed` data and no feed refetch after an answer.
- No local "dismissed" state: the server's `approvedAt` is the only memory.

## Decisions

1. **Show rule.** Card data = the default-tags response when `approved` is false, `source` is not `member-set`, and `tags` is not empty; otherwise no card. Visible when signed in, `SHOW_NEWS_PREFERENCES` is on, there is card data, and the view is For You, or All with no topic filter and no search. The design shows the card on For You; LAB-3250 says it replaces the set-up message, which lives on All, and a member with no For You stories has no For You pill. Showing it on both covers both. Polina confirms at review.

2. **Data hooks.** `useNewsDefaultTags(enabled)`: React Query, `staleTime: Infinity`, `retry: false`, enabled for a signed-in member with News preferences on; an error or a bad shape is "no card". `useApproveNewsDefaultTags()`: mutation that posts `{}` or `{ tags }`, writes the response into the default-tags query cache, and invalidates the member preferences query when tags were saved. No optimistic update: the card waits for the response, with the pressed button in a loading state, so a failed save leaves the card as it was.

3. **Local chip state.** `picked` starts as all shown tags. `changed` is "picked differs from the shown set". Chips keep their order. The primary button is "Looks good" (approve, no tags) when not changed and "Save topics" (approve with `picked`) when changed, disabled when `picked` is empty.

4. **"See all topics" approves, then navigates.** The prototype notes that arriving in News preferences counts as answering. The button fires the approve call without waiting for the response and opens `/settings/news-preferences?from=feed`. If that call fails the card shows again on the next Home load, which is the safe direction.

5. **After an answer.** The mutation's cache write flips `approved`, so the show rule hides the card and the caption or set-up line rule applies again. Toast "Topics saved" for both "Looks good" and "Save topics", as in the prototype.

6. **Source line copy.** `interest-profile`: "Picked from your activity in the network." `ai`: "Picked from your profile, teams and projects." `team`: "Picked from your teams' focus areas." This answers the open point in LAB-3245 ("Picked from…" was a placeholder). The copy needs Polina's ok.

7. **Placement.** New Home: the `forYouLine` slot; when the card is visible neither `ForYouSetupPrompt` nor `ForYouCaption` renders. Previous Home: where `ForYouSetupPrompt` renders on All, and in place of `ForYouHint` on the For You category. `isForYouSetupVisible` gets a `tagCardShown` input and returns false when it is true. The card stays mounted while a filter hides it, so `shown` fires once and the chip state survives.

8. **Styles.** Copy the card surface, title, description, chip row margin and action row from the prototype's SCSS into the component's module. Use the production News preferences chip classes and icons, not the prototype's `digest-topics` ones. Production components do not import from `prototypes/`.

9. **Events.** `shown` is guarded by a ref per member, like `ForYouSetupPrompt`. `tag-toggled` carries the new state, which replaces the ticket's `tag-removed` name because a chip can come back. `saved` carries the saved tags and the turned-off tags, so PostHog shows which picks members reject.

10. **No feed refetch.** After "Save topics" the For You match changes on the next load, as with `FollowTagButton` today.

## Risks / Trade-offs

- [The card shows on All as well as For You, beyond the prototype] → decision 1; one line to change if Polina wants For You only.
- [Button save differs from the LAB-3250 text] → agreed with the owner on 13 Nov 2026; noted on the ticket.
- [A member who ignores the card sees it on every visit] → by design ("shown until answered"); "See all topics" and "Looks good" both end it.
- [Backend not deployed] → the GET fails, no card, Home as today.
- [The prototype PR #3561 is not merged] → the build reads it from its branch; nothing depends on the merge.

## Migration Plan

1. Task PR into goal branch `lab-3244`; E2E on feature env `lab-3244` with the backend Task and `NEWS_DEFAULT_TAGS_JOB_ENABLED=true`.
2. Goal PR to `develop` after the backend Goal PR.
3. Rollback: revert the PR. Approvals and saved tags stay; they are normal data.

## Open Questions

- Polina's ok on the three source lines and on showing the card on All.
- The draft metric: at least 25% of members who see the card answer it within 7 days (LAB-3250 prep). Anuj confirms.
