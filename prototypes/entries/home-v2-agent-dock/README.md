# homepage-redesign-v0-agent

A copy of `home-v2` (`homepage`). Everything except the bottom-right corner is unchanged, and the page rationale stays in `../home-v2/README.md`.

**What's different:** the floating Agent pill is replaced by `AgentCorner.tsx`, one row in the signed-in corner: Agent, its history, then Give feedback (Linear's corner).

- Give feedback is the mocked LabOS button and drawer from `../labos-feedback-button/feedback/`.
- History lists mocked chats (`agentHistory` in `AgentV0.tsx`). A row reopens that chat, already answered.
- The panel is still `../home-v2-b/AgentPanel`, with two optional props added: `headIcon` and `initialThread`.

## One right-hand slot (manager review, 2026-11-11)

Review: "the two drawers overlap, so you can't see the feedback option when the agent is open", and "how does it look on other pages, when you add a page as context". Keep the current (top) navigation.

- `AgentDock.tsx` owns the slot: Agent panel, feedback drawer, corner. Opening one closes the other (corner, Ctrl/⌘ J, F). While either is open the corner steps aside. **Tabs (user, 2026-11-11):** the open drawer's title is `SlotTabs`, Agent | Feedback, on production's FeedbackTabs segmented control (the AI Apps Feedback | Comments switch). Both drawers are 480px, the feedback drawer opens without its slide (`instant`), and the Agent header is 73px with 23px left padding, so the tabs measure at the same x/y in both. The feedback drawer loses its "About this page" subline (the tabs replace the title).
- Context row above the composer: chips for the pages the agent reads (starts with the current page, ✕ removes), plus Add page (recently viewed). Added pages appear as "Read …" steps in the answer.
- `?page=profile`: `AgentProfilePage.tsx`, member-profile's `MemberProfilePage` with the same dock. Two profile prompts answer from the page's mocks; with the profile chip removed the agent says it isn't reading it.
- Shared changes: `home-v2-b/AgentPanel` gained optional `headTitle` and `contextSlot`; `labos-feedback-button/feedback` gained `instant` (dialog + frame) and PageFeedbackDrawer passes `headerTabs`. All are no-ops for their other hosts.
- **Closed state as tabs (user, 2026-11-11, segmented All | Images | Video reference):** the corner is one white pill holding Agent and Feedback as two equal tabs (neither selected while closed); a press opens the drawer on that tab. Production's floating brand feedback disc is gone from this entry. History moved from the corner to the Agent tab's header (`AgentHistoryMenu`, beside New chat, through AgentPanel's `headExtra`). Feedback wears `nav-shared` CommentGlyph (1.5px stroke) to match the pointer.
- **Rounded (same day):** the open tabs are pills too (`.slotTrack` / `.slotTab` override FeedbackTabs' 8px/6px radius to 999px), matching the closed corner.
- **Closed tabs = glyphs (same day):** the pill arrives with both labels, settles to the two glyphs after 2.2s (production's INTRO_MS), and a hovered or focused tab slides its own label out. Transcribed from production FeedbackFabButton (label max-width/margin/opacity transitions, padding to 0 + min-width disc, fabIn arrival). The corner stays mounted (hidden) while the drawer is open, so closing doesn't replay the arrival. The open drawer's tabs are pills (`.slotTrack`/`.slotTab`).
- **Feedback tab blue (same day):** the closed Feedback tab wears dev's FeedbackFabButton brand fill, glow and hover lift (`.feedbackTab`); Agent stays quiet beside it.
