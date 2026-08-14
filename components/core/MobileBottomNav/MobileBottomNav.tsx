'use client';

import clsx from 'clsx';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  EVENT_LINKS,
  DEMO_DAY_LINK,
  DIRECTORY_LINKS,
  DEMO_DAY_ANALYTICS_LINK,
  FORUM_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { HomeIcon, MoreIcon, StarFourIcon } from '@/components/core/navbar/components/icons';
import { useHasNewNews } from '@/services/team-news/hooks/useHasNewNews';
import { ISubItem } from '@/components/core/navbar/type';
import { useDemoDayAnalyticsAccess } from '@/services/rbac/hooks/useDemoDayAnalyticsAccess';
import { useMoreNavItems } from '@/components/core/navbar/components/navItems/MoreNavItems/hooks/useMoreNavItems';
import { useGetPlInfraNavItems } from '@/components/core/navbar/components/navItems/PLInfraNavItems/hook/useGetPlInfraNavItems';
import { isBareRoute } from '@/utils/isBareRoute';

import { NavigationMenu } from '@base-ui-components/react';

import { useScrollDirection } from './useScrollDirection';

import { MobileNavItemWithMenu } from './components/MobileMenuItem';
import { DemoDayIcon, DirectoryIcon, EventsIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { hasAccess: hasDemoDayAnalyticsAccess } = useDemoDayAnalyticsAccess();

  const baseMoreItems = useMoreNavItems();
  const plInfraItems: ISubItem[] = useGetPlInfraNavItems();
  const hasNewNews = useHasNewNews();

  // Five slots, and PL Infra members need one of them for PL Infra — so Events
  // gives up the bar for them and moves into More. Everyone else keeps Events
  // where it is. EVENT_LINKS spreads flat because More is a flat list.
  const hasPlInfra = plInfraItems.length > 0;
  const moreItems = useMemo(
    () => (hasPlInfra ? [FORUM_LINK, ...EVENT_LINKS, ...baseMoreItems] : [FORUM_LINK, ...baseMoreItems]),
    [hasPlInfra, baseMoreItems],
  );

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
          <MobileNavItemWithMenu icon={<DirectoryIcon />} label="Directory" items={DIRECTORY_LINKS} />

          {/* Slot 2 belongs to PL Infra for the members who have it, Events for
              everyone else. `plInfraItems` comes from async permissions, so this
              renders Events first and swaps once they resolve — a swap, not a
              gap, which is why the slot is never left empty. */}
          {hasPlInfra ? (
            <MobileNavItemWithMenu icon={<StarFourIcon />} label="PL Infra" items={plInfraItems} />
          ) : (
            <MobileNavItemWithMenu icon={<EventsIcon />} label="Events" items={EVENT_LINKS} />
          )}

          <NavigationMenu.Item>
            <Link
              href="/home"
              className={clsx(s.item, {
                [s.itemActive]: pathname.startsWith('/home'),
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
            />
          ) : (
            <NavigationMenu.Item>
              <Link
                href="/demoday"
                className={clsx(s.item, {
                  [s.itemActive]: pathname.startsWith('/demoday'),
                })}
              >
                <DemoDayIcon />
                <span>Demo Day</span>
              </Link>
            </NavigationMenu.Item>
          )}

          {moreItems.length > 0 && <MobileNavItemWithMenu icon={<MoreIcon />} label="More" items={moreItems} />}
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
