# agent

The LabOS Agent and Feedback as two tabs of one floating button. It's a separate entry, built on `homepage-redesign-v0-agent` (folder `home-v2-agent-dock`), whose Home pieces it imports unchanged. It's signed in only.

## What changed from homepage-redesign-v0-agent

- **Agent | Feedback, one floating button (2026-11-18).** This replaces the 2026-11-17 single "Agent" door. The corner is home-v2-agent-dock's `AgentCorner`, imported: one pill holding both tabs. It arrives with both labels, settles to two glyphs, and a hovered tab shows its label again; Feedback keeps dev's brand fill. Either tab opens the right-hand drawer on that tab. The drawer's title is the same pair (`SlotTabs`), so switching swaps the Agent panel and the LabOS feedback drawer in place (both 480px, no slide). Ctrl/⌘ J and Alt F switch too.
- **Feedback in the agent.** Because Feedback has its own tab again, the agent no longer offers "Report a problem…" as a prompt. If someone types feedback to the agent anyway ("the events filter forgets my city"), it still drafts a feedback card: Kind pills, the note, the current page and a screenshot checkbox, sent only on **Send feedback**.
- **Context.** The row above the composer starts with the current page (✕ takes it out). **+** opens a picker with a search field. Typing **@** opens the same picker, filtered by what follows. Groups: pages (this page and recently viewed), news, teams, members, events, forum. Picking adds a chip, and with @ it also inserts a short `@name` into the sentence. Arrow keys and Enter/Tab pick; Esc closes the picker before the drawer.
- **Ask AI on news cards** (exploration; `?askai=off` hides it). It's a control at the end of each card's action row. It starts a new chat reading Home plus that story, offering: Summarize this story, Who at {team} should I talk to?, and Draft a comment on it. The comment is a card that posts only on Post.
- **Role-aware** (`?viewer=`). The empty state's line says what this member can do.
  - Portfolio founder (default): intros through the PL Venture team, plus everything a lead can do.
  - Team lead: their own profile, the team profile from a URL, and team news (type pills, headline, summary, **Post to {team} news**).
  - Member: their own profile and forum drafts. Team profile changes and team news become a suggestion addressed to the lead (**Send all 3 to Sam**). Intro requests get the "portfolio founders only" answer.
- `?page=profile`: the same drawer on a member profile, with profile questions first.

## Files

- `AgentDrawer.tsx`: the door, history, context state, and Ask AI hand-off.
- `AgentChat.tsx`: a fork of `home-v2-b/AgentPanel`, plus the context row and the @ / + picker. It's forked so home-v2-b and home-v2-agent-dock don't change.
- `script.tsx`: a fork of `home-v2-agent-dock/AgentV0`, with roles, feedback, team news, and answers about context.
- `items.tsx`: what can be put in context, built from the Home entries' mocks.
- Shared change: `newsfeed-v0/V0FeedCard` gained an optional `footerExtra`. It's a no-op for other hosts.

## Open questions

- Should @mentions be inline pills in the composer rather than text plus a chip? In a plain textarea, the chip carries the reference.
- What should Ask AI show on forum cards and in the story modal?
- With a Feedback tab, should the agent keep drafting feedback cards when told about a problem, or hand off to the Feedback tab with the text filled in?
