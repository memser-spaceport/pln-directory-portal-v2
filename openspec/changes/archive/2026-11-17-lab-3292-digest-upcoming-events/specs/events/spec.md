## MODIFIED Requirements

### Requirement: Event drawer analytics

The drawer SHALL record these PostHog events, each with `event_uid`:
- `event-drawer-opened`, with `source` (`home`, `member-profile`, `team-profile`, `add-event` or `digest`);
- `event-going-marked`, with `source`;
- `event-not-going-marked`, on "Mark as not going";
- `event-plans-saved`, with `roles`;
- `event-attendees-opened`.

#### Scenario: Going from Home

- **WHEN** a member opens event A from the Home rail and presses "Yes, I'm going"
- **THEN** `event-drawer-opened` is recorded with `source` = `home`
- **AND** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `home`
