import { useQuery } from '@tanstack/react-query';
import { McpQueryKeys } from '@/services/mcp/constants';
import { fetchMcpAccessRequest } from '@/services/mcp/mcp.service';

/** The access request behind `/settings/mcp?request=<id>`. Only runs with an id and `mcp.connect`. */
export function useMcpAccessRequest(uid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [McpQueryKeys.ACCESS_REQUEST, uid],
    queryFn: () => fetchMcpAccessRequest(uid as string),
    enabled: enabled && !!uid,
    retry: false,
    staleTime: Infinity,
  });
}
