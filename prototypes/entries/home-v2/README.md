# homepage-redesign-v0: onboarding story signed out, member desk signed in

**Status:** proposal prototype. Mocked data only.
**Route:** `/prototypes/homepage-redesign-v0` (was `/prototypes/home-v2` until 2026-11-03; the folder keeps its name)
**Review switches:** `?state=signed-out` (default) `| signed-in | signed-in-no-deals | email-not-found`, `?events=upcoming` (default) `| none`, and signed in `?repos=picks` (default) `| none` and `?cue=fade|jump`. The same switches sit in the grey review band under the navbar.

## 2026-11-05 LabOS Agent V0

Signed in, a floating **Agent** button (or Ctrl/⌘ J) opens a panel docked on the right. `?agent=open` opens it on arrival, and `?viewer=founder` (default) `| member` picks who is signed in. The panel is home-v2-b's `AgentPanel`, imported rather than forked: steps, streaming, composer. `AgentV0.tsx` holds only this version's script and its three cards. Replies are scripted, and Send, Apply and Post only switch a card to its receipt.

What V0 does, from the V0 notes:

| Ask | What the agent does |
|---|---|
| **Request to the PL Venture team** (portfolio founders only). "I need intros to founders who raised a Series A this year, I'm planning a fundraise" | Asks the one thing the profile can't answer, *when are you raising?*, as numbered options. Then it returns an editable request: To PL Venture team, the text, what goes with it (your profile and your team's), where the reply goes. Sends only on **Send to PL Venture team**. |
| **Update the team profile from a URL**. "Update our team profile from latticecompute.xyz", or a bare link | Reads the site and lists each field it would change as old (struck through) → new, all ticked. **Apply N changes** counts the ticked rows, and Undo is on the receipt. A link sent on its own gets "What should I do with it?" (team profile / forum post) rather than a guess. |
| **Update my profile**. "I'm now CEO and based in Lisbon" | The same change card, for the member's own profile. |
| **Draft and create a forum post** | An editable title and body, posted on **Post to forum**. |

Not for investors: V0 has no use case for them. A member who isn't a portfolio founder gets no request prompt, and if they type one anyway, the agent says who requests are for and links to AI Search.

Why these shapes (Mobbin): Delphi edits a card in place in the thread and saves it ("ready for you to refine before saving"). Whop and AirOps ask in the thread when the agent isn't sure, rather than guessing. Cofounder shows tasks marked "Requires approval". The agent asks before it changes or sends anything, as B's follow proposal already does.

Navigation was left as it is (the V0 notes put agent UX first). Home has no sidebar, so the door is B's phone pill at every width. Collapsing the left nav inside AI apps is for those apps and isn't built here.

Open: does a sent request show up anywhere after the receipt (a thread, an email)? Does the PL Venture team reply in LabOS or by email? Can a founder see their earlier requests?

## 2026-11-02 design standup: what changed

V0 (this prototype) was picked as the version to build now: V1's signed-out page with V0's member page. V1 (`home-v2-b`) now re-exports this prototype's `SignedOutHome.tsx`, so the two signed-out pages can't drift. The style refresh is parked: the structure works, but the styling reads as generated. Top-level navigation stays as it is until there's a clear answer. The likely first move is Job Board out of More.

