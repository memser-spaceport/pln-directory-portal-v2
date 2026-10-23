# LAB-2948: MCP connect and agent control in Settings

Route: `/prototypes/lab-2948-prototype-a-better-mcp-connect`. Mock data only.

Settings → Email & Accounts: the production MCP card is redesigned, and a "What agents can do in LabOS" card sits under it. The rail, back bar, tab frame, card frame, Button, Badge, Tabs, Drawer, CopyButton, CloseIcon and toast all come from production.

## Review band

- **No agents / Connected / Pending confirms**: reach every scenario. Confirm, Reject, the access switch and Revoke all work on local state.
- **Show backend tags**: hides the gap tags so screenshots stay clean.

## Scenarios → where they live

| Scenario                                       | Where                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No agent: how to connect, per client           | "No agents": the Connect block is open. Server URL with copy, then tabs (Claude Code · Codex · Claude.ai · Others), each with 3 numbered steps and a copyable command |
| Each agent: name, connected, last used, access | One card per agent                                                                                                                                                    |
| Change read-only ↔ make changes, no reconnect | The segmented control on each card. It applies at once with a toast. Going read-only drops that agent's waiting actions and says how many                             |
| Last actions as the member, then the full list | "Recent actions as you" (last 3), then **View all activity**, a drawer grouped by day and filterable by agent                                                         |
| Outward actions waiting for confirm            | "Needs your confirm", above the agents. Confirm / Reject per row. Both land in the activity record                                                                    |
| Revoke one agent                               | Grey **Revoke** text, then an inline confirm popover                                                                                                                  |

## Backend gaps (dashed tags)

- `Needs LAB-2903`: the "Needs your confirm" queue.
- `Needs LAB-2901`: "Recent actions as you" and the activity drawer (the "via agent" record).
- `Needs backend: change access after consent`: the access switch. LAB-2902/2943 set access only at consent.
- `Proposed in LAB-2944`: the "Proposed" lines in the capabilities card. They come from the spike's priority list, which is not decided yet.

## Decisions

- **The confirm queue leads the card.** It is the only part that asks the member for something. It shows only when something waits. One block holds all the waiting items (design-thinking lesson 20). Confirm is primary and Reject is bordered neutral. The full-width pair sits under each row on phones.
- **Access is a two-option segmented control on a settings row.** The label and the one-line meaning sit on the left; the control sits on the right (Mintlify). The meaning uses GitHub's plain "**Read** / **Read and write** access…" wording. The labels match the consent screen's words: Read-only / Make changes. The control sits next to its own meaning, with no separate explainer (lesson 16).
- **Revoke is quiet at rest.** It is grey text that turns red on hover, and the inline popover holds the one red button (PandaDoc). Production's bordered red Revoke was the loudest thing on every card.
- **Connect collapses once an agent exists.** It becomes one "Connect another agent" button that opens the same block with a close ✕. The server URL becomes its own copy row (Magnific, Descript), so the Claude.ai and Others steps say "paste the server URL" and do not repeat it. Production's separate "Status: Connected" line is gone, because the agent list already says it.
- **One-click only where it is real.** The Claude.ai tab has an "Open Claude.ai connectors" button. Claude Code and Codex have copy-paste commands. I did not invent an "Add in 1 click" deep link that LabOS has not checked.
- **Activity rows label only what is not a read.** Reads are the resting state. Changes, "Sent after your confirm" and "Rejected by you" (amber) carry a muted word. The drawer keeps sent and rejected items next to the rest, like Juicebox's Completed/Skipped.
- **Copy cut.** The old pending hint ("These actions reach other people. Nothing is sent until you confirm.") is gone. The block title and the Confirm button already say it (lesson 15).

## Open question → "What agents can do in LabOS"

The answer is yes, compactly, in the spike's own split. Every row comes from the [LAB-2944 spike table](https://linear.app/protocollabs/document/spike-mcp-spike-table-of-all-user-actions-in-labos-with-mcp-coverage-a4a6b285352c):

- **Read** (today): members, teams, projects, events, forum threads, the PL portfolio, investors and warm intros, own AI Apps feedback. Proposed next: jobs (P0), news feed, notifications.
- **Change**, with Make changes only (today): warm-intro notes and feedback, investor field locks, AI Apps feedback status. Proposed next: own profile (P0), saved jobs and alerts, RSVP (P1).
- **Send to others**, which waits for confirm: nothing today. Proposed: forum posts and replies (P0), team news (P1 after Anuj's review), job applications (P1).
- **Stays with you**: the spike's "should not be covered" reasons (login, uploads, legal consent, keys, and 20.11, connecting agents itself).

The card links to the full table ("See all 231 actions") instead of reproducing it.

The mock activity uses real tools from the spike (search_members, get_team, get_forum_thread, search_events, get_warm_intro_investor, submit_warm_path_note, update_ai_app_feedback_status). The waiting items are the spike's outward rows 13.6, 4.14 and 6.6. The old "Request an intro" and "Updated your bio" mocks are gone: no tool or table row backs them today.

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

1. Does a forum reply need the LAB-2903 confirm, or is Make changes consent enough? The spike's "Not yet known" list asks the same. The prototype assumes the confirm.
2. When an agent goes read-only, are its waiting actions dropped (as here) or kept until it is upgraded again?
3. Can an agent apply to a job for the member at all? The spike leaves this open. The third waiting item depends on the answer.
4. Is there a Claude.ai deep link that pre-fills a custom connector? If so, the Claude.ai tab gets a real one-click button.
