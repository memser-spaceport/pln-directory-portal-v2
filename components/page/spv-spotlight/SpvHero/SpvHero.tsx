'use client';

import React, { useMemo } from 'react';
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
  isLoggedIn: boolean;
  profileComplete: boolean;
  /** The pending stepper's profile step: opens the drawer, or sends a signed-out applicant to sign in. */
  onProfile: () => void;
  /** The rejected message's "get in touch": the contact-support modal. */
  onContactUs: () => void;
};

/**
 * The completed Demo Day hero, kept compact so the team card starts above the
 * fold: title, admin description, then whatever the viewer's state has to say.
 * The investor profile has its own card below (review 2026-10-05). No status
 * badge: every state
 * that matters already says so in the message box or the card's action. The
 * data-room action lives in the team card's action slot, so the page has one door.
 */
export const SpvHero = ({
  viewState,
  title,
  description,
  isLoggedIn,
  profileComplete,
  onProfile,
  onContactUs,
}: Props) => {
  const descriptionHtml = useMemo(() => sanitizeSpvHtml(description), [description]);

  const message = (() => {
    switch (viewState) {
      case 'rejected':
        return (
          <>
            Your request for this data room wasn&apos;t approved. If you think this is a mistake,{' '}
            <button type="button" className={s.inlineLink} onClick={onContactUs}>
              get in touch
            </button>
            .
          </>
        );
      case 'openingSoon':
        return <>You&apos;re approved. We&apos;ll email you when this Spotlight opens and the data room goes live.</>;
      case 'closed':
        return <>This Spotlight has closed and its data room is no longer available.</>;
      // Pending draws the applied stepper instead; open says it with the card's data-room link.
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
        </div>
      </div>

      {viewState === 'pending' && (
        <div className={s.appliedSteps}>
          <SpvAppliedSteps isLoggedIn={isLoggedIn} profileComplete={profileComplete} onProfile={onProfile} />
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
