/**
 * Mock data for the LAB-2948 MCP settings prototype. Names are invented; no
 * real Directory member, team or thread is used.
 *
 * The actions are real LabOS actions from the LAB-2944 spike table. Since the
 * 2026-10-26 sync the server is "broad API → MCP" (option two): tools are
 * generated from the existing APIs, and what an agent may call is decided by
 * the member's feature permissions (SCOPES below), capped by what admins have
 * switched on. Writes happen directly once the member has turned
 * write on for that feature (with its own consent).
 */

/** PostHog-style scope level. `write` always includes read. */
export type ScopeLevel = 'none' | 'read' | 'write';

/** Who is looking: an approved member, or an L0/L1 member / job aspirant. */
export type Viewer = 'member' | 'limited';

export type ScopeKey =
  | 'search'
  | 'forum'
  | 'news'
  | 'directory'
  | 'jobs'
  | 'events'
  | 'office-hours'
  | 'intros'
  | 'profile'
  | 'ai-apps';

export type Scope = {
  key: ScopeKey;
  name: string;
  /** What Read lets an agent do, in the member's words. */
  read: string;
  /** What Read and write adds, read after "With write:" (so lower-case unless a proper noun). Absent = nothing to write. */
  write?: string;
  /** Prototype annotation for the review band. */
  backendTag?: string;
};

/**
 * Ordered by the 2026-10-26 priority: high value, low effort, most-used first.
 * Search and forum stay on top; the news feed moved up because exposing it is
 * a small change.
 */
export const SCOPES: Scope[] = [
  {
    key: 'search',
    name: 'Search',
    read: 'Search members, teams, projects and events, and ask AI Search.',
  },
  {
    key: 'forum',
    name: 'Forum',
    read: 'Read threads and replies.',
    write: 'start threads and reply.',
    backendTag: 'Needs throttling',
  },
  {
    key: 'news',
    name: 'News feed',
    read: 'Read Home updates and your For You feed.',
    write: 'post news for your teams.',
    backendTag: 'Moved up: P0',
  },
  {
    key: 'directory',
    name: 'Members, teams and projects',
    read: 'Open profiles, team pages and projects.',
  },
  {
    key: 'jobs',
    name: 'Job board',
    read: 'Search open roles.',
    write: 'apply to roles with your profile.',
    backendTag: 'Write pending decision',
  },
  {
    key: 'events',
    name: 'Events',
    read: 'Browse events and who is going.',
    write: 'RSVP for you.',
  },
  {
    key: 'office-hours',
    name: 'Office hours',
    read: 'See who has office hours.',
    write: 'book office hours.',
    backendTag: 'Needs throttling',
  },
  {
    key: 'intros',
    name: 'Investors and warm intros',
    read: 'Look up investors and your warm-intro paths.',
    write: 'refresh an investor’s data from the web and Affinity, and add notes and feedback to your paths.',
    backendTag: 'Needs refresh tool (Vova)',
  },
  {
    key: 'profile',
    name: 'Your profile',
    read: 'Read your profile.',
    write: 'edit your profile.',
  },
  {
    key: 'ai-apps',
    name: 'AI Apps',
    read: 'Read feedback on your apps.',
    write: 'change the status of that feedback.',
  },
];

export type Lock = { reason: string; by: 'admin' | 'account' };

/**
 * Write locks. Admins switch endpoints off for everyone (booking has no
 * throttling yet); applying through an agent is never on for L0/L1 members or
 * job aspirants.
 */
export function getWriteLock(key: ScopeKey, viewer: Viewer): Lock | null {
  if (key === 'office-hours') return { by: 'admin', reason: 'Booking is off for everyone for now.' };
  if (key === 'jobs' && viewer === 'limited') {
    return { by: 'account', reason: 'Agents can apply to roles only for approved members.' };
  }
  return null;
}

/** The highest level a scope can be set to for this viewer. */
export function maxLevel(scope: Scope, viewer: Viewer): ScopeLevel {
  return scope.write && !getWriteLock(scope.key, viewer) ? 'write' : 'read';
}

export type Levels = Record<ScopeKey, ScopeLevel>;
export type Template = 'read' | 'write' | 'custom';

/** The two presets. Read and write stops at each feature's maximum, so locked writes stay Read. */
export function templateLevels(template: 'read' | 'write', viewer: Viewer): Levels {
  return Object.fromEntries(
    SCOPES.map((scope) => [scope.key, template === 'read' ? 'read' : maxLevel(scope, viewer)]),
  ) as Levels;
}

export function templateOf(levels: Levels, viewer: Viewer): Template {
  const same = (other: Levels) => SCOPES.every((scope) => levels[scope.key] === other[scope.key]);
  if (same(templateLevels('read', viewer))) return 'read';
  if (same(templateLevels('write', viewer))) return 'write';
  return 'custom';
}

