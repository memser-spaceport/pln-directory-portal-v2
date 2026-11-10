# Design

## Context

See proposal.md for the motivation and the prod findings.

How the page decides today (`AiAppDetailPage.tsx`):

- `selectedEnv` is `'prod'` unless the viewer may open Preview and picked it. The starting value is always `'prod'`.
- `appUrl` is the selected environment's URL, with the app's top-level `url` as a fallback for Production.
- After the loading, error and private states, the page returns "App not found." when `(!isLoading && !appUrl) || !app`.
- Below that guard, `showSetupCard` renders the setup view for a Production draft that needs values (`needsSetup`), a failed deploy, or a deploy in progress. `renderFrameArea` already has a "Preview is not deployed yet" state for Preview without a URL.

The guard runs first, so every state below it that has no URL is unreachable. The API returns `url: null` for an app until its first deploy starts, and for a deleted app. `GET /v1/ai-apps/:uid` returns apps of any status, including `DELETED`.

`useAiApp` already returns `errorKind` (`'forbidden' | 'not-found' | 'network'`), so the page can tell a missing app from an app without a URL.

## Goals / Non-Goals

**Goals:**

- "App not found." depends on the app's existence and status, never on a URL.
- Every existing app the viewer may see reaches a state that says what is going on.
- Reuse the states the page already has (setup view, "not deployed" frame state).

**Non-Goals:**

- New visual design. No new components or styles beyond one text variant.
- Changes to `AppSecretsPanel`, `DeploymentSettingsModal`, or the API contract.

## Decisions

### 1. Not-found is `!app` or `status === 'DELETED'`

Replace the URL check with the app's own state. `!app` covers the API's 404 (`errorKind === 'not-found'`) and any other empty result that passed the earlier guards. `DELETED` keeps what the 2026-08-14 change wanted: a deleted app reads as not found.

Alternative: keep the URL check and exempt drafts. Rejected: it keeps a proxy that already broke twice (drafts, Preview-only apps) and would break again for the next status.

Alternative: make the backend set a URL when a draft is registered. Rejected: nothing serves there, the page would mount a frame on a dead address, and "has a URL" is used elsewhere to mean "was deployed".

### 2. The setup view covers every never-deployed Production draft

`showSetupCard` also turns on when Production is selected, the app is `DRAFT`, and Production has no URL, even with no required values. `needsSetup` itself is unchanged, so the draft-setup analytics event fires exactly as today. `AppSecretsPanel` already switches to its plain deploy copy when there are no required values.

A draft that was deployed before (re-registered as `DRAFT` with a URL, like `blue-funds-grant-ops` on prod) keeps today's behaviour.

### 3. Production with nothing deployed uses the existing frame-area state

`renderFrameArea` shows its "not deployed yet" state whenever the selected environment has no URL, with the text naming the environment. For Production the hint is "Switch to Preview" only when the viewer may open Preview; otherwise the title alone. The header and the environment switch render as usual.

This is the state for `IN_DEVELOPMENT` (an app that so far exists only through Preview). The setup view is wrong there: Production has no uploaded bundle, and a deploy attempt returns 400.

### 4. Starting environment is derived until the viewer picks one

The environment state starts as "no choice". While it is "no choice", the page uses Preview when the viewer may open it, Preview has a URL, Production has no URL, and Production is not a draft to set up; otherwise Production. Clicking the switch stores an explicit choice, which then always wins.

Deriving it during render avoids an effect that flips the environment after the first paint and reloads the frame.

Alternative: always start on Production and let the viewer switch. Rejected: the owner of a Preview-only app lands on an empty state every time they open their app.

## Risks / Trade-offs

- [A status with no URL that nobody listed, for example `DELETING`] → It now falls through to the "not deployed" frame state instead of "App not found.". This is an acceptable reading for a short-lived state; the list page already hides such apps.
- [A draft owner on the setup view cannot switch to Preview, because the setup view has no header] → Unchanged by this fix. Task 2.4 checks how the owner reaches the Preview draft (Deployment settings) and records the answer; if there is no path, that is a follow-up ticket, not part of this change.
- [Tests keep passing on a fixture that does not match the API] → The new cases build the app with `url: null` at the top level and in `deployments`, as the API returns it.

## Migration Plan

Frontend-only. Ship through the normal develop → main flow. Rollback is a revert of one PR. No data or config change.

After the prod release, open `/pl-infra/ai-apps/cmvv99h7b00bzsm019gqnmqa3` as a directory admin: the setup view must show. Then answer the reporter.
