# Spec Delta

## ADDED Requirements

### Requirement: Contact details follow the member's visibility switch

An approved signed-in member SHALL see another member's email, LinkedIn, Telegram, GitHub, Discord, X, Bluesky, and GitHub projects when that member's visibility switch is on. A contact flag that was never saved SHALL count as on. When the switch is off, those values SHALL be omitted for other members. Signed-out visitors SHALL keep the blurred panel, and those values SHALL stay out of the public HTML. A Job Aspirant SHALL get no contact section on someone else's profile. Office hours SHALL stay outside this switch.

#### Scenario: Switch on, including flags that were never saved

- **GIVEN** a member whose preferences object has no contact flags, so the visibility switch reads as on
- **WHEN** an approved signed-in member opens that profile
- **THEN** they see the email, LinkedIn, Telegram, GitHub, Discord, X, Bluesky, and GitHub projects

#### Scenario: Switch off

- **GIVEN** a member whose contact flags are false
- **WHEN** an approved signed-in member opens that profile
- **THEN** the email, LinkedIn, Telegram, GitHub, Discord, X, Bluesky, and GitHub projects are omitted
