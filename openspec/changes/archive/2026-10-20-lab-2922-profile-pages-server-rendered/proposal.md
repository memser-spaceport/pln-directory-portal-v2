# Proposal

## Why

[LAB-2922](https://linear.app/protocollabs/issue/LAB-2922), part of Goal [LAB-2876](https://linear.app/protocollabs/issue/LAB-2876): Google cannot index pages whose content arrives only after JavaScript runs. On `os.pl.xyz` (checked 2026-10-20), the server HTML of member profiles, project profiles and the `/teams` list has no body content: only the navbar and a `<title>`. Search Console reports 311 pages "Crawled, currently not indexed", and empty profiles are the likely cause. A profile that does not exist also answers HTTP 200 with an error message (a "soft 404"), so Google keeps those URLs too.

## What Changes

- A member, team or project profile whose id the API reports as not found answers HTTP 404 with the not-found page. Any other failure (5xx, 429, timeout, network) keeps today's error page.
- The server HTML of a project profile carries its body. Today the server render throws `ReferenceError: document is not defined`, so React drops the whole page to client rendering. The project description imports the rich-text editor, whose Quill dependency touches `document` when its module loads (reproduced locally on 2026-10-20). The fix makes the editor load in the browser only. Every page that imports it benefits, including the member profile's edit forms, which would otherwise crash the same way once that page renders on the server.
- The server HTML of a member profile carries the public profile: name, role, teams, bio and the other sections a signed-out visitor sees. A signed-in viewer's private data and edit controls still arrive after hydration, as today.
- The server HTML of `/teams` carries the first page of teams for the URL's filters, with a link to each team profile. The filter rail still waits for hydration, as on `/members` and `/jobs` since LAB-2888.
- No visible change for a signed-in user beyond the profile and list appearing sooner.

## Capabilities

### New Capabilities

- `profiles`: what a crawler and a visitor get from member, team and project profile pages: public content in the server HTML, and a real 404 for an unknown id.
- `teams`: the teams directory listing: page 1 in the server HTML with a crawlable link to every listed team.

### Modified Capabilities

None. `job-board` already requires server-rendered content for `/jobs`; nothing in it changes.

## Out of scope

- Other pages: home, `/members`, `/projects` and team profiles already render on the server and only get a regression check. Demo Day, events, forum and Founder Guides are not part of this ticket.
- Titles, descriptions and keywords (LAB-2923) and structured data.
- Search Console fixes beyond 404s (LAB-2924) and Search Console steps (LAB-2890).
- Server rendering anything a signed-in viewer sees beyond the public profile.
- The backend's 10 req/s throttle that can answer 429 to server rendering (pln-directory-portal#3542). A 429 keeps the error page and the browser retries, as today.

## Impact

- Pages: `app/members/[id]`, `app/teams/[id]`, `app/projects/[id]`, `app/teams/(teams-page)`.
- Shared components: `components/ui/RichTextEditor` (imported by 15 components; 3 already load it with `ssr: false`), `components/page/teams/TeamsFilterUrlSync`.
- Services: `getTeam` and `getProject` return the HTTP status with their error, as `getMember` already does.
- Hooks: `services/teams/hooks/useInfiniteTeamsList` (the unused `initialData` seed becomes a `placeholderData` server page).
- Data: the member page makes one extra server-side API call per request for the public member, beside the one `generateMetadata` already makes.
- No API, backend, auth or proxy change.
