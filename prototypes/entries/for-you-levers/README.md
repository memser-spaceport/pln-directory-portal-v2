# For You levers

Route: `/prototypes/for-you-levers?variant=current|follow|explain|thin-feed`

Four ways to tell a member what their For You feed is made of. All of them
close the loop in the mock: follow or unfollow a team and For You changes
straight away. The new card slides in at the top with a "New in your feed"
tag, the story count in the header updates, and a toast says what changed.

A **Feed** switch (Quiet week, 3 stories / Busy week, 6 stories) sits next to
the variant switch. Changing either one resets the session.

| Variant | What it shows |
|---|---|
| `current` | Production's `ForYouHint`, same words and styles. Baseline. |
| `follow` | "Your feed shows news from your teams and the teams you follow." + **Follow more teams**. On desktop (≥1200px) the button scrolls to the Teams to follow rail and highlights it. Below that, the rail sits under every story, so the button opens the suggestions under the hint instead. |
| `explain` | One reason line under the team name on each card: "Your team" / "You follow X" / "Matches your team's focus: Storage". The hint becomes one line with **Manage followed teams**, which opens your followed teams in place so you can unfollow them. |
| `thin-feed` | Only when For You has fewer than 5 stories: "Your feed is quiet. Follow teams in areas you care about." with 3 suggested teams and Follow buttons. Nothing shows on a busy week. Whether the ask shows is decided when the page loads, so it doesn't vanish halfway through a click. |

## Levers modelled (and the only ones named in the UI)

1. The teams you're on, and which one is primary.
2. The teams you follow.
3. Teams-to-follow matches whose reason looks like a focus area (e.g. "Storage").

Profile fields (skills, interests) are **not** modelled and not named. The
`current` variant still says "your profile", because those are production's
own words. That claim is unconfirmed, which is part of why this test exists.

## Mocked analytics (`console.log('[analytics]', …)`)

Every event carries `variant` and `feedSize`.

- `team_news_for_you_hint_viewed` (`storyCount`): on load, for every variant except thin-feed
- `team_news_for_you_thin_ask_viewed` (`storyCount`): thin-feed only, and only when the ask shows
- `team_news_for_you_update_profile_clicked` (`memberUid`): current
- `team_news_for_you_follow_more_clicked`: follow
- `team_news_for_you_manage_follows_clicked` (`followCount`): explain
- `team_news_for_you_team_followed` / `_unfollowed` (`teamUid`, `source`: card | rail | inline | panel, `storyCountAfter`)

## Questions for the backend team

These are assumptions the prototype makes. Each one changes what the UI is
allowed to say.

1. **Profile fields.** Does anything on the member profile (skills, interests,
   role) affect For You today? Production's hint says "your profile". If the
   answer is no, `current` makes a false claim and its "Update your profile"
   link can't change the feed.
2. **Primary team.** Does the primary team count for more than your other
   teams, or is "primary" only used to pick the focus areas for lever 3? Which
   team's focus areas are used for a member on several teams: the primary
   team's, or all of them?
3. **Focus-area matches vs. Teams to follow.** If a Teams-to-follow suggestion
   with a focus-area reason (Filecoin Foundation, "Storage" in the mock) is
   already in For You, following it changes nothing you can see. The mock
   does exactly this: the toast says "Already in For You" and only the reason
   line changes. Is that right? And are the matches the *same* list the rail
   shows, or a separate server-side match that happens to use the same reasons?
4. **What `reason` contains.** Is `ISuggestedTeam.reason` always a focus-area
   name? Or can it be relational ("works with 2 teams you follow")? The
   explain variant's "Matches your team's focus: X" only holds if it's a focus
   area.
5. **Follow takes effect when?** Does a new follow add that team's stories to
   `forYouTeamUids` on the next request, or only after a cache refresh? The
   mock assumes straight away. Production snapshots the set once at mount
   (`initialForYouTeamUids`), so today a follow wouldn't show until reload.
6. **Window.** Is "fewer than ~5 stories" measured over the same window For You
   uses (`FEED_FOR_YOU_FORUM_POST_WINDOW_DAYS` for posts; what for news)? Does
   that count include forum posts?
7. **Per-item reason.** Can the API return *which* lever put each item in For
   You? Without it, the explain variant has to work out the reason on the
   client from memberships and follows, and it can't tell a focus-area match
   apart from anything else.
