# home-refactor: AI Search hero + editorial Home

**Status:** first-iteration exploration from the team discussion. It's here so people can react to it; the design isn't decided.
**Route:** `/prototypes/home-refactor`

## Intent

Home opens on a question rather than a feed. The hero is AI Search's own field: open, visible, and ready to type into, with no button and no modal. Under it, a short editorial front page shows what is happening in the network. Today's Home is one long feed. This version is a few deliberate sections, each capped and each with a door to its full surface.

## Section order, and why

1. **AI Search field (hero).** The one thing you can *do* on Home. Every visitor can use it, signed in or not. It sits first because it is the new idea under test, and because a question beats scrolling as a starting point. Enter has two behaviours, set by the **On Enter** switch in the review band:
   - **Answer here** (default): a short AI Overview appears under the field, with "Continue in AI Search".
   - **Open AI Search**: Enter goes straight to `/prototypes/ai-mode-results?q=…`.
2. **This week in the network (News).** The most time-bound content, and the reason to come back weekly. It shows the week's lead story plus four rows, one band, the newsfeed's TopStoriesBlock.
3. **Open roles in the network (Jobs).** On desktop this is the rail *beside* News and Forum, not a section under them. Roles are the second most actionable thing after the field, but they are a list you scan, so a rail fits. On phones it stacks after Forum, because one column has to choose, and conversation is closer to news than a job list is.
4. **From the forum.** Four threads with the author on top (newsfeed-v0's ForumPostCard). It comes after news: a discussion reads better once you know the week's context. The cards open the forum post modal.
5. **Open source picks (was "Selected GitHub repos").** Since 2026-10-21 this is one announcement band (`RepoBanner.tsx`), not a grid of six cards. Left side: a brand-tinted ground with an "Open source picks" badge and the week, the headline "6 repos from network teams worth a look this week", and the lead pick with its meta and the band's one filled press ("View kubo on GitHub ↗"). Right side: the other five picks as a compact white "Also picked" list. Mobbin references: Airtable's home banner (https://mobbin.com/screens/4e398418-27a2-44b2-9992-683881a6a96d), Kajabi's home banner (https://mobbin.com/screens/5d415c90-2aa2-4aae-bd05-b5c346f95361) and Better Stack's open-source tile (https://mobbin.com/sites/sections/65b82dbf-c466-470b-8825-47423304d2f0). Why a band: a weekly pick is news and should read as an announcement, while six equal cards read as a directory. It still goes last, and it is the only section that leads off-platform, to GitHub.

The rule behind the order: *act → what changed this week → who's hiring / what people are discussing → what's worth exploring*. That runs from most time-sensitive to most evergreen.

## Reused vs new

**Reused (imported, not forked):**
- `home-ai-ask/HomeAsk`: the field (the AI Search page's Composer), Try prompts, AI Overview answer (ai-mode-results' proposed answer pieces), and "Continue in AI Search".
- `home-ai-ask/useHeaderSearch`: the navbar's search.
- `newsfeed/TopStoriesBlock` and its mocks.
- `newsfeed-v0`: `ForumPostCard`, `ForumPostModal`, `FeedDetailModal`, switch chrome, mocks.
- `nav-shared`: `PrototypeNavBar`, `PrototypeMobileNav`.
- Production: `app/home/page.module.css` (page width), `NewsCard.module.scss` (every card shell), `NewsBase.module.scss` (section title), the Job Board `TeamGroupCard` expander, `ReferRoleRow` (title link, arrow, query params), and HiringCard's role-row classes. The repo and star glyphs are production paths (`RepositoriesList`, `star-outline-gray.svg`) redrawn in currentColor.

**New:**
- `RepoBanner` (the announcement band on this page) and `RepoCard` (no longer on this page; version B's Picked repos strip imports it). Production has no repo card on Home. The member profile's RepositoriesList, a grey row with name and description, is the nearest one.
- `JobsRail`: a cross-team role list. HiringCard is one team per card.
- The page grid, the section headers, and the "See all" links.

All data is mocked. Repo names are real public repos; the stars and dates are made up.

## Open questions for the team

1. **Who curates the repos, and how often?** The card says "Picked by the network team · updated weekly" as a placeholder. Other options: teams nominate their own repos, or an automatic pick by recent activity or stars across linked team GitHub orgs (production has `githubHandle` on members, and teams hold repos via projects).
2. **Does the hero field replace the navbar search?** Right now both exist: the header keeps ai-mode's search, and the hero is AI only. Two fields on one screen is a cost. One option is to hide the header field on Home only, while the hero is in view.
3. **Answer on Home, or hand off?** Answer-here keeps people on Home, but it builds a second answer surface. Hand-off is simpler, but Home then has nothing to show for the question.
4. **Events: added 2026-10-21 as "Upcoming events" under Open roles in the rail (`EventsRail.tsx`).** Four dated gatherings, each with a date tile, the location and the host, linking to /events/irl. The rail stack (jobs + events) is what sticks, not the jobs card alone. Why dated events rather than city cards: dated event cards drew about 4–5% of home visitors per month on the old Home, against about 1% for city cards. Events get only ~10 visitors a week (reference-nav-traffic-2026-10), so Home may be the right door if Events loses its top-level nav slot to Jobs. Still open: who decides which events count as "network" events, and whether the list follows the viewer's city.
5. **What happens to For You, Following, Post news, and the feed's filters?** This Home has none of them. Is the full feed now the "All news" page (`/prototypes/newsfeed`), with Home as its front page?
6. **Signed-out visitors:** should the hero lead with a sign-up ask, or stay purely useful? It stays useful today, and the navbar carries Sign up · Sign in.
7. **Section caps:** 4 + lead, 4 threads, 5 roles, 6 repos. Are those the right sizes? Should any section hide when it has nothing fresh?
