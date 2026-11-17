# Proposal

## Why

LAB-3296 (https://linear.app/protocollabs/issue/LAB-3296): the intro flow sends only `ask-submitted`. We need a funnel baseline for the modal before the LabOS agent takes over intro requests (LAB-3272). Dana wrote the event spec on LAB-3272. Anuj approved it.

## What Changes

- New PostHog events: `intro-request-button-shown`, `intro-request-dialog-opened`, `intro-request-dialog-closed`, `intro-request-submit-failed`.
- `ask-submitted` keeps its name. It adds `entryPoint`, `source` and `textLength`. It no longer sends `loggedInUserEmail` or `loggedInUserName`.
- Every event carries `targetType`, `entryPoint` and `source` (`modal`).
- No event carries message text, names or emails.

## Out of scope

- The agent flow (`source` `agent`). It comes with LAB-3272.
- A "Request an intro" control on the Suggested tab. The `suggested-tab` entry point value exists for it.
