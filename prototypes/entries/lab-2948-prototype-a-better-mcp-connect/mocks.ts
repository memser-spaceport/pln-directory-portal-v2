/**
 * Mock data for the LAB-2948 MCP settings prototype. Names are invented; no
 * real Directory member, team or thread is used.
 */

export type AccessLevel = 'read' | 'write';

export type AgentAction = {
  id: string;
  at: string;
  text: string;
  /** Outward actions (intros, messages, posts) reach other people. */
  outward?: boolean;
};

export type Agent = {
  uid: string;
  clientName: string;
  connectedAt: string;
  lastUsedAt: string | null;
  access: AccessLevel;
  actions: AgentAction[];
};

export type PendingAction = {
  id: string;
  agentUid: string;
  at: string;
  kind: string;
  text: string;
  preview: string;
};

export const mockServerUrl = 'https://directory-api.example.com/mcp';

export const mockEmail = 'sam.rivera@example.com';

export const mockAgents: Agent[] = [
  {
    uid: 'agent-claude-code',
    clientName: 'Claude Code',
    connectedAt: '2026-10-03T10:12:00Z',
    lastUsedAt: '2026-10-21T19:40:00Z',
    access: 'write',
    actions: [
      { id: 'a1', at: '2026-10-21T19:40:00Z', text: 'Updated the bio on your profile' },
      { id: 'a2', at: '2026-10-21T19:31:00Z', text: 'Searched members for "zero-knowledge proofs"' },
      {
        id: 'a3',
        at: '2026-10-21T15:02:00Z',
        text: 'Sent an intro request to Jordan Lee (Brightline Labs)',
        outward: true,
      },
      { id: 'a4', at: '2026-10-20T11:15:00Z', text: 'Read the team page of Northwind Storage' },
      { id: 'a5', at: '2026-10-20T11:12:00Z', text: 'Added "Rust" to the skills on your profile' },
      { id: 'a6', at: '2026-10-19T09:48:00Z', text: 'Listed the events in Lisbon for November' },
      { id: 'a7', at: '2026-10-18T17:20:00Z', text: 'Read 3 forum threads in "Storage"' },
      { id: 'a8', at: '2026-10-17T08:05:00Z', text: 'Searched teams for "data availability"' },
    ],
  },
  {
    uid: 'agent-codex',
    clientName: 'Codex',
    connectedAt: '2026-10-11T14:30:00Z',
    lastUsedAt: '2026-10-19T13:22:00Z',
    access: 'read',
    actions: [
      { id: 'b1', at: '2026-10-19T13:22:00Z', text: 'Read your profile' },
      { id: 'b2', at: '2026-10-19T13:21:00Z', text: 'Searched projects for "IPFS gateway"' },
      { id: 'b3', at: '2026-10-15T10:02:00Z', text: 'Read the team page of Brightline Labs' },
    ],
  },
  {
    uid: 'agent-claude-ai',
    clientName: 'Claude.ai',
    connectedAt: '2026-10-20T16:45:00Z',
    lastUsedAt: null,
    access: 'read',
    actions: [],
  },
];

export const mockPending: PendingAction[] = [
  {
    id: 'p1',
    agentUid: 'agent-claude-code',
    at: '2026-10-21T19:44:00Z',
    kind: 'Intro request',
    text: 'Request an intro to Maya Chen (Arcadia Compute)',
    preview:
      'Hi Maya, I work on proof aggregation at Northwind and would like 20 minutes to compare notes on your prover work.',
  },
  {
    id: 'p2',
    agentUid: 'agent-claude-code',
    at: '2026-10-21T19:46:00Z',
    kind: 'Forum reply',
    text: 'Reply in the forum thread "IPFS gateways in 2027"',
    preview:
      'We moved our gateway to a trustless setup last quarter. Latency went down by about a third. Happy to share the config.',
  },
];

export type ClientKey = 'claude-code' | 'codex' | 'claude-ai' | 'other';

export type SetupStep = { text: string; code?: string };

export function getSetupSteps(client: ClientKey, serverUrl: string): SetupStep[] {
  switch (client) {
    case 'claude-code':
      return [
        { text: 'Run this command in your terminal.', code: `claude mcp add --transport http labos ${serverUrl}` },
        { text: 'In Claude Code, run /mcp and choose "labos". Your browser opens the LabOS consent screen.' },
        { text: 'On the consent screen, choose read-only or make-changes. You can change it here later.' },
      ];
    case 'codex':
      return [
        {
          text: 'Run these commands in your terminal.',
          code: `codex mcp add labos --url ${serverUrl}\ncodex mcp login labos`,
        },
        { text: 'Your browser opens the LabOS consent screen.' },
        { text: 'On the consent screen, choose read-only or make-changes. You can change it here later.' },
      ];
    case 'claude-ai':
      return [
        { text: 'In Claude.ai, open Settings → Connectors and click "Add custom connector".' },
        { text: 'Name it "LabOS" and paste this URL.', code: serverUrl },
        { text: 'Click "Connect". On the LabOS consent screen, choose read-only or make-changes.' },
      ];
    default:
      return [
        {
          text: 'Add an HTTP MCP server in your client with this URL. The client must support OAuth.',
          code: serverUrl,
        },
        { text: 'Start the login in your client. Your browser opens the LabOS consent screen.' },
        { text: 'On the consent screen, choose read-only or make-changes.' },
      ];
  }
}
