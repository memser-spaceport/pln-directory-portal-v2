'use client';

import React from 'react';
// The completed Demo Day hero: overline badge, 56px title, body, buttons,
// links row, and the soft `.info` box, all from its own stylesheet.
import clsx from 'clsx';
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import { EditIcon } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
import { type SpvStatus } from './mocks';
import { SpvAppliedSteps } from './SpvAppliedSteps';

import s from './SpvSpotlight.module.scss';

/**
 * The page's hero: overline, title, description, then only what isn't the
 * data-room door. Request access and View materials moved into the team card's
 * action slot on 2026-09-29 (SpvTeamSpotlight), so there is one door, not two.
 * The hero keeps Explore PL Network (button mode), the investor-profile button
 * for approved viewers, the pending stepper and the state messages.
 */
export type SpvHeroVariant =
  | 'landing' // signed out or signed in without a request (card: Request access)
  | 'pending' // requested, awaiting admin review
  | 'rejected' // request declined, no way to request again
  | 'openingSoon' // approved, spotlight still DRAFT
  | 'open' // approved, spotlight OPEN (card: View materials)
  | 'closed'; // spotlight CLOSED, for everyone

type Props = {
  variant: SpvHeroVariant;
  status: SpvStatus;
  email?: string;
  title: string;
  description: string;
  profileComplete: boolean;
  onEditProfile: () => void;
};

// The overline says where the Spotlight is, not where the viewer is — the
// viewer's own state goes in the message box under the buttons.
const OVERLINE: Record<SpvStatus, string> = {
  DRAFT: 'Opening soon',
  OPEN: 'Open',
  CLOSED: 'Closed',
};

export const SpvHero = ({ variant, status, email, title, description, profileComplete, onEditProfile }: Props) => {
  // Production's "Get in touch" opens the Contact support modal (a store). The
  // prototype keeps the words and drops the modal.
  const getInTouch = (label: string) => (
    <button type="button" className={s.inlineLink}>
      {label}
    </button>
  );

  // The investor-profile door for approved viewers, under the description: the
  // completed Demo Day's own text link (its "Give Feedback" — underlined brand
  // blue, icon after the words), not a hero button. It is about the investor,
  // never the page's main action (2026-09-29).
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
            Your request for this data room wasn&apos;t approved, so its materials aren&apos;t available to you. If you
            think this is a mistake, {getInTouch('get in touch')}.
          </>
        );
      case 'openingSoon':
        return (
          <>You&apos;re approved. We&apos;ll email you when this Spotlight opens and the deal materials go live.</>
        );
      case 'closed':
        return <>This Spotlight has closed and its materials are no longer available.</>;
      // Open + approved says nothing here: the card's View materials already
      // is the state.
      default:
        return null;
    }
  })();

  // Only the pending stepper and the state messages sit under the headline now:
  // the data-room action is in the team card, Explore is the tile under it, and
  // the profile link is part of the headline.
  const hasButtons = variant === 'pending' || !!message;

  return (
    <section className={d.heroSection}>
      <div className={d.titleContainer}>
        <div className={d.overline}>
          <div className={d.badge}>
            {status === 'OPEN' ? (
              <span className={s.openDot} aria-hidden />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="3.5" fill="#455468" />
              </svg>
            )}
            <span className={d.overlineText}>{OVERLINE[status]}</span>
          </div>
        </div>
        <div className={d.headline}>
          <h1 className={d.title}>{title}</h1>
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
