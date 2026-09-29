'use client';

import React from 'react';
import clsx from 'clsx';
import { AppLogo } from '@/components/core/navbar/components/icons';
// Production's navbar shell: the white bar and its shadow, the 48px logo slot,
// the right-hand group and the item style (NavBar.module.scss). The component
// itself runs analytics, search, notifications and the account menu, so only
// its classes are used here.
import n from '@/components/core/navbar/NavBar.module.scss';
import s from './SpvSpotlight.module.scss';

type Props = {
  // The product's name beside the cube, as a site header carries one.
  label: string;
  supportEmail: string;
  // 'dark' over a black hero (Explore's Visual direction): the white bar
  // would cut the full-bleed sea in two.
  tone?: 'light' | 'dark';
};

/**
 * An ordinary top bar for the chromeless investor pages (SPV Spotlight and
 * Explore PL Network): logo and name on the left, one quiet action on the
 * right, a hairline under it, pinned while the page scrolls. Still no routes
 * into the app — the logo is not a link and there are no nav items; Request
 * access lives in the team card, so the bar doesn't repeat it.
 */
export const SpvNavBar = ({ label, supportEmail, tone = 'light' }: Props) => (
  <header className={clsx(n.Root, s.navBar, { [s.navBarDark]: tone === 'dark' })}>
    <div className={s.navBrand}>
      <span className={n.logoWrapper} aria-hidden>
        <AppLogo />
      </span>
      <span className={s.navLabel}>{label}</span>
    </div>
    <div className={n.right}>
      <a className={clsx(n.Trigger, s.navLink)} href={`mailto:${supportEmail}`}>
        Contact us
      </a>
    </div>
  </header>
);
