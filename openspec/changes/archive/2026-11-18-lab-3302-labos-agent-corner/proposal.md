# Proposal

## Why

LAB-3302 (https://linear.app/protocollabs/issue/LAB-3302), slice S5 of LAB-3272: a pilot member opens the agent from any signed-in page, with that page as context. The member can remove the page context. The plan and design come from the dock prototype (`prototypes/entries/home-v2-agent-dock/`). No backend change: S5 uses the C1 `context` values that exist today.

## What Changes

- New `LabosAgentCorner`: one pill with an Agent tab and a Feedback tab. For a member with agent access, it takes the place of the feedback button in `GlobalFeedback`. Everyone else keeps the button.
- Ctrl/⌘ J opens and closes the agent (`useLabosAgentShortcut`).
- `pageContextFromLocation` maps the URL to an open context: news, home, member, team, job and profile.
- The panel chip gets a ✕. After ✕, the C1 request has no `context`. "+ Read <page>" gives the page back.
- One slot: when the agent opens, the feedback drawer closes, and the reverse.

## Out of scope

- New C1 `context` values for member, team, job and profile. Until Felix adds them, these pages go to C1 as `home`, with no uid.
- Agent | Feedback tabs inside the open panel and drawer headers, "Add page" and chat history (prototype only).
- Signed-out visitors and new backend endpoints.
