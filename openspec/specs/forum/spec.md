# forum Specification

> Added by LAB-2989. How the directory site calls the forum.

## Purpose

A member reads and posts in the forum. The forum bearer token stays on the server. The browser never receives it.

## Requirements

### Requirement: Forum token stays on the server

The client bundle SHALL NOT contain the forum bearer token. Forum reads and posts SHALL go through a server route. That route SHALL call the forum with the forum token when the server has one and the member has a session. When the server has no forum token, the route SHALL call the forum with the member session token.

#### Scenario: Member reads and posts

- **GIVEN** a signed-in member
- **WHEN** the member reads the forum or posts in it
- **THEN** the browser calls a directory server route
- **AND** the forum bearer token is not in the browser request

#### Scenario: Visitor has no session

- **GIVEN** a visitor with no session
- **WHEN** the visitor requests a forum write through the server route
- **THEN** the route refuses the write
- **AND** the route does not call the forum with the forum token

### Requirement: Impersonation comes from the server session

The server route SHALL send `x-impersonate-member-uid` to the forum only when `isAdminUser` is true for the directory access of the session token. The route SHALL ignore that header for every other member.

#### Scenario: Directory admin posts as another member

- **GIVEN** a signed-in directory admin
- **WHEN** the admin posts as another member
- **THEN** the server route sends `x-impersonate-member-uid` for that member

#### Scenario: Another member sends the header

- **GIVEN** a signed-in member who is not a directory admin
- **WHEN** the member's request includes `x-impersonate-member-uid`
- **THEN** the server route does not send that header to the forum

### Requirement: The forum is not indexed

Every page under `/forum` SHALL be marked `noindex, follow`, because its content is for signed-in members only. `/forum` SHALL answer a signed-out visitor with status 200 at its own address, with the title "Forum | Protocol Labs Directory" and one `<h1>`. A signed-in member without a `cid` SHALL still be sent to `/forum?cid=0`. The list behind the sign-in panel SHALL be a skeleton with no text, hidden from assistive technology.

#### Scenario: Crawler on the forum

- **WHEN** a client without cookies requests `/forum`
- **THEN** the response status is 200, not a redirect
- **AND** the page is marked `noindex, follow` and has one `<h1>`
- **AND** the HTML contains no placeholder post text

#### Scenario: Signed-in member opens the forum

- **GIVEN** a signed-in member
- **WHEN** they open `/forum`
- **THEN** they are sent to `/forum?cid=0` and see the feed

### Requirement: Category names read as typed

NodeBB sends category names and descriptions HTML-escaped. The directory SHALL decode them once before showing them: in the forum category tabs, the Create Post category picker, the post page badge, the edit page, and forum posts in the home feed. It SHALL NOT render the escapes as text.

#### Scenario: Category with an ampersand

- **GIVEN** a forum category named "Comments & Feedback", which NodeBB sends as `Comments &amp; Feedback`
- **WHEN** a member opens the forum
- **THEN** the tab reads "Comments & Feedback"
- **AND** a post in that category shows the same name on its badge and in the home feed

### Requirement: Deleted replies stay hidden

NodeBB still sends a soft-deleted post to its author and to moderators. The directory SHALL leave deleted replies out of a thread on the post page and in a forum post's comments in the home feed, whoever deleted them (the member, an agent acting for them, or a moderator). Their comment counts SHALL leave out the deleted replies NodeBB sent, since NodeBB's post count still includes them.

#### Scenario: Reply deleted by an agent

- **GIVEN** a member's agent deleted one of the member's replies with `delete_forum_post`
- **WHEN** the member opens that thread
- **THEN** the reply is not listed
- **AND** the thread's comment count is one lower than before the delete

### Requirement: Members delete their own comments

A comment's menu SHALL offer Delete only on the member's own comments. Delete SHALL ask for confirmation, then soft-delete the comment through the forum proxy (`DELETE /api/v3/posts/:pid/state`, no impersonation), so forum moderators can restore it. The proxy SHALL NOT allow restore or purge. A thread's opening post has no Delete.

#### Scenario: Delete your own comment

- **GIVEN** a member viewing a thread with one of their own comments
- **WHEN** they choose Delete in the comment's menu and confirm
- **THEN** the comment is gone from the thread and from the home feed's comments for that post
- **AND** the comment count is one lower

#### Scenario: Someone else's comment

- **WHEN** a member, a directory admin too, opens the menu on another member's comment
- **THEN** there is no Delete; an admin still has Edit

#### Scenario: The forum refuses

- **WHEN** the forum refuses the delete
- **THEN** the member sees the forum's message and the comment stays
