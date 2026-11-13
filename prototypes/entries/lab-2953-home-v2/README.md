# lab-2953-home-v2: Home v2

Version 2 of the LAB-2953 Home prototype, from Polina's `home-v2` brief (2026-10-29). Route: `/prototypes/lab-2953-home-v2` (the requested `/prototypes/home-v2` maps to it; the prototype keys of the designer start with the ticket number). Version 1 stays at `/prototypes/lab-2953-design-homepage-refactor-open`. Mock data only.

Review switch: `?state=signed-out | signed-in | signed-in-no-deals | email-not-found`. The default is `signed-out`. The switch band at the top and the "Upcoming events" flag are review tools, not part of the design.

## Why (the rationale)

Manager's direction:

- The signed-out Home gives no orientation to visitors who are not investors or job seekers. The Explore page layout (focus areas, logo islands) becomes an onboarding story for new visitors.
- Signed-in priorities: forum posts, deals (underused and hidden today) and a news selection.
- Open roles show in both states.
- Upcoming events depend on more event data (La Crysta), so they have a slot behind a flag, off by default.

PostHog, 90 days to 2026-10-29, bots excluded (from the brief):

- Signed out: 1,100 people (993 with no account, 107 logged-out members). 73% left the site from /home; median session 8 seconds. Next pages: /jobs 100, /members 61, /teams 35, /sign-up 35. The current Welcome banner speaks to members and offers only "Sign in".
- Sign-in from Home: 41 people closed the Privy window, 7 entered wrong credentials, 8 hit the dead-end "email not found" modal.
- Signed in: 163 people. Next pages: AI Apps (31 people, 492 visits), /jobs 48, member profiles 48, /forum 25, /deals 13. Only 14 clicked a news card; "Teams to follow" was seen by 88 and used by 6. So "news selection" is a short curated pick, not the feed.

## What each state shows

Signed out, in this order:

1. `EditorialIntro` (production, explore page) and the two auth doors: Sign up first (the navbar `Signup` style, bordered), Sign in second (the navbar `LoginBtn` style, filled). Sentence case.
2. Focus areas: one card per area with links to `/teams` and `/projects` filtered by the area. Then `PortfolioPanel` (production; the islands map and the list) with the static fallback list of teams.
3. Open roles: 4 roles and "See all roles" (`home-refactor/JobsRail`).
4. `ExploreLogoWall` (production).
5. News preview: 3 stories and "Sign up to get updates from teams you follow".

Signed in, in this order:

1. The Quick Actions band (production `ActionCard` and `QuickActions.module.scss`): AI Apps, Job Board, then Network Deals when the member has deals access.
2. From the forum: 4 threads, author on top (`newsfeed-v0/ForumPostCard`).
3. Latest deals: 3 deals and "See all deals". Only with deals access (`deals.read`, `hasDealsAccess` in `components/page/home/QuickActions/utils/resolveQuickActionsState.ts`). `signed-in-no-deals` shows no section and no locked teaser.
4. Selected news: 5 picked stories and "All news". "Teams to follow" is gone.
5. Open roles: the same `JobsRail`, with no auth line.
6. Upcoming events: `home-refactor/EventsRail`, behind the "Upcoming events" flag (off by default).

Email not found: the signed-out page with the production `AuthInvalidUser` shell (`ModalBase`, the warning icon, the same width). The title is "This email isn't in the directory yet". The primary button is "Sign up". "Try another email" replaces the dead end (in the prototype it simulates a successful second sign-in).

## Production files each section would touch

| Section | Production files |
|---|---|
| Page order, signed-in vs signed-out split | `app/home/page.tsx`, `app/home/page.module.css` |
| Intro + auth doors | `components/page/explore-pl-network/EditorialIntro/*`, `components/core/navbar/components/Signup/*`, `components/core/navbar/components/LoginBtn/*` |
| Focus areas + map | `components/page/explore-pl-network/PortfolioPanel/*`, `components/page/explore-pl-network/data/*`, the teams and projects focus-area filters |
| Logo wall | `components/page/explore-pl-network/ExploreLogoWall/*` |
| Quick Actions | `components/page/home/QuickActions/QuickActions.tsx` (card order, AI Apps card) |
| Forum | `components/page/home/*` forum module (new on Home) |
| Deals | `components/page/deals/DealCard/*`, a new Home deals module, `resolveQuickActionsState.ts` (access) |
| News selection | `components/page/home/TeamNews/*` (replaced by a short pick), the curation source |
| Open roles | a new Home jobs module from `components/page/jobs/*` |
| Events | `components/page/home/*` events module, behind a flag |
| Email not found | `components/core/login/components/modals/AuthInvalidUser/AuthInvalidUser.tsx` (`email_not_found` content) |

## Fonts and colours beside the directory chrome

- The explore intro uses the explore page's type sizes (56 / 32 / 18) and centred layout. Under the directory navbar it reads as a landing hero; it sits on its own white sheet, like the explore page.
- The islands map keeps its dark sea and the Aileron font (loaded with `aileron.variable`). It is the only dark block on Home, so it reads as a showcase. No clash found with the navbar colours.
- Clash to check: the explore intro headings are larger than every other Home heading (28px greeting, 20px section heads). That is acceptable for a landing, but the jump is large on phones.

## Open questions

1. Does the Explore story replace `/explore-pl-network`, or does Home link to it?
2. Do logged-out members (107 in 90 days) see the full story, or a lighter "welcome back" with Sign in first?
3. Who curates the news selection, and how often?
4. Which PostHog click events must Home send? QuickActions sends none today.
5. The directory focus-area titles are not checked against marketing's four names. The links use marketing's names as the filter value.

## Defaults the agent picked

- The AI Search field and the agent launcher of version 1 are not on this page: the brief does not name them.
- One column in the order of the brief; open roles and events sit side by side on desktop when the events flag is on.
- Sign in (navbar and intro) simulates a successful sign-in; the email-not-found state is on the switch.
- The deals count line ("23 deals are open to your team") is mock text.
