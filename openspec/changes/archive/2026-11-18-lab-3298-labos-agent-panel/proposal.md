# Proposal

## Why

LAB-3298 (https://linear.app/protocollabs/issue/LAB-3298), slice S1 of LAB-3272: members ask the agent a follow-up question on a news story. This is the thinnest path that proves the agent. It has no writes.

## What Changes

- New agent panel (`components/core/labos-agent/`), from home-v2-b's AgentPanel prototype and the homepage-redesign-v0-agent design.
- New "open with context" call: `openAgent({ context })` in `services/labos-agent/store.ts`. S2 to S5 reuse it.
- "Ask a follow-up" in the news story detail footer opens the agent with the story as context.
- One client for C1 (`POST /v1/labos-agent/chat`) and the access check, with a mock that is on until the backend is live.
- A local feature gate, off by default until D1.
- Stub event handlers. No tracking until S0 is approved.

## Out of scope

- The corner tab, dock and Ctrl/⌘ J (S5). Other pages as context (S5).
- Writes and action proposals (S2). Saved chat history.
- New env vars and production tracking.
