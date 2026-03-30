import { useMutation } from '@tanstack/react-query';
import { requestDeal, RequestDealPayload } from '../deals.service';
import { toast } from '@/components/core/ToastContainer';
import { useDealsAnalytics } from '@/analytics/deals.analytics';

export function useRequestDeal() {
  const { trackRequestDealSubmitted, trackRequestDealSubmitFailed } = useDealsAnalytics();

  return useMutation({
    mutationFn: (payload: RequestDealPayload) => requestDeal(payload),
    onSuccess: () => {
      trackRequestDealSubmitted();
      toast.success("Your request has been submitted. We'll use it to prioritize new deals.");
    },
    onError: (error: Error) => {
      trackRequestDealSubmitFailed(error.message);
      toast.error('Something went wrong. Please try again.');
    },
  });
}
