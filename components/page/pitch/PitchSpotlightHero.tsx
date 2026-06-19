'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import { InvestorProfileInlineLink } from '@/components/page/pitch/InvestorProfileInlineLink';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMember } from '@/services/members/hooks/useMember';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';
import { useTeamPitchAnalytics } from '@/analytics/team-pitch.analytics';
import { buildEngagementTrackEvent } from '@/analytics/team-pitch-engagement';
import { useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { TEAM_PITCH_ANALYTICS } from '@/utils/constants';
import s from './PitchSpotlightHero.module.scss';

export type PitchSpotlightHeroVariant =
  | 'notLoggedIn'
  | 'draftWhitelist'
  | 'restricted'
  | 'closed'
  | 'closedLoggedOut'
  | 'open'
  | 'draftPreview';

type Props = {
  variant: PitchSpotlightHeroVariant;
  pitchSlug: string;
  prefillEmail?: string;
  title: string;
  description?: string;
  spotlightStatement?: string | null;
  teamName: string;
  teamUid: string;
};

export const PitchSpotlightHero = ({
  variant,
  pitchSlug,
  prefillEmail,
  title,
  description,
  spotlightStatement,
  teamName,
  teamUid,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openModal } = useContactSupportStore((state) => state.actions);
  const { currentUser: userInfo } = useCurrentUserStore();
  const isLoggedIn = !!userInfo?.uid;
  const { data: memberData } = useMember(isLoggedIn ? userInfo?.uid : undefined);
  const isProfileComplete = checkInvestorProfileComplete(memberData?.memberInfo, userInfo);
  const teamPitchAnalytics = useTeamPitchAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const statement = spotlightStatement?.trim() || null;
  const isPastSpotlight = variant === 'closed' || variant === 'closedLoggedOut';

  const trackPitchEvent = useCallback(
    (eventName: string, posthogFn: () => void, extra: Record<string, unknown> = {}) => {
      posthogFn();
      const distinctId = userInfo?.email ?? `pitch-anonymous-${pitchSlug}`;
      reportAnalytics.mutate(
        buildEngagementTrackEvent(eventName, distinctId, getTeamSpotlightPath(pitchSlug), pitchSlug, {
          ...(userInfo ? { userId: userInfo.uid, userEmail: userInfo.email, userName: userInfo.name } : {}),
          variant,
          ...extra,
        }),
      );
    },
    [userInfo, pitchSlug, variant, reportAnalytics],
  );

  const openProfileDrawer = () => {
    trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_INVESTOR_PROFILE_CTA_CLICKED, () =>
      teamPitchAnalytics.onInvestorProfileCtaClicked({ pitchSlug, variant, profileCtaAsLink: true }),
    );
    setDrawerOpen(true);
  };

  const handleTeamLinkClick = (linkContext: 'spotlight_line' | 'explore_team') => {
    trackPitchEvent(
      TEAM_PITCH_ANALYTICS.ON_SPOTLIGHT_TEAM_LINK_CLICKED,
      () => teamPitchAnalytics.onSpotlightTeamLinkClicked({ pitchSlug, variant, linkContext, teamUid }),
      { linkContext, teamUid },
    );
  };

  const handleMemberProfileLinkClick = () => {
    trackPitchEvent(
      TEAM_PITCH_ANALYTICS.ON_SPOTLIGHT_MEMBER_PROFILE_LINK_CLICKED,
      () =>
        teamPitchAnalytics.onSpotlightMemberProfileLinkClicked({
          pitchSlug,
          variant,
          memberUid: userInfo?.uid,
        }),
      { memberUid: userInfo?.uid },
    );
  };

  const handleGetInTouch = () => {
    trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_CONTACT_SUPPORT_CLICKED, () =>
      teamPitchAnalytics.onContactSupportClicked({ pitchSlug, variant }),
    );
    openModal({ pitchSlug }, 'askQuestion');
  };

  const handleContactSupport = () => {
    trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_RESTRICTED_ACCESS_SUPPORT_CLICKED, () =>
      teamPitchAnalytics.onRestrictedAccessSupportClicked({ pitchSlug, variant: 'restricted' }),
    );
    openModal(
      { reason: 'team_pitch_access_denied', pitchSlug },
      'contactSupport',
      'I need access to a team spotlight page',
    );
  };

  const handleLogin = () => {
    trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_LOGIN_CLICKED, () =>
      teamPitchAnalytics.onLoginClicked({ pitchSlug, variant }),
    );
    const email = prefillEmail || '';
    router.replace(`${getTeamSpotlightPath(pitchSlug)}?prefillEmail=${encodeURIComponent(email)}#login`);
  };

  const profileSetupPhrase = isProfileComplete
    ? 'keep your investor profile up to date'
    : 'set up your investor profile';
  const openProfileSetupPhrase = isProfileComplete
    ? 'Keep your investor profile up to date'
    : 'Set up your investor profile';
  const profileClosedPhrase = isProfileComplete ? 'update your investor profile' : 'set up your investor profile';

  const renderTeamLine = () => (
    <p className={s.spotlightLine}>
      {isPastSpotlight ? 'Spotlighted: ' : 'Spotlighting: '}
      <Link
        href={`/teams/${teamUid}`}
        target="_blank"
        rel="noopener noreferrer"
        className={s.teamLink}
        onClick={() => handleTeamLinkClick('spotlight_line')}
      >
        {teamName}
      </Link>
      {!isPastSpotlight && statement ? ` — ${statement}` : null}
    </p>
  );

  const renderStateBody = () => {
    switch (variant) {
      case 'notLoggedIn':
        return (
          <>
            <p className={s.body}>
              This is a private spotlight for invited investors. Log in with the email that received your invite to
              confirm access.{' '}
              <button type="button" className={s.inlineLink} onClick={handleGetInTouch}>
                Get in touch
              </button>{' '}
              if you have questions or feedback.
            </p>
          </>
        );
      case 'draftWhitelist':
        return (
          <>
            <p className={s.body}>
              {teamName}
              <> </>hasn&apos;t opened their spotlight to investors yet. You&apos;re on the invite list — we&apos;ll
              notify you when their materials go live.
            </p>
            <p className={s.footer}>
              In the meantime,{' '}
              <InvestorProfileInlineLink onClick={openProfileDrawer} className={s.inlineLink}>
                {profileSetupPhrase}
              </InvestorProfileInlineLink>{' '}
              so we can match you with the right teams, and{' '}
              <button type="button" className={s.inlineLink} onClick={handleGetInTouch}>
                get in touch
              </button>{' '}
              if you have questions or feedback.
            </p>
          </>
        );
      case 'restricted':
        return (
          <>
            <p className={s.body}>
              Your account is not on the invite list for this spotlight page.
              <br />
              Please make sure you&apos;re logged in with the email address that received the invitation — you&apos;re
              currently signed in as{' '}
              {userInfo?.uid && userInfo.email ? (
                <Link
                  href={`/members/${userInfo.uid}?backTo=${encodeURIComponent(pathname)}`}
                  className={s.teamLink}
                  onClick={handleMemberProfileLinkClick}
                >
                  {userInfo.email}
                </Link>
              ) : (
                (userInfo?.email ?? 'your account')
              )}
              .
            </p>
            <p className={s.footer}>
              In the meantime,{' '}
              <InvestorProfileInlineLink onClick={openProfileDrawer} className={s.inlineLink}>
                {profileSetupPhrase}
              </InvestorProfileInlineLink>{' '}
              so we can match you with the right teams, and{' '}
              <button type="button" className={s.inlineLink} onClick={handleContactSupport}>
                Contact support
              </button>{' '}
              if you believe this is a mistake.
            </p>
          </>
        );
      case 'closed':
        return (
          <>
            <p className={s.body}>This spotlight has closed and its materials are no longer available.</p>
            <p className={s.footer}>
              You can{' '}
              <InvestorProfileInlineLink onClick={openProfileDrawer} className={s.inlineLink}>
                {profileClosedPhrase}
              </InvestorProfileInlineLink>{' '}
              to be matched to future spotlights, <br /> or{' '}
              <Link
                href={`/teams/${teamUid}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.teamLink}
                onClick={() => handleTeamLinkClick('explore_team')}
              >
                explore {teamName}&apos;s profile
              </Link>
              .
            </p>
          </>
        );
      case 'closedLoggedOut':
        return <p className={s.body}>This spotlight has closed and its materials are no longer available.</p>;
      case 'open':
      case 'draftPreview':
        return (
          <p className={s.footer}>
            <InvestorProfileInlineLink onClick={openProfileDrawer} className={s.inlineLink}>
              {openProfileSetupPhrase}
            </InvestorProfileInlineLink>{' '}
            so we can match you with the right teams, and{' '}
            <button type="button" className={s.inlineLink} onClick={handleGetInTouch}>
              get in touch
            </button>{' '}
            if you have questions or feedback.
          </p>
        );
      default:
        return null;
    }
  };

  const showLoginCta = variant === 'notLoggedIn' || variant === 'closedLoggedOut';

  const showTeamLine = variant !== 'closed';

  return (
    <div className={s.card}>
      <div className={s.headline}>
        <div className={s.headlineText}>
          {variant === 'draftPreview' && <p className={s.prepLabel}>[Draft]</p>}
          <h1 className={s.title}>{title}</h1>
          {description && <p className={s.description} dangerouslySetInnerHTML={{ __html: description }} />}
          {showTeamLine && renderTeamLine()}
          <hr className={s.divider} aria-hidden />
          {renderStateBody()}
        </div>

        {showLoginCta && (
          <div className={s.actions}>
            <button type="button" className={s.primaryButton} onClick={handleLogin}>
              Log in
            </button>
          </div>
        )}
      </div>

      {(variant === 'open' || variant === 'draftPreview') && (
        <Alert>
          <p>
            Confidentiality notice: Materials presented here are confidential and are provided exclusively for your
            review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure will result in
            removal from the network.
          </p>
        </Alert>
      )}

      {isLoggedIn && userInfo?.uid && (
        <EditInvestorProfileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          uid={userInfo.uid}
          isLoggedIn
          isInvestor
        />
      )}
    </div>
  );
};
