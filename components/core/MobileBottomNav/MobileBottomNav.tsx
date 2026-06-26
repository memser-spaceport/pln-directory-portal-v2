'use client';

import clsx from 'clsx';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  EVENT_LINKS,
  DEMO_DAY_LINK,
  DIRECTORY_LINKS,
  DEMO_DAY_ANALYTICS_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { MoreIcon, StarFourIcon } from '@/components/core/navbar/components/icons';
import { ISubItem } from '@/components/core/navbar/type';
import { useDemoDayAnalyticsAccess } from '@/services/rbac/hooks/useDemoDayAnalyticsAccess';
import { useMoreNavItems } from '@/components/core/navbar/components/navItems/MoreNavItems/hooks/useMoreNavItems';
import { useGetPlInfraNavItems } from '@/components/core/navbar/components/navItems/PLInfraNavItems/hook/useGetPlInfraNavItems';

import { NavigationMenu } from '@base-ui-components/react';

import { useScrollDirection } from './useScrollDirection';

import { MobileNavItemWithMenu } from './components/MobileMenuItem';
import { DemoDayIcon, DirectoryIcon, EventsIcon, ForumIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { hasAccess: hasDemoDayAnalyticsAccess } = useDemoDayAnalyticsAccess();

  const moreItems: ISubItem[] = useMoreNavItems();
  const plInfraItems: ISubItem[] = useGetPlInfraNavItems();

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
          <MobileNavItemWithMenu icon={<EventsIcon />} label="Events" items={EVENT_LINKS} />

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

          <MobileNavItemWithMenu icon={<MoreIcon />} label="More" items={moreItems} />
          <MobileNavItemWithMenu icon={<StarFourIcon />} label="PL Infra" items={plInfraItems} />
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
