# News preferences

A new Settings page, **News preferences**, placed after Email Preferences in the settings menu. It
holds what shapes the news a member sees, for **both** For You on Home and the email digest.

Switches: `?persona=complete|investor|empty` and `?from=digest|feed|settings`. The settings menu is
clickable between Email Preferences and News preferences.

## Why its own page

- **Email Preferences** is about email delivery. If the news choices lived there, the feed would have
  no natural way in. It keeps frequency, Forum activity and Network news, plus one line linking here.
- **Recommendations** is a different product: a member and team matching email with its own on/off,
  frequency, Save button and `recommendationsEnabled` flag. Mixing the two would confuse both.

## Sections

1. **Topics:** hashtag topics (`#ai`, `#depin`, `#storage`…). The list is **invented**; backend
   supplies the real one. Each member arrives subscribed to a prefilled set, shown first. Clicking a
   chip unsubscribes, and clicking again resubscribes, in place. Unsubscribing from all is allowed.
   Topics replace both the Home feed's categories and the team focus areas / skills that used to
   shape suggestions.
2. **Teams you follow:** production `FollowButton`. Unfollowing happens in place and can be undone.
   Empty state: "You don't follow any teams yet. See teams to follow".

Everything saves on change, with a "Saved" note in the card header.

## Ways in

- The digest email's **Update preferences** link → `?from=digest`
- The For You hint's **Tune For You** link → `?from=feed`
- The settings menu → `?from=settings`, with no highlight

Arriving from the digest or the feed outlines the biggest gap until the first change: no topics →
topics; no follows → teams; otherwise topics.

## Backend questions

1. What is the real topic list, and who maintains it (fixed taxonomy vs tags on posts)?
2. How is a member's starting set prefilled (from skills, team focus areas, investment focus)?
3. Do For You and the digest both filter by subscribed topics? Where is the subscription stored?
4. Does news without a matching topic still reach a member through followed teams?
