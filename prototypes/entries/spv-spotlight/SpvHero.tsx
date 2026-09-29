'use client';

import React from 'react';
// The completed Demo Day hero: title, body, buttons, links row, and the soft
// `.info` box, all from its own stylesheet.
import clsx from 'clsx';
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import { EditIcon } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
import { SpvAppliedSteps } from './SpvAppliedSteps';

import s from './SpvSpotlight.module.scss';

/**
 * The page's hero: title, description, then only what isn't the data-room
 * door. Request access and Open data room live in the team card's action slot
 * (SpvTeamSpotlight), so there is one door, not two. The hero keeps the
 * investor-profile link, the pending stepper and the state messages.
 *
 * No status pill over the title (2026-09-29 review: "they don't add any
 * value"). Whether the data room is open is the card's action slot's to say,
 * and the closed / opening-soon messages below say the rest. The hero is kept
 * short so the team card starts higher (same review).
 */
export type SpvHeroVariant =
  | 'landing' // signed out or signed in without a request (card: Request access)
  | 'pending' // requested, awaiting admin review
  | 'rejected' // request declined, no way to request again
  | 'openingSoon' // approved, spotlight still DRAFT
  | 'open' // approved, spotlight OPEN (card: Open data room)
  | 'closed'; // spotlight CLOSED, for everyone

type Props = {
  variant: SpvHeroVariant;
  title: string;
  description: string;
  profileComplete: boolean;
  onEditProfile: () => void;
};

export const SpvHero = ({ variant, title, description, profileComplete, onEditProfile }: Props) => {
  // Production's "Get in touch" opens the Contact support modal (a store). The
  // prototype keeps the words and drops the modal.
  const getInTouch = (label: string) => (
    <button type="button" className={s.inlineLink}>
      {label}
    </button>
  );

  // The investor-profile door for approved viewers, under the description: the
  // completed Demo Day's own text link (underlined brand blue, icon after the
  // words). No Contact us beside it (removed 2026-09-29): the FAQ at the
  // bottom already carries the support email.
  const showProfileLink = variant === 'open' || variant === 'openingSoon';

  // One line in the completed page's soft info box, for every state that has
  // something to say about this viewer.
  const message = (() => {
    switch (variant) {
      // Pending draws Demo Day's applied-investor stepper instead of a sentence
      // (see below): submitted, set up your investor profile, await approval.
      case 'pending':
        return null;
      case 'rejected':
        return (
          <>
            Your request for this data room wasn&apos;t approved. If you think this is a mistake,{' '}
            {getInTouch('get in touch')}.
          </>
        );
      case 'openingSoon':
        return <>You&apos;re approved. We&apos;ll email you when this Spotlight opens and the data room goes live.</>;
      case 'closed':
        return <>This Spotlight has closed and its data room is no longer available.</>;
      // Open + approved says nothing here: the card's Open data room already
      // is the state.
      default:
        return null;
    }
  })();

  const hasButtons = variant === 'pending' || !!message;

  return (
    <section className={clsx(d.heroSection, s.heroCompact)}>
      <div className={d.titleContainer}>
        <div className={d.headline}>
          <h1 className={clsx(d.title, s.heroTitle)}>{title}</h1>
          <p className={d.body} dangerouslySetInnerHTML={{ __html: description }} />
          {showProfileLink && (
            <div className={clsx(d.links, s.heroLinks)}>
              <button type="button" className={d.linkButton} onClick={onEditProfile}>
                {profileComplete ? 'Edit investor profile' : 'Set up investor profile'} <EditIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      {hasButtons && (
        <div className={d.buttons}>
          {variant === 'pending' && (
            <div className={s.appliedSteps}>
              <SpvAppliedSteps profileComplete={profileComplete} onProfile={onEditProfile} />
            </div>
          )}

          {message && (
            <div className={`${d.info} ${s.infoTight}`}>
              <p className={d.infoText}>{message}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
