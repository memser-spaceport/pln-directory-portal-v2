import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';

export function useFixBrokenOfficeHoursLinkEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'oh_broken_link_fixed';

  const { onFixBrokenOfficeHoursLinkClicked } = useMemberAnalytics();

  useEffect(() => {
    if (reportedRef.current || !isCorrectSource) {
      return;
    }

    reportedRef.current = true;

    const searchParamsObj = {
      utmSource: searchParams.get('utm_source'),
      targetUid: searchParams.get('target_uid'),
      targetEmail: searchParams.get('target_email'),
      requesterUid: searchParams.get('requester_uid'),
      requesterEmail: searchParams.get('requester_email'),
    };

    onFixBrokenOfficeHoursLinkClicked(searchParamsObj);
  }, [isCorrectSource, onFixBrokenOfficeHoursLinkClicked, searchParams]);
}

export function useBrokenOfficeHoursLinkBookAttemptEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'oh_broken_link_book_attempt';

  const { onBrokenOfficeHoursLinkBookAttemptClicked } = useMemberAnalytics();

  useEffect(() => {
    if (reportedRef.current || !isCorrectSource) {
      return;
    }

    reportedRef.current = true;

    const searchParamsObj = {
      utmSource: searchParams.get('utm_source'),
      targetUid: searchParams.get('target_uid'),
      targetEmail: searchParams.get('target_email'),
      requesterUid: searchParams.get('requester_uid'),
      requesterEmail: searchParams.get('requester_email'),
    };

    onBrokenOfficeHoursLinkBookAttemptClicked(searchParamsObj);
  }, [isCorrectSource, onBrokenOfficeHoursLinkBookAttemptClicked, searchParams]);

  return {
    forceEditMode: isCorrectSource,
  };
}
