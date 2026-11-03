## ADDED Requirements

### Requirement: The sign-in system loads only when it is needed

A signed-out visitor SHALL NOT download the sign-in system's code or contact its service (`auth.privy.io`) until they start to sign in, or until something on the page asks the sign-in system to act: account linking or sign-out. Starting to sign in means opening the sign-in dialog, by choosing Sign in or by arriving at an address with `#login`. A signed-in member SHALL get the sign-in system on every page, as before this change.

#### Scenario: Signed-out visitor reads a page

- **GIVEN** a visitor with no session
- **WHEN** they load `/home`, `/jobs`, a profile or any other page, and do not choose Sign in
- **THEN** the page makes no request to `auth.privy.io` and loads no sign-in system code

#### Scenario: Signed-out visitor chooses Sign in

- **GIVEN** a visitor with no session on any page
- **WHEN** they choose Sign in
- **THEN** the sign-in dialog opens with the same sign-in methods as before (email, Google, GitHub, wallet)
- **AND** completing it signs them in as before

#### Scenario: Arriving at a sign-in address

- **GIVEN** a visitor with no session
- **WHEN** they open a LabOS address ending in `#login`
- **THEN** the sign-in dialog opens, as before this change

#### Scenario: Signed-in member

- **GIVEN** a signed-in member
- **WHEN** they load any page
- **THEN** sign-out, account linking and email change work as before this change

### Requirement: Sign-in flows keep working with the sign-in system loaded on demand

Every flow that used the sign-in system before this change SHALL behave the same when it is loaded on demand: sign-in with each method, login links, sign-out (including across tabs and after a failed refresh), account linking, email change and the sign-in error dialogs. A request that reaches the sign-in system before it has loaded SHALL be carried out once it has loaded, not dropped.

#### Scenario: Google or GitHub sign-in returns to the site

- **GIVEN** a visitor with no session who chose Google or GitHub in the sign-in dialog
- **WHEN** the provider sends them back to LabOS with Privy's OAuth parameters in the address
- **THEN** the sign-in completes and they are signed in, as before this change

#### Scenario: Login link

- **GIVEN** a visitor with no session who opens a one-time login link
- **WHEN** the page loads
- **THEN** they are signed in and the link's parameters are removed from the address, as before this change

#### Scenario: Sign-out from a stale session

- **GIVEN** a browser whose session can no longer be refreshed, on a page rendered as signed out
- **WHEN** the page asks the sign-in system to sign out
- **THEN** the sign-out completes and the session is cleared, as before this change

#### Scenario: Dismissed sign-in

- **GIVEN** a visitor who opened the sign-in dialog
- **WHEN** they close it without signing in
- **THEN** the page returns to its normal state, and choosing Sign in again opens the dialog again

#### Scenario: Sign-in with an email that is not a member

- **GIVEN** a visitor who signs in with an email that has no member profile
- **WHEN** sign-in completes at the sign-in service
- **THEN** they see the same error dialog as before this change
