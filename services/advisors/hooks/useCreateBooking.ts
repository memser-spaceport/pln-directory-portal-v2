import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '../advisors.service';
import { AdvisorsQueryKeys } from '../constants';

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [AdvisorsQueryKeys.ADVISOR_BY_ID, variables.advisorId],
      });
    },
  });
}
