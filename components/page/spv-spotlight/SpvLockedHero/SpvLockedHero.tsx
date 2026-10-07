'use client';

import React from 'react';
import { spvPrimaryButtonClassName } from '../SpvTeamCard/SpvTeamCard';
import s from './SpvLockedHero.module.scss';

type Props = {
  variant: 'lockedSignedOut' | 'lockedNoAccess';
  onSignIn: () => void;
  onContactUs: () => void;
};

// Names nothing about the deal (no team, no title): a stranger holding the URL
// reads only this. Not invited: no "use another account" and no email address,
// just that this account has no access and Contact us (review 2026-10-05).
const COPY = {
  lockedSignedOut: {
    title: 'Sign in to view this Spotlight',
    body: 'PL Spotlights are shared by invitation. Open the link in your invitation email, or sign in with the email it was sent to.',
  },
  lockedNoAccess: {
    title: 'You don’t have access to this Spotlight',
    body: 'PL Spotlights are shared by invitation. If you think you should have access, contact us.',
  },
};

/**
 * The hero for a viewer who may not see the Spotlight. Signed out: Sign in, with
 * Contact us beside it. Signed in but not invited: Contact us is all that's left,
 * so it is the one filled button.
 */
export const SpvLockedHero = ({ variant, onSignIn, onContactUs }: Props) => {
  const copy = COPY[variant];
  return (
    <section className={s.root}>
      <div className={s.headline}>
        <span className={s.lockBadge} aria-hidden>
          <LockGlyph />
        </span>
        <h1 className={s.title}>{copy.title}</h1>
        <p className={s.body}>{copy.body}</p>
      </div>
      <div className={s.buttons}>
        {variant === 'lockedSignedOut' ? (
          <>
            <button type="button" className={spvPrimaryButtonClassName} onClick={onSignIn}>
              Sign in
            </button>
            <button type="button" className={s.contactLink} onClick={onContactUs}>
              Contact us
            </button>
          </>
        ) : (
          <button type="button" className={spvPrimaryButtonClassName} onClick={onContactUs}>
            Contact us
          </button>
        )}
      </div>
    </section>
  );
};

const LockGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
