## MODIFIED Requirements

### Requirement: The home page says what the network is

With `NEXT_PUBLIC_SHOW_HOME_V2` off, `/home` SHALL have the `<h1>` "Protocol Labs Directory", visually hidden so the top of the page keeps its design, and read by assistive technology. For a signed-out visitor, the page SHALL show a definition of the Protocol Labs network and the directory, of 40 to 60 words, as visible text in an "About" section at the foot of the page.

With the flag on, the signed-out `/home` SHALL have one visible `<h1>`, the mission "Protocol Labs drives breakthroughs in computing to push humanity forward.", The visible sentence under it SHALL say what the network is ("We are an innovation network that connects over 760 tech startups, …"), and the Join the network card beside it SHALL say what the directory is for. The page SHALL have no About foot.

In both cases, the definition SHALL NOT be hidden from view, because text shown only to crawlers is hidden text.

#### Scenario: Crawler on the home page

- **GIVEN** the flag is off
- **WHEN** a crawler requests `/home` without cookies
- **THEN** the HTML has one `<h1>`, "Protocol Labs Directory"
- **AND** the definition is in a visible "About Protocol Labs Directory" section after the focus areas

#### Scenario: Visitor on the home page

- **GIVEN** the flag is off
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the top of the page starts with the welcome card, as before LAB-3089
- **AND** the definition appears at the foot of the page

#### Scenario: Crawler on the new home page

- **GIVEN** the flag is on
- **WHEN** a crawler requests `/home` without cookies
- **THEN** the HTML has one `<h1>`, the mission sentence, with the definition right under it
- **AND** the Organization and WebSite JSON-LD are still present
