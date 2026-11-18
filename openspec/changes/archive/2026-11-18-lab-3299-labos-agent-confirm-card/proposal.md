# Proposal

## Why

LAB-3299 (https://linear.app/protocollabs/issue/LAB-3299), slice S2 of LAB-3272: the agent proposes an edit to the member's profile, experience or team, and the member confirms it in the panel. Decision D2: nothing saves before Confirm.

## What Changes

- New action card (`components/core/labos-agent/LabosAgentActionCard/`), from home-v2-b's proposal card. One card per proposed edit, with old and new values, Confirm and Cancel.
- C2 (`POST /v1/labos-agent/actions/confirm`) in the live client and the mock. The C1 client reads `proposals`.
- Card state lives with its turn in the store, so it survives close and reopen.
- Mock words: "edit profile", "edit team", "forbidden" and "save fails".

## Out of scope

- A refresh of profile or team page data after a save (the C2 `result`).
- Intro requests (S3) and the job application draft (S4).
- New tracking. The handlers stay stubs until S0 is approved.
