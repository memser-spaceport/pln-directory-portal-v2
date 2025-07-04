import { useSearchParams } from 'next/navigation';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { useEffect, useRef } from 'react';
import { useMemberAnalytics } from '@/analytics/members.analytics';

export function useMemberApprovalEvents() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isFromApprovalMail = searchParams.get('utm_source') === 'member_approval';

  const { onExplorePlNetworkCLicked } = useMemberAnalytics();

  useEffect(() => {
    if (reportedRef.current) {
      return;
    }

    if (!isFromApprovalMail) {
      return;
    }

    reportedRef.current = true;

    const searchParamsObj = {
      utmSource: searchParams.get('utm_source'),
      targetUid: searchParams.get('target_uid'),
      targetEmail: searchParams.get('target_email'),
    };

    onExplorePlNetworkCLicked(searchParamsObj);
  }, [isFromApprovalMail, onExplorePlNetworkCLicked, searchParams]);
}
