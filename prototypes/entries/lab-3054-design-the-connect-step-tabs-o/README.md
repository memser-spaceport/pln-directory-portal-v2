# LAB-3054: connect steps as tabs on MCP connections

Route: `/prototypes/lab-3054-design-the-connect-step-tabs-o`. Mock data only. Design for the build ticket LAB-3048.

This entry is a copy of `lab-2948-prototype-a-better-mcp-connect` (that entry is not changed). Only the connect block is different. The page opens on **No connections**, where the connect block shows at once. On **3 connections**, open it with Add another connection.

## What changed (LAB-3054, from the Prod/Eng standup on 2026-10-29)

Members did not see that the terminal clients are a different path. The connect block now has one tab bar:

| Tab | Content |
| --- | --- |
| **Claude app** (selected first) | Open Claude connectors button, the server URL with copy, the consent step, and the note about the workspace admin |
| **Claude Code** | The `claude mcp add` command with copy, then `/mcp`, then the consent step |
| **Codex** | The two `codex mcp` commands with copy, then the consent step |
| **Others** | The server URL with copy, the generic steps, then the consent step |

- The "For developers" title and the separate "Claude app (web, desktop, mobile)" group are removed.
- The server URL row above the tabs is removed. The URL is in the Claude app and Others steps; the Claude Code and Codex commands already contain it.
- Under 640 px the tab bar scrolls sideways (production `Tabs`, pill variant, `white-space: nowrap`). The page does not scroll sideways.

Files changed from the copy: `McpSectionMock.tsx` (`CLIENTS`, `ConnectBlock`), `mocks.ts` (the Others first step has the server URL as a copy row), the page default state (No connections). The mock URL and text are not live text; the live URL comes from `DIRECTORY_API_URL` + `/mcp`.

## Open question for the build (LAB-3048)

- The spec `openspec/specs/mcp-settings/spec.md` has "The Claude app steps come first" and "Developer commands stay". The build changes the second requirement to the tabs.

---

## Background: the LAB-2948 prototype that this entry copies

Route: `/prototypes/lab-2948-prototype-a-better-mcp-connect`. Mock data only.

Revised on 2026-10-26 after the MCP strategy sync, then again after the MCP configuration design review the same day. MCP has its own Settings page, **MCP connections**, under Account: one card per connection with its Access, View activity and Revoke, configuration guidance per client (CLI: Claude Code, Codex; apps: Claude.ai, others). Every connection starts **read only** on the LabOS consent screen; write is turned on afterwards from that connection's Access row, saved once. The rail, back bar, tab frame, card frame, Button, Badge, Tabs, Drawer, CopyButton, CloseIcon and toast all come from production.

## Review band