**Signed out** (`SignedOutHome.tsx`)
- **Hero:** no overline, and no "The Protocol Labs Network" title. The H1 is now the mission, "Protocol Labs drives breakthroughs in computing to push humanity forward.", at 32/40 (down from the old title's 48/56), balanced over two lines. Under it is the About text's first sentence; everything from "Organizations collaborate across…" is gone, the origin paragraph included.
- **This week + roles + events:** the news sits beside one sidebar holding open roles (3) and upcoming events (3), the same sections the member rail has. With no events in the next 30 days (`?events=none`) the events section goes and roles take the room (5).
- **Portfolio:** the map is unchanged. The focus areas use Explore's simpler numbered look (EditorialIntro's `.edFocusItem`: 01–04, name, marketing's line), with Teams / Projects doors under each.
- **PL entities:** a row under the portfolio, Explore's five across, matching the portfolio's width.
- **Removed:** the closing Join card (a Q&A may take that spot later: why sign up, what membership gives, how to apply for a role, when forum access comes) and the SPV footer (its investment disclaimer and Demo Day legal links belong to SPV pages).
- **Not added:** deals. They exist only for signed-in portfolio founders. Search was already in the signed-out header here; it was missing only from the style refresh.

**Signed in**
- **No All · News · Forum tabs:** one stream. Forum posts already appear in production's stream for members who have the forum, Discussions filters them, and a Forum tab means nothing to a member without forum access.
- **Rail:** open roles, then upcoming events (on by default now, gone when there are none), Teams to follow, deals only with `deals.read` (`signed-in-no-deals` is the common case), Popular this week. So the minimal state is news + roles.
- **Top stories:** unpinned. They're labelled in the stream, with a Top pill (confirmed).
- **Filters:** the trimmed row (For You · All · Top · Discussions · Funding · Launch · Announcement) is confirmed. Production's focus-area tabs are not brought back.
- **Search:** production's header search (`NewsSearch`; the full-width field on phones). It matches team, title, summary and tags, and a leading `#` is dropped. **Dev note:** production's `matchesTeamNewsQuery` already checks tags on main and develop. A `#ai` query fails only because no tag contains "#", so the fix is that one normalisation.
- **Under the feed:** the open-source picks when curated (`?repos=none` shows nothing in their place), then the same focus areas as signed out ("Browse by focus area"), which replace production's FocusAreaSection.
- **Media on stories:** the video poster already shows where a story has one (the IPFS story). Since 2026-11-04 the signed-in feed's other five stories carry an image in the same 16:9 column beside the headline (full width on phones), and the story modal shows it as its header where a video would play. The images are Unsplash stock picked per story (`IMAGE_BY_UID` in `mocks.ts`). The review band's Image switch (`?image=below`) moves it to the card's full width under the summary and hashtags, above the meta line. The image isn't a control, and the row still opens the story. Production news has no image field: the scraper that feeds the digest would need to keep each story's image (og:image). Open question for backend.

**2026-11-03 follow-ups**
- **Hero:** the mission sentence is the H1 (40/48 on desktop, 32/40 on phones). The copy and the Join card are centred on each other.
- **Large screens:** every band uses the Explore page's measure (a 1184px column in the 1344px sheet, the same side insets at each breakpoint), so all sections share one left edge.
- **Focus areas:** category cards (Mobbin: Coda's banded categories, Headspace and Dropbox topic tiles). No colour band on top (removed 2026-11-03). Each has a count of its portfolio teams with a pile of their logos on the island colour (they're the map's white glyphs), the name and line, and Teams → / Projects → as a split foot.
- **Deals panel:** a "Portfolio perks" kicker, then white rows on the tint with the vendor mark, the name, a green value pill ("12 mo free", "$50K credits") and the line, with "See all 38 deals →" left-aligned (Mobbin: Revolut Business rewards, SoundCloud benefits, Adobe partner perks). The value is mocked (`OFFER_VALUE` in `DealsRail.tsx`). The deals API has only `shortDescription`, so a build needs a field for it.
- **Multi-tag filtering** (the feed and See all news): tag clicks stack, and a story must carry every selected tag. The scope sits on its own row under the pills: a chip with ✕ per tag, the count, Follow for a single tag or Clear all from two, and "Narrow by + #tag" with the commonest other tags still in scope. `TopicTags` (newsfeed-v0) now accepts a list for `active`, and other prototypes are unchanged.
- **Footer** (signed out, `HomeFooter.tsx`): the logo and mission, then Directory / Network / Protocol Labs link columns, then © and Contact support (opens production's support form). There are no legal links, because the only ones in the codebase are Demo Day's PDFs.

The sections below describe the page before the standup. Where they differ, the list above wins.

## Why

### The manager's direction

- The signed-out Home doesn't orient anyone who isn't an investor or a job seeker. The Explore PL Network layout (focus areas, logo islands) becomes the onboarding story for new visitors.
- Signed in, the priorities are forum posts, deals (underused and hidden today) and a news selection.
- Open roles appear in both states.
- Upcoming events depend on La Crysta bringing in more data. They get a slot, but the page isn't designed around them.

### The data (PostHog, 90 days to 2026-10-29, bots excluded)

**Signed out:** 1,100 people.
- 993 have no account. 107 are members who were signed out.
- 73% left the site from /home, and the median session lasted 8 seconds.
- Where people went next: /jobs (100 people), /members (61), /teams (35), /sign-up (35).
- Today's Welcome banner speaks to members and offers only "Sign in". The 993 people without an account get no door.

**Sign-in from Home:**
- 41 people closed the Privy window.
- 7 entered the wrong credentials.
- 8 hit the "Email not found" modal, which ends there.

**Signed in:** 163 people.
- Where people went next: AI Apps (31 people, 492 visits), /jobs (48), member profiles (48), /forum (25), /deals (13).
- Only 14 people clicked a news card in 90 days.
- "Teams to follow" was seen by 88 people and used by 6.
- So "news selection" here means a short curated pick, not the full feed.

## What's on the page

### Signed out, in story order

Sections 1 and 2 follow the 2026-10-30 mock, on a neutral ground (`--background-neutral-soft-surface`, no blue cast). From the portfolio down, the page is one full-bleed white band ending in the footer.

1. **Who PL is** (`StoryIntro.tsx`). EditorialIntro's header (overline, title at 48/56 so it holds one line, mission lede, the two General Info paragraphs; production classes and `data/content.ts`), left-aligned beside a **Join the network** card: one line on what the directory is for, **Sign up for free** (DS primary with the product's glossy highlight, follow-shared `.glossy`), an "or" rule, **Sign in** (outlined), both 42px, then three founders' faces (Juan Benet, Molly Mackinlay, Vincent Weisser, each the photo on their own directory profile) and "750+ organizations in the network". The door order follows the mock, not the navbar pair (Sign up quiet first, Sign in filled): this reader is mostly new, so Sign up leads.
   - **Figures band:** EditorialIntro's four figures as a full-bleed white strip, hairline-divided ("Network organizations", the mock's shorter label for one that wraps).
2. **This week in the network beside PL Entities.** Left: three stories in one white card (`NewsPreviewList.tsx`, production `NewsCard`'s flat rows with the mock's changes: time at the head row's end, the event type as a brand Badge beside the source) with **See all updates →** in the header corner and again as **See all 23 updates**, the card's last row (added 2026-11-05: Anuj found the corner link alone hard to see; the bottom row matches the rail's "See all N jobs / events" expanders, and both are kept); Follow and Like are the sign-up ask, the row opens the story. Right: EditorialIntro's PL entities as stacked cards, each linking out.
3. **The portfolio.** Production `PortfolioPanel` (islands map and list), fed the static fallback JSON. Under it are four focus-area tiles. Each has a **Teams** and a **Projects** link to `/teams?focusAreas=<name>` / `/projects?focusAreas=<name>`, the URL shape the old Home `FocusAreaSection` used. On phones the map is clamped to 640px with a fade and "Show the whole map". Unclamped it is about 3,000px of hexes, which buries everything after it.
4. **Open roles.** home-refactor's `JobsRail` (4 roles plus "See all 64 jobs"). Its new optional `note` slot carries a full-width glossy **Sign up to apply** button (the Join card's primary at size s) (2026-11-05 review: as inline brand text it read the same as "See all N jobs" below it and was easy to miss). /jobs is the top next page for signed-out visitors.
5. **Logo wall.** Production `ExploreLogoWall`.
6. **Closing CTA.** The hero's Join the network card again (`JoinCard`, one component for both), in its `wide` layout (copy and facepile on the left, Sign up · or · Sign in in a row on the right, full content width from 960px; the stacked card below) right after the PL entities and before the logo wall (restored 2026-11-05: the hero asks before anyone has read the page, so the ask comes back once the story is told).
7. **Footer.** The live Explore page's `SpvFooter` with its note, Privacy Policy and Terms & Conditions on (Explore turns them off; this is the directory's Home).

### Signed in, in order

1. **Quick Actions: removed (2026-10-30).** The page opens on the feed; deals stay reachable from the rail.
2. **Network Updates** (`WeekFeed.tsx`): the title at module size, then production Home's description line under it ("Recent shipping, raises, partnerships, and milestones from across the network.", NewsBase's copy and `.sub`). One grouped feed, tabs All · News · Forum, with the posts **in full**. News uses newsfeed-v0's `V0FeedCard` and forum uses `ForumPostCard`, the same pair newsfeed-v0 mixes, so each item has its body, tags, likes and comments. All interleaves both by recency, so the first screen shows a forum post and the next story.
   - **Filtering under the tabs:** production Home's filter bar (`TeamNews.module.scss` `.filterBar` / `.catRow` / `.cat`, `SortDropdown`). Pills are For You, All, Discussions (forum posts, on the All tab), then Funding, Launch and Announcement, with counts. Milestone, Partnership and Other are left off the row (1, 4 and 3 people used them in 90 days; Other is the uncategorised catch-all): their posts stay under All and keep their card label. A pill whose count drops to 0, including inside a hashtag scope, is hidden rather than greyed. "All" (was "All categories") resets, and so does pressing the active pill again. On the Forum tab the pills are the forum's categories. Phones get production's "Type:" dropdown instead of the pills. "Sort by:" is production's Latest / Following / Most popular. For You is a mocked slice (`FOR_YOU_UIDS`); production builds it from focus areas, skills and followed teams.
   - **For You caption:** production's `ForYouHint` ("For you: Curated based on your profile, primary team attributes, and the teams you follow. Update your profile…"), shown where production shows it: head of the stream, For You only. Redrawn as a caption instead of a grey box: **For you** · Curated from your profile, your team, and the teams you follow. on the left, **Tune For You →** on the right (develop's newer link, to News preferences: the `digest-topics` prototype with `?from=feed`). It sits 8px under the filter bar because it names the pill just chosen. One line on desktop; on phones the link wraps to the left edge.
   - **Top stories:** production's band at the head of the feed, under the filter bar (newsfeed's `TopStoriesBlock`, the prototype copy; production's reads the auth store). Lead plus two rows, the newsfeed's editorial pick re-dated to this week. Production's rules: shown on the All tab while the category is All or For You and nothing narrows it (a hashtag scope here, search there); its stories leave the cards below and Popular this week. Cost: on a 900px desktop screen the band fills the first screen, and the first forum post starts below it.
   - **Hashtags on the cards:** news and forum cards both draw them in the newsfeed's style (newsfeed-v0 `TopicTags` as blue `#tag` links), not as grey chips. Story tags use production's real tag vocabulary (`ITeamNewsItem.tags`, which production searches but never renders): a verb, then topics, read from the live feed on 2026-10-30 (`PROD_TAGS_BY_UID` in mocks.ts has the counts). A click scopes the feed the newsfeed's way, "Filter: #tag ✕ · N updates · Follow" beside Sort by, across news and threads; clicking the tag again clears it.
   - **The cut:** beside the sidebar, the feed is cut exactly where the sidebar ends, the last card fading into the page ground under **See all news** (Forum tab: See all forum posts), so the two columns finish on one line and nothing leaves a hole under the shorter one. Without the Top stories band it keeps at least three full cards; with the band (three stories already on the page) there's no minimum. Stacked on phones: three cards (two under the band), then 140px of the next one faded. The faded card is inert. A feed that visibly ends is the cue that Home continues below it.
