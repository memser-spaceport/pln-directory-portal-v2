# Tasks

Two PRs into `lab-2876`: groups 1 to 3 (editor fix, 404s, project profile), then groups 4 and 5 (member profile, teams list). Server-HTML checks run against a local `next dev` on the dev API. They fetch the page with `curl`, without cookies, and strip scripts and styles before searching the visible text.

## 1. The rich-text editor no longer breaks server rendering (D1)

- [x] 1.1 Move the editor implementation to `components/ui/RichTextEditor/RichTextEditorClient.tsx`. `RichTextEditor.tsx` default-exports `dynamic(() => import('./RichTextEditorClient'), { ssr: false })`. Point the editor's own tests at `RichTextEditorClient`. Verify: `npx jest __tests__/ui/rich-text-editor` is green.
- [x] 1.2 Add a test that importing `RichTextEditor.tsx` never evaluates `quill`, for example by mocking `react-quill-new` to throw on import. Verify: the test fails when the wrapper is reverted to a static import.
- [x] 1.3 Fix any test that rendered a static importer and expected the editor synchronously (`unsaved-project-sections`, the feed comments tests). Wait for the dynamic import in the test. Verify: `npx jest __tests__/page/project-details __tests__/page/home` is green.

## 2. Unknown profiles answer 404 (D2)

- [x] 2.1 `getTeam` and `getProject` return `status` in their error object, and `getTeam` no longer parses the body before checking `ok`. Verify: unit tests for both services cover 404 → `{ error: { status: 404 } }` and 503 → `{ error: { status: 503 } }`.
- [x] 2.2 Team and project routes call `notFound()` on an API 404, in a new route layout (the real 404 status) and in the page. `generateMetadata` gives the status nothing, because the page streams under `loading.tsx`. Old Airtable team ids skip the check. Other errors keep `<Error />`. Verify: page tests assert that `notFound` is called for 404 and not for 503 or a thrown fetch.
- [x] 2.3 The member layout's `generateMetadata` and layout body (a server component, so this works before group 4 converts the page) call `notFound()` only when the signed-out fetch is 404 and the request has no auth cookie. Verify: tests cover signed-out 404 → `notFound`, signed-in 404 → no `notFound`, 503 → no `notFound`, and a stale cached 404 confirmed uncached.
- [x] 2.4 Check the status locally: `curl -o /dev/null -w '%{http_code}'` against `/members/`, `/teams/` and `/projects/doesnotexist000000000000`, once plain and once with `-A Googlebot`. Verify: all six answer 404. Result (2026-10-20): all six answer 404. Real team and project profiles answer 200. A made-up Airtable id behaves as before.

## 3. Project profile body in the server HTML

- [x] 3.1 Check the project profile locally: the server HTML of `/projects/<uid>` contains the project name and description text, and the dev server log shows no `document is not defined`. Verify: the curl check passes. Also add a Jest test that renders the project page's client sections with a project and finds the description.
- [x] 3.2 Regression: the server HTML of `/teams/<uid>`, `/home`, `/members` and `/projects` still holds its main content. Verify: the curl check finds the team name, the "Network updates" heading, and member and project links.
- [x] 3.3 Run `npm run lint`, `npx tsc --noEmit` (no new errors against `develop`), `npm run test` and `npx -y @fission-ai/openspec@1.14.1 validate --json`. Then open PR 1 into `lab-2876`.

## 4. Member profile body in the server HTML (D3)

- [x] 4.1 Move the client body to `components/page/member-details/MemberDetailsPage.tsx`, taking `memberId` and `serverMember`. Make `app/members/[id]/page.tsx` an async Server Component that fetches the public member (`with: 'image,skills,location,teamMemberRoles.team'`, signed out), applies 2.3, and renders it. Verify: `tsc` is clean and the existing member-details tests are green.
- [x] 4.2 Pass `placeholderData: serverMember` to the member `useQuery`. While `isPlaceholderData` is true, render the public view (`isLoggedIn=false`, no `userInfo`, `isOwner=false`). Verify: a test renders the body with a `serverMember` and a signed-in owner, and asserts no edit control shows until the query resolves, then that edit controls appear.
- [x] 4.3 Check the member profile locally: its server HTML contains the member's name, role, team names and bio, and no email address. Opening it in a browser, signed out and signed in as the owner, shows no hydration warning in the console. Fix each hook that renders differently on the server at its source. Verify: the curl check passes, and the browser console is clean in both cases.
    - Done (2026-10-20): the server HTML of `/members/cldvnzqfd0287u21km8g49s20` (dev API) has the name, team, role and bio, with no email and no client-render fallback. Signed out, the browser console shows no hydration warning.
    - Done (2026-10-20, Oleg, in a browser): signed in as the owner, the public profile shows first, then edit controls and private fields once the viewer's data loads, with no hydration warning.

## 5. Teams list in the server HTML (D4)

- [x] 5.1 Extract the teams list query builder to `services/teams/teamsListQuery.ts` (no `'use client'`) and use it from `useInfiniteTeamsList`'s fetcher. Verify: a unit test shows the builder's output is unchanged for sort, investment focus and priorities.
- [x] 5.2 `TeamsFilterUrlSync` wraps only the filter rail in the teams layout. Verify: add teams to `__tests__/app/listing-layouts-gate.test.tsx`.
- [x] 5.3 The `@content` page fetches page 1 with the viewer's token and passes `serverPage` (`{ key, items, total, followingTotal }`), or nothing on failure. The fetch lives in `services/teams/getServerTeamsPage.ts`, because a page file may not export helpers. Verify: a test of that module covers success, the key, repeated params and failure.
- [x] 5.4 `useInfiniteTeamsList` drops the unused `initialData` seed and shows `serverPage` as `placeholderData` while hydrating or when the query equals `serverPage.key`. Verify: hook tests cover (a) a hydrating render with an empty store shows the server page, (b) a matching key shows it, (c) a different filter key does not.
- [x] 5.5 `TeamsContent` shows the list without waiting for filter values. `TeamList` and `TeamsToolbar` tolerate undefined `filterValues`. Verify: a test renders `TeamsContent` with a server page while filter values are loading, and finds the team links.
- [x] 5.6 Check the teams list locally: the server HTML of `/teams` and `/teams?searchBy=<text>` has team names and `/teams/<uid>` links matching what the browser shows after load. In a browser, filtering, the Following tab and infinite scroll work, and the console shows no hydration warning. Verify: the curl check passes, and a manual browser pass works.
    - Done (2026-10-20): `/teams` and `/teams?searchBy=lab` have 50 team links each in the server HTML, with no fallbacks. The browser shows the same teams (72 for "lab"). Clear All switches to all 1,020 teams, infinite scroll goes from 50 to 200 teams, and there is no hydration warning. The one Next issue was the React DevTools extension's own "bug in React" message.
    - Done (2026-10-20, Oleg, in a browser): signed in, the Following tab switches the list and the count as before.

## 6. Ship

- [x] 6.1 Run `npm run lint`, `npx tsc --noEmit` (no new errors), `npm run test` and `npx -y @fission-ai/openspec@1.14.1 validate --json`. Then open PR 2 into `lab-2876` with the OpenSpec change archived in it.

## Workflow follow-up

- Deploy `lab-2876` to the feature env (`/lab-goal env deploy`). Re-run the curl checks there, then `/lab-goal test`.
- After release, run Search Console's URL Inspection live test on one member, one project and `/teams` (LAB-2924).
