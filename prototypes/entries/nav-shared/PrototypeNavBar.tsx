'use client';

import React from 'react';
import clsx from 'clsx';
import { NavigationMenu } from '@base-ui-components/react';

import { NavItemWithMenu } from '@/components/core/navbar/components/NavItemWithMenu';
import {
  DIRECTORY_LINKS,
  EVENT_LINKS,
  JOBS_LINK,
  DEALS_LINK,
  FOUNDER_GUIDES_LINK,
} from '@/components/core/navbar/constants/navLinks';
import {
  AppLogo,
  HelpIcon,
  ForumIcon,
  EventsIcon,
  DemoDayIcon,
  DirectoryIcon,
  MoreIcon,
} from '@/components/core/navbar/components/icons';

// Reuse the production navbar styling 1:1 — every class below is production's.
import s from '@/components/core/navbar/NavBar.module.scss';
import signup from '@/components/core/navbar/components/Signup/Signup.module.scss';
import login from '@/components/core/navbar/components/LoginBtn/LoginButton.module.scss';
import local from './PrototypeNav.module.scss';

import { HomeIcon, BellIcon, SearchGlyph } from './icons';
import { LOGO_LABEL, scrollToTop } from './home';

/**
 * Copy of the production `Navbar` (components/core/navbar/nav-bar.tsx) with the
 * proposal applied: a **Home** item, first in the list, pointing at the same
 * `/home` the logo already points at. Labelled Home rather than News — it is
 * the landing page, and the feed is what's on it; the dot is what says the feed
 * moved. Identifiers below still say "news" because that's what the signal
 * counts, not what the item is called.
 *
 * The other half of the proposal is what this does to the **logo**. In
 * production the logo is the *only* route to the feed (`nav-bar.tsx:94`, an
 * unlabelled 48px SVG), which makes an unnamed glyph load-bearing. Here it
 * resolves to exactly where Home resolves and gains an accessible name, so it
 * becomes the redundant escape hatch a logo should be. The unread dot stays on
 * the labelled item and never rides the logo: a dot on a wordmark reads as a
 * badge on the whole app, which is not what it means.
 *
 * Shared (prototypes/entries/nav-shared/, no registry entry — like
 * follow-shared/): the item is the same proposal wherever a prototype needs the
 * header, so one copy rather than one per entry.
 *
 * Deliberately simplified — the real navbar reads the auth store, RBAC access
 * hooks and the notifications query to decide what to render; none of that
 * changes what this prototype is asking about, so the right-hand cluster
 * (search, bell, account) is static and the Demo Day / More items render their
 * un-gated variants. Everything on the left is the real component (
 * `NavItemWithMenu`) with the real link constants, so the new item is judged
 * next to its actual neighbours rather than approximations.
 */
interface PrototypeNavBarProps {
  /** Drives the unread dot on the News item. */
  hasUnreadNews: boolean;
  /** Where News goes. Omit on a page that handles the click itself. */
  newsHref?: string;
  /** Called on click — clears the dot on pages that own the feed. */
  onNewsClick?: () => void;
  /** Whether this page *is* Home. Marks the item for assistive tech. */
  active?: boolean;
  /** Re-selecting Home while on Home: refresh in place instead of navigating. */
  onHomeReselect?: () => void;
  /**
   * Defaults to true — the static signed-in cluster is what every entry sharing
   * this file already shows, so opting out is the new behaviour, not the norm.
   * Set false on a page reviewing what a logged-out visitor sees: leaving an
   * account avatar over a "sign in" page makes the state incoherent.
   */
  isLoggedIn?: boolean;
  /** What Sign up / Sign in do while `isLoggedIn` is false. */
  onSignIn?: () => void;
}