3. **One full sidebar beside it** (on phones it stacks after the feed): every module below is a section of a single white card, divided by hairlines, after Digg's sidebar (one column of Daily / Discover Communities / Featured Posts). The modules keep their titles, rows and See all and lose their own card chrome. Not sticky, since it runs taller than the window; the feed's cut lands at its bottom.
   - **Open roles:** the same `JobsRail`, without the auth line.
   - **Upcoming events:** home-refactor's `EventsRail`, behind `?events=on`. It is off by default. It needs La Crysta's event data to be reliable (city coverage, dates, hosts) before it earns a permanent slot. Until then the slot stays empty, and the page doesn't depend on it.
   - **New deals for your team** (2026-11-02: moved under Teams to follow, on a filled panel): the three latest deals as compact rail rows (vendor mark, name, the offer) and "See all 38 deals". The panel fills with `--background-brand-subtle` edge to edge across the sidebar and replaces the hairlines above and below it, so the perk reads apart from the network lists. Only with `hasDealsAccess` (`deals.read`). In `signed-in-no-deals` the module and the shortcut are both gone, with no locked teaser. Deals are not a tab in the week module: they're a catalogue, not a dated stream, and a tab would hide them again.

4. **Open source picks**, full width under the feed and rail: home-refactor's `RepoBanner` (lead repo plus five more from network teams).

