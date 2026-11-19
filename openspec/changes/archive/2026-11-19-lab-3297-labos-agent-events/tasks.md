# Tasks

## 1. LAB-3297: agent events for v0 (frontend)

- [x] 1.1 Event names in `LABOS_AGENT_ANALYTICS_EVENTS` (`utils/constants.ts`).
- [x] 1.2 `useLabosAgentAnalytics` with the shared properties and pure helpers (flow, page type, action type, error type).
- [x] 1.3 Dock session in the store; `entryPoint` from `AskAgentButton` and `LabosAgentCorner`.
- [x] 1.4 `useLabosAgentDockEvents` in `LabosAgentRoot`.
- [x] 1.5 Chat, card, draft and source events; `conversationId` on the intro events (V0-R2); `mentionCount` (V0-R3).
- [x] 1.6 Optional C1 counts in `normalizeChatBody` (V0-R4).
- [x] 1.7 Tests: `labos-agent-events.test.tsx`, `labos-agent.analytics.test.ts`.
- [x] 1.8 `labos-agent` and `intro-requests` specs, AGENTS.md and CLAUDE.md.
