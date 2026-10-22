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

1. **Categories:** the Home feed's categories (Funding, Launch, Partnership, Announcement, Milestone,
   Deals, Other), all on by default, multi-select. They narrow For You and the digest only; browsing
   All on Home always shows everything. At least one stays on. Discussions isn't here because it's the
   digest's Forum activity toggle.
2. **Suggested from your profile:** Skills and Focus areas, read-only, each linking to where it's
   changed. Team focus areas say "set by <team>" with no link, because members can't edit them.
3. **Teams you follow:** production `FollowButton`. Unfollowing happens in place and can be undone.
   Empty state: "You don't follow any teams yet. See teams to follow".

Everything saves on change, with a "Saved" note in the card header.

## Ways in

- The digest email's **Update preferences** link → `?from=digest`
- The For You hint's **Tune For You** link → `?from=feed`
- The settings menu → `?from=settings`, with no highlight

Arriving from the digest or the feed outlines the biggest gap until the first change: no skills →
profile; no follows → teams; otherwise categories.

## Backend questions

1. Do For You and the digest use the **same** inputs? `for-you-levers` names only teams, follows and
   focus-area matches for For You; skills isn't confirmed there. If they differ, this page has to say
   which input applies where.
2. Can the categories filter For You and the digest per member? Where would the list be stored?
3. Which profile signals feed suggestions besides skills and focus areas ("skills etc.")? Only
   confirmed ones should be named on this page.
4. For an investor on a team, is it investment focus, team focus, or both?
5. Hiring exists in `TeamNewsEventType` but not in the feed's category row. Should it be offered here?
