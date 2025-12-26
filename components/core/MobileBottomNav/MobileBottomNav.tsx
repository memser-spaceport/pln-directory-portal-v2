'use client';

import clsx from 'clsx';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DIRECTORY_LINKS, EVENT_LINKS } from '@/components/core/navbar/constants/navLinks';

import { NavigationMenu } from '@base-ui-components/react';

import { useScrollDirection } from './useScrollDirection';

import { MobileNavItemWithMenu } from './components/MobileMenuItem';
import { EventsIcon, ForumIcon, DemoDayIcon, DirectoryIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

const navItems = [
  { href: '/forum?cid=0', label: 'Forum', icon: ForumIcon },
  { href: '/demoday', label: 'Demo Day', icon: DemoDayIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();

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
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}
