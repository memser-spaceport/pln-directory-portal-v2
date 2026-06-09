'use client';

import clsx from 'clsx';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  DIRECTORY_LINKS,
  EVENT_LINKS,
  DEMO_DAY_LINK,
  DEMO_DAY_ANALYTICS_LINK,
  JOBS_LINK,
  GANTRY_LINK,
  INVESTOR_DB_LINK,
  FOUNDER_DB_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { DealsIcon, FounderGuidesIcon, MoreIcon } from '@/components/core/navbar/components/icons';
import { ISubItem } from '@/components/core/navbar/type';
import { useFounderGuidesAccess } from '@/services/rbac/hooks/useFounderGuidesAccess';
import { useDemoDayAnalyticsAccess } from '@/services/rbac/hooks/useDemoDayAnalyticsAccess';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { useFoundersAccess } from '@/services/rbac/hooks/useFoundersAccess';

import { NavigationMenu } from '@base-ui-components/react';

import { useScrollDirection } from './useScrollDirection';

import { MobileNavItemWithMenu } from './components/MobileMenuItem';
import { DemoDayIcon, DirectoryIcon, EventsIcon, ForumIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { hasAccess: hasFounderGuidesAccess } = useFounderGuidesAccess();
  const { hasAccess: hasDemoDayAnalyticsAccess } = useDemoDayAnalyticsAccess();
  const { canView: hasGantryAccess } = useGantryAccess();
  const { canView: hasInvestorDbAccess } = useInvestorsAccess();
  const { canView: hasFounderDbAccess } = useFoundersAccess();

  const moreItems: ISubItem[] = [
    { href: '/forum', title: 'Forum', icon: <ForumIcon /> },
    { href: '/deals', title: 'Deals', icon: <DealsIcon /> },
    ...(hasFounderGuidesAccess
      ? [{ href: '/founder-guides', title: 'Founder Guides', icon: <FounderGuidesIcon /> }]
      : []),
    ...(hasGantryAccess ? [GANTRY_LINK] : []),
    ...(hasInvestorDbAccess ? [INVESTOR_DB_LINK] : []),
    ...(hasFounderDbAccess ? [FOUNDER_DB_LINK] : []),
    JOBS_LINK,
  ];

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
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
