import type {
  AgentSession,
  AgentSessionMessage,
  AgentSessionProgressStep,
} from '@/services/agent-sessions/agent-sessions.service';

/**
 * Stands in for the `[id]` segment of /pl-infra/agent-sessions/<id>. The real page
 * prints this id verbatim under the title, so the prototype needs one that looks
 * like the orchestrator's task ids rather than a slug.
 */
export const MOCK_SESSION_ID = '9f3c1a7e-4b62-4d51-9d0c-2c8a5f1e77b3';

/** The four states a session detail page can be caught in. */
export type ScenarioKey = 'running' | 'waiting_for_input' | 'pr_created' | 'failed';

export interface Scenario {
  readonly key: ScenarioKey;
  readonly label: string;
  /** Why this state is worth looking at — shown under the switcher. */
  readonly note: string;
  readonly session: AgentSession;
  readonly messages: AgentSessionMessage[];
  readonly steps: AgentSessionProgressStep[];
}

const REPOSITORY_KEY = 'pln-directory-portal-v2';
const REPOSITORY_URL = 'https://github.com/memser-spaceport/pln-directory-portal-v2';
const WORKING_BRANCH = 'agent/job-alert-empty-state';
const REQUESTED_BY = 'polina@plnetwork.io';

const PROMPT = `On /jobs, the filters rail can be narrowed to a state that matches nothing, and the results pane
just goes blank — no message, no way back.

Add an empty state that names which filters are responsible and offers a single "Clear filters" action.
Reuse the existing empty-state component from the members listing rather than adding another one.`;

/**
 * Every timestamp is a literal string, never `Date.now()` — the page renders them
 * through `formatDate`, and a moving clock would make two screenshots of the same
 * scenario disagree.
 */
const T = {
  created: '2026-08-13T09:12:04.000Z',
  cloned: '2026-08-13T09:12:41.000Z',
  changeStarted: '2026-08-13T09:13:02.000Z',
  question: '2026-08-13T09:18:37.000Z',
  answer: '2026-08-13T09:24:10.000Z',
  tests: '2026-08-13T09:31:55.000Z',
  pushed: '2026-08-13T09:34:20.000Z',
  pr: '2026-08-13T09:34:48.000Z',
  featureJob: '2026-08-13T09:35:06.000Z',
  featureReady: '2026-08-13T09:39:12.000Z',
  failure: '2026-08-13T09:33:07.000Z',
};

function baseSession(overrides: Partial<AgentSession>): AgentSession {
  return {
    id: MOCK_SESSION_ID,
    repository_key: REPOSITORY_KEY,
    repository_url: REPOSITORY_URL,
    base_branch: 'main',
    working_branch: WORKING_BRANCH,
    prompt: PROMPT,
    status: 'running',
    create_feature_environment: true,
    kubernetes_namespace: 'code-fix-orchestrator',
    kubernetes_job_name: 'agent-session-9f3c1a7e-exec-1',
    commit_sha: null,
    pull_request_number: null,
    pull_request_url: null,
    feature_environment_name: null,
    feature_environment_url: null,
    feature_environment_status: null,
    error_code: null,
    error_message: null,
    requested_by: REQUESTED_BY,
    created_at: T.created,
    started_at: T.created,
    completed_at: null,
    updated_at: T.created,
    ...overrides,
  };
}

function step(
  key: string,
  eventType: string,
  reached: boolean,
  status: string,
  message: string | null,
  createdAt: string | null,
  metadata: Record<string, unknown> = {},
): AgentSessionProgressStep {
  return { key, eventType, reached, status, message, metadata, createdAt };
}

/**
 * Step keys and order mirror the orchestrator's `GET /v1/tasks/:id/progress`
 * definitions, because `deriveProgressSteps` reads position and `reached` — a
 * re-ordered list would derive the wrong phases.
 */
