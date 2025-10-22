import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForumAnalytics } from '@/analytics/forum.analytics';

export function useDigestEmailLinkEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'digest_email_post_link';

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
      category_id: searchParams.get('category_id'),
      post_id: searchParams.get('post_id'),
      topic_id: searchParams.get('topic_id'),
    };

    onDigestEmailPostLinkClicked(searchParamsObj);
  }, [isCorrectSource, onDigestEmailPostLinkClicked, searchParams]);
}

export function useCommentNotificationEmailLinkEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'notification_email_link';

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
      category_id: searchParams.get('category_id'),
      post_id: searchParams.get('post_id'),
      topic_id: searchParams.get('topic_id'),
    };

    onCommentNotificationEmailLinkClicked(searchParamsObj);
  }, [isCorrectSource, onCommentNotificationEmailLinkClicked, searchParams]);
}

export function useCommentNotificationEmailReplyEventCapture() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isCorrectSource = searchParams.get('utm_source') === 'notification_email_reply';

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
      category_id: searchParams.get('category_id'),
      post_id: searchParams.get('post_id'),
      topic_id: searchParams.get('topic_id'),
    };

    onCommentNotificationEmailReplyClicked(searchParamsObj);
  }, [isCorrectSource, onCommentNotificationEmailReplyClicked, searchParams]);
}
