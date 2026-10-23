/**
 * Mock data for the LAB-2948 MCP settings prototype. Names are invented; no
 * real Directory member, team or thread is used.
 *
 * The actions are real LabOS actions from the LAB-2944 spike table: reads and
 * changes use tools the MCP server has today (search_members, get_team,
 * get_forum_thread, search_events, get_warm_intro_investor, submit_warm_path_note,
 * update_ai_app_feedback_status). The outward ones (forum reply 13.6, team news
 * 4.14, job application 6.6) are proposed in the spike and wait for the confirm
 * of LAB-2903.
 */

export type AccessLevel = 'read' | 'write';

/** read and change: done by the agent. sent / rejected: outward, after the member's answer. */
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

export const SPIKE_TABLE_URL =
  'https://linear.app/protocollabs/document/spike-mcp-spike-table-of-all-user-actions-in-labos-with-mcp-coverage-a4a6b285352c';

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
      { id: 'c4', at: '2026-10-20T11:15:00Z', kind: 'read', text: 'Opened the team page of Northwind Storage' },
      {
        id: 'c5',
        at: '2026-10-20T11:12:00Z',
        kind: 'change',
        text: 'Marked feedback on your app "Deal Finder" as Done',
      },
      { id: 'c6', at: '2026-10-19T09:48:00Z', kind: 'read', text: 'Searched events in Lisbon for November' },
      { id: 'c7', at: '2026-10-18T17:20:00Z', kind: 'read', text: 'Read the forum thread "IPFS gateways in 2027"' },
      { id: 'c8', at: '2026-10-17T08:05:00Z', kind: 'rejected', text: 'Post team news for Northwind Storage' },
      { id: 'c9', at: '2026-10-16T16:40:00Z', kind: 'read', text: 'Looked up warm-intro paths to Arcadia Ventures' },
    ],
  },
  {
    uid: 'agent-codex',
    clientName: 'Codex',
    connectedAt: '2026-10-11T14:30:00Z',
    lastUsedAt: '2026-10-19T13:22:00Z',
    access: 'read',
    actions: [
      { id: 'x1', at: '2026-10-19T13:22:00Z', kind: 'read', text: 'Opened your member profile' },
      { id: 'x2', at: '2026-10-19T13:21:00Z', kind: 'read', text: 'Searched projects for "IPFS gateway"' },
      { id: 'x3', at: '2026-10-15T10:02:00Z', kind: 'read', text: 'Opened the project Lighthouse Indexer' },
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
    kind: 'Forum reply',
    text: 'Reply in the forum thread "IPFS gateways in 2027"',
    preview:
      'We moved our gateway to a trustless setup last quarter. Latency went down by about a third. Happy to share the config.',
  },
  {
    id: 'p2',
    agentUid: 'agent-claude-code',
    at: '2026-10-21T19:46:00Z',
    kind: 'Team news',
    text: 'Post team news for Northwind Storage',
    preview: 'Northwind Storage 2.4 is out. Retrieval is 30% faster, and providers can now set their own prices.',
  },
  {
    id: 'p3',
    agentUid: 'agent-claude-code',
    at: '2026-10-21T19:50:00Z',
    kind: 'Job application',
    text: 'Apply to Senior Rust Engineer at Arcadia Compute',
    preview:
      'Sends your profile and CV with this note: "I built the proof pipeline at Northwind and want to work on provers."',
  },
];

export type ClientKey = 'claude-code' | 'codex' | 'claude-ai' | 'other';

export type SetupStep = { text: string; code?: string; link?: { label: string; href: string } };

const CONSENT_STEP = 'On the LabOS consent screen, choose Read-only or Make changes.';

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
          text: 'In Claude.ai, open Connectors and click "Add custom connector".',
          link: { label: 'Open Claude.ai connectors', href: 'https://claude.ai/settings/connectors' },
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
