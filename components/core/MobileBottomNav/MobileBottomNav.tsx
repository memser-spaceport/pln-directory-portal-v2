'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NavigationMenu } from '@base-ui-components/react';
import { Menu } from '@base-ui-components/react/menu';
import Link from 'next/link';
import { DIRECTORY_LINKS } from '@/components/core/navbar/constants/navLinks';

import { useScrollDirection } from './useScrollDirection';

import { EventsIcon, ForumIcon, DemoDayIcon, DirectoryIcon } from './components/icons';

import s from './MobileBottomNav.module.scss';

const navItems = [
  { href: '/events', label: 'Events', icon: EventsIcon },
  { href: '/forum?cid=0', label: 'Forum', icon: ForumIcon },
  { href: '/demoday', label: 'Demo Day', icon: DemoDayIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();

  // Check if current path is a directory page
  const isDirectoryActive = DIRECTORY_LINKS.some((item) => pathname.startsWith(item.href));

  return (
    <div
      className={clsx(s.wrapper, {
        [s.hidden]: scrollDirection === 'down',
      })}
      id="mobile-bottom-nav"
    >
      <NavigationMenu.Root style={{ width: '100%' }}>
        <NavigationMenu.List className={s.list}>
          {/* Directory Item with Submenu */}
          <NavigationMenu.Item>
            <Menu.Root modal={false}>
              <Menu.Trigger className={clsx(s.item, isDirectoryActive && s.itemActive)}>
                <DirectoryIcon />
                <span>Directory</span>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner className={s.positioner} side="top" sideOffset={16} align="center">
                  <Menu.Popup className={s.popup}>
                    {DIRECTORY_LINKS.map(({ href, title, icon }) => (
                      <Link key={href} href={href}>
                        <Menu.Item
                          className={clsx(s.menuItem, pathname.startsWith(href) && s.menuItemActive)}
                        >
                          {icon}
                          <span>{title}</span>
                        </Menu.Item>
                      </Link>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </NavigationMenu.Item>

          {/* Other Nav Items */}
          {navItems.map(({ href, label, icon: Icon }) => {
            return (
              <NavigationMenu.Item key={href}>
                <Link href={href} className={clsx(s.item, href.includes(pathname) && s.itemActive)}>
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
