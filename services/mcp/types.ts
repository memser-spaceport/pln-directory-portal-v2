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

/** Mirrors `libs/contracts/src/schema/mcp-limits.ts` in pln-directory-portal. */
export type McpCallType = 'read' | 'contact_read' | 'write' | 'forum_post';

export type McpLimitTier = 'standard' | 'pl_infra';

export type McpLimitRow = {
  callType: McpCallType;
  label: string;
  used: number | null;
  limit: number;
  resetsAt: string;
  window: 'hour' | 'day';
  tier: McpLimitTier;
  override: { limit: number; endsAt: string | null } | null;
  hitRecently: boolean;
  lastHitAt: string | null;
};

export type McpMemberLimits = {
  tier: McpLimitTier;
  limits: McpLimitRow[];
};

export type McpAdminLimitCallType = {
  callType: McpCallType;
  label: string;
  standardLimit: number;
  infraLimit: number;
  window: 'hour' | 'day';
};

export type McpAdminLimits = {
  callTypes: McpAdminLimitCallType[];
  recentHits: Array<{
    memberUid: string;
    memberName: string | null;
    email: string | null;
    callType: McpCallType;
    hitAt: string;
    resetsAt: string;
  }>;
  overrides: Array<{
    memberUid: string;
    memberName: string | null;
    email: string | null;
    callType: McpCallType;
    limit: number;
    endsAt: string | null;
    updatedAt: string;
    updatedByUid: string | null;
  }>;
  changes: Array<{
    memberUid: string;
    callType: string;
    action: string;
    limit: number | null;
    endsAt: string | null;
    actorUid: string | null;
    createdAt: string;
  }>;
  members: Array<{
    uid: string;
    name: string | null;
    email: string | null;
    tier: McpLimitTier;
    limits: McpLimitRow[];
  }>;
};
