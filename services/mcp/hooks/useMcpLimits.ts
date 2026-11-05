import { useQuery } from '@tanstack/react-query';
import { McpQueryKeys } from '@/services/mcp/constants';
import { fetchMcpLimits } from '@/services/mcp/mcp.service';

/** The member's MCP limits and current usage (LAB-3151). Gate on `mcp.connect`. */
export function useMcpLimits(enabled: boolean) {
  return useQuery({
    queryKey: [McpQueryKeys.LIMITS],
    queryFn: fetchMcpLimits,
    enabled,
    retry: 1,
  });
}
