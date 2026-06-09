import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import { reviewFounder } from '../founders.service';
import { FoundersQueryKeys } from '../constants';
import type { ReviewFounderPayload } from '../types';

export function useReviewFounder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewFounderPayload }) => reviewFounder(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [FoundersQueryKeys.FOUNDERS_LIST] });
      queryClient.invalidateQueries({ queryKey: [FoundersQueryKeys.FOUNDER_DETAIL, id] });
      toast.success('Review saved');
    },
    onError: () => {
      toast.error('Failed to save review. Please try again.');
    },
  });
}
