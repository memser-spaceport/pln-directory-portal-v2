# Tasks

## 1. Reproduce

- [x] 1.1 In `__tests__/page/ai-apps/ai-app-detail-page.test.tsx`, add a fixture for a never-deployed app in the real API shape (`url`, `httpUrl`, `host` null at the top level and in `deployments.prod`; `lastDeployedAt` null) and a test that opens a `DRAFT` app with required values as a manager. Verify the test fails on the current code with "App not found." on screen — this confirms the cause from proposal.md.

## 2. Fix the app page states

- [x] 2.1 In `AiAppDetailPage.tsx`, replace the `(!isLoading && !appUrl) || !app` guard with "no app, or the app is `DELETED`". Add tests: a 404 result shows "App not found."; a `DELETED` app shows "App not found."; the test from 1.1 now passes and shows the required-values form.
- [x] 2.2 Turn the setup view on for every Production `DRAFT` without a URL, including one with no required values; leave `needsSetup` and its analytics event unchanged. Add tests: owner/admin sees the form and deploy action; a non-manager sees the "not deployed yet" note and no form; a draft with both environments undeployed shows "Prod Draft" and "Preview Draft"; a `DRAFT` that already has a URL renders as before.
- [x] 2.3 Make the frame-area "not deployed yet" state apply to any selected environment without a URL, with a Production text ("Production is not deployed yet", plus the "Switch to Preview" hint only when the viewer may open Preview). Add tests: `IN_DEVELOPMENT` Production without Preview access shows the Production text; switching from Preview to Production shows it and keeps the environment switch.
- [x] 2.4 Derive the starting environment: Preview when the viewer may open it, Preview has a URL, Production has no URL and is not a draft to set up; otherwise Production; an explicit click on the switch wins. Add tests: Preview-only app opens on Preview; an app with both URLs opens on Production; after clicking Production on a Preview-only app, Production stays selected. Also check by hand how a draft owner reaches the Preview draft from the setup view and write the answer in the PR description.

## 3. Verify

- [x] 3.1 Run `npm run lint` and `npm run test`; both pass for the touched files (note any failure that already exists on develop).
- [ ] 3.2 On dev, register a draft with a required value and open its app page as the owner and as a directory admin: the setup view shows, the values can be entered, and the deploy starts. Open a deleted app's page: "App not found.".

## Workflow follow-up

- After the prod release, open `/pl-infra/ai-apps/cmvv99h7b00bzsm019gqnmqa3` as a directory admin and confirm the setup view shows.
- Answer the reporter on LAB-3205: the page now opens; the app still needs its 6 required values and a deploy before it can be tested.
- Update LAB-3205: error text is "App not found."; app is "Feedback Looper"; Department is Frontend.
