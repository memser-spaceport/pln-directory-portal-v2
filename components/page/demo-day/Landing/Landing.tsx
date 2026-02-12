'use client';
import { clsx } from 'clsx';
import Cookies from 'js-cookie';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

import { getParsedValue } from '@/utils/common.utils';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import LoginBtn from '@/components/core/navbar/login-btn';
import { LandingBase } from '@/components/page/demo-day/LandingBase';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { IUserInfo } from '@/types/shared.types';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { ApplyForDemoDayModal } from '@/components/page/demo-day/ApplyForDemoDayModal';
import { AccountCreatedSuccessModal } from '@/components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal';
import { DemoDayInfoRow } from '@/components/common/DemoDayInfoRow';
import { CountdownComponent } from '@/components/common/Countdown';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';

import s from './Landing.module.scss';

export function Landing({ initialDemoDayState }: { initialDemoDayState?: DemoDayState }) {
  const { data, isLoading } = useGetDemoDayState(initialDemoDayState);
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const params = useParams();
  const searchParams = useSearchParams();
  const demoDaySlug = params?.demoDayId as string;
  const showCountdown =
    data?.status === 'UPCOMING' || data?.status === 'REGISTRATION_OPEN' || data?.status === 'EARLY_ACCESS';

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<{ uid: string; isNew: boolean; email: string } | null>(null);

  // Auto-open modal if dialog=applyToDemoday query param is present
  useEffect(() => {
    if (searchParams.get('dialog') === 'applyToDemoday') {
      setIsApplyModalOpen(true);
    }
  }, [searchParams]);

  // Analytics hooks
  const { onLandingRequestInviteButtonClicked, onLandingInvestorProfileLinkClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics('onLandingPageOpened', DEMO_DAY_ANALYTICS.ON_LANDING_PAGE_OPENED, '/demoday', {
    demoDayTitle: data?.title,
    demoDayDate: data?.date,
    demoDayStatus: data?.status,
    isLoggedIn: !!userInfo,
  });

  // Time on page tracking (analytics/track only, no PostHog)
  useTimeOnPage({
    onTimeReport: (timeSpent, sessionId) => {
      // Custom analytics event only (no PostHog)
      const timeOnPageEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_LANDING_TIME_ON_PAGE,
        distinctId: userInfo?.email || 'anonymous',
        properties: {
          userId: userInfo?.uid || null,
          userEmail: userInfo?.email || null,
          userName: userInfo?.name || null,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          timeSpent: timeSpent,
          eventId: sessionId,
          demoDayTitle: data?.title,
          isLoggedIn: !!userInfo,
        },
      };

      reportAnalytics.mutate(timeOnPageEvent);
    },
    reportInterval: 30000, // Report every 30 seconds
  });

  const handleApplyClick = () => {
    // PostHog analytics
    onLandingRequestInviteButtonClicked();

    // Custom analytics event
    const requestInviteEvent: TrackEventDto = {
      name: DEMO_DAY_ANALYTICS.ON_LANDING_REQUEST_INVITE_BUTTON_CLICKED,
      distinctId: userInfo?.email || 'anonymous',
      properties: {
        userId: userInfo?.uid || null,
        userEmail: userInfo?.email || null,
        userName: userInfo?.name || null,
        path: '/demoday',
        timestamp: new Date().toISOString(),
        demoDayTitle: data?.title,
        isLoggedIn: !!userInfo,
      },
    };

    reportAnalytics.mutate(requestInviteEvent);

    setIsApplyModalOpen(true);
  };

  const handleClose = useCallback(() => setShowSuccessModal(null), []);
  const handleCloseApply = useCallback(() => setIsApplyModalOpen(false), []);
  const handleSuccess = useCallback(
    (res: { uid: string; isNew: boolean; email: string }) => setShowSuccessModal(res),
    [],
  );

  // Show skeleton loader while loading
  if (isLoading || !data) {
    return <DemoDayPageSkeleton />;
  }

  if (data.access !== 'none') {
    window.location.reload();
  }

  return (
    <>
      <LandingBase
        initialDemoDayState={initialDemoDayState}
        countdown={
          showCountdown && (
            <CountdownComponent targetDate={data?.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
          )
        }
        information={
          <DemoDayInfoRow
            approximateStartDate={data?.approximateStartDate}
            date={data?.date}
            teamsCount={data?.teamsCount}
            investorsCount={data?.investorsCount}
            showInvestorsLink={true}
          />
        }
        hideLogos={demoDaySlug === 'pl-genesis-accelerator'}
      >
        <div>
          <div className={s.root}>
            {!userInfo && <LoginBtn className={clsx(s.btn, s.secondaryButton)}>Already applied? Log in</LoginBtn>}
            <button className={clsx(s.btn, s.primaryButton)} onClick={handleApplyClick} disabled={data?.isPending}>
              {data?.isPending ? (
                <>
                  You have applied <CheckIcon />
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
          {!!data?.isPending && userInfo?.accessLevel === 'L0' && (
            <div className={s.pendingText}>
              Complete your{' '}
              <Link
                href={`/members/${userInfo.uid}`}
                className={s.link}
                onClick={() => {
                  // PostHog analytics
                  onLandingInvestorProfileLinkClicked({
                    demoDayTitle: data?.title,
                    demoDayDate: data?.date,
                    demoDayStatus: data?.status,
                  });

                  // Custom analytics event
                  if (userInfo?.email) {
                    const investorProfileLinkEvent: TrackEventDto = {
                      name: DEMO_DAY_ANALYTICS.ON_LANDING_INVESTOR_PROFILE_LINK_CLICKED,
                      distinctId: userInfo.email,
                      properties: {
                        userId: userInfo.uid,
                        userEmail: userInfo.email,
                        userName: userInfo.name,
                        path: '/demoday',
                        timestamp: new Date().toISOString(),
                        demoDayTitle: data?.title,
                        demoDayDate: data?.date,
                        demoDayStatus: data?.status,
                        isLoggedIn: !!userInfo,
                      },
                    };

                    reportAnalytics.mutate(investorProfileLinkEvent);
                  }
                }}
              >
                investor profile
              </Link>{' '}
              to join Demo Day
            </div>
          )}
        </div>
      </LandingBase>

      {demoDaySlug && (
        <ApplyForDemoDayModal
          isOpen={isApplyModalOpen && !data?.isPending}
          onClose={handleCloseApply}
          userInfo={userInfo}
          memberData={null}
          demoDaySlug={demoDaySlug}
          demoDayData={data}
          onSuccessUnauthenticated={handleSuccess}
        />
      )}

      <AccountCreatedSuccessModal
        isOpen={!!showSuccessModal}
        onClose={handleClose}
        isNew={showSuccessModal?.isNew}
        userInfo={userInfo}
        uid={showSuccessModal?.uid}
        email={showSuccessModal?.email}
        demoDayState={data}
      />
    </>
  );
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3332 4L5.99984 11.3333L2.6665 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