The rail also keeps production's news rail, in its order, under the roles:
   - **Teams to follow:** a copy of production's `TeamsToFollowCard` (same markup and classes; no auth-store read). Following is one-way, as in production, and flips the team's Follow on its news cards.
   - **Popular this week:** production's `PopularThisWeekCard`, imported as is, with the week's three most-liked stories. A tap opens the story's modal (production scrolls to it in the feed, which the cut feed can't promise).

**Showing there's something under the feed.** Two cues, switchable with `?cue=` (review band, "Below feed"):
- `fade` (default): the cut itself. The feed ends on a fading card and See all news, so it reads as a section with an end, not an endless stream, and the band below starts right after it.
- `jump`: the same cut, plus "Open source picks ↓" in the feed header. It names what's below before anyone scrolls, which the fade can't do. The cost is a second link in a header that already has tabs and filters.

Other options considered and not built: a sticky "More on Home ↓" pill (floats over content and competes with the feedback button), and a shorter feed so the band peeks into the first screen (not dependable across screen heights).

**Why one module (2026-10-30 revision).** The first version stacked From the forum (a 2×2 card grid), a deals card band, and Picked this week. The forum grid alone filled the first screen, so a member saw no news until they scrolled. The grouped overview puts both in front of them at once, and moving deals into the rail puts them on the first screen as well. The Mobbin MCP server was unreachable during this revision, so the pattern is the one already explored in `home-refactor-b` (its README lists the references: Plane's "Recent", Record Club's "… this week").

