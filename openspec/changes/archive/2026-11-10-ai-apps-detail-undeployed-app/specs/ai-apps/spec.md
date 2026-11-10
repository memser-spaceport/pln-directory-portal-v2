# Spec Delta

## Purpose

What a member sees on the LabOS AI Apps pages (`/pl-infra/ai-apps`): the app page and the states it shows for an app that is running, not deployed yet, private, missing, or deleted.

## ADDED Requirements

### Requirement: "App not found" only for a missing or deleted app

The app page SHALL show "App not found." only when the app does not exist or is deleted. An app that exists and that the viewer may see MUST NOT show "App not found." because it has no address yet.

#### Scenario: Unknown app

- **GIVEN** a signed-in member with AI Apps access
- **WHEN** they open the app page for an id that does not exist
- **THEN** the page shows "App not found."

#### Scenario: Deleted app

- **GIVEN** an app that was deleted
- **WHEN** a member opens its app page
- **THEN** the page shows "App not found."

#### Scenario: Existing app with no address

- **GIVEN** an app that exists, is not deleted, and has never been deployed to any environment
- **WHEN** a member who may view it opens its app page
- **THEN** the page does not show "App not found."

### Requirement: A never-deployed draft opens its setup view

When Production is a draft that has never been deployed, the app page SHALL show the setup view instead of the running app. The setup view shows the app name, its status for each environment, and the Private badge when the app is private.

#### Scenario: Owner opens a private draft

- **GIVEN** a private app whose Production is a never-deployed draft that needs required values
- **WHEN** the app's owner opens its app page
- **THEN** the page shows the setup view with the form for the required values and the deploy action

#### Scenario: Directory admin opens the same draft

- **GIVEN** the same never-deployed draft
- **WHEN** a directory admin opens its app page
- **THEN** the page shows the same setup view with the form and the deploy action

#### Scenario: Another member opens an open draft

- **GIVEN** an open app whose Production is a never-deployed draft
- **WHEN** a member who is not its owner or a directory admin opens its app page
- **THEN** the page shows that the app is not deployed yet and that only its owner can provide the values and deploy it
- **AND** the page shows no form and no deploy action

#### Scenario: Draft with both environments undeployed

- **GIVEN** an app whose Production and Preview are both never-deployed drafts
- **WHEN** the owner opens its app page
- **THEN** the page shows the setup view with both statuses, "Prod Draft" and "Preview Draft"

### Requirement: Production without a deployment shows a "not deployed" state

When Production is selected, has nothing deployed, and is not a draft waiting for setup, the app page SHALL show a "Production is not deployed yet" state in place of the running app. The page header stays, including the environment switch for viewers who may open Preview.

#### Scenario: Production never deployed, Preview not available to the viewer

- **GIVEN** an app whose Production has never been deployed and has no draft to set up
- **AND** a viewer who may not open its Preview
- **WHEN** the viewer opens the app page
- **THEN** the page shows "Production is not deployed yet"

#### Scenario: Viewer switches from Preview back to Production

- **GIVEN** an app whose Production has never been deployed and whose Preview is deployed
- **AND** a viewer who may open its Preview
- **WHEN** the viewer selects Production in the environment switch
- **THEN** the page shows "Production is not deployed yet" and the switch still offers Preview

### Requirement: The page opens on Preview when only Preview has an address

When Production has nothing deployed and no draft to set up, and the viewer may open a Preview that has an address, the app page SHALL open on Preview. The viewer's own choice in the environment switch MUST win after that.

#### Scenario: Preview-only app

- **GIVEN** an app whose Production has never been deployed and whose Preview has an address
- **AND** a viewer who may open its Preview
- **WHEN** the viewer opens the app page
- **THEN** Preview is selected

#### Scenario: Production is deployed

- **GIVEN** an app whose Production and Preview both have an address
- **WHEN** a viewer who may open its Preview opens the app page
- **THEN** Production is selected
