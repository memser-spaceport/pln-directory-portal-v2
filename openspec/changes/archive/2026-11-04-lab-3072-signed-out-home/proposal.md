# Proposal

## Why

[LAB-3072](https://linear.app/protocollabs/issue/LAB-3072), part of Goal [LAB-3070](https://linear.app/protocollabs/issue/LAB-3070) (the new Home).

The signed-out Home doesn't orient anyone who isn't an investor or a job seeker. PostHog, 90 days to 2026-10-29, bots excluded:

- 1,100 signed-out people reached `/home`, and 993 of them have no account.
- 73% left the site from `/home`, and the median session lasted 8 seconds.
- The Welcome banner speaks to members and offers only "Sign in".
- The next pages people chose were `/jobs` (100 people), `/members` (61), `/teams` (35) and `/sign-up` (35).

The design team approved a new signed-out page at the 2026-11-02 standup: prototype `homepage-redesign-v0`, source `prototypes/entries/home-v2/`, with the 2026-11-03 follow-ups. It tells the Protocol Labs story, puts both auth doors in the first screen, shows this week's news beside open roles and events, and walks through the portfolio.

## What Changes

- **New build-time flag `NEXT_PUBLIC_SHOW_HOME_V2`.**
  - Off: `/home` is unchanged.
  - On: a signed-out visitor gets the new page.
  - Signed-in members keep today's Home until [LAB-3125](https://linear.app/protocollabs/issue/LAB-3125).
- **The page, top to bottom:**
  - **Hero:** the mission as the page's one `<h1>`, one sentence under it, and a Join the network card with Sign up for free and Sign in.
  - **Figures band:** the Explore page's four figures.
  - **This week:** three news stories beside one sidebar with open roles and upcoming events.
  - **Portfolio:** the islands map, clamped on phones, and four focus-area cards under it.
  - **PL entities:** shown as a row.
  - **Investor logo wall.**
  - **Footer:** the directory's own.
- **Shared pieces.** The rail's open-roles and upcoming-events sections, and the focus-area cards, are built so the signed-in page can reuse them.
- **SEO.** The visually hidden "Protocol Labs Directory" `<h1>` and the About foot from LAB-3089 give way to the visible mission `<h1>`. The Organization and WebSite JSON-LD stay.
- **PostHog click events:**
  - `home-auth-door-clicked`
  - `home-news-pick-clicked`
  - `home-role-clicked`
  - `home-event-clicked`
  - `home-focus-area-clicked`
  - `home-see-all-clicked`

## Capabilities

### New Capabilities

- `home`: what `/home` shows and in what order, and where its data comes from. This change covers the signed-out view; LAB-3125 adds the signed-in view.

### Modified Capabilities

- `seo`: with the flag on, the home page's `<h1>` is the visible mission sentence. The definition sits right under the `<h1>` instead of in an About section at the foot.

## Impact

- **Code:**
  - `app/home/page.tsx`: a branch on the flag and on whether the viewer is signed in.
  - New production components ported from the prototype under `components/page/home/HomeV2/`.
  - Reuse of `components/page/explore-pl-network/*`: `EditorialIntro` content, `PortfolioPanel`, `ExploreLogoWall` and `data/*`.
  - `analytics/home.analytics.ts`.
  - `.env.example`.
- **Backend:** [LAB-3071](https://linear.app/protocollabs/issue/LAB-3071) adds `days`, `limit`, `sort=soonest` and `total` to `GET /v1/irl/events/upcoming`. Until it is merged, the events section reads the endpoint without them and trims on the client.
- **Data that already exists:**
  - `GET /v1/team-news` (editorial rank, newest).
  - `GET /v1/job-openings` (`totalRoles`).
  - `GET /v1/explore-pl-network/portfolio`.
  - All of these are public.
- **Testing:** the feature env with the flag on, then Roma (QA) and Polina (design review).

### Out of scope

- The signed-in Home (LAB-3125).
- See all news, `?view=news` (LAB-3126).
- The Email not found dialog (LAB-3127).
- Open source picks (LAB-3128).
- Story images, waiting on Polina.
- Removing the old Home's components. That is a cleanup after prod sign-off.
- Changes to `/explore-pl-network`.
