/**
 * Mock data for the LAB-2948 MCP settings prototype. Names are invented; no
 * real Directory member, team or thread is used.
 *
 * The features follow the MCP strategy decisions of 2026-10-23: news feed,
 * forum and search first, the job board as read-only search, forum posts and
 * office-hour bookings as read-write scopes that wait for the confirm of
 * LAB-2903. Sign-up and login are not in MCP, so they are not listed.
 */

/** Per feature: off, read-only or read-write (PostHog's API-key scope picker). */
export type Scope = 'off' | 'read' | 'write';

export type FeatureKey = 'news' | 'forum' | 'search' | 'jobs' | 'office-hours' | 'events';

export type Feature = {
  key: FeatureKey;
  title: string;
  /** What read-only gives. */
  read: string;
  /** What read-write adds. Absent: read-write is not offered for this feature yet. */
  write?: string;
  /** Read-write sends things to other people, so each one waits for the member's confirm (LAB-2903). */
  outward?: boolean;
  /** Short note under the feature, for example why read-write is not offered. */
  note?: string;
  /** An admin turned the feature off for every member. The member sees it, but cannot turn it on. */
  adminOff?: boolean;
};

export const FEATURES: Feature[] = [
  {
    key: 'news',
    title: 'News feed',
    read: 'Read the news feed and team news.',
    note: 'Read-only for now.',
  },
  {
    key: 'forum',
    title: 'Forum',
    read: 'Read and search forum threads.',
    write: 'Post and reply as you.',
    outward: true,
  },
  {
    key: 'search',
    title: 'Search',
    read: 'Search members, teams and projects.',
  },
  {
    key: 'jobs',
    title: 'Job board',
    read: 'Search job openings.',
    note: 'Search only. Agents cannot apply to jobs. The final job board permission is still open.',
  },
  {
    key: 'office-hours',
    title: 'Office hours',
    read: 'See open office-hour slots.',
    write: 'Book office hours as you.',
    outward: true,
  },
  {
    key: 'events',
    title: 'Events',
    read: 'Search events and see who goes.',
    write: 'RSVP to events as you.',
    adminOff: true,
  },
];

/** The highest scope a member can give a feature. */
export function maxScope(feature: Feature): Scope {
  if (feature.adminOff) return 'off';
  return feature.write ? 'write' : 'read';
}

export type Scopes = Record<FeatureKey, Scope>;

export type PresetKey = 'read' | 'write';

/** Permission templates: one click sets every feature, then the member can adjust each one. */
export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'read', label: 'Read-only' },
  { key: 'write', label: 'Read and write' },
];

export function presetScopes(preset: PresetKey): Scopes {
  return FEATURES.reduce((acc, feature) => {
    const max = maxScope(feature);
    acc[feature.key] = preset === 'read' && max === 'write' ? 'read' : max;
    return acc;
  }, {} as Scopes);
}

/** The preset that matches the scopes, or `null` when the member adjusted them (custom). */
export function presetOf(scopes: Scopes): PresetKey | null {
  return (
    PRESETS.map((p) => p.key).find((key) => {
      const target = presetScopes(key);
      return FEATURES.every((f) => scopes[f.key] === target[f.key]);
    }) ?? null
  );
}

/** read: the agent read something. sent / rejected: outward, after the member's answer. */
export type ActionKind = 'read' | 'change' | 'sent' | 'rejected';

export type AgentAction = {
  id: string;
  at: string;
  text: string;
  kind: ActionKind;
};

export type Agent = {
  uid: string;
  clientName: string;
  connectedAt: string;
  lastUsedAt: string | null;
  scopes: Scopes;
  actions: AgentAction[];
};

export type PendingAction = {
  id: string;
  agentUid: string;
  feature: FeatureKey;
  at: string;
  kind: string;
  text: string;
  preview: string;
};

export const mockServerUrl = 'https://directory-api.example.com/mcp';