**Open point:** the News tab shows the week's six stories from home-refactor-b's mocks. The brief's "five picked stories" is a curation question (who picks, how many), not a layout one.

### Email not found

The page signed out, with production's `AuthInvalidUser` shell open: `ModalBase`, warning icon, 400px root, link-style footer button. The content changes:

| | Production | home-v2 |
|---|---|---|
| Title | Email Not Found | This email isn't in the directory yet |
| Body | "Double-check your email or try a different one…" | Names the email, then says what to do if you're new and what to do if you're a member |
| Buttons | Cancel · Sign up · Contact Support (link) | **Sign up** (primary) · Try another email (link) · ✕ |

In production, "Try another email" would reopen Privy. In the prototype it closes back to the signed-out page. Contact support is still in the help menu.

### See all news (`?view=news`)

Where "See all news" (signed in, under the cut feed) and "See all updates" (signed out) lead: a page of news only, no forum threads (`NewsGrid.tsx`). The other review params ride along, so it opens in whichever state you were in.
- **Head:** "← Home", "Network news", "N stories from network teams".
- **Search:** production's news search (`NewsSearch`) beside the title, held open rather than behind the icon, since finding a story is a main job of this page; on phones production's full-width row under the head. Same rule as the week feed: team, headline, summary and tags, a leading "#" dropped. It narrows on top of the pill and hashtags, the pill counts follow it, and no match shows "No stories match … Clear search".
- **Filter bar:** the week feed's: For You · All · Funding · Launch · Announcement with counts (Discussions left off, since there are no threads here), empty chips hidden, the active chip resets on a second press; Sort by on the right; on phones the "Type:" dropdown.
- **Grid:** 2 columns from tablet up, 1 on phones (3 on desktop until 2026-11-04). Each card transcribes production `NewsCard`'s default boxed variant, the card production's Home grid draws, with media added (2026-11-04): the story's 16:9 image at full card width under the hashtags, or for the three video stories their poster, which opens the story already playing. Media and meta line sit on the card's floor, so a row's images line up. (The media was on top at first; moved under the text on every width the same day.) The card reads team head with Follow, a two-line headline, a three-line summary, the feed's hashtag links (a click scopes the grid with "Filter: #tag ✕ · N stories"), then the event dot and label, time, views, likes and comments pinned to the card's floor.
- **Data:** every news story in the newsfeed corpus (23), hiring roll-ups and deals excluded; this week's six re-dated and re-tagged as on Home.
- Signed out, Follow and Like are the sign-up ask; the card opens the story either way.

