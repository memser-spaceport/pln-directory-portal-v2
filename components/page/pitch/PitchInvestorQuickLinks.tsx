'use client';

import React from 'react';
import clsx from 'clsx';
import { useContactSupportStore } from '@/services/contact-support/store';
import type {
  PitchInvestorVariant,
  PrimaryCtaType,
} from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import stepperStyles from '@/components/page/demo-day/AppliedInvestorSteps/AppliedInvestorSteps.module.scss';
import { useTeamPitchAnalytics } from '@/analytics/team-pitch.analytics';
import { buildEngagementTrackEvent } from '@/analytics/team-pitch-engagement';
import { useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { useCurrentUserStore } from '@/services/auth/store';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';
import { TEAM_PITCH_ANALYTICS } from '@/utils/constants';
import s from './PitchInvestorHeader.module.scss';

type Props = {
  pitchSlug: string;
  variant: PitchInvestorVariant;
  primaryCtaType: PrimaryCtaType;
  primaryCtaLabel: string;
  showLoginCta?: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
};

export const PitchInvestorQuickLinks = ({
  pitchSlug,
  variant,
  primaryCtaType,
  primaryCtaLabel,
  showLoginCta = true,
  onLogin,
}: Props) => {
  const { openModal } = useContactSupportStore((state) => state.actions);

  const teamPitchAnalytics = useTeamPitchAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const { currentUser: userInfo } = useCurrentUserStore();

  const trackPitchEvent = (eventName: string, posthogFn: () => void, extra: Record<string, unknown> = {}) => {
    posthogFn();
    const distinctId = userInfo?.email ?? `pitch-anonymous-${pitchSlug}`;
    reportAnalytics.mutate(
      buildEngagementTrackEvent(eventName, distinctId, getTeamSpotlightPath(pitchSlug), pitchSlug, {
        ...(userInfo ? { userId: userInfo.uid, userEmail: userInfo.email, userName: userInfo.name } : {}),
        variant,
        ...extra,
      }),
    );
  };

  const handleContactSupport = () => {
    if (variant === 'restricted') {
      trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_RESTRICTED_ACCESS_SUPPORT_CLICKED, () =>
        teamPitchAnalytics.onRestrictedAccessSupportClicked({ pitchSlug, variant }),
      );
      openModal(
        { reason: 'team_pitch_access_denied', pitchSlug },
        'contactSupport',
        'I need access to a team spotlight page',
      );
      return;
    }

    trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_CONTACT_SUPPORT_CLICKED, () =>
      teamPitchAnalytics.onContactSupportClicked({ pitchSlug, variant }),
    );
    openModal({ pitchSlug }, 'askQuestion');
  };

  const handleLogin = () => {
    trackPitchEvent(TEAM_PITCH_ANALYTICS.ON_LOGIN_CLICKED, () =>
      teamPitchAnalytics.onLoginClicked({ pitchSlug, variant }),
    );
    onLogin();
  };

  return (
    <div className={s.quickLinksSection}>
      <div className={clsx(s.quickLinksActions)}>
        {showLoginCta && primaryCtaType === 'login' && (
          <button type="button" className={stepperStyles.primaryButton} onClick={handleLogin}>
            {primaryCtaLabel}
          </button>
        )}
        <p className={s.supportLine}>
          <button type="button" className={s.supportLink} onClick={handleContactSupport}>
            Questions or feedback?
          </button>
        </p>
      </div>
    </div>
  );
};
