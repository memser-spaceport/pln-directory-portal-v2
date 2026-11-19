## ADDED Requirements

### Requirement: Digest email page

`/digest/email?t=<link token>` SHALL show the link member's digest email settings without sign-in: a greeting with their first name, whether the digest is on, and whether it is daily or weekly. It SHALL read them on the server through `POST /v1/labos-digest/email-settings/read`; opening the page SHALL change nothing. It SHALL offer:

- turning the digest off ("Unsubscribe") or back on ("Turn the digest back on");
- switching between daily and weekly while it is on;
- "All email preferences", a link to `/settings/email`;
- "Read your digest", a link to `/digest?t=<the same token>`.

The page SHALL NOT be indexed and SHALL send no Referer.

#### Scenario: Manage from the footer

- **GIVEN** a signed-out reader whose digest is on and daily
- **WHEN** they open the Manage preferences link
- **THEN** the page says the digest is on and daily, offers Unsubscribe and Switch to weekly, and nothing has changed

#### Scenario: Signed in as someone else

- **GIVEN** a browser signed in as another member
- **WHEN** the page opens from a link
- **THEN** it shows and changes the link member's settings

### Requirement: Footer action waits for a press

When the link carries `link_type=unsubscribe`, the page SHALL make "Unsubscribe" its main button. When it carries `link_type=switch_frequency` with `to=weekly` or `to=daily`, the main button SHALL be "Switch to weekly" or "Switch to daily". The page SHALL NOT change anything until the reader presses a button. When the requested state already holds, the page SHALL say so instead: an Unsubscribe link with the digest off says "You're already unsubscribed from the digest" and offers "Turn the digest back on"; a Switch link to the frequency the digest already has says "Your digest is already weekly" (or daily) with no button. A Switch link while the digest is off says "The digest is off" and offers "Turn on the weekly digest" (or daily), which turns it on at that frequency. An unknown `link_type` or `to` behaves as Manage.

#### Scenario: A scanner opens the Unsubscribe link

- **WHEN** the Unsubscribe link is opened and nothing is pressed
- **THEN** the digest stays on

#### Scenario: Unsubscribe

- **GIVEN** the page opened from the Unsubscribe link
- **WHEN** the reader presses Unsubscribe
- **THEN** the digest is off and the page says "You're unsubscribed from the digest" with Undo

#### Scenario: Switch to weekly

- **GIVEN** the page opened from Switch to weekly
- **WHEN** the reader presses Switch to weekly
- **THEN** the digest is weekly and the page says "Your digest is now weekly" with Undo

#### Scenario: Already unsubscribed

- **GIVEN** the digest is already off
- **WHEN** the Unsubscribe link opens the page
- **THEN** it says "You're already unsubscribed from the digest" and offers "Turn the digest back on"

#### Scenario: Switch link while the digest is off

- **GIVEN** the digest is off
- **WHEN** the Switch to weekly link opens the page and the reader presses "Turn on the weekly digest"
- **THEN** the digest is on and weekly

### Requirement: Undo and failed saves

After a change, Undo SHALL restore the previous on/off and frequency with one more change call. A failed change SHALL leave the shown settings as they were and say "We couldn't save that." with "Try again", which repeats the same change.

#### Scenario: Undo an unsubscribe

- **GIVEN** the reader just unsubscribed
- **WHEN** they press Undo
- **THEN** the digest is on again with its frequency, and the page shows the settings again

#### Scenario: Save fails

- **WHEN** the change call fails
- **THEN** the page still shows the old settings and "We couldn't save that." with "Try again"

### Requirement: Digest email page link that does not work

When the token is missing, malformed, wrongly signed or expired, or the API cannot read the settings, the page SHALL show a short message ("This link has expired" for an expired link, otherwise "We couldn't open your email settings") and an "Email preferences" link to `/settings/email` to manage email after sign-in. While the settings load, the page SHALL show its own small skeleton, not the digest's.

#### Scenario: Expired link

- **GIVEN** a link older than 90 days
- **WHEN** the page opens
- **THEN** it says "This link has expired" and links to email preferences

### Requirement: Digest email page events

The page SHALL record these PostHog events, none carrying the link token:

- `digest-email-page-viewed`, once per load, with `link_type` (`manage`, `unsubscribe`, `switch_frequency` or `direct`), `enabled`, `frequency` and `is_logged_in`.
- `digest-email-unsubscribed`, `digest-email-resubscribed` and `digest-email-frequency-changed` (with `frequency`) on a saved change, each with `via` (`main-button` or `controls`).
- `digest-email-undo-clicked`, with `reverted` (`unsubscribe`, `resubscribe` or `frequency`).
- `digest-email-save-failed`, with `action` (`unsubscribe`, `resubscribe`, `frequency` or `undo`).

#### Scenario: Unsubscribe recorded

- **WHEN** the reader unsubscribes from the main button
- **THEN** `digest-email-unsubscribed` is recorded with `via: 'main-button'` and no token