## Explore beside directory chrome: what clashes

- **Two type scales.** Explore's section titles are 32/42 centred (24/32 on phones). The directory's Home titles are 20/28 left-aligned. Signed out uses only Explore's scale and signed in uses only the directory's, so each page is consistent on its own, but the two Homes don't look like the same product. Within the story, `JobsRail` and `TopStoriesBlock` carry directory-sized type under 32px Explore headings. That's readable, but it's visibly two systems.
- **The map's black.** `PortfolioPanel` is a pure black box with marketing's island blues (`#4584EF`, `#244680`…). Neither is a PL token, and the blues sit close to, but not on, the brand blue `#1b4dff` used by the links right under it. The focus-area dots reuse the island colours so the legend matches the map, which carries the drift one step further.
- **Fonts.** No clash. Aileron is used only inside the map (`--font-aileron` is set on the page root, as the live Explore page does), and everything else is the app font.
- **Cards on a white sheet.** Explore's content is a white sheet on the directory's grey ground (`#f1f5f9`, the same ground). Directory cards (jobs, news) are white cards with light shadows, so on white they lose most of their separation. Fine in a prototype; a build would either drop the sheet or give the cards a border.
- **Sign in's gradient pill** is the loudest thing on the editorial page. That's correct for the main door, but it is the only gradient in the story.
- **The navbar** uses home-refactor's header search (the field fills the free width). With the fixed-width search, the signed-out bar is 56px wider than a 1200px window.

## Production files each section would touch

