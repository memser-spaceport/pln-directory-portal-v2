import { useMutation } from '@tanstack/react-query';
import { submitDeal, SubmitDealPayload } from '../deals.service';
import { toast } from '@/components/core/ToastContainer';
import { useDealsAnalytics } from '@/analytics/deals.analytics';

export function useSubmitDeal(isPublicContext: boolean = false) {
  const { trackDealSubmitted, trackDealSubmitFailed } = useDealsAnalytics();

  return useMutation({
    mutationFn: (payload: SubmitDealPayload) => submitDeal(payload, !isPublicContext),
    onSuccess: () => {
      trackDealSubmitted();
      toast.success('Your deal has been submitted for review.');
    },
    onError: (error: Error) => {
      trackDealSubmitFailed(error.message);
      toast.error('Something went wrong. Please try again.');
    },
  });
}
