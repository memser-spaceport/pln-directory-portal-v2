# Tasks

## 1. LAB-3302: agent corner, Ctrl/⌘ J and context chips (frontend)

- [x] 1.1 S5 open contexts (`member`, `team`, `job`, `profile`) in `types/labos-agent.types.ts`; `chatKey` for each.
- [x] 1.2 `pageContextFromLocation` (`services/labos-agent/labos-agent.page-context.ts`).
- [x] 1.3 `readsPage` and `setReadsPage` in the store; `useLabosAgentChat` sends no `context` when `readsPage` is false.
- [x] 1.4 Chip ✕ and "+ Read <page>" in `LabosAgentPanel`.
- [x] 1.5 `LabosAgentCorner` and `useLabosAgentShortcut`; `GlobalFeedback` shows the corner for members with agent access.
- [x] 1.6 Tests: `__tests__/core/labos-agent/labos-agent-corner.test.tsx`.
- [x] 1.7 `labos-agent` and `feedback` specs, AGENTS.md and CLAUDE.md.
- [x] 1.8 Key hint only with keys (`useShowsKeyHint`); "⌘J" on a Mac, "Ctrl J" elsewhere.
- [x] 1.9 Contract change 3 (S5-C25 to S5-C30): `toChatContext` sends `member`, `team`, `job` and `profile` with their ids; the 3 page 404 codes; the mock.
