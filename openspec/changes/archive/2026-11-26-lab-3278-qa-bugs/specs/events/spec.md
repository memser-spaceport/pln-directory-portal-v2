## ADDED Requirements

### Requirement: Event form and summary QA corrections

The form SHALL enforce the 10,000-character description limit and SHALL accept custom tags on Enter, comma, and blur. The host and co-host fields SHALL align. Submit and Save as draft SHALL reject an invalid host email with a field error.

The Submit and Edit forms SHALL show Website Link and Social Handles. The Twitter option SHALL use the label "X/Twitter" and keep the value `twitter`.

Preview SHALL show an in-person or hybrid venue only when the form has a resolved place. The event summary SHALL show the venue instruction when a venue exists. It SHALL show valid social links and use `mailto:` for email.

#### Scenario: Website and registration link

- **GIVEN** an upcoming event with a valid website and a different valid registration link
- **WHEN** a visitor opens Preview or the drawer
- **THEN** the event summary shows both links
- **AND** Register in the drawer opens the registration link

#### Scenario: A synced event with a registration resource

- **GIVEN** an upcoming synced event without a website, with one valid "Registration" resource
- **WHEN** a visitor opens the drawer
- **THEN** the summary shows one page link and Register opens that same link
