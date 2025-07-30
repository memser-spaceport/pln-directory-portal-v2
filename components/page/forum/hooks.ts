import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForumAnalytics } from '@/analytics/forum.analytics';

export function useDigestEmailLinkEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'digest_email';

  const { onDigestEmailPostLinkClicked } = useForumAnalytics();

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

    onDigestEmailPostLinkClicked(searchParamsObj);
  }, [isCorrectSource, onDigestEmailPostLinkClicked, searchParams]);
}

export function useCommentNotificationEmailLinkEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'digest_email';

  const { onCommentNotificationEmailLinkClicked } = useForumAnalytics();

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

    onCommentNotificationEmailLinkClicked(searchParamsObj);
  }, [isCorrectSource, onCommentNotificationEmailLinkClicked, searchParams]);
}

export function useCommentNotificationEmailReplyEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'digest_email';

  const { onCommentNotificationEmailReplyClicked } = useForumAnalytics();

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

    onCommentNotificationEmailReplyClicked(searchParamsObj);
  }, [isCorrectSource, onCommentNotificationEmailReplyClicked, searchParams]);
}
