# Proposal

## Why

LAB-3081 (https://linear.app/protocollabs/issue/LAB-3081): a job-board member cannot add a GitHub handle to the profile. In the job-board profile drawer (Update profile, or the Apply step "Complete your profile"), the "Edit Contact Details" form shows Email, LinkedIn, Telegram, X (Twitter) and Bluesky, but no GitHub field. Because the member cannot save a GitHub handle there, the Repositories section of the drawer stays empty.

## What Changes

- The "Edit Contact Details" form in the job-board profile drawer shows a GitHub field, with the same label, placeholder, logo and validation as the member profile's Contact Details edit.
- Saving the drawer form sends the bare GitHub handle (a handle or a `https://github.com/<name>` URL is accepted) in the existing member update request.
- The drawer's Contact Details view lists the GitHub handle next to the other contacts.
- After the save, the Repositories section shows the repositories of that GitHub user, or the empty text, without a page reload.

Out of scope: the Discord field and the contact sharing switch in the drawer; backend changes (the member update request already accepts the GitHub handle); GitHub fetch or rate limits; deny-listed areas (auth, cookies, tokens, CI, env, destructive migrations).

## Capabilities

### New Capabilities

### Modified Capabilities
- `job-board`: adds the GitHub contact to the job-board profile drawer's Contact Details edit and view.

## Impact

- Job-board profile drawer (banner "Update profile", and the Apply flow step "Complete your profile"): Contact Details edit form and view.
- Existing member update request (`PUT /v1/member/:uid`, field `githubHandler`) and the member repositories query: no contract change.
