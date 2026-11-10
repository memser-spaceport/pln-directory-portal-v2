# homepage-redesign-v0-agent

A copy of `home-v2` (`homepage`). Everything except the bottom-right corner is unchanged, and the page rationale stays in `../home-v2/README.md`.

**What's different:** the floating Agent pill is replaced by `AgentCorner.tsx`, one row in the signed-in corner: Agent, its history, then Give feedback (Linear's corner).

- Give feedback is the mocked LabOS button and drawer from `../labos-feedback-button/feedback/`.
- History lists mocked chats (`agentHistory` in `AgentV0.tsx`). A row reopens that chat, already answered.
- The panel is still `../home-v2-b/AgentPanel`, with two optional props added: `headIcon` and `initialThread`.
