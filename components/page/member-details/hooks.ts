import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';

/* `utm_source` values the job board's refer and apply emails stamp on the
   profile links in their member cards — see `memberProfileEmailUrl` in the
   API's job-openings module. */
const JOB_EMAIL_UTM_SOURCES = ['job_referral_email', 'job_referral_notice_email', 'job_application_email'];

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

/**
 * A profile opened from a referral or application email. Without this the
 * referral funnel ends at `job-refer-succeeded` — the send — and a hiring lead
 * reading the candidate looks like any other profile view.
 */
export function useJobEmailProfileLinkEventCapture(memberUid: string) {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const utmSource = searchParams.get('utm_source');
  const isJobEmailSource = !!utmSource && JOB_EMAIL_UTM_SOURCES.includes(utmSource);

  const { onJobEmailProfileLinkClicked } = useJobsAnalytics();

  useEffect(() => {
    if (reportedRef.current || !isJobEmailSource || !memberUid) {
      return;
    }

    reportedRef.current = true;

    onJobEmailProfileLinkClicked({
      profile_member_uid: memberUid,
      job_id: searchParams.get('job_uid'),
      utm_source: utmSource as string,
      utm_content: searchParams.get('utm_content'),
    });
  }, [isJobEmailSource, memberUid, utmSource, onJobEmailProfileLinkClicked, searchParams]);
}
