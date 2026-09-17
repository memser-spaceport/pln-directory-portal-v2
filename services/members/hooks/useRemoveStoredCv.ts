import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { removeStoredCv } from '@/services/members/cv-import.service';

/**
 * Removes the stored CV and puts the upload offer back.
 *
 * **Only the CV's own keys are invalidated.** Removing the document does not
 * touch the role, skills or experience it once filled — those are ordinary
 * profile fields by now, nothing records that a document put them there, and the
 * member may have edited them since. Invalidating the member here would be
 * harmless but would misdescribe the operation to the next person reading it.
 */
export function useRemoveStoredCv(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeStoredCv(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MembersQueryKeys.GET_STORED_CV, uid] });
    },
  });
}
