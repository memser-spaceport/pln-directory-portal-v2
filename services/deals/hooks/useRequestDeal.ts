import { useMutation } from '@tanstack/react-query';
import { requestDeal, RequestDealPayload } from '../deals.service';
import { toast } from '@/components/core/ToastContainer';
import { useDealsAnalytics } from '@/analytics/deals.analytics';

export function useRequestDeal() {
  const { trackRequestSucceeded, trackRequestDealSubmitFailed } = useDealsAnalytics();

  return useMutation({
    mutationFn: (payload: RequestDealPayload) => requestDeal(payload),
    onSuccess: () => {
      trackRequestSucceeded();
    },
    onError: (error: Error) => {
      trackRequestDealSubmitFailed(error.message);
      toast.error('Something went wrong. Please try again.');
    },
  });
}
