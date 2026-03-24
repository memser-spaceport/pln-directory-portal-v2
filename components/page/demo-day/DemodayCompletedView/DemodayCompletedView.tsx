'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useToggle } from 'react-use';
import clsx from 'clsx';
import { useSearchParams, useParams } from 'next/navigation';

import { Button } from '@/components/common/Button';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { TeamCard } from '@/components/common/LogosGrid/components/TeamCard';
import { faqCompletedItems, PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { FeedbackDialog } from './components/FeedbackDialog';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import teamsData from '@/components/common/LogosGrid/teams.json';

import s from './DemodayCompletedView.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { toast } from '@/components/core/ToastContainer';
import { format } from 'date-fns';
import { useGetDemoDaysList } from '@/services/demo-day/hooks/useGetDemoDaysList';
import { ApplyForDemoDayModal } from '@/components/page/demo-day/ApplyForDemoDayModal';
import { AccountCreatedSuccessModal } from '@/components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';
import { isDemoDayParticipantInvestor } from '@/utils/member.utils';
import { ChartIcon } from '@/components/icons';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';

interface DemodayCompletedViewProps {
  initialDemoDayState?: DemoDayState;
  isLoggedIn?: boolean;
  userInfo?: IUserInfo;
}

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DemodayCompletedView: React.FC<DemodayCompletedViewProps> = ({
  initialDemoDayState,
  isLoggedIn,
  userInfo,
}) => {
  const searchParams = useSearchParams();
  const params = useParams();
  const demoDayId = params.demoDayId as string;
  const showFeedbackOption =
    isLoggedIn && initialDemoDayState?.access && isDemoDayParticipantInvestor(initialDemoDayState?.access);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [showAllTeams, toggleShowAllTeams] = useToggle(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<{ uid: string; isNew: boolean; email: string } | null>(null);
  const isFounder = initialDemoDayState?.access?.toUpperCase() === 'FOUNDER';
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

  // Use static teams data from teams.json
  const displayTeams = teamsData;

  const handleFeedbackSuccess = () => {
    // You can add a success toast notification here if needed
    console.log('Feedback submitted successfully!');
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

  const handleShowMoreTeamsClick = () => {
    onCompletedViewShowMoreTeamsClicked();
    toggleShowAllTeams();
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
              <div className={s.overlineText}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11.375 1.53125H10.2812V1.3125C10.2812 1.13845 10.2121 0.971532 10.089 0.848461C9.96597 0.72539 9.79905 0.65625 9.625 0.65625C9.45095 0.65625 9.28403 0.72539 9.16096 0.848461C9.03789 0.971532 8.96875 1.13845 8.96875 1.3125V1.53125H5.03125V1.3125C5.03125 1.13845 4.96211 0.971532 4.83904 0.848461C4.71597 0.72539 4.54905 0.65625 4.375 0.65625C4.20095 0.65625 4.03403 0.72539 3.91096 0.848461C3.78789 0.971532 3.71875 1.13845 3.71875 1.3125V1.53125H2.625C2.33492 1.53125 2.05672 1.64648 1.8516 1.8516C1.64648 2.05672 1.53125 2.33492 1.53125 2.625V11.375C1.53125 11.6651 1.64648 11.9433 1.8516 12.1484C2.05672 12.3535 2.33492 12.4688 2.625 12.4688H11.375C11.6651 12.4688 11.9433 12.3535 12.1484 12.1484C12.3535 11.9433 12.4688 11.6651 12.4688 11.375V2.625C12.4688 2.33492 12.3535 2.05672 12.1484 1.8516C11.9433 1.64648 11.6651 1.53125 11.375 1.53125ZM3.71875 2.84375C3.71875 3.0178 3.78789 3.18472 3.91096 3.30779C4.03403 3.43086 4.20095 3.5 4.375 3.5C4.54905 3.5 4.71597 3.43086 4.83904 3.30779C4.96211 3.18472 5.03125 3.0178 5.03125 2.84375H8.96875C8.96875 3.0178 9.03789 3.18472 9.16096 3.30779C9.28403 3.43086 9.45095 3.5 9.625 3.5C9.79905 3.5 9.96597 3.43086 10.089 3.30779C10.2121 3.18472 10.2812 3.0178 10.2812 2.84375H11.1562V4.15625H2.84375V2.84375H3.71875ZM2.84375 11.1562V5.46875H11.1562V11.1562H2.84375ZM7.875 7C7.875 7.17306 7.82368 7.34223 7.72754 7.48612C7.63139 7.63002 7.49473 7.74217 7.33485 7.80839C7.17496 7.87462 6.99903 7.89195 6.8293 7.85819C6.65956 7.82443 6.50365 7.74109 6.38128 7.61872C6.25891 7.49635 6.17557 7.34044 6.14181 7.1707C6.10805 7.00097 6.12538 6.82504 6.19161 6.66515C6.25783 6.50527 6.36998 6.36861 6.51388 6.27246C6.65777 6.17632 6.82694 6.125 7 6.125C7.23206 6.125 7.45462 6.21719 7.61872 6.38128C7.78281 6.54538 7.875 6.76794 7.875 7ZM10.5 7C10.5 7.17306 10.4487 7.34223 10.3525 7.48612C10.2564 7.63002 10.1197 7.74217 9.95985 7.80839C9.79996 7.87462 9.62403 7.89195 9.4543 7.85819C9.28456 7.82443 9.12865 7.74109 9.00628 7.61872C8.88391 7.49635 8.80057 7.34044 8.76681 7.1707C8.73305 7.00097 8.75038 6.82504 8.81661 6.66515C8.88283 6.50527 8.99498 6.36861 9.13888 6.27246C9.28277 6.17632 9.45194 6.125 9.625 6.125C9.85706 6.125 10.0796 6.21719 10.2437 6.38128C10.4078 6.54538 10.5 6.76794 10.5 7ZM5.25 9.625C5.25 9.79806 5.19868 9.96723 5.10254 10.1111C5.00639 10.255 4.86973 10.3672 4.70985 10.4334C4.54996 10.4996 4.37403 10.5169 4.2043 10.4832C4.03456 10.4494 3.87865 10.3661 3.75628 10.2437C3.63391 10.1213 3.55057 9.96544 3.51681 9.7957C3.48305 9.62597 3.50038 9.45004 3.56661 9.29015C3.63283 9.13027 3.74498 8.99361 3.88888 8.89746C4.03277 8.80132 4.20194 8.75 4.375 8.75C4.60706 8.75 4.82962 8.84219 4.99372 9.00628C5.15781 9.17038 5.25 9.39294 5.25 9.625ZM7.875 9.625C7.875 9.79806 7.82368 9.96723 7.72754 10.1111C7.63139 10.255 7.49473 10.3672 7.33485 10.4334C7.17496 10.4996 6.99903 10.5169 6.8293 10.4832C6.65956 10.4494 6.50365 10.3661 6.38128 10.2437C6.25891 10.1213 6.17557 9.96544 6.14181 9.7957C6.10805 9.62597 6.12538 9.45004 6.19161 9.29015C6.25783 9.13027 6.36998 8.99361 6.51388 8.89746C6.65777 8.80132 6.82694 8.75 7 8.75C7.23206 8.75 7.45462 8.84219 7.61872 9.00628C7.78281 9.17038 7.875 9.39294 7.875 9.625ZM10.5 9.625C10.5 9.79806 10.4487 9.96723 10.3525 10.1111C10.2564 10.255 10.1197 10.3672 9.95985 10.4334C9.79996 10.4996 9.62403 10.5169 9.4543 10.4832C9.28456 10.4494 9.12865 10.3661 9.00628 10.2437C8.88391 10.1213 8.80057 9.96544 8.76681 9.7957C8.73305 9.62597 8.75038 9.45004 8.81661 9.29015C8.88283 9.13027 8.99498 8.99361 9.13888 8.89746C9.28277 8.80132 9.45194 8.75 9.625 8.75C9.85706 8.75 10.0796 8.84219 10.2437 9.00628C10.4078 9.17038 10.5 9.39294 10.5 9.625Z"
                    fill="#455468"
                  />
                </svg>

                {initialDemoDayState?.date ? format(new Date(initialDemoDayState?.date), 'MMM dd, yyyy') : ''}
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
        <section className={s.sectionTeams} style={{ display: 'none' }}>
          <div className={s.subtitle}>
            <h2 className={s.label}>{displayTeams.length} Teams That Presented</h2>
            <p className={s.supportingText}>Innovative startups across AI, web3, crypto, robotics, and neurotech</p>
          </div>
          <div className={s.cards}>
            <div
              className={clsx(s.cardsGridContainer, {
                [s.expanded]: showAllTeams,
              })}
            >
              <div className={s.cardsGrid}>
                {displayTeams.length > 0 ? (
                  displayTeams.map((team) => (
                    <TeamCard
                      key={team.uid}
                      team={{
                        uid: team.uid,
                        name: team.name,
                        logo: team.logo,
                        stage: team.stage,
                        website: team.website || '',
                        shortDescription: team.shortDescription,
                      }}
                    />
                  ))
                ) : (
                  <div className={s.noTeams}>No teams available</div>
                )}
              </div>
              <div className={s.bottomShadow} />
            </div>
            <Button size="s" style="border" onClick={handleShowMoreTeamsClick}>
              Show {showAllTeams ? 'Less' : 'All'} Teams
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={s.sectionFaq}>
          <FAQ
            title="Frequently Asked Questions"
            items={faqCompletedItems}
            demoDaySlug={initialDemoDayState?.uid}
            subtitle={
              <p className={s.infoText}>
                Reach out to us on{' '}
                <a href="mailto:demoday@protocol.ai" className={s.infoLink}>
                  pldemoday@protocol.ai
                </a>{' '}
                for any other questions.
              </p>
            }
          />
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.note}>
            © 2026 Protocol Labs. All content is provided by the founders. Protocol Labs Demo Day organizers do not
            endorse or recommend any investment.
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

const ArrowRight = ({
  color = 'white',
  width = 22,
  height = 21,
}: {
  color?: string;
  width?: number;
  height?: number;
}) => (
  <svg width={width} height={height} viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path
        d="M18.5383 10.6631L12.9133 16.2881C12.7372 16.4642 12.4983 16.5631 12.2492 16.5631C12.0001 16.5631 11.7613 16.4642 11.5852 16.2881C11.409 16.1119 11.3101 15.8731 11.3101 15.624C11.3101 15.3749 11.409 15.136 11.5852 14.9599L15.6094 10.9373H4.125C3.87636 10.9373 3.6379 10.8385 3.46209 10.6627C3.28627 10.4869 3.1875 10.2484 3.1875 9.99977C3.1875 9.75113 3.28627 9.51267 3.46209 9.33686C3.6379 9.16104 3.87636 9.06227 4.125 9.06227H15.6094L11.5867 5.03727C11.4106 4.86115 11.3117 4.62228 11.3117 4.37321C11.3117 4.12414 11.4106 3.88527 11.5867 3.70915C11.7628 3.53303 12.0017 3.43408 12.2508 3.43408C12.4999 3.43408 12.7387 3.53303 12.9148 3.70915L18.5398 9.33414C18.6273 9.42136 18.6966 9.52498 18.7438 9.63907C18.7911 9.75315 18.8153 9.87544 18.8152 9.99892C18.815 10.1224 18.7905 10.2446 18.743 10.3586C18.6955 10.4726 18.6259 10.576 18.5383 10.6631Z"
        fill={color}
      />
    </g>
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.8125 2.40625H2.18751C1.89743 2.40625 1.61923 2.52148 1.41411 2.7266C1.20899 2.93172 1.09376 3.20992 1.09376 3.5V12.25C1.09289 12.4583 1.15205 12.6624 1.26416 12.838C1.37628 13.0135 1.5366 13.153 1.72595 13.2398C1.87129 13.3079 2.02976 13.3434 2.19024 13.3438C2.44707 13.3431 2.6954 13.2517 2.89134 13.0856L2.90173 13.0769L4.59376 11.5938H11.8125C12.1026 11.5938 12.3808 11.4785 12.5859 11.2734C12.791 11.0683 12.9063 10.7901 12.9063 10.5V3.5C12.9063 3.20992 12.791 2.93172 12.5859 2.7266C12.3808 2.52148 12.1026 2.40625 11.8125 2.40625ZM11.5938 10.2812H4.51173C4.25424 10.2812 4.00501 10.3721 3.8079 10.5377L3.79751 10.5465L2.40626 11.7655V3.71875H11.5938V10.2812Z"
      fill="#1B4DFF"
    />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5858 3.85775L10.1423 1.41377C10.0408 1.31216 9.92018 1.23155 9.78746 1.17656C9.65473 1.12157 9.51246 1.09326 9.36879 1.09326C9.22512 1.09326 9.08286 1.12157 8.95013 1.17656C8.8174 1.23155 8.69681 1.31216 8.59524 1.41377L1.85172 8.15783C1.74979 8.2591 1.66897 8.3796 1.61396 8.51234C1.55895 8.64508 1.53084 8.78742 1.53125 8.93111V11.3751C1.53125 11.6652 1.64649 11.9434 1.85161 12.1485C2.05672 12.3536 2.33492 12.4688 2.625 12.4688H5.06899C5.21267 12.4692 5.35501 12.4411 5.48774 12.3861C5.62048 12.3311 5.74098 12.2503 5.84227 12.1484L12.5858 5.40432C12.7908 5.19921 12.906 4.92106 12.906 4.63104C12.906 4.34101 12.7908 4.06286 12.5858 3.85775ZM4.97657 11.1563H2.84375V9.02354L7.4375 4.42979L9.57032 6.5626L4.97657 11.1563ZM10.5 5.63291L8.36719 3.5001L9.37016 2.49713L11.503 4.62994L10.5 5.63291Z"
      fill="#1B4DFF"
    />
  </svg>
);
