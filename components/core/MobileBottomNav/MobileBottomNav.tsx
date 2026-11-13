'use client';

import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

import {
  DEMO_DAY_LINK,
  DIRECTORY_LINKS,
  DEMO_DAY_ANALYTICS_LINK,
  FORUM_LINK,
  JOBS_LINK,
  DEALS_LINK,
  FOUNDER_GUIDES_LINK,
  PLAA_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { HomeIcon, MoreIcon, StarFourIcon } from '@/components/core/navbar/components/icons';
import { useHasNewNews } from '@/services/team-news/hooks/useHasNewNews';
import { ISubItem } from '@/components/core/navbar/type';
import { useDemoDayAnalyticsAccess } from '@/services/rbac/hooks/useDemoDayAnalyticsAccess';
import { useMoreNavItems } from '@/components/core/navbar/components/navItems/MoreNavItems/hooks/useMoreNavItems';
import { useGetPlInfraNavItems } from '@/components/core/navbar/components/navItems/PLInfraNavItems/hook/useGetPlInfraNavItems';
import { isBareRoute } from '@/utils/isBareRoute';
import { PUBLISHED_AI_APPS_PATH } from '@/services/ai-apps/constants';

import { NavigationMenu } from '@base-ui-components/react';

import { useScrollDirection } from './useScrollDirection';

import { MobileNavItemWithMenu } from './components/MobileMenuItem';
import { DemoDayIcon, DirectoryIcon, JobsIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

/** More is one flat list on mobile — no sub-menus — so it sets its own order
 *  instead of inheriting the desktop menu's. Matched by href prefix so the
 *  three Events links rank together as one block. LAB-3172 swapped Job Board
 *  and Events: Events leads, and Job Board (only here for PL Infra members)
 *  takes Events' old place after Forum. AI Apps published to the member
 *  (LAB-3200) close the named block, as they do on desktop. */
const MORE_ORDER = [
  '/events',
  DEALS_LINK.href,
  FORUM_LINK.href,
  JOBS_LINK.href,
  PLAA_LINK.href,
  `${PUBLISHED_AI_APPS_PATH}/`,
];

function moreRank({ href }: ISubItem) {
  // Founder Guides sits last by request, below anything this list doesn't name.
  if (href.startsWith(FOUNDER_GUIDES_LINK.href)) return MORE_ORDER.length + 1;

  const rank = MORE_ORDER.findIndex((prefix) => href.startsWith(prefix));
  return rank === -1 ? MORE_ORDER.length : rank;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { hasAccess: hasDemoDayAnalyticsAccess } = useDemoDayAnalyticsAccess();

  const baseMoreItems = useMoreNavItems();
  const plInfraItems: ISubItem[] = useGetPlInfraNavItems();
  const hasNewNews = useHasNewNews();

  const analytics = useCommonAnalytics();
  const currentUser = useCurrentUserStore((state) => state.currentUser);

  // This bar reported nothing at all until now, so mobile navigation was
  // invisible in analytics. It reuses the desktop bar's event rather than
  // minting a mobile-only one — the question is which destinations members
  // reach, and splitting that by bar would need every report to union two
  // events to answer it.
  const onNavItemClickHandler = useCallback(
    (href: string, title: string) => {
      if (pathname === href) return;
      analytics.onNavItemClicked(title, getAnalyticsUserInfo(currentUser));
    },
    [analytics, currentUser, pathname],
  );

  // The dot's impression is reported by the desktop navbar alone (both bars
  // stay mounted at every width), so this only adds the click side.
  const onHomeClick = useCallback(() => {
    if (pathname === '/') return;
    analytics.onHomeNavClicked('mobile-nav', hasNewNews);
    analytics.onNavItemClicked('Home', getAnalyticsUserInfo(currentUser));
  }, [analytics, currentUser, hasNewNews, pathname]);

  // Five slots, and PL Infra members need one of them for PL Infra — so Job
  // Board gives up the bar for them and moves into More. Everyone else keeps
  // Job Board where it is. The Events links come flat from the shared More hook.
  const hasPlInfra = plInfraItems.length > 0;
  const moreItems = useMemo(() => {
    const items = hasPlInfra ? [FORUM_LINK, JOBS_LINK, ...baseMoreItems] : [FORUM_LINK, ...baseMoreItems];

    // Stable sort, so the Events links keep their own relative order.
    return [...items].sort((a, b) => moreRank(a) - moreRank(b));
  }, [hasPlInfra, baseMoreItems]);

  if (isBareRoute(pathname)) return null;

  return (
    <div
      className={clsx(s.wrapper, {
        [s.hidden]: scrollDirection === 'down',
      })}
      id="mobile-bottom-nav"
    >
      <NavigationMenu.Root style={{ width: '100%' }}>
        <NavigationMenu.List className={s.list}>
          <MobileNavItemWithMenu
            icon={<DirectoryIcon />}
            label="Directory"
            items={DIRECTORY_LINKS}
            onNavItemClickHandler={onNavItemClickHandler}
          />

          {/* Slot 2 belongs to PL Infra for the members who have it, Job Board
              for everyone else (LAB-3172: it was Events). `plInfraItems` comes
              from async permissions, so this renders Job Board first and swaps
              once they resolve — a swap, not a gap, which is why the slot is
              never left empty. */}
          {hasPlInfra ? (
            <MobileNavItemWithMenu
              icon={<StarFourIcon />}
              label="PL Infra"
              items={plInfraItems}
              onNavItemClickHandler={onNavItemClickHandler}
            />
          ) : (
            <NavigationMenu.Item>
              <Link
                href={JOBS_LINK.href}
                onClick={() => onNavItemClickHandler(JOBS_LINK.href, JOBS_LINK.title)}
                className={clsx(s.item, {
                  [s.itemActive]: pathname.startsWith(JOBS_LINK.href),
                })}
              >
                <JobsIcon />
                <span>{JOBS_LINK.title}</span>
              </Link>
            </NavigationMenu.Item>
          )}

          <NavigationMenu.Item>
            <Link
              href="/"
              onClick={onHomeClick}
              className={clsx(s.item, {
                [s.itemActive]: pathname === '/',
              })}
            >
              <span className={s.iconWithDot}>
                <HomeIcon />
                {hasNewNews && <span className={s.newsDot} aria-hidden />}
              </span>
              <span>Home</span>
              {hasNewNews && <span className={s.srOnly}>New news</span>}
            </Link>
          </NavigationMenu.Item>

          {hasDemoDayAnalyticsAccess ? (
            <MobileNavItemWithMenu
              icon={<DemoDayIcon />}
              label="Demo Day"
              items={[DEMO_DAY_LINK, DEMO_DAY_ANALYTICS_LINK]}
              onNavItemClickHandler={onNavItemClickHandler}
            />
          ) : (
            <NavigationMenu.Item>
              <Link
                href="/demoday"
                onClick={() => onNavItemClickHandler('/demoday', 'Demo Day')}
                className={clsx(s.item, {
                  [s.itemActive]: pathname.startsWith('/demoday'),
                })}
              >
                <DemoDayIcon />
                <span>Demo Day</span>
              </Link>
            </NavigationMenu.Item>
          )}

          {moreItems.length > 0 && (
            <MobileNavItemWithMenu
              icon={<MoreIcon />}
              label="More"
              items={moreItems}
              onNavItemClickHandler={onNavItemClickHandler}
            />
          )}
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
