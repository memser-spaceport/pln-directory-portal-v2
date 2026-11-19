# Proposal

## Why

LAB-3252: header Search results show no L0/L1 badge for admins. LAB-3180 added the badges on profiles and directory cards, but not on search results.

## What Changes

- `FoundItem` adds optional `accessLevel`, `memberState` and `isJobAspirant`.
- `ResultItem` shows `TeamAccessBadge` on team results and `MemberAccessBadges` on member results, after the name.
- The badges reuse `components/common/AccessLevelBadges`, so only a directory admin sees them.

## Impact

- Code: `services/search/types.ts`, `ResultItem.tsx`, `SearchResultsSection.module.scss`.
- Pair: backend PR in `pln-directory-portal` sends the fields. Merge order: backend first.
