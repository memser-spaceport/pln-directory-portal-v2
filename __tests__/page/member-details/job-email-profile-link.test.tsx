import { renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const onJobEmailProfileLinkClicked = jest.fn();
jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobEmailProfileLinkClicked: (...args: unknown[]) => onJobEmailProfileLinkClicked(...args),
  }),
}));
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({
    onFixBrokenOfficeHoursLinkClicked: jest.fn(),
    onBrokenOfficeHoursLinkBookAttemptClicked: jest.fn(),
  }),
}));

import { useJobEmailProfileLinkEventCapture } from '@/components/page/member-details/hooks';

const setUrl = (search: string) => window.history.replaceState({}, '', `/members/member-1${search}`);

beforeEach(() => jest.clearAllMocks());

describe('useJobEmailProfileLinkEventCapture', () => {
  it('reports a referred person opened from the referral email', () => {
    setUrl('?utm_source=job_referral_email&utm_medium=email&utm_content=referred&job_uid=job-1');

    renderHook(() => useJobEmailProfileLinkEventCapture('member-1'));

    expect(onJobEmailProfileLinkClicked).toHaveBeenCalledWith({
      profile_member_uid: 'member-1',
      job_id: 'job-1',
      utm_source: 'job_referral_email',
      utm_content: 'referred',
    });
  });

  it('reports an applicant opened from the application email', () => {
    setUrl('?utm_source=job_application_email&utm_medium=email&utm_content=applicant&job_uid=job-1');

    renderHook(() => useJobEmailProfileLinkEventCapture('member-1'));

    expect(onJobEmailProfileLinkClicked).toHaveBeenCalledWith(
      expect.objectContaining({ utm_source: 'job_application_email', utm_content: 'applicant' }),
    );
  });

  it('fires once, not on every render', () => {
    setUrl('?utm_source=job_referral_email&utm_content=referrer&job_uid=job-1');

    const { rerender } = renderHook(() => useJobEmailProfileLinkEventCapture('member-1'));
    rerender();
    rerender();

    expect(onJobEmailProfileLinkClicked).toHaveBeenCalledTimes(1);
  });

  it('says nothing on a profile reached any other way', () => {
    setUrl('?utm_source=recommendations');

    renderHook(() => useJobEmailProfileLinkEventCapture('member-1'));

    expect(onJobEmailProfileLinkClicked).not.toHaveBeenCalled();
  });
});
