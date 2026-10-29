'use client';

import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';
import { useMcpConnections } from '@/services/mcp/hooks/useMcpConnections';
import { SHOW_MCP_CONNECTIONS_PAGE } from '@/utils/mcp';

export type McpHintAudience = {
  /** Can use MCP today (`mcp.connect`: admins and PL infra) and the MCP connections page is on. */
  eligible: boolean;
  /** The connections have loaded, so `connectedClient` can be trusted. */
  ready: boolean;
  /** The client of the member's first connection (e.g. "Claude Code"), or null with no agent yet. */
  connectedClient: string | null;
};

/**
 * Who sees the MCP discovery hints (LAB-3033), and whether they already have an agent. Every hint links to
 * Settings → MCP connections, so they share that page's flag; connections are only asked for when eligible.
 */
export function useMcpHintAudience(): McpHintAudience {
  const { canConnect } = useMcpAccess();
  const eligible = SHOW_MCP_CONNECTIONS_PAGE && canConnect;
  const { data, isSuccess } = useMcpConnections(eligible);

  return {
    eligible,
    ready: eligible && isSuccess && data !== undefined,
    connectedClient: data?.[0]?.clientName ?? null,
  };
}
