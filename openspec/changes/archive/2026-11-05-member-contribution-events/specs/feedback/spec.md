## ADDED Requirements

### Requirement: A support submit is recorded
A successful Contact Support submit SHALL record `contact-support-submitted` with the chosen topic and the page path. The event SHALL NOT include the message, the name or the email. A failed submit SHALL record no submit event. Choosing a topic SHALL still record `contact-support-topic-pill-selected`.

#### Scenario: Report a bug
- **WHEN** a member chooses "Report a bug" and the submit succeeds
- **THEN** PostHog gets one `contact-support-submitted` with that topic

#### Scenario: Submit fails
- **WHEN** the submit request fails
- **THEN** PostHog gets no `contact-support-submitted`
