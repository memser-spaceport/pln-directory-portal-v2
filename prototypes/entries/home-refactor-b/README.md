# home-refactor-b: ask-first, one column

**Status:** an exploration, not a committed design. It is version B of [`home-refactor`](../home-refactor/README.md) (A). Both answer the same meeting ask: a refactored Home with an open AI Search field and editorial sections for news, forum posts, jobs and selected GitHub repos.
**Route:** `/prototypes/home-refactor-b` (A is `/prototypes/home-refactor`)

## Intent

A is a front page: the field leads, then four editorial sections sit side by side, with a jobs rail. B asks a different question: **what if Home is mostly the question, with the week as a single compact list under it?** It uses one 760px column with no rail. The content is the same week A shows, so the comparison is about structure, not data.

## Page, top to bottom

1. **Greeting + date.** "Good morning, Polina" and today's date, using the viewer's own clock. It renders after mount, so server and client HTML agree. Signed out, it reads "What do you want to find in the network?", which is a neutral line and not a sign-up pitch. The navbar already carries Sign up · Sign in.
2. **AI composer with scope chips inside it.** The AI Search page's own multi-line `Composer`. Its bottom band holds the scope chips (Anything · People · Teams · Jobs · Repos) on the left and the send button on the right. A chip changes the placeholder and the prompt cards under the field. On phones the chips scroll sideways inside the field. Enter behaves exactly as in A: **Answer here** shows the inline AI answer with "Continue in AI Search", and **Open AI Search** hands off to the page. Both are switchable in the review band.
3. **Start with a question.** There are 3–4 prompt cards per scope, each built from this week's content ("Who's hiring Rust engineers this week?" comes from the three Rust roles in the Jobs tab, "What changed in IPFS retrieval?" from the lead news row). Each card names its source type (Job / News / Forum / Repo / Event) and the piece of content it came from. Clicking a card fills the composer and submits it. **This is the bridge between the AI and the editorial content:** the week becomes things to ask about, not only things to scroll past. On phones the cards are a horizontal swipe row.
4. **This week in the network.** One module replaces A's four sections. It has DS `Tabs` (All · News · Forum · Jobs · Repos · Events, each with a count) over a compact row list. Every row has the same anatomy: type glyph + label (+ subtype) with the time on the right, then the title, then source team or author and one or two numbers. Because of that, **All** can interleave the types. All shows "Coming up this week" (events in the next 5 days) above "Latest" (the 8 newest items of any type). Every tab ends with "See all <type> →": the newsfeed prototype, `/forum`, the job-board prototype, A's repo grid (there is no repos page; that is a placeholder), and `/events`. News rows open A's `FeedDetailModal` and forum rows open A's `ForumPostModal`. Job rows open the posting (as in A), repo rows open the GitHub release, and event rows go to `/events`.
5. **Picked repos.** A small strip using A's `RepoCard`. Desktop shows three cards and "See all". On phones it is a swipe row of six.

## Decisions

- **Picked repos strip: kept.** Inside the module, the Repos tab shows **releases this week** (kubo v0.38, rust-libp2p v0.56…), because the module is about what *changed*. A's idea is different: an evergreen, curated pick of repos worth knowing. A tab hides it behind a click, and a release list doesn't express it. The strip keeps the curated idea visible at the cost of about 250px, and it sits last because it changes slowly. If the team drops curation, the strip goes and the Repos tab stays.
- **Events: in, as a tab, plus this week's events in All.** Events are forward-looking, so "this week in the network" fits them only when they happen this week. The Events tab lists the next ~3 weeks. All shows only the two events within 5 days, grouped above the rest so a future date isn't mixed into a list of "5h ago". Evidence for keeping them visible: dated event cards drew about 4–5% of home visitors per month on the old Home, against ~1% for city cards. Events pages themselves are low-traffic (1.3% of visitors), so they get a tab, not a section. (A now has an "Upcoming events" block under Open roles in its rail, so both versions carry events.)
- **Navbar search on Home: hidden while the composer is on screen.** Two AI fields in one viewport are two identical doors. The header's search slot fades out while the composer is visible, and returns once the composer scrolls under the sticky navbar. This keeps search one scroll away anywhere on the page. The review band's **Navbar search** switch shows the alternative (always on, as in A). This is prototype-only: a page-scoped `<style>` hides `header [data-search-anchor]`. The shared navbar is untouched.
- **No rail on desktop.** Jobs are a tab and a prompt card instead of a column. This is the main bet B makes: Jobs draws 40% of site visitors (reference-nav-traffic-2026-10), so **B tests whether a tab and an AI prompt are enough**, or whether jobs need A's always-visible rail.

## How B differs from A, and what each tests

