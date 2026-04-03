'use client';

import clsx from 'clsx';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DIRECTORY_LINKS, EVENT_LINKS } from '@/components/core/navbar/constants/navLinks';
import { DealsIcon, FounderGuidesIcon, MoreIcon } from '@/components/core/navbar/components/icons';
import { ISubItem } from '@/components/core/navbar/type';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { useFounderGuidesAccess } from '@/services/rbac/hooks/useFounderGuidesAccess';

import { NavigationMenu } from '@base-ui-components/react';

import { useScrollDirection } from './useScrollDirection';

import { MobileNavItemWithMenu } from './components/MobileMenuItem';
import { DemoDayIcon, DirectoryIcon, EventsIcon, ForumIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

const navItems = [{ href: '/demoday', label: 'Demo Day', icon: DemoDayIcon }];

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { hasAccess: hasDealsPageAccess } = useDealsAccess();
  const { hasAccess: hasFounderGuidesAccess } = useFounderGuidesAccess();

  const moreItems: ISubItem[] = [
    { href: '/forum', title: 'Forum', icon: <ForumIcon /> },
    ...(hasDealsPageAccess ? [{ href: '/deals', title: 'Deals', icon: <DealsIcon /> }] : []),
    ...(hasFounderGuidesAccess ? [{ href: '/founder-guides', title: 'Founder Guides', icon: <FounderGuidesIcon /> }] : []),
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

          {/* Other Nav Items */}
          {navItems.map(({ href, label, icon: Icon }) => {
            return (
              <NavigationMenu.Item key={href}>
                <Link
                  href={href}
                  className={clsx(s.item, {
                    [s.itemActive]: href.includes(pathname),
                  })}
                >
                  <Icon />
                  <span>{label}</span>
                </Link>
              </NavigationMenu.Item>
            );
          })}

          <MobileNavItemWithMenu icon={<MoreIcon />} label="More" items={moreItems} />
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