- **No connections / Consent screen / Two Claude accounts / 3 connections**: the page in each state, plus the LabOS page a client opens when it connects. Tick the checkbox and Connect adds the connection, read only. On a card, Edit permissions or +N more → change rows → Save (write included, no extra step). Revoke and every permission control work on local state.
- **Discovery hints**: the launch banner and the LabOS navbar over each hint's full host page, picked with a switch: **AI Search** (the ai-search-page prototype; hint right above the follow-up field), **Forum: new post** (production's Create Post page with its form parts; hint under the title, where the writing starts, not on the reply box) and **AI Apps: feedback** (the ai-apps-feedback-comments page on production's table; hint under the tabs). A second switch flips **No agent yet** / **Claude Code connected**. The rail's New badge now shows in the No connections state.
- **Show backend tags**: off by default, so the page reads as the design; tick it to see the dashed gap tags. The page is shown to an approved member (the L0/L1 / job aspirant switch was removed on 2026-10-27; the job board lock for them stays in `mocks.ts`).

## What the 2026-10-26 sync changed → where it lives

| Decision                                                                   | Where                                                                                                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP settings get a dedicated sub-tab                                       | Rail item **MCP connections** under Account, with a New badge until it is opened. Email & Accounts goes back to email and linked accounts                                                   |
| Broad API → MCP (option two), but only selected tools exposed              | Each agent's permissions decide what it may call. Every feature row maps to a group of generated tools                                                                                      |
| Scopes and templates, read-only and read-write (PostHog-style)             | Template row (Read only · Read and write · Custom), then one row per feature with No access / Read / Read and write                                                                         |
| Admin and user controls enable or disable endpoints                        | Members set their own rows. An admin-off endpoint shows a lock and "Turned off by LabOS admins" (here: booking office hours, which has no throttling yet)                                   |
| Risk of spam, no throttling for posts and bookings                         | Write is turned on per feature, per connection (no confirm queue or write-consent step since 2026-10-27). Forum and Office hours carry a "Needs throttling" tag                             |
| Newsfeed moves higher, forum and search stay important                     | Row order is the priority order: Search, Forum, News feed, then the rest                                                                                                                    |
| Sign-up and login stay outside MCP                                         | Not a row. The card's footer says sign-in, sign-up and connecting agents always stay in LabOS                                                                                               |
| No job applications for L0/L1 or job aspirants; job board starts read-only | Job board defaults to Read (search roles). Read and write is locked for L0/L1 and aspirants in the mock (not switchable in the band), and tagged "Write pending decision" for everyone else |
| Discovery: in-product messaging, contextual suggestions                    | Rail New badge, plus a dismissible hint in search, forum and comment flows (Discovery hints state)                                                                                          |
| Measure usage and failures in PostHog (Vova)                               | Blocked calls are logged in the agent's activity ("Blocked by permissions", amber). The hints view is tagged with the events it needs                                                       |

## MCP configuration design review (2026-10-26) → where it lives

| Decision                                                                     | Where                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permissions are per connection                                               | Each card has its own Access row and Edit drawer (briefly shared on 2026-10-27, then restored to match these notes)                                                                    |
| Read only on first connect, write configurable afterwards                    | The consent screen has no editor: it states Read only and what that covers. New connections land as Read only ("…is connected, read only."). Write is turned on from the card's drawer |
| Label: "MCP connection", not "AI agents" or "Claude Code permissions"        | Rail and page title **MCP connections**, section **Connections**, "Add a connection", "All connections" in activity, drawer titled with the client and "MCP connection" under it       |
| Revoke follows danger-zone styling                                           | Tried red at rest, then kept grey on 2026-10-27 (your call): DS neutral bordered Button like Edit, red only on the confirm inside its popover                                          |
| Read only: tell the member the agent can see other members' contact info     | Amber notice on the consent screen: email, Telegram, LinkedIn. **Connect** is disabled until the checkbox is ticked                                                                    |
| Read and write: separate, explicit message that it acts on their behalf      | Each row says what write lets it do ("With write: start threads and reply"). The separate consent step on Save was removed 2026-10-27: Save just saves                                 |
| MCP gets its own settings page with the app guide, CLI guide and permissions | Already its own page. The connect block holds the CLI (Claude Code, Codex) and app (Claude.ai, others) guides; permissions per connection                                              |

## Decisions

- **Access is per connection, and the first grant is the smallest.** Every new connection starts Read only, so the consent screen asks one thing: acknowledge that Read already shows other members' contact details. The card has no separate Permissions button (2026-10-27: the Access row, then the Permissions link, were removed). Under the name row, the card lists its permissions as PostHog lists an app's scopes: one DS Badge chip per feature it can reach (`search:read`, `forum:write`; highest level only, priority order), the first four, then a "+N more" chip that opens the Permissions drawer with the full list. It is the card's only way into permissions, so when nothing is hidden the same chip reads "Edit". Access was made shared for all connections on 2026-10-27 and restored the same day: shared access let a new connection inherit writes, which broke "read-only on first connect", and made one write consent cover clients the member had forgotten.
- **Asking for more access (2026-10-27, Access request state).** When a read-only agent tries a write, LabOS refuses it and the agent shows one line with a link (a dark terminal stand-in shows what it says). The link opens Settings → MCP connections with that connection's Permissions drawer already open: a blue note on top ("Codex asked to post in the Forum", what it tried) and that feature preset to Read and write. Save saves it. No separate request page or popup (2026-10-27): asking for access is just editing permissions, so it uses the one place that does that. Examples: Codex → Forum, Claude.ai → News feed, and Codex → Office hours, where the feature is admin-locked: the agent says it can't, and the link is not given. The agent never grants itself access.
- **Card actions (2026-10-27).** **Edit permissions** is a link in the card's top right; View activity and Revoke (red, still with its confirm) moved into a ⋯ menu on production's team-news menu styles. "+N more" opens the same drawer.
- **Status badge beside the name**, derived from what LabOS already knows: **Active** (used in the last 14 days), **Idle** (connected, not used for longer), **Not used yet**, and **Sign-in expired** (amber, with "Reconnect from the client to use it again" in the meta line; shown on the personal account in Two Claude accounts). No state shows Idle yet.
- **One Save (2026-10-27).** In the drawer, changes are a draft: no toast per row. Save is disabled until something changes, and saves directly, write included. The extra "Let Claude.ai act for you?" step (checkbox + Turn on write and save) was removed the same day. Cancel discards.
- **Templates are presets.** Read and write sets every row to its maximum (locked rows stay Read). Custom is a reading of the rows rather than a button.
- **A lock says who locked it.** Admin locks name the admins; account-level locks give the reason in one sentence. The locked option stays visible and disabled, so the member can see the capability exists.
- **Lowering a feature drops what was waiting there.** Setting Forum to Read removes the agent's waiting forum reply, and the toast says how many actions were dropped (same rule as the old access switch).
- **Connection cards are one row (2026-10-27):** client, status badge, the account email on every card (2026-10-27) (connected / last-used dates removed 2026-10-27), then Edit permissions and a ⋯ menu with View activity and Revoke. The recent-actions list was cut as unneeded detail; the drawer holds the record.
- **The same client twice (2026-10-27).** A member can connect Claude.ai with two different email accounts. Each card shows that account's email under the name, and the activity drawer and Revoke confirm name it "Claude.ai · alex.chen@gmail.com". Nothing is asked of the member. Backend: the MCP sign-in does not give LabOS the client account's email, so the client has to share it (tag "Needs the account email from the client"); without it, the two cards are told apart by status only.
- **Activity shows failures.** A call refused by permissions is recorded in the activity, so the member can see why the agent said it couldn't do something. It's the same event PostHog needs for measuring failures.
- **Hints quote what the member just did.** Each one appears right after something an agent could have done for them (a search answered, a reply box opened, 3 or more new comments) and names it: the query, the thread, the comment count. One link, dismissible per context, and none of them repeat the server URL.
- **Connected members still get hints, as prompts.** Discovery doesn't end once an agent is connected. For a member with one, the hint becomes "Ask Claude Code instead", with the request written as a prompt and a copy button. That covers the usage half of the sync's "discovery and measurement".

- **No confirm queue (2026-10-27).** "Needs your confirm" was removed. Once write is on for a feature, the connection acts directly, and the activity marks what other members saw ("Seen by others").
- **Launch banner.** The Discovery hints state shows the announcement in production's site-wide `HighlightsBar` (the Demo Day banner's slot above the navbar), laid out like Mobbin's top bars ([Wellfound](https://mobbin.com/sites/sections/3e322691-6871-467d-a15a-a0579b235be0), [Equals](https://mobbin.com/sites/sections/2bd2f9eb-2e62-4b27-9f33-4f4f95d2204b), Visual Electric): centred, a New pill, "Connect Claude, Codex or any AI agent to LabOS", a white pill **Set it up →** (opens MCP connections) and a close button. Chosen over a launch modal or a card on Home because it already exists in LabOS and costs no one a click. Show it until the member opens the tab or closes it; the contextual hints carry discovery after that.

