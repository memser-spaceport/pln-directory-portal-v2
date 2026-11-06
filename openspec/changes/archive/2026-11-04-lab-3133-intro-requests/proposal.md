## Why

LAB-3133 connects the member and team intro entry points to `POST /v1/intro-requests`. Only a member with a current PL Portfolio role, or the PL Infra policy, can send. After a successful send the member sees a receipt, and PostHog records `ask-submitted`.

## What Changes

- "Request intro" on another member's profile header and on a team header, hidden from the member's own profile and from a team they belong to.
- A form with one required message (max 4000 characters). Success replaces the form with the receipt. Failure keeps the text and shows an error.
- PostHog `ask-submitted` with `type: intro` and `targetType: member | team`.

## Capabilities

### New Capabilities

- `intro-requests`: send an intro request from a member page or a team page.

### Modified Capabilities

<!-- none -->

## Impact

- Member profile header and team profile header.
- New client call to `POST /v1/intro-requests` and a teams query for PL Portfolio membership.