/** Claude Code's access: mostly read, writes only where the member turned them on. */
export const mockScopeLevels: Levels = {
  search: 'read',
  forum: 'write',
  news: 'write',
  directory: 'read',
  jobs: 'read',
  events: 'read',
  'office-hours': 'read',
  intros: 'write',
  profile: 'read',
  'ai-apps': 'write',
};

/** read and change: done by the connection. sent: seen by other members. blocked: refused by permissions. */
export type ActionKind = 'read' | 'change' | 'sent' | 'blocked';

export type AgentAction = {
  id: string;
  at: string;
  text: string;
  kind: ActionKind;
  /** Blocked calls: the feature that needed write. */
  scope?: ScopeKey;
};

export type Agent = {
  uid: string;
  clientName: string;
  /** The account signed in on the client (its email), shown on every card (2026-10-27). Needs the client to share it. */
  account?: string;
  /** What this connection may do. Starts Read only on connect; changed per connection in Settings. */
  levels: Levels;
  /** The client's sign-in to LabOS expired; it can't call anything until the member reconnects from the client. */
  expired?: boolean;
  connectedAt: string;
  lastUsedAt: string | null;
  actions: AgentAction[];
};

export const SPIKE_TABLE_URL =
  'https://linear.app/protocollabs/document/spike-mcp-spike-table-of-all-user-actions-in-labos-with-mcp-coverage-a4a6b285352c';

export const mockServerUrl = 'https://directory-api.example.com/mcp';

/** How a connection is named everywhere: the client, plus its account email when there is one. */
export function agentName(agent: Pick<Agent, 'clientName' | 'account'>): string {
  return agent.account ? `${agent.clientName} · ${agent.account}` : agent.clientName;
}

export type AgentStatus = 'active' | 'idle' | 'unused' | 'expired';

/** Same mock clock as shared.tsx. */
const STATUS_NOW = new Date('2026-10-21T20:00:00Z').getTime();
const IDLE_AFTER_DAYS = 14;

/** Derived from what LabOS already knows: the sign-in, and when the client last called. */
export function agentStatus(agent: Pick<Agent, 'expired' | 'lastUsedAt'>): AgentStatus {
  if (agent.expired) return 'expired';
  if (!agent.lastUsedAt) return 'unused';
  const days = (STATUS_NOW - new Date(agent.lastUsedAt).getTime()) / 86_400_000;
  return days > IDLE_AFTER_DAYS ? 'idle' : 'active';
}

/** The same client twice: Claude.ai signed in with two different email accounts. */
export const mockClaudeAccounts: Agent[] = [
  {
    uid: 'agent-claude-ai-work',
    clientName: 'Claude.ai',
    account: 'alex.chen@gmail.com',
    levels: mockScopeLevels,
    connectedAt: '2026-10-08T09:30:00Z',
    lastUsedAt: '2026-10-21T18:10:00Z',
    actions: [
      { id: 'w1', at: '2026-10-21T18:10:00Z', kind: 'read', text: 'Searched members for "retrieval markets"' },
      {
        id: 'w2',
        at: '2026-10-21T18:02:00Z',
        kind: 'sent',
        text: 'Replied in the forum thread "Storage provider onboarding"',
      },
    ],
  },
  {
    uid: 'agent-claude-ai-personal',
    clientName: 'Claude.ai',
    account: 'alex@northwind.io',
    expired: true,
    levels: templateLevels('read', 'member'),
    connectedAt: '2026-10-19T20:15:00Z',
    lastUsedAt: '2026-10-20T21:40:00Z',
    actions: [{ id: 'q1', at: '2026-10-20T21:40:00Z', kind: 'read', text: 'Browsed events in Lisbon for November' }],
  },
];

