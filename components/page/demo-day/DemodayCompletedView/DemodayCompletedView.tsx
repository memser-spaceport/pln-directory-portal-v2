'use client';

import Link from 'next/link';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';

import { Button } from '@/components/common/Button';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';

import {
  faqCompletedItems,
  PRIVACY_POLICY_URL,
  TERMS_AND_CONDITIONS_URL,
  isNetworkPartnerDemoDaySlug,
  NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER,
} from '@/app/constants/demoday';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { FeedbackDialog } from './components/FeedbackDialog';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

import { IUserInfo } from '@/types/shared.types';
import { toast } from '@/components/core/ToastContainer';
import { useGetDemoDaysList } from '@/services/demo-day/hooks/useGetDemoDaysList';
import { ApplyForDemoDayModal } from '@/components/page/demo-day/ApplyForDemoDayModal';
import { AccountCreatedSuccessModal } from '@/components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';
import { isDemoDayParticipantInvestor } from '@/utils/member.utils';
import { ChartIcon } from '@/components/icons';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';

import { ChatIcon, EditIcon, ArrowRight } from './components/Icons';
import { CompletedDemoDayTeamsList } from './components/CompletedDemoDayTeamsList';

import s from './DemodayCompletedView.module.scss';

interface DemodayCompletedViewProps {
  initialDemoDayState?: DemoDayState;
  isLoggedIn?: boolean;
  userInfo?: IUserInfo;
}

