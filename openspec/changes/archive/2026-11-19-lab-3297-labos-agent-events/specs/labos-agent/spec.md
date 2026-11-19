# Spec Delta

## REMOVED Requirements

### Requirement: No agent tracking before S0 is approved

## ADDED Requirements

### Requirement: The agent sends the v0 agent events

The agent SHALL send the 10 v0 events of the LAB-3297 spec (V0-R1) through `useLabosAgentAnalytics` (`analytics/labos-agent.analytics.ts`), with the names in `LABOS_AGENT_ANALYTICS_EVENTS`: `agent-dock-opened`, `agent-dock-closed`, `agent-message-sent`, `agent-answer-shown`, `agent-answer-failed`, `agent-source-clicked`, `agent-action-proposed`, `agent-action-confirmed`, `agent-action-cancelled` and `agent-action-failed`. Every event SHALL carry `flow`, `entryPoint`, `pageType`, `conversationId` and `loggedInUserUid`. `conversationId` SHALL be a random UUID that the store makes for each dock session (`session` in `services/labos-agent/store.ts`). A closed panel, or a new context in the open panel, SHALL start a new session. `openAgent` SHALL take `entryPoint` (`news-story`, `intro-entry`, `corner` or `shortcut`; default `corner`). `LabosAgentRoot` SHALL send `agent-dock-opened` and `agent-dock-closed` through `useLabosAgentDockEvents`, for every way to open the panel. At the close, each card that still waits SHALL send one `agent-action-cancelled`, once per card. `agent-message-sent` SHALL carry `mentionCount`, the number of mention chips (V0-R3). `agent-answer-shown` SHALL send the C1 `toolCount`, `usedWebSearch` and `sourceCount` when the final chunk has them. Else it SHALL count `sourceCount` from the answer and leave out the other two (V0-R4). The intro events with `source` `agent` SHALL carry the `conversationId` of the session (V0-R2). No event SHALL carry message text, draft text, names, emails, or IDs of members, teams or news (V0-R5). S4 (`agent-draft-copied`, `apply_via`, `job-draft`, `job-apply`) is not in v0. These events SHALL not reach production before Anuj's own yes (LAB-3297).

#### Scenario: Two messages in one session

- **GIVEN** the member opens the agent from a news story
- **WHEN** the member sends 2 messages
- **THEN** one `agent-dock-opened` with `entryPoint` `news-story` and `flow` `news` goes out
- **AND** 2 `agent-message-sent` events go out with `turnIndex` 1 and 2 and the same `conversationId`

#### Scenario: Open and close with no message

- **WHEN** the member opens the agent and closes it with no message
- **THEN** one `agent-dock-closed` goes out with `turnCount` 0
