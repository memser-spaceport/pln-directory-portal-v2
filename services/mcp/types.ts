/**
 * MCP connections as the backend returns them (LAB-2995). Mirrors pln-directory-portal
 * `libs/contracts/src/schema/mcp-scopes.ts`.
 */
export type McpScopeKey = 'search' | 'forum' | 'news' | 'directory' | 'events' | 'investors' | 'ai_apps' | 'profile';

export type McpLevel = 'none' | 'read' | 'write';

export type McpConnectionStatus = 'active' | 'idle' | 'not_used' | 'signin_expired';

export type McpConnectionScope = {
  key: McpScopeKey;
  label: string;
  /** Effective level: the stored level capped by admins. */
  level: McpLevel;
  /** The highest level the member may set. */
  maxLevel: McpLevel;
  /** What the scope's tools allow before admin caps. */
  registryMax: McpLevel;
  /** `admin` when admins cap the scope below what its tools allow. */
  lock: 'admin' | null;
};

export type McpConnection = {
  uid: string;
  clientName: string;
  connectedAt: string;
  lastUsedAt: string | null;
  status: McpConnectionStatus;
  scopes: McpConnectionScope[];
};

export type McpAccessRequest = {
  uid: string;
  authorizationUid: string;
  scope: McpScopeKey;
  level: 'read' | 'write';
  toolName: string;
  status: 'open' | 'resolved' | 'expired';
  createdAt: string;
};

export type McpLevels = Partial<Record<McpScopeKey, McpLevel>>;