export const mockAgents: Agent[] = [
  {
    uid: 'agent-claude-code',
    clientName: 'Claude Code',
    account: 'alex.chen@gmail.com',
    levels: mockScopeLevels,
    connectedAt: '2026-10-03T10:12:00Z',
    lastUsedAt: '2026-10-21T19:50:00Z',
    actions: [
      {
        id: 'c0',
        at: '2026-10-21T19:50:00Z',
        kind: 'blocked',
        scope: 'jobs',
        text: 'Tried to apply to Senior Rust Engineer at Arcadia Compute',
      },
      {
        id: 'c1',
        at: '2026-10-21T19:40:00Z',
        kind: 'change',
        text: 'Added a note to your warm-intro path to Halcyon Ventures',
      },
      { id: 'c2', at: '2026-10-21T19:31:00Z', kind: 'read', text: 'Searched members for "zero-knowledge proofs"' },
      {
        id: 'c3',
        at: '2026-10-21T15:02:00Z',
        kind: 'sent',
        text: 'Replied in the forum thread "Storage provider onboarding"',
      },
      { id: 'c4', at: '2026-10-20T11:15:00Z', kind: 'read', text: "Read this week's news from Northwind Storage" },
      {
        id: 'c5',
        at: '2026-10-20T11:12:00Z',
        kind: 'change',
        text: 'Marked feedback on your app "Deal Finder" as Done',
      },
      { id: 'c6', at: '2026-10-19T09:48:00Z', kind: 'read', text: 'Searched events in Lisbon for November' },
      { id: 'c7', at: '2026-10-18T17:20:00Z', kind: 'read', text: 'Read the forum thread "IPFS gateways in 2027"' },
      { id: 'c8', at: '2026-10-17T08:05:00Z', kind: 'sent', text: 'Posted team news for Northwind Storage' },
      { id: 'c9', at: '2026-10-16T16:40:00Z', kind: 'read', text: 'Looked up warm-intro paths to Arcadia Ventures' },
    ],
  },
  {
    uid: 'agent-codex',
    clientName: 'Codex',
    account: 'alex.chen@gmail.com',
    levels: templateLevels('read', 'member'),
    connectedAt: '2026-10-11T14:30:00Z',
    lastUsedAt: '2026-10-19T13:22:00Z',
    actions: [
      { id: 'x1', at: '2026-10-19T13:22:00Z', kind: 'read', text: 'Opened your member profile' },
      { id: 'x2', at: '2026-10-19T13:21:00Z', kind: 'read', text: 'Searched projects for "IPFS gateway"' },
      {
        id: 'x3',
        at: '2026-10-15T10:02:00Z',
        kind: 'blocked',
        scope: 'office-hours',
        text: 'Tried to book office hours with Lena Ortiz',
      },
      { id: 'x4', at: '2026-10-15T10:00:00Z', kind: 'read', text: 'Opened the project Lighthouse Indexer' },
    ],
  },
  {
    uid: 'agent-claude-ai',
    clientName: 'Claude.ai',
    account: 'alex.chen@gmail.com',
    levels: templateLevels('read', 'member'),
    connectedAt: '2026-10-20T16:45:00Z',
    lastUsedAt: null,
    actions: [],
  },
];

export type ClientKey = 'claude-code' | 'codex' | 'claude-ai' | 'other';

export type SetupStep = { text: string; code?: string; link?: { label: string; href: string } };

const CONSENT_STEP = 'Sign in to LabOS and approve. It starts with read-only access.';

export function getSetupSteps(client: ClientKey, serverUrl: string): SetupStep[] {
  switch (client) {
    case 'claude-code':
      return [
        { text: 'Run this in your terminal.', code: `claude mcp add --transport http labos ${serverUrl}` },
        { text: 'In Claude Code, run /mcp and choose "labos". Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
    case 'codex':
      return [
        { text: 'Run these in your terminal.', code: `codex mcp add labos --url ${serverUrl}\ncodex mcp login labos` },
        { text: 'Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
    case 'claude-ai':
      return [
        {
          text: 'In Claude, open Settings → Connectors → Add custom connector.',
          link: { label: 'Open Claude connectors', href: 'https://claude.ai/settings/connectors' },
        },
        { text: 'Name it "LabOS" and paste the LabOS MCP server URL. Select Add, then Connect.', code: serverUrl },
        { text: CONSENT_STEP },
      ];
    default:
      return [
        {
          text: 'Add a remote MCP server in your client (Cursor, ChatGPT and others) and paste the LabOS MCP server URL.',
          code: serverUrl,
        },
        { text: 'Sign in from your client. Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
  }
}

/**
 * A write the agent tried without access. LabOS refuses it and hands the agent
 * a link to a one-feature request page; the member approves there, never in
 * the agent. A locked feature gets no link: there is nothing to approve.
 */
export type AccessRequest = {
  id: string;
  agentUid: string;
  scope: ScopeKey;
  /** What the agent tried, in the member's words. */
  tried: string;
  /** The ask, read after "Let Codex …". */
  ask: string;
};

export const mockRequests: AccessRequest[] = [
  {
    id: 'req-forum',
    agentUid: 'agent-codex',
    scope: 'forum',
    tried: 'Post “Who is hiring Rust engineers for zk work?” in the Forum',
    ask: 'post in the Forum',
  },
  {
    id: 'req-news',
    agentUid: 'agent-claude-ai',
    scope: 'news',
    tried: 'Post team news for Northwind Storage',
    ask: 'post news for your teams',
  },
  {
    id: 'req-office-hours',
    agentUid: 'agent-codex',
    scope: 'office-hours',
    tried: 'Book office hours with Lena Ortiz',
    ask: 'book office hours',
  },
];

export const requestUrl = (id: string) => `labos.plnetwork.io/settings/mcp?request=${id}`;
