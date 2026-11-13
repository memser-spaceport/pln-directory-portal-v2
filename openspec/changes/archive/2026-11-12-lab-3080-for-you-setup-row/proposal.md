## Why

LAB-3080 (https://linear.app/protocollabs/issue/LAB-3080): a member with nothing For You can match on never sees the For You hint, because the feed opens on All. Home now tells them to set it up in News preferences.

## What Changes

- On Home's resting All view, a signed-in member with no own teams, no followed teams and no news tags sees one line: "For you · Get news picked for you. Choose your topics and teams in News preferences." The link is "Open News preferences →" and opens `/settings/news-preferences?from=feed`.
- A focus-area tab, another category, a topic filter or search text hides the line.
- A click records `team-news-for-you-setup-clicked`. The line records `team-news-for-you-setup-shown` once per page load. Neither records `team-news-for-you-tune-clicked`.
- On the new Home, this line replaces the curated "For you" line for that member, and only on resting All.

## Capabilities

### Modified Capabilities

- `team-news`: a new way in to News preferences, and the two set-up events.
- `home`: the Network Updates "For you" line for a member with no inputs.

## Impact

Signed-out visitors, members who already have teams or tags, and News preferences off are unchanged. A quiet week (inputs, no stories) is unchanged.