| | A — editorial front page | B — ask-first, one column |
|---|---|---|
| Width | 1200px, two columns (main + 340px Jobs rail) | 760px, one column, no rail |
| Above the field | "Explore the Protocol Labs network" | Greeting + date |
| Field | Composer, scope-less | Composer with scope chips inside |
| Suggestions | "Try" text links (3) | Prompt cards built from this week (3–4 per scope), with source type |
| Editorial | 4 sections: News (lead + 4), Jobs rail, Forum grid (4), Repos grid (6) | 1 module, 6 tabs, compact rows, + a 3-card repo strip |
| Events | Upcoming events block in the rail | Events tab + this week's events at the top of All |
| Navbar search | Always shown | Hidden while the composer is on screen (switchable) |
| Dates | Newsfeed mocks (July: "3 months ago") | Re-dated to the viewer's week, in hours |

- **A tests:** does a browsable front page with rich cards (lead story, author-on-top forum cards, repo cards) bring people back weekly? Does an always-visible jobs rail serve the 40%?
- **B tests:** does making the question the main act, and turning the week into prompts, get the AI field used? Is a dense list with tabs enough editorial, at a fraction of the scroll height? (Desktop: A's page is much taller.)

## Reused vs new

**Reused (imported, not forked):**
- A (`home-refactor`): `RepoCard`, `CURATED_REPOS`, `TOTAL_OPEN_ROLES`, `REPOS_ATTRIBUTION`.
- `home-ai-ask`: `HomeAsk.module.scss` (answer card, ✕, Continue in AI Search, foot note), `AskMode`, `useHeaderSearch`.
- `ai-search-page/Composer` (the field and its round send). `ai-search` `buildAnswer` and `AnswerPanel.module.scss`. `ai-mode-results/proposed` `ThinkingStatus`, `AnswerProse`, `AnswerShapes`, `EntityList`, `SourcesButton`. This is the same answer A shows.
- `newsfeed` / `newsfeed-v0`: the stories, threads and roles, `FeedDetailModal`, `ForumPostModal`, and the review-band switch chrome.
- `nav-shared`: `PrototypeNavBar`, `PrototypeMobileNav`.
- Production: `components/common/Tabs`, `NewsCard.module.scss` (`.card` for the module, and `.cardFlat`, `.headline`, `.headlineCompact`, `.logo`, `.logoFallback`, `.meta`, `.sep` for rows), `DocumentIcon`, `CommentIcon`, `CalendarBlankIcon`, `CloseIcon`, the `/icons/briefcase.svg` and `/icons/repos.svg` paths in currentColor, `formatTimeAgo`, `getTeamLogoFallback`, `getDefaultAvatar`.

**New:**
- `AskFirst`: the composer with scope chips, the prompt cards, and A's answer block. `HomeAsk` couldn't be imported for this because it owns its own headline, Try line and value, so a prompt card can't fill it. Its overview branch is transcribed without the founder request door.
- `WeekModule`: the tabbed row list and the row anatomy.
- `KindGlyph`: one existing glyph per type.
- Scope chips: control-chip lineage (white + subtle edge, brand when on or hovered, brand focus outline).
- `mocks.ts`: B's re-dating, engagement numbers, the extra Rust roles, repo releases, events and prompts.

**Mock fixes over A (B only):** every item has an age in hours, resolved against the viewer's clock, so the week is always this week. Engagement varies and sits in a plausible range: reads 174–1,240, likes 4–46, forum views 207–1,180, events 31–410 going, stars gained +33 to +212. Comment counts come from the real mock threads, so a row and its modal agree.

## Open questions

1. **Ask-first or browse-first?** B bets that people come to Home to ask. If most Home visits are a quick check of what's new, A's richer cards may serve them better. This is worth a PostHog look: Home visits that interact with search vs scroll.
2. **Do jobs need a rail?** In B, jobs are one tab plus a prompt card. Given Jobs' traffic, is that too buried?
3. **Scope chips: real filters or just prompts?** In the prototype the scope changes the placeholder and prompts, and is passed to AI Search as `?scope=` (which the page ignores today). Should AI Search honour it, and do People / Teams / Jobs / Repos map to its indexes?
4. **Who writes the prompt cards?** Hand-written each week by the network team (like the Monday digest), or generated from the week's items? Generated prompts need a quality bar: a question the AI then answers badly is worse than no card. Today the canned answer for "Who's hiring Rust engineers this week?" returns a member rather than the roles, which is exactly that failure.
5. **Repos tab vs Picked repos strip.** Releases this week vs an evergreen pick: does the team want both, either, or neither? Where would a repos page live? "See all" currently points at A's grid.
6. **Hiding the navbar search on Home.** Is a header that changes as you scroll acceptable, or should Home simply have no header search?
7. **Greeting.** Is "Good morning, Polina" worth the vertical space for members who visit daily? Signed out, should the line pitch membership instead?
8. **Row density.** The All tab caps at 2 events + 8 items. Is a long list with a type label per row scannable, or does it need the section headings A has?
