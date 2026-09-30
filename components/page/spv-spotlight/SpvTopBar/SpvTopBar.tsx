'use client';

import React from 'react';
import clsx from 'clsx';
import { AppLogo } from '@/components/core/navbar/components/icons';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import s from './SpvTopBar.module.scss';

type Props = {
  /** The product's name beside the cube. */
  label: string;
  /** Shows "Contact us" on the right. Pages that put it in their own body leave it out. */
  supportEmail?: string;
  /** Signed-in viewer: their avatar on the right, opening their profile. */
  user?: { uid: string; name?: string; profileImageUrl?: string } | null;
  /** 'dark' over a black page (the Explore landing). */
  tone?: 'light' | 'dark';
};

/**
 * The plain top bar of the chromeless investor pages: cube and name on the
 * left; on the right, Contact us and/or the signed-in viewer's avatar. The
 * logo isn't a link and there are no nav items; the avatar is the one way
 * into the app, to the viewer's own profile, in a new tab so the page stays.
 */
export const SpvTopBar = ({ label, supportEmail, user, tone = 'light' }: Props) => (
  <header className={clsx(s.root, { [s.dark]: tone === 'dark' })}>
    <div className={s.brand}>
      <span className={s.logo} aria-hidden>
        <AppLogo />
      </span>
      <span className={s.label}>{label}</span>
    </div>
    <div className={s.right}>
      {supportEmail && (
        <a className={s.link} href={`mailto:${supportEmail}`}>
          Contact us
        </a>
      )}
      {user?.uid && <ProfileAvatar user={user} />}
    </div>
  </header>
);

const ProfileAvatar = ({ user }: { user: NonNullable<Props['user']> }) => {
  const fallback = useDefaultAvatar(user.name);
  return (
    <a
      className={s.avatar}
      href={`/members/${user.uid}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Your profile"
      title="Your profile"
    >
      <img src={user.profileImageUrl || fallback} alt="" width={32} height={32} />
    </a>
  );
};
