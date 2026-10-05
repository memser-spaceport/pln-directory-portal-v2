'use client';

import React from 'react';
// The completed Demo Day hero: title, body, buttons, links row, and the soft
// `.info` box, all from its own stylesheet.
import clsx from 'clsx';
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
// The page's primary button (DemoDayActionButtons' Invest in Company).
import act from '@/components/page/demo-day/DemoDayActionButtons/DemoDayActionButtons.module.scss';
import { SpvAppliedSteps } from './SpvAppliedSteps';

import s from './SpvSpotlight.module.scss';

/**
 * The page's hero: title, description, then only what isn't the data-room
 * door. Request access and Request data room access live in the team card's action slot
 * (SpvTeamSpotlight), so there is one door, not two. The hero keeps the
 * investor-profile link, the pending stepper and the state messages.
 *
 * No status pill over the title (2026-09-29 review: "they don't add any
 * value"). Whether the data room is open is the card's action slot's to say,
 * and the closed / opening-soon messages below say the rest. The hero is kept
 * short so the team card starts higher (same review).
 */
export type SpvHeroVariant =
  // The token model (2026-10-01 standup): the page is only for invited
  // investors, so everyone else gets a locked state and no team.
  | 'lockedSignedOut' // no token, not logged in: sign in
  | 'lockedNoAccess' // logged in, not on this Spotlight's list
  | 'landing' // signed out or signed in without a request (card: Request access)
  | 'pending' // requested, awaiting admin review
  | 'rejected' // request declined, no way to request again
  | 'openingSoon' // approved, spotlight still DRAFT
  | 'open' // approved, spotlight OPEN (card: Request data room access)
  | 'closed'; // spotlight CLOSED, for everyone

type Props = {
  variant: SpvHeroVariant;
  title: string;
  description: string;
  profileComplete: boolean;
  onEditProfile: () => void;
  // Locked states only.
  email?: string;
  supportEmail?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
};

// Locked copy. It names nothing about the deal: no team, no SPV title, nothing
// a stranger holding the URL could read (2026-10-01: "everything else should be
// locked out so they don't actually see").
const lockedCopy = (variant: 'lockedSignedOut' | 'lockedNoAccess', email?: string) =>
  variant === 'lockedSignedOut'
    ? {
        title: 'Sign in to view this Spotlight',
        body: 'PL Spotlights are shared by invitation. Open the link in your invitation email, or sign in with the email it was sent to.',
      }
    : {
        title: 'You don’t have access to this Spotlight',
        // The email is quoted mid-sentence in a grey chip (review 2026-10-02:
        // as the sentence's first words it read as a stray fragment).
        body: email ? (
          <>
            You’re signed in as <span className={s.emailChip}>{email}</span>, which isn’t on the invitation list for
            this Spotlight. Sign in with the email your invitation was sent to, or contact us if you think this is a
            mistake.
          </>
        ) : (
          'This account isn’t on the invitation list for this Spotlight. Sign in with the email your invitation was sent to, or contact us if you think this is a mistake.'
        ),
      };

export const SpvHero = ({
  variant,
  title,
  description,
  profileComplete,
  onEditProfile,
  email,
  supportEmail,
  onSignIn,
  onSignOut,
}: Props) => {
  if (variant === 'lockedSignedOut' || variant === 'lockedNoAccess') {
    const copy = lockedCopy(variant, email);
    return (
      <section className={clsx(d.heroSection, s.heroCompact, s.heroLocked)}>
        <div className={d.titleContainer}>
          <div className={clsx(d.headline, s.lockHeadline)}>
            <span className={s.lockBadge} aria-hidden>
              <LockGlyph />
            </span>
            <h1 className={clsx(d.title, s.heroTitle)}>{copy.title}</h1>
            <p className={d.body}>{copy.body}</p>
          </div>
        </div>
        <div className={clsx(d.buttons, s.lockedButtons)}>
          <button
            type="button"
            className={clsx(act.primaryButton, s.cardActionButton)}
            onClick={variant === 'lockedSignedOut' ? onSignIn : onSignOut}
          >
            {variant === 'lockedSignedOut' ? 'Sign in' : 'Use a different account'}
          </button>
          {/* Questions go to Contact us, not an FAQ (2026-10-01). */}
          <a className={s.contactLink} href={`mailto:${supportEmail}`}>
            Contact us
          </a>
        </div>
      </section>
    );
  }

  // Production's "Get in touch" opens the Contact support modal (a store). The
  // prototype keeps the words and drops the modal.
  const getInTouch = (label: string) => (
    <button type="button" className={s.inlineLink}>
      {label}
    </button>
  );

  // No investor-profile link here any more: for invited viewers it is the team
  // card's secondary call to action (2026-10-01).

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
      // Open + approved says nothing here: the card's Request data room access already
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

const LockGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