Kept from the first round: Revoke has an inline confirm, the Connect block collapses once an agent exists, and Claude.ai is the only client with a one-click button.

## Backend gaps (dashed tags)

- `Needs scopes on the MCP server`: the access line on the consent screen and the scope editor in Settings (account-level tool filtering for every connection, admin endpoint switches).
- `Needs throttling`: forum writes and office-hour booking.
- `Moved up: P0`: news feed read/write.
- `Write pending decision`: job applications through an agent.
- `Needs LAB-2901`: the activity drawer.
- `Needs PostHog MCP events`: hint shown / dismissed / connected / prompt copied, tool calls, failures.
- `Needs refresh tool (Vova)`: refreshing an investor's data from an agent (web sources and Affinity), under Investors and warm intros.

## Open questions

1. The review's write message names "contact" members. No feature row lets a client contact anyone today (messages, intro requests). If that tool lands, it needs its own row.
2. Where do admins switch endpoints off: back office, or a flag per tool? The prototype only shows the member's side of it.
3. Job applications for approved members: on (per connection), or off for everyone in the POC?
4. Do read-only rows need a throttle too (bulk search scraping), or only writes?
5. Which hint contexts ship first? The sync named search, forum and comments. Measure each one's dismiss and connect rates before adding more.

## Mobbin and other references

