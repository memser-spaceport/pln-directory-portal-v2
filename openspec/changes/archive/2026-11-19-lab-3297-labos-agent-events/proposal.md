# Proposal

## Why

LAB-3297 (https://linear.app/protocollabs/issue/LAB-3297), slice S0 of LAB-3272: we must compare each v0 flow with and without the agent. Dana's final spec for v0 (2026-11-19, the attachment on LAB-3297) defines the events. The v0 addendum wins: V0-R1 to V0-R3 are frontend work.

## What Changes

- `analytics/labos-agent.analytics.ts`: the 10 `agent-*` events with the shared properties, in the place of the stubs.
- `services/labos-agent/store.ts`: a dock `session` with `conversationId`, `entryPoint` and counts. `openAgent` takes `entryPoint`.
- `useLabosAgentDockEvents` (in `LabosAgentRoot`): `agent-dock-opened`, `agent-dock-closed`, and `agent-action-cancelled` for open cards at the close.
- `useLabosAgentChat`: message, answer, action and draft events. The intro events with `source: 'agent'` add `conversationId`.
- `LabosAgentTurn`: `agent-source-clicked`.
- `normalizeChatBody`: reads the optional C1 `toolCount`, `usedWebSearch` and `sourceCount` (V0-R4).

## Out of scope

- S4 job events: `agent-draft-copied`, `apply_via`, `job-draft` and `job-apply`.
- PostHog dashboards, insights, flags and warehouse models.
- Backend counts in C1 (Felix, V0-R4).
- Production: Anuj's own yes comes before `lab-3272` merges to develop.
