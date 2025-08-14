import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';

export function useFixBrokenOfficeHoursLinkEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'broken_oh_link';

  const { onFixBrokenOfficeHoursLinkClicked } = useMemberAnalytics();

  useEffect(() => {
    if (reportedRef.current || !isCorrectSource) {
      return;
    }

    reportedRef.current = true;

    const searchParamsObj = {
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCode: searchParams.get('utm_code'),
      targetUid: searchParams.get('target_uid'),
      targetEmail: searchParams.get('target_email'),
    };

    onFixBrokenOfficeHoursLinkClicked(searchParamsObj);
  }, [isCorrectSource, onFixBrokenOfficeHoursLinkClicked, searchParams]);
}
