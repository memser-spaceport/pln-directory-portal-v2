'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useToggle } from 'react-use';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/common/Button';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { TeamCard } from '@/components/common/LogosGrid/components/TeamCard';
import { faqCompletedItems, PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { FeedbackDialog } from './components/FeedbackDialog';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import teamsData from '@/components/common/LogosGrid/teams.json';

import s from './DemodayCompletedView.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { toast } from '@/components/core/ToastContainer';
import { format } from 'date-fns';
import { useGetDemoDaysList } from '@/services/demo-day/hooks/useGetDemoDaysList';
import { ApplyForDemoDayModal } from '@/components/page/demo-day/ApplyForDemoDayModal';
import { AccountCreatedSuccessModal } from '@/components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';

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
  const showFeedbackOption =
    isLoggedIn && initialDemoDayState?.access && initialDemoDayState?.access?.toUpperCase() === 'INVESTOR';
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [showAllTeams, toggleShowAllTeams] = useToggle(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    onCompletedViewApplyForNextDemoDayClicked,
    onCompletedViewGiveFeedbackClicked,
    onCompletedViewKeepProfileUpdatedClicked,
    onCompletedViewShowMoreTeamsClicked,
  } = useDemoDayAnalytics();

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
              <div className={s.dot} />
              <span className={s.overlineText}>COMPLETED</span>
              <span className={s.break} />
              <span className={s.overlineText}>
                {initialDemoDayState?.date ? format(new Date(initialDemoDayState?.date), 'MMM dd, yyyy') : ''}
              </span>
            </div>
            <div className={s.headline}>
              <h1 className={s.title}>{initialDemoDayState?.title}</h1>
              <p className={s.body} dangerouslySetInnerHTML={{ __html: initialDemoDayState?.description || '' }} />
            </div>
          </div>

          <div className={s.buttons}>
            <Link href="/demoday" onClick={handleApplyForNextDemoDayClick}>
              <Button size="l" style="fill" variant="primary">
                View upcoming Demo Days <ArrowRight />
              </Button>
            </Link>
            <div className={s.links}>
              {showFeedbackOption && (
                <button onClick={handleGiveFeedbackClick} className={s.linkButton}>
                  Give Feedback <ChatIcon />
                </button>
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
                  demoday@protocol.ai
                </a>{' '}
                for any other questions.
              </p>
            }
          />
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.note}>
            © 2025 Protocol Labs. All content is provided by the founders. Protocol Labs Demo Day organizers do not
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
            confidentialityAccepted: nextDemoDay.confidentialityAccepted,
            investorsCount: nextDemoDay.investorsCount,
            teamsCount: nextDemoDay.teamsCount,
          }}
          onSuccessUnauthenticated={() => setShowSuccessModal(true)}
        />
      )}

      <AccountCreatedSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
};

const ArrowRight = () => (
  <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path
        d="M18.5383 10.6631L12.9133 16.2881C12.7372 16.4642 12.4983 16.5631 12.2492 16.5631C12.0001 16.5631 11.7613 16.4642 11.5852 16.2881C11.409 16.1119 11.3101 15.8731 11.3101 15.624C11.3101 15.3749 11.409 15.136 11.5852 14.9599L15.6094 10.9373H4.125C3.87636 10.9373 3.6379 10.8385 3.46209 10.6627C3.28627 10.4869 3.1875 10.2484 3.1875 9.99977C3.1875 9.75113 3.28627 9.51267 3.46209 9.33686C3.6379 9.16104 3.87636 9.06227 4.125 9.06227H15.6094L11.5867 5.03727C11.4106 4.86115 11.3117 4.62228 11.3117 4.37321C11.3117 4.12414 11.4106 3.88527 11.5867 3.70915C11.7628 3.53303 12.0017 3.43408 12.2508 3.43408C12.4999 3.43408 12.7387 3.53303 12.9148 3.70915L18.5398 9.33414C18.6273 9.42136 18.6966 9.52498 18.7438 9.63907C18.7911 9.75315 18.8153 9.87544 18.8152 9.99892C18.815 10.1224 18.7905 10.2446 18.743 10.3586C18.6955 10.4726 18.6259 10.576 18.5383 10.6631Z"
        fill="white"
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
