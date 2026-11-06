# Tasks

## 1. Service

- [x] 1.1 Add `recordMemberSignal` (session gate, `customFetch`, `keepalive`, errors swallowed) and `searchIndexToEntityType`; verify with unit tests

## 2. Call sites

- [x] 2.1 Add `MemberSignalViewTracker` to the member, team and project detail pages; verify it renders nothing and fires once per mount
- [x] 2.2 Add calls beside the existing analytics in the member contact block (click + copy), repo card, team contact view, project links and search results; verify with component tests that the analytics call still fires

## 3. Checks

- [x] 3.1 Run lint, type-check and the touched Jest suites
- [x] 3.2 Run `openspec validate lab-2609-member-signal-tracking --strict`
