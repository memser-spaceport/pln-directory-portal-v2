# LAB-2948: MCP connect and agent control in Settings

Route: `/prototypes/lab-2948-prototype-a-better-mcp-connect`. Mock data only.

Revised to the MCP strategy decisions of 2026-10-23 (ticket description) and Polina's call notes on LAB-2948. Settings has a new **mcp** sub-tab in the rail; MCP is no longer part of Email & Accounts. The rail, back bar, tab frame, card frame, Button, Badge, Tabs, Drawer, CopyButton, CloseIcon and toast all come from production.

## Review band

- **No agents / Connected / Pending confirms**: reach every scenario. Confirm, Reject, the permission templates, the per-feature controls and Revoke all work on local state.
- **Discovery in search**: one in-product discovery example, a contextual suggestion in member search. "Set up in Settings" opens the MCP sub-tab with no agent yet.
- **Show backend tags**: hides the gap tags so screenshots stay clean.

## What the page shows

| Ask (call notes)                                                                                          | Where                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. MCP sub-tab, separate from Connected Accounts                                                          | Rail item "mcp" under Account; page title "MCP"                                                                                                                                                             |
| 2. Connected clients, connected date, last used, revoke; setup steps per client when nothing is connected | One card per agent; "No agents": the Connect block (Claude Code · Codex · Claude app · Others)                                                                                                              |
| 3. Feature permissions as a PostHog-style scope picker, with templates                                    | "Feature permissions" on each agent card: template Read-only / Read and write, then "Adjust each feature" with Off / Read / Read and write per feature. A change to one feature makes the template "Custom" |
| 4. First features: news feed, forum, search; job board as read-only search; no sign-up or login           | The feature list. News feed and search are read-only by nature. Job board offers Read only                                                                                                                  |
| 5. Forum posts and office-hour bookings need the outward confirm                                          | Forum and Office hours carry "Sends after your confirm". Their waiting items show in "Needs your confirm". Setting the feature below Read and write drops what that agent prepared for it                   |
| 6. Features an admin turned off                                                                           | Events: "Off for all members", muted, control disabled. The admin control is a separate surface and is not built                                                                                            |
| 7. In-product discovery                                                                                   | Review band "Discovery in search" (placeholder copy until Horizon)                                                                                                                                          |
| 8. Backend marks                                                                                          | Dashed tags, below                                                                                                                                                                                          |

The older scenarios stay: the last actions as the member with **View all activity** (drawer grouped by day, filter by agent), and the confirm queue on top.

## Backend gaps (dashed tags)

- `Needs LAB-2996`: per-feature on/off for each connection, and the admin switch for everyone (LAB-2996 builds the endpoints; no admin UI).
- `Needs backend: change access after consent`: read versus read-and-write after connect. LAB-2902/2943 set it only at consent.
- `Needs LAB-2903`: the "Needs your confirm" queue and the outward features.
- `Needs LAB-2901`: "Recent actions as you" and the activity drawer (the "via agent" record).
- `Admin control: separate surface`: the admin view is not in this prototype.
- `Placeholder copy: Horizon`: the discovery text.

## Decisions

- **The confirm queue leads the card.** It is the only part that asks the member for something. It shows only when something waits.
- **Templates first, features on demand.** The template row (PostHog's preset) answers the common case in one click. The feature list opens under "Adjust each feature" (open on the first agent), so three agents do not stack eighteen rows.
- **Read and write is offered only where it exists.** A feature without a write action (news feed, search, job board) shows "Read and write" disabled with a tooltip, not hidden, so the three columns stay aligned.
- **The features list answers "which features MCP covers".** The old "What agents can do in LabOS" card is gone: the per-agent list shows what is available now.
- **Revoke is quiet at rest.** Grey text that turns red on hover; the inline popover holds the one red button.
- **Connect collapses once an agent exists** into "Connect another agent".

## Mobbin references

- [Magnific MCP settings](https://mobbin.com/screens/6c752779-eef2-4420-a780-18d568dce6db): client tabs, numbered steps, URL with copy.
- [Descript MCP](https://mobbin.com/screens/0ce6b1ce-f761-43b2-bfe1-82865899cdfc): the MCP URL as its own copy row, and "Other AI tools" as one entry (the Others tab).
- [Mintlify MCP](https://mobbin.com/screens/ef5226b5-56b8-41c3-86ec-b6d62f0dffb0): two-column settings rows (Access row, capabilities card) and segmented client tabs.
- [Base44 MCP](https://mobbin.com/screens/d8627a6c-0a81-4634-9118-cb1141f8a38e): access per scope with a control beside it, and "How to connect" tabs below.
- [GitHub → Cursor app](https://mobbin.com/screens/01bc9bde-3eb5-41d1-b143-83fc0e0f8081): "**Read** / **Read and write** access…" wording.
- [Dropbox Dash connected apps](https://mobbin.com/screens/669b28e8-79b8-4417-ba73-59c35b7da51c): connected-on and permissions inside the app row, disconnect inside it.
- [Discord Authorized Apps](https://mobbin.com/screens/b19ff1c2-1060-491d-bca0-e6f2102916fb): one card per app with "Authorized on" and its own Deauthorize.
- [PandaDoc](https://mobbin.com/screens/6f645ae3-0017-4f3a-8c08-8af90dec8432): inline confirm popover for disconnect.
- [Juicebox pending tasks](https://mobbin.com/screens/fb8a5e8e-51a1-4b84-b364-ac9261150dfb): a queue of agent-prepared outward actions, each with its own Execute/Skip; completed and skipped kept as history.

## Open questions

1. Final job board permission: the prototype offers read-only search and no applications (job applications are off for L0/L1 members and job aspirants).
2. When a feature goes below Read and write, are its waiting actions dropped (as here) or kept?
3. Which feature does an admin turn off first? Events is only the example.
4. Is there a Claude app deep link that pre-fills a custom connector? If so, the Claude app tab gets a real one-click button.
