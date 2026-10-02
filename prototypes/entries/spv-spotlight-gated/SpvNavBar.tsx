'use client';

import React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { Avatar } from '@base-ui-components/react/avatar';
import { AppLogo } from '@/components/core/navbar/components/icons';
// Production's navbar shell: the white bar and its shadow, the 48px logo slot,
// the right-hand group and the item style (NavBar.module.scss). The component
// itself runs analytics, search, notifications and the account menu, so only
// its classes are used here.
import n from '@/components/core/navbar/NavBar.module.scss';
// Production's account menu (avatar + chevron → popup), by its own classes.
import am from '@/components/core/navbar/components/AccountMenu/AccountMenu.module.scss';
// Production's signed-out Sign in (LoginBtn), by its class.
import login from '@/components/core/navbar/components/LoginBtn/LoginButton.module.scss';
import s from './SpvSpotlight.module.scss';

type Account = {
  name: string;
  avatar: string;
  // Production's first item goes to /members/<uid>. This page has no routes
  // into the app, so it opens the investor's own profile in the drawer.
  onProfile: () => void;
  onSignOut: () => void;
};

type Props = {
  // The product's name beside the cube, as a site header carries one.
  label: string;
  // Explore keeps Contact us in the bar. The SPV page moved it into the hero,
  // beside the investor-profile link, as PL Spotlight pairs them (2026-09-29).
  supportEmail?: string;
  // Signed-in viewers get production's avatar menu, so they can reach their
  // profile (2026-09-29 review).
  account?: Account;
  // Signed-out viewers get production's Sign in in the same corner (2026-09-29).
  onSignIn?: () => void;
  // 'dark' over a black hero (Explore's Visual direction): the white bar
  // would cut the full-bleed sea in two.
  tone?: 'light' | 'dark';
};

/**
 * An ordinary top bar for the chromeless investor pages (SPV Spotlight and
 * Explore PL Network): logo and name on the left, the account (or one quiet
 * action) on the right, pinned while the page scrolls. Still no routes into
 * the app — the logo is not a link and there are no nav items; Request access
 * lives in the team card, so the bar doesn't repeat it.
 */
export const SpvNavBar = ({ label, supportEmail, account, onSignIn, tone = 'light' }: Props) => (
  <header className={clsx(n.Root, s.navBar, { [s.navBarDark]: tone === 'dark' })}>
    <div className={s.navBrand}>
      <span className={n.logoWrapper} aria-hidden>
        <AppLogo />
      </span>
      <span className={s.navLabel}>{label}</span>
    </div>
    <div className={n.right}>
      {supportEmail && (
        <a className={clsx(n.Trigger, s.navLink)} href={`mailto:${supportEmail}`}>
          Contact us
        </a>
      )}
      {!account && onSignIn && (
        <button type="button" className={clsx(login.root, s.navSignIn)} onClick={onSignIn}>
          Sign in
        </button>
      )}
      {account && (
        <Menu.Root modal={false}>
          <Menu.Trigger className={am.Button} aria-label="Account">
            <Avatar.Root className={am.Avatar}>
              <Avatar.Image src={account.avatar} width="40" height="40" className={am.Image} />
              <Avatar.Fallback className={am.Fallback}>{account.name}</Avatar.Fallback>
            </Avatar.Root>
            <ChevronDownIcon className={am.ButtonIcon} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={clsx(am.Positioner, s.accountPositioner)} align="end" sideOffset={10}>
              <Menu.Popup className={am.Popup}>
                <Menu.Item className={am.Item} onClick={account.onProfile}>
                  <UserIcon /> {account.name}
                </Menu.Item>
                <Menu.Item className={am.Item} onClick={account.onSignOut}>
                  <LogoutIcon /> Sign out
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  </header>
);

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

// Production's account-menu glyphs, verbatim.
function UserIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8 3.8125C9.3125 3.8125 10.4062 4.90625 10.4062 6.21875C10.4062 7.55859 9.3125 8.625 8 8.625C6.66016 8.625 5.59375 7.55859 5.59375 6.21875C5.59375 4.90625 6.66016 3.8125 8 3.8125ZM8 7.3125C8.60156 7.3125 9.09375 6.84766 9.09375 6.21875C9.09375 5.61719 8.60156 5.125 8 5.125C7.37109 5.125 6.90625 5.61719 6.90625 6.21875C6.90625 6.84766 7.37109 7.3125 8 7.3125ZM8 0.75C11.8555 0.75 15 3.89453 15 7.75C15 11.6328 11.8555 14.75 8 14.75C4.11719 14.75 1 11.6328 1 7.75C1 3.89453 4.11719 0.75 8 0.75ZM8 13.4375C9.25781 13.4375 10.4336 13.0273 11.3906 12.3164C10.9258 11.4141 9.99609 10.8125 8.95703 10.8125H7.01562C5.97656 10.8125 5.04688 11.3867 4.58203 12.3164C5.53906 13.0273 6.71484 13.4375 8 13.4375ZM12.375 11.3867C13.1953 10.4023 13.6875 9.14453 13.6875 7.75C13.6875 4.63281 11.1172 2.0625 8 2.0625C4.85547 2.0625 2.3125 4.63281 2.3125 7.75C2.3125 9.14453 2.77734 10.4023 3.59766 11.3867C4.33594 10.2383 5.59375 9.5 7.01562 9.5H8.95703C10.3789 9.5 11.6367 10.2383 12.375 11.3867Z"
        fill="#64748B"
      />
    </svg>
  );
}

function LogoutIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5.59375 14.5625C5.94922 14.5625 6.25 14.8633 6.25 15.2188C6.25 15.6016 5.94922 15.875 5.59375 15.875H3.625C2.14844 15.875 1 14.7266 1 13.25V6.25C1 4.80078 2.14844 3.625 3.625 3.625H5.59375C5.94922 3.625 6.25 3.92578 6.25 4.28125C6.25 4.66406 5.94922 4.9375 5.59375 4.9375H3.625C2.88672 4.9375 2.3125 5.53906 2.3125 6.25V13.25C2.3125 13.9883 2.88672 14.5625 3.625 14.5625H5.59375ZM14.7539 9.28516C14.918 9.42188 15 9.58594 15 9.77734C15 9.96875 14.918 10.1328 14.7539 10.2695L10.5977 13.9062C10.4336 14.0703 10.2148 14.1523 9.99609 14.1523C9.85938 14.1523 9.72266 14.125 9.61328 14.0703C9.28516 13.9062 9.09375 13.6055 9.09375 13.25V11.7461H5.8125C5.18359 11.7461 4.71875 11.2539 4.71875 10.6523V8.90234C4.71875 8.27344 5.18359 7.80859 5.8125 7.80859H9.09375V6.27734C9.09375 5.92188 9.28516 5.62109 9.61328 5.45703C9.94141 5.32031 10.3242 5.375 10.5977 5.62109L14.7539 9.28516ZM10.4062 12.3203L13.332 9.75L10.4062 7.17969V9.09375H6.03125V10.4062H10.4062V12.3203Z"
        fill="#64748B"
      />
    </svg>
  );
}
