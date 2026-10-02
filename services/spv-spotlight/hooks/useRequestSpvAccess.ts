import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SpvSpotlightQueryKeys } from '@/services/spv-spotlight/constants';
import { requestSpvAccess } from '@/services/spv-spotlight/spv-spotlight.service';
import type { SpvAccessRequestPayload } from '@/services/spv-spotlight/types';

export function useRequestSpvAccess(slug: string, authenticated: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SpvAccessRequestPayload) => requestSpvAccess(slug, payload, authenticated),
    // On success a signed-in requester is now PENDING; on a 409 the server's
    // viewerAccess is the answer. Either way, re-read it.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [SpvSpotlightQueryKeys.GET_SPOTLIGHT, slug] });
    },
  });
}