function progressSteps(reachedUpTo: number, options: { failedAt?: number } = {}): AgentSessionProgressStep[] {
  const definitions: Array<[string, string, string, string | null, string | null]> = [
    ['session_created', 'task.created', 'queued', 'Session queued', T.created],
    ['repo_cloned', 'repo.cloned', 'cloning', `Cloned ${REPOSITORY_KEY} at main`, T.cloned],
    ['code_change_started', 'code_change.started', 'running', 'Agent started working on the change', T.changeStarted],
    ['tests_run', 'tests.completed', 'testing', 'npm run test — 412 passed, 0 failed', T.tests],
    ['branch_pushed', 'branch.pushed', 'pushing', `Pushed ${WORKING_BRANCH}`, T.pushed],
    ['pr_created', 'pull_request.created', 'pr_created', 'Opened PR #2791', T.pr],
    ['feature_job_created', 'feature_job.created', 'deploying', 'Feature environment build dispatched', T.featureJob],
    ['feature_ready', 'feature_env.ready', 'ready', 'Feature environment is live', T.featureReady],
  ];

  return definitions.map(([key, eventType, status, message, createdAt], index) => {
    const reached = index <= reachedUpTo;
    if (options.failedAt === index) {
      return step(key, eventType, true, 'failed', 'Build failed — see the error above', T.failure);
    }
    return step(
      key,
      eventType,
      reached,
      status,
      reached ? message : null,
      reached ? createdAt : null,
      key === 'feature_ready' && reached
        ? { urls: { frontend: 'https://pr-2791.dev.plnetwork.io' } }
        : {},
    );
  });
}

const OPENING_INSTRUCTION: AgentSessionMessage = {
  id: 'msg-1',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-1',
  sender: 'admin',
  message_type: 'instruction',
  body: PROMPT,
  created_at: T.created,
};

const PLAN_REPLY: AgentSessionMessage = {
  id: 'msg-2',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-1',
  sender: 'agent',
  message_type: 'reply',
  body: `Cloned \`${REPOSITORY_KEY}\` and read the jobs listing. Here's what I found:

- \`components/page/jobs/JobsList/JobsList.tsx\` renders \`null\` when \`filteredRoles.length === 0\`, which is the blank pane.
- The members listing already has \`components/page/members/MembersEmptyState\` — it takes a \`title\`, a \`description\` and an optional action, so it covers this case without a new component.
- Active filters are already derived in \`useJobsFilters\`, so naming the responsible ones needs no new state.

Plan:

1. Render \`MembersEmptyState\` from \`JobsList\` when the filtered set is empty.
2. Pass the active filter labels into the description.
3. Wire "Clear filters" to the existing \`resetFilters()\`.`,
  created_at: T.changeStarted,
};

const QUESTION: AgentSessionMessage = {
  id: 'msg-3',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-1',
  sender: 'agent',
  message_type: 'question',
  body: `One thing I can't decide from the prompt.

\`MembersEmptyState\` is named for members and lives under \`components/page/members/\`. Reusing it from the jobs
page means importing across page folders, which nothing else in the repo does today.

Do you want me to:

1. **Import it as-is** — fastest, but couples jobs to the members folder, or
2. **Move it to \`components/ui/EmptyState\`** and update the two members call sites?

I'll take option 1 unless you say otherwise, since the prompt asked me not to add another component.`,
  created_at: T.question,
};

const ANSWER: AgentSessionMessage = {
  id: 'msg-4',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-2',
  sender: 'admin',
  message_type: 'instruction',
  body: 'Option 2 — move it to components/ui/EmptyState and update the members call sites. Keep the props identical so the diff stays readable.',
  created_at: T.answer,
};

const DONE_REPLY: AgentSessionMessage = {
  id: 'msg-5',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-2',
  sender: 'agent',
  message_type: 'reply',
  body: `Done — [PR #2791](https://github.com/memser-spaceport/pln-directory-portal-v2/pull/2791) is open.

| File | Change |
| --- | --- |
| \`components/ui/EmptyState/\` | Moved from \`page/members/MembersEmptyState\`, props unchanged |
| \`components/page/members/MembersList.tsx\` | Import path updated |
| \`components/page/jobs/JobsList/JobsList.tsx\` | Renders \`EmptyState\` with the active filter labels + Clear filters |

\`\`\`tsx
{!filteredRoles.length ? (
  <EmptyState
    title="No roles match these filters"
    description={\`Nothing matches \${activeFilterLabels.join(', ')}.\`}
    actionLabel="Clear filters"
    onAction={resetFilters}
  />
) : null}
\`\`\`

Tests pass (412), and the feature environment is building.`,
  created_at: T.pr,
};

