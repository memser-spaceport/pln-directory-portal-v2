# settings-invite Specification

## Purpose

Where a signed-in member finds and copies their personal LabOS invite link (LAB-3398). The backend (LAB-3396) owns the link, sign-up and attribution.

## Requirements

### Requirement: Settings → Invite shows the member's own link

The page `/settings/invite` SHALL read `GET /v1/members/me/invite-link` with the member's session. It SHALL show `inviteUrl` exactly as the API returns it. The page SHALL use no mock link and send no new analytics events.

#### Scenario: Copy the link

- **GIVEN** a signed-in member and a valid API response
- **WHEN** the member clicks "Copy invite link"
- **THEN** the clipboard gets `inviteUrl` and the button shows "Copied" for 2 seconds

#### Scenario: The browser blocks the copy

- **WHEN** the clipboard is not available or the write fails
- **THEN** the link stays visible and selected, and the page tells the member to copy it by hand

#### Scenario: The request fails

- **WHEN** the API fails or returns a body without an absolute http(s) `inviteUrl`
- **THEN** the page shows no link, shows an alert and offers "Try again"

#### Scenario: Signed-out visitor

- **WHEN** a signed-out visitor opens `/settings/invite`
- **THEN** the app redirects to `/home?returnTo=settings-invite#login` and does not call the API
