import { useQuery } from '@tanstack/react-query';
import { McpQueryKeys } from '@/services/mcp/constants';
import { fetchMcpConnections } from '@/services/mcp/mcp.service';

/** The member's active MCP connections with status and scope levels (LAB-2995). Gate on `mcp.connect`. */
export function useMcpConnections(enabled: boolean) {
  return useQuery({
    queryKey: [McpQueryKeys.CONNECTIONS],
    queryFn: fetchMcpConnections,
    enabled,
    retry: 1,
  });
}
