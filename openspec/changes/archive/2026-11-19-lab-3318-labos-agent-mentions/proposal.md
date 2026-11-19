# Proposal

## Why

LAB-3318 (https://linear.app/protocollabs/issue/LAB-3318), slice S6 of LAB-3272: the member points the agent at pages, news stories, teams and members with `@` or the + button. The design comes from the prototype `prototypes/entries/agent` (`AgentChat.tsx`, `script.tsx`). The API is contract change 4 (section 10): C4 `GET /v1/labos-agent/mentions` and the C1 `mentions` array. Backend PR #3749 adds them.

## What Changes

- New `LabosAgentMentionPicker`: groups Pages, News, Teams and Members, a hint line, keys, a limit note and a search error note.
- `LabosAgentPanel`: `@` in the input and a + button open the picker; picked items become chips; the chip ✕ removes a chip.
- `searchMentions` in the live and mock clients; `useLabosAgentMentionSearch` calls it 300 ms after the last key.
- `useLabosAgentChat` sends `mentions` next to `context`. A C1 404 with `mentionIndex` marks the chip.
- The placeholder changes with `useCanRequestIntro()`. The fixed no-context line shows above the first answer.

## Out of scope

- Agent events for S6 (the event spec is not approved).
- Backend changes (Felix, #3749).
