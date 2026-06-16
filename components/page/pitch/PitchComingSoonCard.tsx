'use client';

import React from 'react';
import Link from 'next/link';
import { useContactSupportStore } from '@/services/contact-support/store';
import s from './PitchComingSoonCard.module.scss';

type Variant = 'upcoming' | 'active' | 'closed';

type Props = {
  teamName?: string;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  variant?: Variant;
  teamProfileHref?: string;
  hideBadge?: boolean;
};

type VariantConfig = {
  badgeClass: string;
  dotClass: string;
  badgeLabel: string;
  getHeading: (teamName?: string) => React.ReactNode;
  getDescription: (teamName?: string, teamProfileHref?: string) => React.ReactNode;
  buttonLabel: string;
};

const VARIANT_CONFIG: Record<Variant, VariantConfig> = {
  upcoming: {
    badgeClass: s.badgeUpcoming,
    dotClass: s.dotUpcoming,
    badgeLabel: 'Upcoming',
    getHeading: (teamName) => <>{teamName ? `${teamName} pitch` : 'Team pitch'}</>,
    getDescription: (teamName) => (
      <>
        {teamName && <>{teamName} </>}has not opened this pitch to investors yet
        <br />
        Log in with the email that received your invite to confirm access.
        <br />
        We will notify you when pitch materials are available.
      </>
    ),
    buttonLabel: 'Log in',
  },
  active: {
    badgeClass: s.badgeActive,
    dotClass: s.dotActive,
    badgeLabel: 'Pitch Active',
    getHeading: (teamName) => <>{teamName ? `${teamName} Pitch` : 'Team Pitch'}</>,
    getDescription: () => (
      <>
        This is a private team pitch page for invited investors.
        <br />
        Log in with the email that received your invite to confirm access.
        <br />
        We will notify you when pitch materials are available.
      </>
    ),
    buttonLabel: 'Log in to view pitch',
  },
  closed: {
    badgeClass: s.badgeCompleted,
    dotClass: s.dotCompleted,
    badgeLabel: 'Completed',
    getHeading: (teamName) => <>{teamName ? `${teamName} Pitch Closed` : 'Pitch Closed'}</>,
    getDescription: (teamName, teamProfileHref) => (
      <>
        This fundraising opportunity has ended and pitch materials are no longer available. You can still learn more
        about{' '}
        {teamProfileHref ? (
          <Link href={teamProfileHref} className={s.teamLink}>
            {teamName}
          </Link>
        ) : (
          <strong className={s.teamLink}>{teamName}</strong>
        )}{' '}
        on the Protocol Labs Network.
      </>
    ),
    buttonLabel: 'Log in to view team profile',
  },
};

export const PitchComingSoonCard = ({ teamName, isLoggedIn, onLogin, variant = 'upcoming', teamProfileHref, hideBadge }: Props) => {
  const { openModal } = useContactSupportStore((state) => state.actions);
  const config = VARIANT_CONFIG[variant];

  return (
    <div className={s.card}>
      {!hideBadge && (
        <div className={config.badgeClass}>
          <span className={config.dotClass} aria-hidden />
          <span className={s.badgeLabel}>{config.badgeLabel}</span>
        </div>
      )}
      <h2 className={s.title}>{config.getHeading(teamName)}</h2>
      <p className={s.description}>{config.getDescription(teamName, teamProfileHref)}</p>
      {!isLoggedIn && (
        <div className={s.actions}>
          <button type="button" className={s.primaryButton} onClick={onLogin}>
            {config.buttonLabel}
          </button>
          <p className={s.supportText}>
            Questions or feedback?{' '}
            <button type="button" className={s.supportLink} onClick={() => openModal()}>
              Contact support
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
