import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { McpQueryKeys } from '@/services/mcp/constants';
import { deleteMcpLimitOverride, fetchMcpAdminLimits, saveMcpLimitOverride } from '@/services/mcp/mcp.service';
import type { McpCallType } from '@/services/mcp/types';

/** Usage, recent limits and active overrides for directory admins (LAB-3150). */
export function useMcpAdminLimits(enabled: boolean, query: string) {
  return useQuery({
    queryKey: [McpQueryKeys.ADMIN_LIMITS, query],
    queryFn: () => fetchMcpAdminLimits(query),
    enabled,
    retry: 1,
  });
}

function useRefreshLimits() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [McpQueryKeys.ADMIN_LIMITS] });
    queryClient.invalidateQueries({ queryKey: [McpQueryKeys.LIMITS] });
  };
}

export function useSaveMcpLimitOverride() {
  const refresh = useRefreshLimits();
  return useMutation({
    mutationFn: (input: { memberUid: string; callType: McpCallType; limit: number; endsAt: string | null }) =>
      saveMcpLimitOverride(input.memberUid, { callType: input.callType, limit: input.limit, endsAt: input.endsAt }),
    onSuccess: refresh,
  });
}

export function useDeleteMcpLimitOverride() {
  const refresh = useRefreshLimits();
  return useMutation({
    mutationFn: (input: { memberUid: string; callType: McpCallType }) =>
      deleteMcpLimitOverride(input.memberUid, input.callType),
    onSuccess: refresh,
  });
}
