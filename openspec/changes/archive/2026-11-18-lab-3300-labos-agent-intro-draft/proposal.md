# Proposal

## Why

LAB-3300 (https://linear.app/protocollabs/issue/LAB-3300), slice S3 of LAB-3272: portfolio and PL Infra members ask the agent to write an intro request. The member edits the draft and presses Send. The agent never sends. Contract: section 8 of `contracts/lab-3272-labos-agent-api.md` (change 2, Q1 option A).

## What Changes

- "Ask the agent" next to "Request an intro", for eligible members inside the agent gate. It opens the agent with `context.page` `intro` and a first message.
- New draft card (`components/core/labos-agent/LabosAgentDraftCard/`). Send calls the existing `createIntroRequest` (C3).
- The C1 client reads `drafts` and the 404 `INTRO_TARGET_NOT_FOUND`. The mock gives drafts.
- The intro funnel events (LAB-3296) get `source` `agent` from the card.

## Out of scope

- Backend S3 (`draft_intro` tool, the intro context in C1). Felix builds it.
- A stored `source` on the intro request (contract 8.8, question 2).
- "Ask the agent" inside the Request an intro dialog. The dialog does not change.
