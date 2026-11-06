import { useMutation, useQueryClient } from '@tanstack/react-query';
import { McpQueryKeys } from '@/services/mcp/constants';
import { revokeMcpAuthorization } from '@/services/mcp/mcp.service';
import type { McpConnection } from '@/services/mcp/types';

export function useRevokeMcpConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uid: string) => {
      if (!(await revokeMcpAuthorization(uid))) {
        throw new Error('Failed to revoke MCP connection');
      }
      return uid;
    },
    onSuccess: (uid) => {
      queryClient.setQueryData<McpConnection[]>([McpQueryKeys.CONNECTIONS], (list) =>
        list?.filter((item) => item.uid !== uid),
      );
      // The Email & Accounts card (flag off) reads its own key.
      queryClient.invalidateQueries({ queryKey: ['mcp-authorizations'] });
    },
  });
}
