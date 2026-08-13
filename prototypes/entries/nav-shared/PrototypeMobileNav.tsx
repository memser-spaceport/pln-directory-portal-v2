'use client';

import clsx from 'clsx';
import React from 'react';
import { NavigationMenu } from '@base-ui-components/react';

import {
  EVENT_LINKS,
  DIRECTORY_LINKS,
  DEMO_DAY_LINK,
  FORUM_LINK,
  JOBS_LINK,
  DEALS_LINK,
  FOUNDER_GUIDES_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { MoreIcon } from '@/components/core/navbar/components/icons';
import { MobileNavItemWithMenu } from '@/components/core/MobileBottomNav/components/MobileMenuItem';
import { DemoDayIcon, DirectoryIcon, EventsIcon } from '@/components/core/MobileBottomNav/components/icons';

// Reuse the production bottom-bar styling 1:1.
import s from '@/components/core/MobileBottomNav/MobileBottomNav.module.scss';
import local from './PrototypeNav.module.scss';

import { HomeIcon } from './icons';
import { scrollToTop } from './home';

/**
 * Copy of the production `MobileBottomNav` with the same proposal applied.
 *
 * Worth looking at on its own terms: mobile has the *same* gap as desktop —
 * Directory / Events / Demo Day / More, no route to `/home` at all, and not
 * even a logo to fall back on. But the bar is a fixed row of slots, so adding
 * News costs something here that it doesn't on desktop: five items where there
 * were four (six for viewers who also see PL Infra). That crowding is the
 * decision this screen puts in front of you.
 *
 * Home is in the bar rather than left to the logo, and this is the load-bearing
 * half of the decision: below 960px the whole desktop nav row is `display:none`
 * (NavBar.module.scss:54), so today the feed lives entirely behind a 48px glyph
 * in the top-left — the hardest pixel on a phone to reach one-handed, and the
 * place the unread dot would have to live. The dot belongs where the thumb is.
 * The logo stays where it is, keeps the same link, and carries no dot; two
 * routes at opposite ends of the screen are fine as long as only one is
 * load-bearing.
 *
 * Six items would break this bar, and viewers who also see PL Infra would hit
 * six. Fold PL Infra into More for them rather than dropping Home — Home is for
 * everyone, PL Infra is for a subset, so the universal item takes the slot.
 * Not modelled here: this copy already drops the PL Infra slot (see below).
 *
 * Unlike the desktop navbar, this one *does* have an active state
 * (`.itemActive`), so the News item uses it rather than inventing one — on a
 * page that isn't the feed (`active={false}`) it renders like its neighbours.
 * Simplified the same way as the desktop copy: the RBAC-gated Demo Day
 * analytics variant and the PL Infra slot are dropped, and More carries a
 * static list.
 */
interface PrototypeMobileNavProps {
  hasUnreadNews: boolean;
  /** Where News goes. Omit on a page that handles the click itself. */
  newsHref?: string;
  onNewsClick?: () => void;
  /** Whether Home is the current page. Defaults off, matching PrototypeNavBar —
   *  the two bars answer the same question and must not disagree. */
  active?: boolean;
  /** Re-selecting Home while on Home: refresh in place instead of navigating. */
  onHomeReselect?: () => void;
}

export function PrototypeMobileNav({
  hasUnreadNews,
  newsHref,
  onNewsClick,
  active = false,
  onHomeReselect,
}: PrototypeMobileNavProps) {
  const className = clsx(s.item, { [s.itemActive]: active }, local.mobileNewsItem);
  const label = hasUnreadNews ? 'Home, new items since your last visit' : 'Home';
  const inner = (
    <>
      <HomeIcon size={24} />
      <span>Home</span>
      {hasUnreadNews && <span className={local.mobileNavDot} aria-hidden="true" />}
    </>
  );

  // Same gesture as the desktop item — tap Home on Home to go top and pull.
  const onHomeActivate = (e: React.MouseEvent) => {
    onNewsClick?.();
    if (!active) return;
    e.preventDefault();
    scrollToTop();
    onHomeReselect?.();
  };

  return (
    <div className={clsx(s.wrapper, local.mobileNav)} data-prototype-chrome>
      <NavigationMenu.Root style={{ width: '100%' }}>
        <NavigationMenu.List className={s.list}>
          <NavigationMenu.Item>
            {newsHref ? (
              <a
                className={className}
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
                className={className}
                onClick={onHomeActivate}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {inner}
              </button>
            )}
          </NavigationMenu.Item>

          <MobileNavItemWithMenu icon={<DirectoryIcon />} label="Directory" items={DIRECTORY_LINKS} />
          <MobileNavItemWithMenu icon={<EventsIcon />} label="Events" items={EVENT_LINKS} />
          <MobileNavItemWithMenu icon={<DemoDayIcon />} label="Demo Day" items={[DEMO_DAY_LINK]} />
          {/* Production seeds More with FORUM_LINK ahead of the RBAC-resolved
              list; the rest is static here. */}
          <MobileNavItemWithMenu
            icon={<MoreIcon />}
            label="More"
            items={[FORUM_LINK, JOBS_LINK, DEALS_LINK, FOUNDER_GUIDES_LINK]}
          />
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
