'use client';

import React from 'react';
import { Button } from '@/components/common/Button';
import { NotePencilIcon } from '@/components/icons';
import { ArrowRight } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
// The completed Demo Day hero: overline badge, 56px title, body, buttons,
// links row, and the soft `.info` box, all from its own stylesheet.
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import { DISCOVER_PL_NETWORK_URL, type SpvStatus } from './mocks';
import { SpvAppliedSteps } from './SpvAppliedSteps';
import s from './SpvSpotlight.module.scss';

export type SpvHeroVariant =
  | 'landing' // signed out or signed in without an application — Apply
  | 'pending' // applied, awaiting admin review
  | 'rejected' // application declined — no way to re-apply
  | 'openingSoon' // approved, spotlight still DRAFT
  | 'open' // approved, spotlight OPEN — DocSend
  | 'closed'; // spotlight CLOSED, for everyone

type Props = {
  variant: SpvHeroVariant;
  status: SpvStatus;
  isLoggedIn: boolean;
  email?: string;
  title: string;
  description: string;
  onBrowseTeams: () => void;
  onApply: () => void;
  onSignIn: () => void;
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

export const SpvHero = ({
  variant,
  status,
  isLoggedIn,
  email,
  title,
  description,
  onBrowseTeams,
  onApply,
  onSignIn,
  profileComplete,
  onEditProfile,
}: Props) => {
  // Production's "Get in touch" opens the Contact support modal (a store). The
  // prototype keeps the words and drops the modal.
  const getInTouch = (label: string) => (
    <button type="button" className={s.inlineLink}>
      {label}
    </button>
  );

  const discover = (
    <a href={DISCOVER_PL_NETWORK_URL} target="_blank" rel="noopener noreferrer">
      <Button size="l" style="border" variant="secondary">
        Discover PL Network
      </Button>
    </a>
  );

  // The investor-profile door for approved applicants: a button in the hero's
  // row, labelled for what it does — set the profile up, or edit it once it
  // has something in it. Bordered beside Browse teams (that is the page's
  // primary on Open); filled when it is the only thing to do (Opening soon).
  const profileButton = (primary: boolean) => (
    <Button size="l" style={primary ? 'fill' : 'border'} variant={primary ? 'primary' : 'secondary'} onClick={onEditProfile}>
      <NotePencilIcon width={20} height={20} /> {profileComplete ? 'Edit investor profile' : 'Set up investor profile'}
    </Button>
  );

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
            Your application for this Spotlight wasn&apos;t approved, so its materials aren&apos;t available to you. If
            you think this is a mistake, {getInTouch('get in touch')}.
          </>
        );
      case 'openingSoon':
        return (
          <>You&apos;re approved. We&apos;ll email you when this Spotlight opens and the deal materials go live.</>
        );
      case 'closed':
        return <>This Spotlight has closed and its materials are no longer available.</>;
      // Open + approved says nothing here: the buttons and the teams' own
      // View materials already are the state.
      default:
        return null;
    }
  })();

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
        </div>
      </div>

      <div className={d.buttons}>
        {variant === 'landing' && (
          <>
            <div className={s.buttonRow}>
              <Button size="l" style="fill" variant="primary" onClick={onApply}>
                Apply to invest <ArrowRight />
              </Button>
              {discover}
            </div>
            {/* Twin-action rule: the sign-in door is a text link under the row,
                not a third button. Pre-approved investors (CSV upload) and anyone
                who already applied come in through here. */}
            {!isLoggedIn && (
              <p className={d.infoText}>
                Already applied or invited?{' '}
                <button type="button" className={s.inlineLink} onClick={onSignIn}>
                  Sign in
                </button>
              </p>
            )}
          </>
        )}

        {variant === 'open' && (
          <div className={s.buttonRow}>
            {/* Materials are per team now, so the hero's primary action points
                at the teams instead of one data room. */}
            <Button size="l" style="fill" variant="primary" onClick={onBrowseTeams}>
              Browse teams <ArrowDown />
            </Button>
            {profileButton(false)}
            {discover}
          </div>
        )}

        {/* Pending carries Discover inside the stepper, beside its profile CTA. */}
        {variant === 'openingSoon' && (
          <div className={s.buttonRow}>
            {profileButton(true)}
            {discover}
          </div>
        )}

        {(variant === 'rejected' || variant === 'closed') && discover}

        {variant === 'pending' && (
          <div className={s.appliedSteps}>
            <SpvAppliedSteps
              profileComplete={profileComplete}
              onProfile={onEditProfile}
              discoverUrl={DISCOVER_PL_NETWORK_URL}
            />
          </div>
        )}

        {message && (
          <div className={`${d.info} ${s.infoTight}`}>
            <p className={d.infoText}>{message}</p>
          </div>
        )}
      </div>
    </section>
  );
};


const ArrowDown = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M10 4v12M5 11l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