- PostHog personal API key scopes: a preset on top, then No access / Read / Write per scope.
- [Magnific MCP settings](https://mobbin.com/screens/6c752779-eef2-4420-a780-18d568dce6db), [Descript MCP](https://mobbin.com/screens/0ce6b1ce-f761-43b2-bfe1-82865899cdfc), [Mintlify MCP](https://mobbin.com/screens/ef5226b5-56b8-41c3-86ec-b6d62f0dffb0): connect tabs, URL copy row, settings rows.
- [Base44 MCP](https://mobbin.com/screens/d8627a6c-0a81-4634-9118-cb1141f8a38e): access per scope with the control beside it.
- [Discord Authorized Apps](https://mobbin.com/screens/b19ff1c2-1060-491d-bca0-e6f2102916fb), [PandaDoc](https://mobbin.com/screens/6f645ae3-0017-4f3a-8c08-8af90dec8432), [Juicebox pending tasks](https://mobbin.com/screens/fb8a5e8e-51a1-4b84-b364-ac9261150dfb): agent cards, inline revoke confirm.
- [Visual Electric](https://mobbin.com/screens/d56e6a1a-5d72-49e0-be48-be1bc3b758c0), [Semrush](https://mobbin.com/screens/290738bc-ba6f-4327-ba1c-365187359c9a), [Ditto](https://mobbin.com/screens/ce67a72c-3e4b-4569-9f98-f42a4bd26d29): one-line top announcement bar with a link (the launch banner).

## Anuj's review comments (2026-10-27) → what changed

- **Connect steps use the old copy** (LAB-2993): the connect block now leads with **Claude app (web, desktop, mobile)**: Settings → Connectors → Add custom connector, name it "LabOS" and paste the URL (copy button), sign in and approve, then the "ask your Claude workspace admin" note. **For developers** below holds the server URL and the Claude Code / Codex / Others commands.
- **Consent copy:** "Read only (default)"; "can view what you can view in LabOS"; the "It can't post, contact anyone or book anything" line is gone; it says access can be widened or narrowed any time in Settings → MCP connections.
- **"See every action"** pointed at the internal spike doc, so it's removed from the drawer footer.
- **"Impersonate my access"** option: not added; it is Read and write.
- **Read-only at a glance:** a connection still on a template shows one chip, "Read only (default)" or "Read and write"; the per-feature chips appear only for Custom.
- **Access request link:** the link in the agent's reply is clickable and reopens the drawer. Settings → MCP connections needs its own persistent URL (`/settings/mcp`) for agents to link to; noted in the Access request state.
- **Launch banner:** copy leads with use cases ("Search teams and members, post news or reply in the forum right from your AI session. LabOS now works with AI agents.") and **Set up now**. Audience first: PL infra, admins and portfolio team members (backend tag).
- **Why connect:** the section intro lists three use cases (post updates, search, hand off tasks) before the cards.
