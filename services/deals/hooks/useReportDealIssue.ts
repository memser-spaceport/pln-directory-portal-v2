import { useMutation } from '@tanstack/react-query';
import { reportDealIssue } from '../deals.service';
import { toast } from '@/components/core/ToastContainer';

export function useReportDealIssue(dealUid: string) {
  return useMutation({
    mutationFn: (description: string) => reportDealIssue(dealUid, description),
    onSuccess: () => {
      toast.success('Thanks! We have received your request and will be in touch soon.');
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });
}