| Section | Files |
|---|---|
| State split | `app/home/page.tsx` (it already branches on `isLoggedIn` and resolves `quickActionsState` on the server) |
| Signed-out intro, map, logo wall | `components/page/explore-pl-network/EditorialIntro`, `PortfolioPanel`, `ExploreLogoWall`; `ExplorePlNetworkView.module.scss` (sheet and section titles would move to a shared module); `services/explore-pl-network/portfolio.service.ts` (`getPortfolioTeams`) and `data/mergePortfolio.ts` called from the Home page; `SHOW_EXPLORE_PL_NETWORK` |
| Auth doors | `components/core/navbar/components/Signup`, `LoginBtn` (classes, or a shared button); `components/page/home/Welcome` (replaced) |
| Focus-area links | `services/common.service.ts` `getFocusAreas` (map marketing's four onto directory titles) |
| Quick Actions | `components/page/home/QuickActions/QuickActions.tsx` (order, AI Apps card), `utils/resolveQuickActionsState.ts` (who sees AI Apps) |
| Open source picks | a curated repo list (no service exists yet; who picks them is an open question, like the news pick) |
| This week (forum + news) | `TeamNews.tsx`'s filter bar and card list, with a 3-card cap and See all news; a new Home section merging `services/forum/*` (latest threads) and `services/team-news/team-news.service.ts` (the curated pick) into one list sorted by date; `components/page/home/TeamNews` stops rendering the full feed on Home; remove `NewsRail/components/TeamsToFollowCard` and `FeedScrollers/FollowTeamsScroller` from Home |
| Deals | `services/deals/*`, a Home deals rail (`components/page/deals/dealsIcons` for the vendor marks), `resolveQuickActionsState.ts` `hasDealsAccess` |
| Open roles | `services/jobs/*`, a Home roles rail (the Job Board's `TeamGroupCard` / `ReferRoleRow` classes) |
| Events (flagged) | `services/events/*`, `events.service.ts` |
| Email not found | `components/core/login/components/modals/AuthInvalidUser/AuthInvalidUser.tsx` (`ERROR_CONTENT.email_not_found` and its footer), `analytics/auth.analytics.ts`, Privy re-open for "Try another email" |

## Reused vs new

**Imported from production:** `EditorialIntro`, `PortfolioPanel`, `ExploreLogoWall`, `aileron`, `ExplorePlNetworkView.module.scss`, `DEAL_ICONS`, `ModalBase`, `Button`, `AuthInvalidUser.module.scss`, `Signup.module.scss`, `LoginButton.module.scss`, `app/home/page.module.css`.

**Copied and simplified:** `EmailNotFoundModal` (new content in the same shell).

**New here:** `DealsRail` (JobsRail's card and rows, with vendor marks).

**From sibling prototypes:** home-refactor-b (the week's grouping, its re-dated mocks and tab styles), home-refactor (`JobsRail`, `EventsRail`, `RepoBanner`, rail styles, mocks), newsfeed (`TopStoriesBlock`, signed-out preview), newsfeed-v0 (`V0FeedCard`, `ForumPostCard`, the modals, switch chrome), home-ai-ask (`useHeaderSearch`), nav-shared.

**Changed outside this folder:** `home-refactor/JobsRail.tsx` gained an optional `note` prop. home-refactor passes none, so its output is unchanged.

## Open questions

1. **Does the Explore story replace /explore-pl-network or link to it?** If Home is the story, /explore-pl-network becomes the chromeless version for SPV links, and both pages share the components but not the frame. If not, Home needs a shorter version with a "See the whole network" link.
2. **Do signed-out members see the story or a lighter "welcome back"?** 107 of the 1,100 are members who were signed out. A returning-member cookie could show them "Welcome back, sign in" over the story. Today both groups get the same page.
3. **Who curates the news selection?** The network team (like the Monday digest), an automatic rank (popularity and recency), or a mix where the team pins the lead? Also: does the pick follow the member's focus areas?
4. **What PostHog click events should Home send?** QuickActions sends none today. Proposed:
   - `home_quick_action_clicked` {action, position}
   - `home_forum_thread_clicked` {thread_uid, position}
   - `home_deal_clicked` {deal_uid, position}
   - `home_see_all_clicked` {section}
   - `home_news_pick_clicked` {news_uid, position}
   - `home_role_clicked` {team_uid, position, signed_in}
   - `home_focus_area_clicked` {area, target: teams|projects}
   - `home_auth_door_clicked` {door: sign_up|sign_in, section}
   - `auth_invalid_user_try_another_clicked`
5. **Focus-area mapping.** The links pass marketing's names (Digital Human Rights, Economies & Governance, AI & Robotics, Neurotechnology) as `focusAreas` titles. The directory's focus-area tree may name them differently, and if so a link lands on an empty filter.
6. **AI Apps visibility.** AI Apps lives under `/pl-infra/ai-apps`. If members outside PL Infra can't open it, the lead shortcut has to follow the same access check.

## 2026-11-06 changes

- **Investor logo wall:** each logo links to the backer's site in a new tab (`LinkedLogoWall.tsx`, a copy of production `ExploreLogoWall` plus the links; NIV and Mesh stay unlinked). Hover fades the logo to 60%.
- **Focus area cards:** the logo pile shows the teams' own colour logos (directory logos in `COLOR_LOGO_BY_UID`, mocks.ts) instead of the map's white tiles on the island colour.
- **Network news, signed out:** no For You pill (nothing of the visitor to pick from). A "Make it yours" row under the filters with a glossy **Personalize my news** button opens production's sign-up modal (`SignupWizard`, the `?dialog=signup` one). Its submit calls the real API, so in the prototype it is for looking at.
- **Signed in, under Browse by focus area:** the signed-out network overview (portfolio map, Protocol Labs entities, investor logo wall) on the same full-bleed white band. It is one component, `NetworkOverview` in `SignedOutHome.tsx`, which both states render. Signed in passes `focusAreas={false}` because the cards are already above it. Signed out passes the closing Join card as its children.
