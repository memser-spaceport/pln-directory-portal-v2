# Proposal

## Why

LAB-3302 (https://linear.app/protocollabs/issue/LAB-3302), slice S5 of LAB-3272: a pilot member opens the agent from any signed-in page, with that page as context. The member can remove the page context. The plan and design come from the dock prototype (`prototypes/entries/home-v2-agent-dock/`). No new endpoint. S5 uses the C1 `context` values of contract change 3 (section 9): `member`, `team`, `job` and `profile`. The S5 backend PR adds them.

## What Changes

- New `LabosAgentCorner`: one pill with an Agent tab and a Feedback tab. For a member with agent access, it takes the place of the feedback button in `GlobalFeedback`. Everyone else keeps the button.
- Ctrl/⌘ J opens and closes the agent (`useLabosAgentShortcut`).
- `pageContextFromLocation` maps the URL to an open context: news, home, member, team, job and profile.
- The panel chip gets a ✕. After ✕, the C1 request has no `context`. "+ Read <page>" gives the page back.
- `toChatContext` sends each page with its id. A C1 404 for the page shows "The agent cannot read this page. Remove the page chip and ask again."
- The key hint shows only with a mouse or trackpad and a screen 640px or wider: "⌘J" on a Mac, "Ctrl J" elsewhere.
- One slot: when the agent opens, the feedback drawer closes, and the reverse.
- Review fixes (Oleg): the job drawer sends `jobUid`; the agent works over the news story modal; no Feedback button flash while access loads; a page 404 restores the text once only.

## Out of scope

- The backend part of contract change 3 (Felix). Merge this PR after the S5 backend PR: the current backend gives 400 for the new page values.
- Agent | Feedback tabs inside the open panel and drawer headers, "Add page" and chat history (prototype only).
- Signed-out visitors and new backend endpoints.
