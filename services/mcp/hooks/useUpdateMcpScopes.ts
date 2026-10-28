import { useMutation, useQueryClient } from '@tanstack/react-query';
import { McpQueryKeys } from '@/services/mcp/constants';
import { updateMcpScopes } from '@/services/mcp/mcp.service';
import type { McpConnection, McpLevels } from '@/services/mcp/types';

type Params = { uid: string; levels: McpLevels; requestUid?: string };

/** One Save for a connection's permissions. Writes the returned connection into the list; no optimistic update. */
export function useUpdateMcpScopes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, levels, requestUid }: Params) => updateMcpScopes(uid, { levels, requestUid }),
    onSuccess: (updated) => {
      queryClient.setQueryData<McpConnection[]>([McpQueryKeys.CONNECTIONS], (list) =>
        list?.map((item) => (item.uid === updated.uid ? updated : item)),
      );
      queryClient.invalidateQueries({ queryKey: [McpQueryKeys.ACCESS_REQUEST] });
    },
  });
}
