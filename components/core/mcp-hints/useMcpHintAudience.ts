'use client';

import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';
import { useMcpConnections } from '@/services/mcp/hooks/useMcpConnections';
import type { McpLevel } from '@/services/mcp/types';
import { SHOW_MCP_CONNECTIONS_PAGE } from '@/utils/mcp';

export type McpHintAudience = {
  /** Can use MCP today (`mcp.connect`: admins and PL infra) and the MCP connections page is on. */
  eligible: boolean;
  /** The connections have loaded, so `connectedClient` can be trusted. */
  ready: boolean;
  /** The member has at least one connection. */
  connected: boolean;
  /**
   * The display name of the first connection's client (e.g. "Claude Code"), or null when there is none or the client
   * sent no name (LAB-3049: then the hints say "your agent"). Never use it to tell whether the member is connected.
   */
  connectedClient: string | null;
  /** The first connection's uid (LAB-3136: the AI Apps hint's "Allow changes" opens its permissions), or null. */
  connectionUid: string | null;
  /** The first connection's effective `ai_apps` level; `none` when it has no such scope, null when not connected. */
  aiAppsLevel: McpLevel | null;
};

/**
 * Who sees the MCP discovery hints (LAB-3033), and whether they already have an agent. Every hint links to
 * Settings → MCP connections, so they share that page's flag; connections are only asked for when eligible.
 */
export function useMcpHintAudience(): McpHintAudience {
  const { canConnect } = useMcpAccess();
  const eligible = SHOW_MCP_CONNECTIONS_PAGE && canConnect;
  const { data, isSuccess } = useMcpConnections(eligible);

  const first = data?.[0];
  return {
    eligible,
    ready: eligible && isSuccess && data !== undefined,
    connected: !!first,
    connectedClient: first?.clientName?.trim() || null,
    connectionUid: first?.uid ?? null,
    aiAppsLevel: first ? (first.scopes?.find((scope) => scope.key === 'ai_apps')?.level ?? 'none') : null,
  };
}