export const mockAgents: Agent[] = [
  {
    uid: 'agent-claude-code',
    clientName: 'Claude Code',
    connectedAt: '2026-10-03T10:12:00Z',
    lastUsedAt: '2026-10-21T19:40:00Z',
    scopes: presetScopes('write'),
    actions: [
      { id: 'c1', at: '2026-10-21T19:40:00Z', kind: 'read', text: 'Read the news feed for this week' },
      { id: 'c2', at: '2026-10-21T19:31:00Z', kind: 'read', text: 'Searched members for "zero-knowledge proofs"' },
      {
        id: 'c3',
        at: '2026-10-21T15:02:00Z',
        kind: 'sent',
        text: 'Replied in the forum thread "Storage provider onboarding"',
      },
      { id: 'c4', at: '2026-10-20T11:15:00Z', kind: 'read', text: 'Opened the team page of Northwind Storage' },
      { id: 'c5', at: '2026-10-20T11:12:00Z', kind: 'sent', text: 'Booked office hours with Maya Chen for Oct 28' },
      { id: 'c6', at: '2026-10-19T09:48:00Z', kind: 'read', text: 'Searched projects for "proof aggregation"' },
      { id: 'c7', at: '2026-10-18T17:20:00Z', kind: 'read', text: 'Read the forum thread "IPFS gateways in 2027"' },
      { id: 'c8', at: '2026-10-17T08:05:00Z', kind: 'rejected', text: 'Reply in the forum thread "Retrieval markets"' },
      { id: 'c9', at: '2026-10-16T16:40:00Z', kind: 'read', text: 'Searched job openings for "Rust"' },
    ],
  },
  {
    uid: 'agent-codex',
    clientName: 'Codex',
    connectedAt: '2026-10-11T14:30:00Z',
    lastUsedAt: '2026-10-19T13:22:00Z',
    scopes: presetScopes('read'),
    actions: [
      { id: 'x1', at: '2026-10-19T13:22:00Z', kind: 'read', text: 'Read the news of the team Brightline Labs' },
      { id: 'x2', at: '2026-10-19T13:21:00Z', kind: 'read', text: 'Searched projects for "IPFS gateway"' },
      { id: 'x3', at: '2026-10-15T10:02:00Z', kind: 'read', text: 'Opened the project Lighthouse Indexer' },
    ],
  },
  {
    uid: 'agent-claude-app',
    clientName: 'Claude app',
    connectedAt: '2026-10-20T16:45:00Z',
    lastUsedAt: null,
    // Adjusted by the member after the template: no forum, no office hours.
    scopes: { ...presetScopes('read'), forum: 'off', 'office-hours': 'off' },
    actions: [],
  },
];

export const mockPending: PendingAction[] = [
  {
    id: 'p1',
    agentUid: 'agent-claude-code',
    feature: 'forum',
    at: '2026-10-21T19:44:00Z',
    kind: 'Forum reply',
    text: 'Reply in the forum thread "IPFS gateways in 2027"',
    preview:
      'We moved our gateway to a trustless setup last quarter. Latency went down by about a third. Happy to share the config.',
  },
  {
    id: 'p2',
    agentUid: 'agent-claude-code',
    feature: 'office-hours',
    at: '2026-10-21T19:50:00Z',
    kind: 'Office hours',
    text: 'Book office hours with Jordan Lee (Brightline Labs)',
    preview: 'Thu, Oct 30, 15:00 UTC, 30 min. Topic: "Prover costs for small storage providers".',
  },
];

export type ClientKey = 'claude-code' | 'codex' | 'claude-app' | 'other';

export type SetupStep = { text: string; code?: string; link?: { label: string; href: string } };

const CONSENT_STEP =
  'On the LabOS consent screen, choose a template: Read-only or Read and write. You can change each feature here later.';

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
    case 'claude-app':
      return [
        {
          text: 'In the Claude app (web, desktop or mobile), open Settings → Connectors and click "Add custom connector".',
          link: { label: 'Open Claude connectors', href: 'https://claude.ai/settings/connectors' },
        },
        { text: 'Name it "LabOS" and paste the server URL.' },
        { text: `Click "Connect". ${CONSENT_STEP}` },
      ];
    default:
      return [
        { text: 'Add a remote MCP server in your client (Cursor, ChatGPT and others) and paste the server URL.' },
        { text: 'Sign in from your client. Your browser opens LabOS.' },
        { text: CONSENT_STEP },
      ];
  }
}
