'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import { PERMISSIONS } from '@/services/rbac/constants';

export type McpAccess = {
  canConnect: boolean;
  isLoading: boolean;
  isError: boolean;
};

export function useMcpAccess(): McpAccess {
  const userInfo = getUserInfoFromLocal();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['access-control-me', 'mcp'],
    queryFn: async () => {
      const access = await fetchMyAccess();
      const set = new Set(access.effectivePermissions ?? []);
      return { canConnect: set.has(PERMISSIONS.MCP.PERM_CONNECT) };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return {
    canConnect: data?.canConnect ?? false,
    isLoading,
    isError,
  };
}
