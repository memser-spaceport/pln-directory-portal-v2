## ADDED Requirements

### Requirement: Copy link with the reader's invite code

For a signed-in reader with a code, the page SHALL show "Copy link" beside the dateline (LAB-3398 R1). It SHALL read the reader's code from `GET /v1/members/me/invite-link`. It SHALL copy `<site>/digest?issue=<issue id>&ref=<invite code>` with no other parameters, hash, token, or reader state (R13). The button SHALL show "Copied" for 2 seconds after success (R12). If the clipboard write fails, the page SHALL show a selected read-only link (R14). The page SHALL send no new events. The route `/digest` SHALL ignore `ref` (R11).

#### Scenario: Signed out

- **WHEN** the reader is signed out or signs out
- **THEN** the page shows no Copy link and does not call the API

#### Scenario: No code

- **WHEN** the code request has not finished or fails
- **THEN** the page shows no Copy link

#### Scenario: A switch of account

- **WHEN** a different member signs in on the same page
- **THEN** Copy link uses the new member's code, never the earlier one

#### Scenario: A visitor opens a shared link

- **GIVEN** a signed-out visitor
- **WHEN** they open `/digest?issue=<issue id>&ref=<code>`
- **THEN** the page reads the issue with no session, as for `/digest?issue=<issue id>`
