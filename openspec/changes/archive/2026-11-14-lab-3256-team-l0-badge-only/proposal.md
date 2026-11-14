# Proposal

## Why

LAB-3256: an L1 team is approved, so the "L1 · Base level" badge adds noise for admins. Only the L0 team badge is useful.

## What Changes

- Remove the `L1` entry from `TEAM_LEVEL_BADGES`. `TeamAccessBadge` shows nothing for L1 teams.
- Keep the L0 team label "L0 · Hidden" (Vova agreed in #labos-team).
- No change to member badges, the back office or the backend.

## Impact

- Code: `components/common/AccessLevelBadges/constants/accessBadges.ts`.
- Places: team page (`TeamDetails.tsx`), team grid cards (`TeamGridView.tsx`), header Search results (`ResultItem.tsx`).
- Search: L0 teams are not in the search index, so Search shows no team badge after this change.