const FAILURE_REPLY: AgentSessionMessage = {
  id: 'msg-5-failed',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-2',
  sender: 'agent',
  message_type: 'reply',
  body: `Moved the component and updated both members call sites, but the build fails before I can push:

\`\`\`
components/page/jobs/JobsList/JobsList.tsx:88:9
Type error: Property 'actionLabel' does not exist on type 'EmptyStateProps'.
\`\`\`

The members version takes \`action\` as a \`ReactNode\`, not a label plus a handler. Renaming the prop would
change the two members call sites you asked me to keep identical, so I stopped rather than guess.`,
  created_at: T.failure,
};

/**
 * Step narration the chat deliberately hides (`HIDDEN_MESSAGE_TYPES`) — kept in the
 * mock so the filter in the chat component is actually exercised rather than
 * assumed. If it ever renders, the prototype is wrong.
 */
const HIDDEN_STATUS: AgentSessionMessage = {
  id: 'msg-status',
  task_id: MOCK_SESSION_ID,
  execution_id: 'exec-1',
  sender: 'agent',
  message_type: 'status',
  body: 'Running: git diff --check',
  created_at: T.changeStarted,
};

export const scenarios: Scenario[] = [
  {
    key: 'running',
    label: 'Running',
    note: 'The agent is mid-run. Nothing is blocked on a person, so the composer is available but nothing is asking for it.',
    session: baseSession({ status: 'running', updated_at: T.changeStarted }),
    messages: [OPENING_INSTRUCTION, HIDDEN_STATUS, PLAN_REPLY],
    steps: progressSteps(2),
  },
  {
    key: 'waiting_for_input',
    label: 'Waiting for input',
    note: 'The one state that needs a human: the agent stopped on a question and will not continue until it is answered. Send a reply to resume the run.',
    session: baseSession({ status: 'waiting_for_input', updated_at: T.question }),
    messages: [OPENING_INSTRUCTION, HIDDEN_STATUS, PLAN_REPLY, QUESTION],
    steps: progressSteps(2),
  },
  {
    key: 'pr_created',
    label: 'PR created · env ready',
    note: 'The finished run: PR link, a live feature environment, and the deploy / delete controls unlocked.',
    session: baseSession({
      status: 'pr_created',
      commit_sha: 'c41f8ab',
      pull_request_number: 2791,
      pull_request_url: 'https://github.com/memser-spaceport/pln-directory-portal-v2/pull/2791',
      feature_environment_name: 'pr-2791',
      feature_environment_url: 'https://pr-2791.dev.plnetwork.io',
      feature_environment_status: 'ready',
      completed_at: T.featureReady,
      updated_at: T.featureReady,
    }),
    messages: [OPENING_INSTRUCTION, HIDDEN_STATUS, PLAN_REPLY, QUESTION, ANSWER, DONE_REPLY],
    steps: progressSteps(7),
  },
  {
    key: 'failed',
    label: 'Failed',
    note: 'The run ended without a closing agent message on some paths — the outcome badge under the thread is the only thing that says so.',
    session: baseSession({
      status: 'failed',
      error_code: 'BUILD_FAILED',
      error_message: "Type error in components/page/jobs/JobsList/JobsList.tsx — 'actionLabel' does not exist on type 'EmptyStateProps'.",
      completed_at: T.failure,
      updated_at: T.failure,
    }),
    messages: [OPENING_INSTRUCTION, HIDDEN_STATUS, PLAN_REPLY, QUESTION, ANSWER, FAILURE_REPLY],
    steps: progressSteps(3, { failedAt: 3 }),
  },
];

export function getScenario(key: ScenarioKey): Scenario {
  return scenarios.find((scenario) => scenario.key === key) ?? scenarios[0];
}

/** The agent's canned answer when an admin replies in the prototype. */
export const RESUMED_REPLY_BODY = `Got it — resuming on \`${WORKING_BRANCH}\`.

Starting a new execution from the current branch state; I'll report back when the change is pushed.`;

/** The agent's canned answer to "Retry run" from the failure block. */
export const RETRY_REPLY_BODY = `Retrying from \`${WORKING_BRANCH}\` at the last good commit.

Re-running the build with the same prompt; I'll stop and ask if I hit the same \`EmptyStateProps\` mismatch again.`;
