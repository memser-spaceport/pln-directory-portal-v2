'use client';

import React, { useMemo } from 'react';
import { EditIcon } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
import type { SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import { sanitizeSpvHtml } from '@/utils/html/sanitizeSpvHtml';
import { SpvAppliedSteps } from '../SpvAppliedSteps/SpvAppliedSteps';
import s from './SpvHero.module.scss';

type Props = {
  /** Null while the viewer's state loads: the hero shows only the spotlight's own copy. */
  viewState: SpvViewState | null;
  title: string;
  /** Admin HTML. */
  description: string;
  /** For the rejected message's "get in touch". */
  supportEmail: string;
  isLoggedIn: boolean;
  profileComplete: boolean;
  /** Opens the investor-profile drawer, or sends a signed-out applicant to sign in. */
  onProfile: (source: 'hero' | 'applied-steps') => void;
};

/**
 * The completed Demo Day hero, kept compact so the team card starts above the
 * fold: title, admin description, the investor-profile text link for approved
 * viewers, then whatever the viewer's state has to say. No Contact us: the FAQ
 * at the bottom already carries the support email. No status badge: every state
 * that matters already says so in the message box or the card's action. The
 * data-room action lives in the team card's action slot, so the page has one door.
 */
export const SpvHero = ({
  viewState,
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
            Your request for this data room wasn&apos;t approved. If you think this is a mistake,{' '}
            <a className={s.inlineLink} href={`mailto:${supportEmail}`}>
              get in touch
            </a>
            .
          </>
        );
      case 'openingSoon':
        return <>You&apos;re approved. We&apos;ll email you when this Spotlight opens and the data room goes live.</>;
      case 'closed':
        return <>This Spotlight has closed and its data room is no longer available.</>;
      // Pending draws the applied stepper instead; open says it with the card's Open data room.
      default:
        return null;
    }
  })();

  return (
    <section className={s.root}>
      <div className={s.titleContainer}>
        <div className={s.headline}>
          <h1 className={s.title}>{title}</h1>
          {descriptionHtml && <div className={s.body} dangerouslySetInnerHTML={{ __html: descriptionHtml }} />}
          {showProfileLink && (
            <div className={s.links}>
              <button type="button" className={s.textLink} onClick={() => onProfile('hero')}>
                {profileComplete ? 'Edit investor profile' : 'Set up investor profile'} <EditIcon />
              </button>
            </div>
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
