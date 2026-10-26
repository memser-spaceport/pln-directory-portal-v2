# Spec Delta

## Purpose

How the directory frontend shows HTML that members wrote or AI generated (bios, team and project descriptions, asks, event and demo day descriptions, comments, forum bodies, AI summaries). Allowed formatting shows; anything that can run code never reaches the page.

## ADDED Requirements

### Requirement: Code in member or AI HTML never runs

Every page that shows member-written or AI-generated HTML SHALL remove script elements, event-handler attributes, and elements that load or run active content (iframe, object, embed, form, style, base, meta, link) before the HTML reaches the page. This applies to the server HTML and to client renders.

#### Scenario: Script tag in a bio

- **GIVEN** a member whose bio is `<p>Hello</p><script>alert(1)</script>`
- **WHEN** any visitor opens `/members/<uid>`
- **THEN** the page shows "Hello"
- **AND** neither the server HTML nor the rendered DOM contains a `script` element from the bio, and no alert runs

#### Scenario: Event handler on an allowed tag

- **GIVEN** a team whose About is `<p onclick="steal()">About us</p><img src=x onerror="steal()">`
- **WHEN** a visitor opens `/teams/<uid>`
- **THEN** "About us" shows as a paragraph
- **AND** no element from the About has an `on*` attribute

#### Scenario: Forum body from NodeBB

- **GIVEN** a NodeBB post body that contains `<iframe src="https://evil.example">`
- **WHEN** a member opens the post in `/forum` or in the home feed
- **THEN** the post text shows and no iframe is rendered

#### Scenario: AI-generated summary

- **GIVEN** an AI news summary or AI bio that contains `<script>`
- **WHEN** it is shown on the home feed or on the profile
- **THEN** the script is removed and the remaining text shows

### Requirement: Allowed formatting still shows

Member and AI HTML SHALL keep paragraphs, line breaks, links, bold, italic, underline, strikethrough, ordered and unordered lists, headings, blockquotes, code, horizontal rules and tables. Text color and background color set in the editor SHALL be kept. Other inline styles SHALL be removed.

#### Scenario: Formatted bio

- **GIVEN** a bio with `<p><strong>Founder</strong> of <a href="https://acme.example">Acme</a></p><ul><li>one</li><li>two</li></ul>`
- **WHEN** a visitor opens the member profile
- **THEN** "Founder" is bold, "Acme" is a working link, and the list shows two bullet items

#### Scenario: Editor text color

- **GIVEN** a bio with `<span style="color: rgb(230, 0, 0); position: fixed; background-image: url(https://evil.example/x)">red</span>`
- **WHEN** a visitor opens the member profile
- **THEN** "red" shows in red
- **AND** the span has no `position` and no `background-image` style

#### Scenario: Methodology table

- **GIVEN** founder methodology HTML that contains a `<table>` with header and body rows
- **WHEN** a member opens the founder methodology modal
- **THEN** the table shows with its rows and cells

### Requirement: Links in member or AI HTML are safe

A link in member or AI HTML SHALL keep its `href` only when it is `http:`, `https:`, `mailto:` or a root-relative path. Any other `href` (for example, `javascript:`, `data:` or protocol-relative `//host`) SHALL be removed and the link text kept. A link that keeps its `href` SHALL open in a new tab with `rel="noopener noreferrer"`.

#### Scenario: javascript: link

- **GIVEN** a project description with `<a href="javascript:alert(1)">click</a>`
- **WHEN** a visitor opens `/projects/<uid>`
- **THEN** "click" shows as text with no `href`

#### Scenario: Normal link

- **GIVEN** a team ask with `<a href="https://acme.example/jobs">jobs</a>`
- **WHEN** a visitor views the ask
- **THEN** the link points to `https://acme.example/jobs`, has `target="_blank"` and `rel="noopener noreferrer"`

#### Scenario: Member mention in a comment

- **GIVEN** a guide comment with a mention link to `/members/<uid>` that carries the mention's data attributes
- **WHEN** a member reads the comment
- **THEN** the mention shows as a mention and links to the member profile

### Requirement: Feature-specific content keeps its current rules

Content that already has its own allowlist SHALL render exactly as it does before this change: feed comments, forum post bodies, AI app feedback, job descriptions, SPV Spotlight descriptions, AI app one-pagers and team news content.

#### Scenario: Job description link rule unchanged

- **GIVEN** a job description with `<a href="/careers">Careers</a>`
- **WHEN** a visitor opens the job
- **THEN** "Careers" shows as text with no `href`, as before this change

#### Scenario: Feed comment image unchanged

- **GIVEN** a feed comment with an uploaded forum image that has a `width`
- **WHEN** a member opens the comment thread
- **THEN** the image shows at that width, as before this change

### Requirement: Plain text is never parsed as HTML

Text that is not meant to carry formatting (for example, a notification title built from a member's name) SHALL render as text. Markup in it SHALL show as literal characters.

#### Scenario: Member name with markup in a notification

- **GIVEN** a member named `<img src=x onerror=alert(1)>`
- **WHEN** another member sees an office-hours follow-up notification about them
- **THEN** the notification shows the name as literal text and no image element is created

### Requirement: One render path, enforced by lint

The repository lint SHALL fail when production code renders raw HTML anywhere except the one safe-render path, or imports an HTML sanitizer or HTML parser directly. An exception SHALL need an inline disable comment that states why the HTML is safe.

#### Scenario: New raw render

- **GIVEN** a change that adds `dangerouslySetInnerHTML` to a component under `components/` or `app/`
- **WHEN** `npm run lint` runs
- **THEN** lint reports an error on that line

#### Scenario: Direct sanitizer import

- **GIVEN** a component that imports `isomorphic-dompurify` or `html-react-parser` directly
- **WHEN** `npm run lint` runs
- **THEN** lint reports an error on that import

### Requirement: Sanitizer library at a patched version

The installed DOMPurify SHALL be version 3.4.17 or later, and the lockfile SHALL resolve exactly one copy of it.

#### Scenario: Lockfile check

- **WHEN** `npm ls dompurify` runs on a clean install
- **THEN** every entry resolves to the same version, 3.4.17 or later