export function PrototypeNavBar({
  hasUnreadNews,
  newsHref,
  onNewsClick,
  active = false,
  onHomeReselect,
  isLoggedIn = true,
  onSignIn,
}: PrototypeNavBarProps) {
  const label = hasUnreadNews ? 'Home, new items since your last visit' : 'Home';
  const inner = (
    <>
      <HomeIcon /> Home
      {/* A dot, never a count: a number turns an ambient feed into a backlog you
          owe, and is always slightly wrong besides. */}
      {hasUnreadNews && <span className={local.navDot} aria-hidden="true" />}
    </>
  );

  /* Tapping Home while already on Home is the standard feed gesture: go to the
     top and pull, don't re-navigate to the page you're looking at. Note this
     lives on the labelled item, not the logo — a logo that behaves differently
     depending on the page is a novelty nobody goes looking for. */
  const onHomeActivate = (e: React.MouseEvent) => {
    // Fires on both paths: "you went to the feed" is true whether you travelled
    // there or were already standing on it, and that's what clears the dot.
    onNewsClick?.();
    if (!active) return;
    e.preventDefault();
    scrollToTop();
    onHomeReselect?.();
  };

  /* `data-prototype-chrome` is the marker the stylesheet keys the
     production-chrome hide off — see PrototypeNav.module.scss. It has to sit on
     an element that unmounts with the route, not on <body>. */
  return (
    <header className={local.headerShell} data-prototype-chrome>
      <NavigationMenu.Root className={s.Root}>
        <NavigationMenu.List className={s.List}>
          {/* Same destination as Home, one of them labelled. `newsHref` absent
              means the page clears the dot in place, so the logo does what Home
              does there too rather than dead-ending on `#`. */}
          {newsHref ? (
            <a href={newsHref} className={s.logoWrapper} aria-label={LOGO_LABEL} onClick={onHomeActivate}>
              <AppLogo />
            </a>
          ) : (
            <button
              type="button"
              className={clsx(s.logoWrapper, local.logoButton)}
              aria-label={LOGO_LABEL}
              onClick={onHomeActivate}
            >
              <AppLogo />
            </button>
          )}

          {/* The proposal. Same markup as the Forum item below — no new pattern,
              no new route, and no active-state styling, because production's nav
              items don't have one. `aria-current` carries the state instead: it
              costs no pixels and invents nothing. */}
          <NavigationMenu.Item className={s.menuItem}>
            {newsHref ? (
              <a
                className={clsx(s.Trigger, local.newsTrigger)}
                href={newsHref}
                onClick={onHomeActivate}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {inner}
              </a>
            ) : (
              <button
                type="button"
                className={clsx(s.Trigger, local.newsTrigger)}
                onClick={onHomeActivate}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {inner}
              </button>
            )}
          </NavigationMenu.Item>

          <NavItemWithMenu
            icon={<DirectoryIcon />}
            label="Directory"
            items={DIRECTORY_LINKS}
            onNavItemClickHandler={() => {}}
          />

          <NavItemWithMenu icon={<EventsIcon />} label="Events" items={EVENT_LINKS} onNavItemClickHandler={() => {}} />

          <NavigationMenu.Item className={s.menuItem}>
            <a className={s.Trigger} href="#" onClick={(e) => e.preventDefault()}>
              <ForumIcon /> Forum
            </a>
          </NavigationMenu.Item>

          <NavigationMenu.Item className={s.menuItem}>
            <a className={s.Trigger} href="#" onClick={(e) => e.preventDefault()}>
              <DemoDayIcon /> Demo Day
            </a>
          </NavigationMenu.Item>

          <NavItemWithMenu
            icon={<MoreIcon />}
            label="More"
            items={[JOBS_LINK, DEALS_LINK, FOUNDER_GUIDES_LINK]}
            onNavItemClickHandler={() => {}}
          />

          <div className={s.right}>
            <span className={local.navIconButton} aria-hidden="true">
              <SearchGlyph />
            </span>
            <div className={s.supportButton}>
              <HelpIcon />
            </div>
            {/* Logged out, the bell goes with the account: notifications with
                nobody to notify is a control that can't mean anything. Same shape
                production uses (nav-bar.tsx `.signInWrapper`), wearing the real
                Signup / LoginBtn stylesheets but wired to the page rather than to
                Privy — the entries using this switch viewer state locally, and a
                real login would navigate away from the thing under review. */}
            {isLoggedIn ? (
              <>
                <span className={local.navIconButton} aria-hidden="true">
                  <BellIcon />
                </span>
                <span className={local.navAvatar} aria-hidden="true">
                  PB
                </span>
              </>
            ) : (
              <div className={s.signInWrapper}>
                <button type="button" className={signup.root} onClick={onSignIn}>
                  Sign up
                </button>
                <button type="button" className={login.root} onClick={onSignIn}>
                  Sign in
                </button>
              </div>
            )}
          </div>
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </header>
  );
}