export const DemodayCompletedView: React.FC<DemodayCompletedViewProps> = (props) => {
  const { userInfo, isLoggedIn, initialDemoDayState } = props;

  const searchParams = useSearchParams();
  const params = useParams();
  const demoDayId = params.demoDayId as string;
  const showFeedbackOption =
    isLoggedIn && initialDemoDayState?.access && isDemoDayParticipantInvestor(initialDemoDayState?.access);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<{ uid: string; isNew: boolean; email: string } | null>(null);
  const isFounder = initialDemoDayState?.access?.toUpperCase() === 'FOUNDER';
  const supportEmail = initialDemoDayState?.supportEmail ?? 'pldemoday@protocol.ai';
  const isNetworkPartnerDemoDay = isNetworkPartnerDemoDaySlug(initialDemoDayState?.slugURL);
  const { data: fundraisingProfile } = useGetFundraisingProfile(isFounder);
  const showAnalyticsReportOption = isFounder && fundraisingProfile?.analyticsReportUrl;

  const {
    onCompletedViewApplyForNextDemoDayClicked,
    onCompletedViewGiveFeedbackClicked,
    onCompletedViewKeepProfileUpdatedClicked,
    onCompletedViewShowMoreTeamsClicked,
  } = useDemoDayAnalytics();

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics(
    'onCompletedViewPageOpened',
    DEMO_DAY_ANALYTICS.ON_COMPLETED_VIEW_PAGE_OPENED,
    '/demoday/completed',
    {
      demoDayTitle: initialDemoDayState?.title,
      demoDayDate: initialDemoDayState?.date,
      demoDayStatus: initialDemoDayState?.status,
      teamsCount: initialDemoDayState?.teamsCount,
      investorsCount: initialDemoDayState?.investorsCount,
    },
  );

  // Fetch demo days list
  const { data: demoDays, isLoading } = useGetDemoDaysList();

  // Auto-open modal if dialog=applyToDemoday query param is present
  useEffect(() => {
    if (searchParams.get('dialog') === 'applyToDemoday') {
      setIsApplyModalOpen(true);
    }
  }, [searchParams]);

  // Find next demo day with REGISTRATION_OPEN or ACTIVE status
  const nextDemoDay = useMemo(() => {
    if (!demoDays) return null;

    // First try to find REGISTRATION_OPEN
    const registrationOpen = demoDays.find((dd) => dd.status === 'REGISTRATION_OPEN');
    if (registrationOpen) return registrationOpen;

    // If not found, try to find ACTIVE
    const active = demoDays.find((dd) => dd.status === 'ACTIVE');
    return active || null;
  }, [demoDays]);

  const handleFeedbackSuccess = () => {
    // You can add a success toast notification here if needed
    toast.success('Feedback submitted successfully!');
  };

  const handleApplyForNextDemoDayClick = () => {
    onCompletedViewApplyForNextDemoDayClicked();
  };

  const handleGiveFeedbackClick = () => {
    onCompletedViewGiveFeedbackClicked();
    setIsFeedbackDialogOpen(true);
  };

  const handleKeepProfileUpdatedClick = () => {
    onCompletedViewKeepProfileUpdatedClicked();
  };

  // Show skeleton loader while loading
  if (isLoading) {
    return <DemoDayPageSkeleton />;
  }

  return (
    <div className={s.root}>
      <div className={s.content}>
        {/* Hero Section */}
        <section className={s.heroSection}>
          <div className={s.titleContainer}>
            <div className={s.overline}>
              <div className={s.badge}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="3.5" fill="#455468" />
                </svg>
                <span className={s.overlineText}>Completed</span>
              </div>
            </div>
            <div className={s.headline}>
              <h1 className={s.title}>{initialDemoDayState?.title}</h1>
              <p className={s.body} dangerouslySetInnerHTML={{ __html: initialDemoDayState?.description || '' }} />
            </div>
          </div>

          <div className={s.buttons}>
            <div className={s.linksWrapper}>
              {showAnalyticsReportOption && (
                <Link
                  className={s.linkAnalytics}
                  href={`/demoday/${demoDayId}/analytics-report/${fundraisingProfile.teamUid}`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                >
                  Your Demo Day Stats <ChartIcon />
                </Link>
              )}
              {!showAnalyticsReportOption && (
                <Link href="/demoday" onClick={handleApplyForNextDemoDayClick}>
                  <Button size="l" style="fill" variant="primary">
                    View all Demo Days <ArrowRight />
                  </Button>
                </Link>
              )}
            </div>

            <div className={s.links}>
              {showFeedbackOption && (
                <button onClick={handleGiveFeedbackClick} className={s.linkButton}>
                  Give Feedback <ChatIcon />
                </button>
              )}
              {showAnalyticsReportOption && (
                <Link href="/demoday" onClick={handleApplyForNextDemoDayClick} className={s.linkButton}>
                  View all Demo Days <ArrowRight width={16} height={16} color="#1b4dff" />
                </Link>
              )}
              {isLoggedIn && userInfo && (
                <Link
                  target="_blank"
                  href={`/members/${userInfo?.uid}?backTo=/demoday/completed`}
                  className={s.linkButton}
                  onClick={handleKeepProfileUpdatedClick}
                >
                  Keep your profile updated <EditIcon />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/*/!* Demo Days Timeline Section *!/*/}
        {/*<section className={s.sectionTimeline}>*/}
        {/*  <div className={s.statusBadge} data-status="upcoming">*/}
        {/*    Upcoming*/}
        {/*  </div>*/}
        {/*  <h3 className={s.timelineTitle}>PL_Genesis Accelerator Demo Day · January 2026</h3>*/}
        {/*  <p className={s.timelineDescription}>*/}
        {/*    Explore 10 pioneering teams asynchronously after they live pitch at{' '}*/}
        {/*    <a*/}
        {/*      href={FOUNDERS_FORGE_URL}*/}
        {/*      target="_blank"*/}
        {/*      rel="noopener noreferrer"*/}
        {/*      className={s.timelineDescriptionLink}*/}
        {/*    >*/}
        {/*      Build Week in UAE*/}
        {/*    </a>*/}
        {/*    .*/}
        {/*  </p>*/}
        {/*  <div className={s.divider} />*/}
        {/*  <h3 className={s.timelineTitle}>PL Demo Day W26 · Q1&apos;26</h3>*/}
        {/*  <p className={s.timelineDescription}>Explore 20+ teams across AI, Web3, crypto, robotics, and neurotech.</p>*/}
        {/*</section>*/}

        {/*<section className={s.sectionTimeline}>*/}
        {/*  <div className={s.statusBadge} data-status="completed">*/}
        {/*    Completed*/}
        {/*  </div>*/}
        {/*  <h3 className={s.timelineTitle}>PL Demo Day F25</h3>*/}
        {/*  <p className={s.timelineDescription}>*/}
        {/*    Showcased 28 teams from Pre-Seed to Series A+ across AI, neurotech, robotics, web3, and crypto.*/}
        {/*  </p>*/}
        {/*</section>*/}

        {/* Partners Section */}
        <section className={s.sectionPartners}>
          <div className={s.logosButtonContainer}>
            <LogosGrid source="completed" />
          </div>
        </section>

        {/* Teams Section */}
        <CompletedDemoDayTeamsList
          demoDay={initialDemoDayState}
          onCompletedViewShowMoreTeamsClicked={onCompletedViewShowMoreTeamsClicked}
        />

        {/* FAQ Section */}
        <section className={s.sectionFaq}>
          <FAQ
            title="Frequently Asked Questions"
            items={faqCompletedItems}
            demoDaySlug={initialDemoDayState?.slugURL}
            subtitle={
              <p className={s.infoText}>
                Reach out to us at{' '}
                <a href={`mailto:${supportEmail}`} className={s.infoLink}>
                  {supportEmail}
                </a>{' '}
                for any other questions.
              </p>
            }
          />
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.note}>
            © 2026 Protocol Labs Venture Studios.{' '}
            {isNetworkPartnerDemoDay
              ? NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER
              : 'All content is provided by the founders. Protocol Labs Demo Day organizers do not endorse or recommend any investment.'}
          </div>
          <div className={s.bottom}>
            <div className={s.links}>
              <a className={s.link} href={PRIVACY_POLICY_URL} target="_blank">
                Privacy Policy
              </a>
              <a className={s.link} href={TERMS_AND_CONDITIONS_URL} target="_blank">
                Terms & Conditions
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={isFeedbackDialogOpen}
        onClose={() => setIsFeedbackDialogOpen(false)}
        onSuccess={handleFeedbackSuccess}
      />

      {/* Apply for Demo Day Modal */}
      {nextDemoDay && (
        <ApplyForDemoDayModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          userInfo={userInfo}
          memberData={null}
          demoDaySlug={nextDemoDay.slugURL}
          demoDayData={{
            uid: '',
            access: nextDemoDay.access,
            date: nextDemoDay.date,
            title: nextDemoDay.title,
            description: nextDemoDay.description,
            status: nextDemoDay.status,
            isDemoDayAdmin: false,
            isDemoDayReadOnlyAdmin: false,
            confidentialityAccepted: nextDemoDay.confidentialityAccepted,
            investorsCount: nextDemoDay.investorsCount,
            teamsCount: nextDemoDay.teamsCount,
          }}
          onSuccessUnauthenticated={(res) => setShowSuccessModal(res)}
        />
      )}

      <AccountCreatedSuccessModal
        isOpen={!!showSuccessModal}
        onClose={() => setShowSuccessModal(null)}
        isNew={showSuccessModal?.isNew}
        uid={showSuccessModal?.uid}
        email={showSuccessModal?.email}
        demoDayState={initialDemoDayState}
      />
    </div>
  );
};
