# Proposal

## Why

The redesigned digest email (LAB-2929) asks members to "Update preferences", but no page says what shapes their news. Polina's review asked for a dedicated place for it. This change builds the frontend half: [LAB-2941](https://linear.app/protocollabs/issue/LAB-2941), part of [LAB-2939](https://linear.app/protocollabs/issue/LAB-2939), in Goal [LAB-2929](https://linear.app/protocollabs/issue/LAB-2929). The design is the prototype in `prototypes/entries/digest-topics/`.

## What Changes

- **New page `/settings/news-preferences`** ("News preferences"), after Email Preferences in the settings menu. It has three cards:
  - **Categories:** six multi-select chips (Funding, Launch, Partnership, Announcement, Milestone, Other), all on by default. At least one stays on. A change saves at once with a "Saved" note, and there is a "Select all" link. The choice narrows For You on Home and the digest's news; the All tab on Home is never narrowed.
  - **Suggested from your profile:** read-only. The member's teams, each with its focus areas and industry tags ("set by <team>"). These are the signals that actually drive news suggestions. Skills are not shown, because news suggestions don't use them.
  - **Teams you follow:** each followed team with a Follow / Following button. Unfollowing keeps the row so it can be undone in place. There is an empty state with a link to Teams.
- **Ways in:**
  - The digest email's "Update preferences" link, `?from=digest`, added in pl-notification-service by LAB-2942.
  - A "Tune For You" link in the For You hint on Home, `?from=feed`.
  - The settings menu, `?from=settings`.
  - Arriving from the digest or the feed outlines the biggest gap until the first change: no followed teams → Teams you follow; otherwise → Categories.
- **Email Preferences:** one line under Network news links to the new page.
- **For You on Home** shows only news in the member's categories. Forum posts and jobs in For You are unaffected.
- **Signed-out visitors** are sent to log in and returned to the page afterwards, as on Email Preferences.
- **Analytics:** page opened (with `from`), category toggled, category save failed, follow toggled on the page, and the For You hint's "Tune For You" click.

## Capabilities

### New Capabilities

- `team-news`: what members see in the Home news feed's For You view, and the News preferences page that shapes it and the digest.

### Modified Capabilities

None.

## Out of scope

- Backend storage and digest filtering. Done in LAB-2940: `Member.preferences.newsCategories`, validated on PATCH and returned by GET with all 6 by default.
- The digest email link itself (LAB-2942, pl-notification-service).
- Deals and Hiring chips. They aren't news event types on the backend, and For You and the digest never show deals.
- Making member skills or member focus areas an input to news suggestions.
- Refreshing For You's team set immediately after follow changes. The Home team set is fixed when the page loads, so a change shows on the next visit to Home.

## Impact

- New: the `app/settings/news-preferences` route, a news-preferences component folder, and a `useFollowedTeams` hook.
- Changed:
  - the settings menu items (`useGetMenuItems`);
  - the Email Preferences Network news card;
  - `ForYouHint`;
  - `selectForYouItems` and `TeamNews`, plus `app/home/page.tsx` to load categories on the server;
  - the member preferences hook and service types;
  - the settings and team-news analytics, with their constants.
- The API is unchanged; the page uses the existing `PATCH /v1/member/:uid/preferences`, `GET /v1/members/:uid/preferences`, `GET /v1/teams/:uid`, `GET /v1/members/me/following/teams` and follow/unfollow.
