'use client';

import React, { useMemo } from 'react';
import { EditIcon } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
import type { SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import type { SpvSpotlightStatus } from '@/services/spv-spotlight/types';
import { sanitizeSpvHtml } from '@/utils/html/sanitizeSpvHtml';
import { SpvAppliedSteps } from '../SpvAppliedSteps/SpvAppliedSteps';
import s from './SpvHero.module.scss';

type Props = {
  viewState: SpvViewState;
  status: SpvSpotlightStatus;
  title: string;
  /** Admin HTML. */
  description: string;
  supportEmail: string;
  isLoggedIn: boolean;
  profileComplete: boolean;
  /** Opens the investor-profile drawer, or sends a signed-out applicant to sign in. */
  onProfile: (source: 'hero' | 'applied-steps') => void;
};

// Says where the Spotlight is, not where the viewer is: the viewer's state
// goes in the message box under the headline.
const OVERLINE: Record<SpvSpotlightStatus, string> = {
  DRAFT: 'Opening soon',
  OPEN: 'Open',
  CLOSED: 'Closed',
};

/**
 * The completed Demo Day hero: overline badge, title, admin description, then
 * whatever the viewer's state has to say. The data-room action is not here: it
 * lives in the team card's action slot, so the page has one door.
 */
export const SpvHero = ({
  viewState,
  status,
  title,
  description,
  supportEmail,
  isLoggedIn,
  profileComplete,
  onProfile,
}: Props) => {
  const descriptionHtml = useMemo(() => sanitizeSpvHtml(description), [description]);
  // About the investor, not the team: a small text link, never the page's main action.
  const showProfileLink = viewState === 'open' || viewState === 'openingSoon';

  const message = (() => {
    switch (viewState) {
      case 'rejected':
        return (
          <>
            Your request for this data room wasn&apos;t approved, so its materials aren&apos;t available to you. If you
            think this is a mistake,{' '}
            <a className={s.inlineLink} href={`mailto:${supportEmail}`}>
              get in touch
            </a>
            .
          </>
        );
      case 'openingSoon':
        return (
          <>You&apos;re approved. We&apos;ll email you when this Spotlight opens and the deal materials go live.</>
        );
      case 'closed':
        return <>This Spotlight has closed and its materials are no longer available.</>;
      // Pending draws the applied stepper instead; open says it with the card's View materials.
      default:
        return null;
    }
  })();

  return (
    <section className={s.root}>
      <div className={s.titleContainer}>
        <div className={s.badge}>
          {status === 'OPEN' ? (
            <span className={s.openDot} aria-hidden />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="3.5" fill="#455468" />
            </svg>
          )}
          <span className={s.overlineText}>{OVERLINE[status]}</span>
        </div>
        <div className={s.headline}>
          <h1 className={s.title}>{title}</h1>
          {descriptionHtml && <div className={s.body} dangerouslySetInnerHTML={{ __html: descriptionHtml }} />}
          {showProfileLink && (
            <button type="button" className={s.profileLink} onClick={() => onProfile('hero')}>
              {profileComplete ? 'Edit investor profile' : 'Set up investor profile'} <EditIcon />
            </button>
          )}
        </div>
      </div>

      {viewState === 'pending' && (
        <div className={s.appliedSteps}>
          <SpvAppliedSteps
            isLoggedIn={isLoggedIn}
            profileComplete={profileComplete}
            onProfile={() => onProfile('applied-steps')}
          />
        </div>
      )}

      {message && (
        <div className={s.info}>
          <p className={s.infoText}>{message}</p>
        </div>
      )}
    </section>
  );
};
