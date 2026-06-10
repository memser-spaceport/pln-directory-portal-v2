'use client';

import React from 'react';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { PitchTeamTitle } from '@/components/page/pitch/PitchTeamTitle';
import { PitchInvestorQuickLinks } from '@/components/page/pitch/PitchInvestorQuickLinks';
import {
  usePitchInvestorOnboardingState,
  type PitchInvestorVariant,
} from '@/components/page/pitch/hooks/usePitchInvestorOnboardingState';
import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';
import clsx from 'clsx';
import s from './PitchInvestorHeader.module.scss';

type Props = {
  variant: PitchInvestorVariant;
  pitchSlug: string;
  prefillEmail?: string;
  pitchStatus?: TeamPitchAccess['status'];
  investorHasAccess?: boolean;
  title: string;
  description: string;
  teamName: string;
  teamUid: string;
  headerImageUrl?: string | null;
  pitchStatusLabel?: string | null;
  showWelcomeMessage?: boolean;
  embedded?: boolean;
};

export const PitchInvestorHeader = ({
  variant,
  pitchSlug,
  prefillEmail,
  pitchStatus,
  investorHasAccess,
  title,
  description,
  teamName,
  teamUid,
  headerImageUrl,
  pitchStatusLabel,
  showWelcomeMessage = false,
  embedded = false,
}: Props) => {
  const { isLoggedIn, userUid, statusLine, primaryCtaType, primaryCtaLabel, profileCtaAsLink, handleLogin } =
    usePitchInvestorOnboardingState({
      pitchSlug,
      prefillEmail,
      pitchStatus,
      investorHasAccess,
      variant,
    });

  return (
    <div className={clsx(s.headerContent, embedded && s.embedded, embedded && !statusLine && s.embeddedCompact)}>
      {!embedded && showWelcomeMessage && headerImageUrl && (
        <div className={s.headerImage}>
          <img src={headerImageUrl} alt="" />
        </div>
      )}

      {!embedded && pitchStatusLabel && <p className={s.pitchLabel}>{pitchStatusLabel}</p>}

      {!embedded &&
        (showWelcomeMessage ? (
          <PageTitle size="small" title={title} description={description} />
        ) : (
          <PitchTeamTitle teamName={teamName} teamUid={teamUid} />
        ))}

      {statusLine && <p className={s.statusLine}>{statusLine}</p>}

      <PitchInvestorQuickLinks
        pitchSlug={pitchSlug}
        variant={variant}
        primaryCtaType={primaryCtaType}
        primaryCtaLabel={primaryCtaLabel}
        profileCtaAsLink={profileCtaAsLink}
        isLoggedIn={isLoggedIn}
        userUid={userUid}
        onLogin={handleLogin}
      />
    </div>
  );
};
