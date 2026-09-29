import React from 'react';
import clsx from 'clsx';
import { AppLogo } from '@/components/core/navbar/components/icons';
import s from './SpvTopBar.module.scss';

type Props = {
  /** The product's name beside the cube. */
  label: string;
  supportEmail: string;
  /** 'dark' over a black page (the Explore landing). */
  tone?: 'light' | 'dark';
};

/**
 * The plain top bar of the chromeless investor pages: cube and name on the
 * left, Contact us on the right, pinned while the page scrolls. No routes into
 * the app: the logo isn't a link and there are no nav items.
 */
export const SpvTopBar = ({ label, supportEmail, tone = 'light' }: Props) => (
  <header className={clsx(s.root, { [s.dark]: tone === 'dark' })}>
    <div className={s.brand}>
      <span className={s.logo} aria-hidden>
        <AppLogo />
      </span>
      <span className={s.label}>{label}</span>
    </div>
    <a className={s.link} href={`mailto:${supportEmail}`}>
      Contact us
    </a>
  </header>
);
