# Proposal

## Why

[LAB-3205](https://linear.app/protocollabs/issue/LAB-3205/ai-apps-app-owner-can-open-the-private-draft-version-of-their-app): on prod, the owner of the private draft app "Feedback Looper" (and a directory admin) gets "App not found." on `/pl-infra/ai-apps/<uid>`. The app exists and the API returns it. The page shows "App not found." for every app whose selected environment has no URL, and an app that was registered as a draft but never deployed has no URL yet. So the owner cannot reach the form that asks for the required values and starts the first deploy, which is the page the agent links to after it registers a draft.

Findings (prod, 2026-11-10, read-only):

- App `feedback-triage-agent`: Production `DRAFT`, Preview `DRAFT`, `PRIVATE`, never deployed, 6 required values, none provided, no URL on either environment.
- The backend sets an app's URL only when a deploy starts. Draft registration (Production or Preview) leaves it empty. This is correct: nothing serves at that address yet.
- The detail page treats "no URL" as "not found". That check was added on 2026-08-14 to show "App not found." for a deleted app.
- A second prod app is affected the same way: `pl-meeting-archive` (Production never deployed, Preview failed). Its page opens on Production, which has no URL.
- The page tests did not catch it: the test app always carries a top-level URL, which a real never-deployed app does not have.

The cause was found by reading the code and the prod data. It has not been reproduced in a browser session yet; the first task does that with a failing test.

## What Changes

- The app page shows "App not found." only when the app does not exist or is deleted. A missing URL no longer means "not found".
- A never-deployed draft opens its setup view: the owner or a directory admin sees the required-values form and can deploy; other viewers see the "not deployed yet" note.
- An app whose Production has nothing deployed and nothing to set up shows a "Production is not deployed yet" state inside the normal page, with the environment switch still available.
- When Production has nothing deployed and the viewer may open a Preview that has a URL, the page opens on Preview.
- Page tests use the real API shape for never-deployed apps (no URL anywhere).

Out of scope:

- Backend changes. The API response is correct; `pln-directory-portal` is not touched.
- Changes to who may view or manage an app (private access, whitelist, Preview testers).
- The deploy flow, the required-values form itself, and the Deployment settings modal.
- The AI Apps list page and its cards.
- Deploying the reporter's app. After the fix they still have to enter the 6 required values and deploy before there is anything to test.

## Capabilities

### New Capabilities

- `ai-apps`: what a member sees on LabOS AI Apps pages. This change adds the app page states for apps that are missing, deleted, or not deployed yet.

### Modified Capabilities

None.

## Impact

- `components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.tsx`: the not-found check, the setup-view condition, the frame-area "not deployed" state, the starting environment.
- `__tests__/page/ai-apps/ai-app-detail-page.test.tsx`: new cases and a never-deployed fixture.
- `openspec/specs/ai-apps/spec.md`: new spec (created on archive).
- No API, dependency, analytics event, or data change.
