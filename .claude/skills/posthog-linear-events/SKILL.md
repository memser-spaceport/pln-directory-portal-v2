---
name: posthog-linear-events
description: >-
  For the current Linear cycle, find Directory issues past In Progress, check
  which are implemented in this frontend, list related PostHog events from the
  code, and post one Linear comment per issue. Use when the user asks to document
  PostHog events on Linear, comment cycle tickets with analytics events, or run
  posthog-linear-events.
disable-model-invocation: true
---

# PostHog events → Linear comments

Document PostHog events for shipped (or nearly shipped) Directory work in the **current Linear cycle**. Source of truth is **this repo’s call sites**, not PostHog ingestion.

Requires **Linear MCP**. If it is missing or unauthenticated, stop and tell the user to connect it. Do not invent issues or events.

Do **not** add new analytics events. Do **not** change product code.

## How to run

1. Connect **Linear MCP** in Cursor, Claude Code, or another agent.
2. From this repo, ask: `Run the posthog-linear-events skill`
3. Claude Code: `/posthog-linear-events`
4. Add `dry-run` to preview comments without posting.

Optional: if the user says **dry-run** / preview / don’t comment, stop after the chat summary and do not call `save_comment`.

## Prerequisites

- Linear MCP tools: `list_teams`, `list_cycles`, `list_issues`, `get_issue`, `list_comments`, `save_comment`
- Working tree: this frontend (`pln-directory-portal-v2`)

## Statuses to include

Directory team names (match case-insensitive, **trim** whitespace — `Ready for test` is stored with a trailing space):

- Code review
- In Review
- Ready for test
- In testing
- In testing on Prod
- Prod ready
- Done

Exclude everything else (Backlog, Todo, In Progress, Design, Design Review, Design Done, Canceled, Duplicate, Review).

## Workflow

```
- [ ] 1. Current cycle issues
- [ ] 2. Filter by status
- [ ] 3. Implemented in this repo?
- [ ] 4. PostHog events from call sites
- [ ] 5. Comment on Linear (unless dry-run)
```

### 1. Current cycle issues

1. `list_teams` → team **Directory** (id + confirm).
2. `list_cycles` with that `teamId` and `type: "current"`. If none, stop.
3. `list_issues` with `team: "Directory"`, `cycle` = that cycle’s id, `limit: 250`. Request `id`, `title`, `description`, `status`, `labels`, `url`, `parentId`. Paginate with `cursor` until done.

### 2. Filter by status

Keep issues whose `status` (trimmed) is in the list above.

Skip **Design-only** issues (label `Design` and no `Frontend`).

### 3. Implemented in this repo?

For each remaining issue, read the title + description (`get_issue` if the list payload is thin). Search **this repo only**:

- `components/`, `app/`, `services/` — UI / behavior from the ticket
- Ignore `prototypes/` for “is it implemented”

Mark:

| Result | Meaning |
| ------ | ------- |
| **Implemented** | Matching production UI or behavior exists here |
| **Partial** | Ticket is broader than what this repo has (e.g. backend-only tags, fields not on frontend types) |
| **Not here** | Backend/design/other repo, or no matching code |

Continue to step 4 for **Implemented** and **Partial**. Skip **Not here** (no comment).

### 4. PostHog events from call sites

Do **not** use PostHog MCP (or the PostHog UI) as the source of truth. Constants and test mocks do not count unless a production call site fires them.

Look up:

1. `utils/constants.ts` — kebab-case event name strings
2. `analytics/*.analytics.ts` — `capture` / `captureEvent` helpers
3. Production call sites (`components/`, `app/`, `services/`, hooks) that invoke those helpers

Include events the **feature actually fires**, including ones that existed before this ticket. Exclude:

- Helpers that are never called from production
- Events only mentioned in `__tests__/` mocks
- Unrelated funnel events from the same page

One line per event: **when it is triggered**, not payload schema. No skill titles, emails, or form field values in the comment (Job Apply privacy: no form values).

If there are **no** related events, skip the comment; list the issue under “no events” in the summary.

### 5. Linear comment

Comment body — **exactly** this shape, nothing else (no “added this round”, no extra notes):

```markdown
PostHog events related to this task:
- `event-name` — short trigger
- `other-event` — short trigger
```

`list_comments` first. If a comment already starts with `PostHog events related to this task:`, **update** it (`save_comment` with that comment `id`). Otherwise **create** one (`save_comment` with `issueId` like `LAB-1234`).

Pass markdown with real newlines (Linear MCP: do not send `\n` escapes).

One comment thread per issue. Do not reply in-thread.

## Chat summary (always)

After comments (or after dry-run):

```markdown
Cycle: <name>

Commented:
- LAB-XXXX — N events — <url>

Skipped (not in this repo / design-only / no events):
- LAB-YYYY — <reason>
```

## Example comment

```markdown
PostHog events related to this task:
- `cv-preview-opened` — stored-CV Preview click (member profile or apply profile step)
- `cv-removed` — stored-CV Remove succeeded
- `team-news-team-followed` — follow succeeded after apply (`source: job-apply`) or interest (`source: job-interest`)
```
