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

## LAB-3389: AI Search, resize, page context (2026-11-24)

- **Open in AI Search.** A labelled header action, **AI Search** with the product's AI mark (the mark the profiles' Ask AI wears, and that door opens AI Search too). It sits first among the header actions, before history, New chat and ✕. It's disabled until the chat has one answer; the tooltip says why. Pressing it opens the `ai-search-page` prototype in a new tab with every answered question as one new saved thread (top of History, all answered). If the agent is reading a member profile, the thread is scoped to that person (`about=member`); Home has no scope, so it's the whole network. The agent's chat stays as it was. If AI Search can't save the thread, a red line under the header says so, with **Retry** and a dismiss (`?handoff=fail`: the first press fails, Retry works). On a phone the word drops and the mark stays, with a 44px touch area.
- **Resize.** Drag the panel's left edge from 960px up. Idle, it's just the border. On hover, the cursor changes and a 2px brand rule shows. While dragging, the rule stays solid and the page can't be text-selected. Width: 600 by default (2026-11-25: "make it wider by default"; the Wide | Narrow header button was removed the same day, so the drag edge is the only resize), 440 min, 720 max, and the page always keeps at least 480px beside it. Double-click resets to 600. Focus the edge and use ← → (Shift for bigger steps), Home or End. The width persists in localStorage (`pln-proto-agent-width`, wrapped in try/catch). The Feedback tab uses the same width, since the two tabs share one slot. Below 960 the panel is the full-screen sheet with no edge.
- **All AI Search chats (2026-11-25, "link to ai chats").** The history menu ends with a rule and **All AI Search chats ↗**, which opens `ai-search-page?history=1` in a new tab with the History rail open. The menu is forked into `AgentHistory.tsx`, so home-v2-agent-dock is unchanged. The agent's own recent chats stay above it.
- **Renamed to AI agent chat (2026-11-25).** The product formerly called AI Search is **AI agent chat** in every prototype: the agent's header action and **All AI agent chats ↗**, the AI Search page and mode prototypes (title, hero, history rail, placeholders), the search popover rows, the guided tour, the MCP hint hosts and the registry. Only what people read changed; routes (`/ai-search`), file names, identifiers and code comments keep the old name. Production (`components/core/navbar/husky-link.tsx` and the `/ai-search` page) still says AI Search and needs its own ticket.
- **This page as context.** The context row's first slot is always the page you're on, and only its state changes:
  - Attached: `[glyph] Context Maya Okonkwo ✕`.
  - Removed: `[glyph] Not in context Maya Okonkwo +`, dashed. One press puts it back.
  - Unreadable (`?pageread=off`): `[lock] Can't read this page`, with nothing to press. The agent starts with no context.
  - Other chips (stories, teams, members) follow it, then **+ Add**.

## Files

- `AgentDrawer.tsx`: the door, history, context state, the Ask AI hand-off, the panel width and its edge handle, and the AI Search hand-off URL.
- `AgentChat.tsx`: a fork of `home-v2-b/AgentPanel`, plus the context row and the @ / + picker. It's forked so home-v2-b and home-v2-agent-dock don't change.
- `script.tsx`: a fork of `home-v2-agent-dock/AgentV0`, with roles, feedback, team news, and answers about context.
- `items.tsx`: what can be put in context, built from the Home entries' mocks.
- Shared change: `newsfeed-v0/V0FeedCard` gained an optional `footerExtra`. It's a no-op for other hosts.
- `AgentHistory.tsx`: a fork of home-v2-agent-dock's `AgentHistoryMenu`, with the All AI Search chats footer.
- Shared change (LAB-3389): `ai-search-page` reads a repeated `?q=`, so one URL can carry several answered questions. A single `q` works as before. It also reads `?history=1`, which opens with the History rail open.

## Open questions

- Should @mentions be inline pills in the composer rather than text plus a chip? In a plain textarea, the chip carries the reference.
- What should Ask AI show on forum cards and in the story modal?
- With a Feedback tab, should the agent keep drafting feedback cards when told about a problem, or hand off to the Feedback tab with the text filled in?
- LAB-3389: AI Search keeps its own history. The agent's chat is copied into a new AI Search thread, not moved or linked (the ticket's assumption, for Anuj to confirm). After the press, should the agent link back to the copy ("Opened in AI Search")?
- LAB-3389: the copy carries the questions, and AI Search answers them again in its own format. The agent's own answers, action cards (drafts, feedback, intros) and steps don't travel. Is that right, or must the answers come across word for word?
- LAB-3389: following the ticket, the button is disabled until there's one answer. An empty agent could instead open AI Search's New chat with this page as the scope. Is that worth offering?
- LAB-3389: only a member profile maps to an AI Search scope today. Team profiles have one in `ai-search-page` (`about=team`), but the agent's team pages aren't wired to it. Stories, events and forum threads added with + have no scope, so they don't travel.
- LAB-3389: which pages can't the agent read (settings, messages, admin)? The unreadable state is designed; the list isn't decided.
- LAB-3389: 440 and 720 are proposals. 720 is where a side panel starts doing the page's job, and AI Search is one press away. Should the width be kept per browser (localStorage, as built) or saved to the account?
