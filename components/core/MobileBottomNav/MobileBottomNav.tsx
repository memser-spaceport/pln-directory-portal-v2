'use client';

import clsx from 'clsx';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

import { DIRECTORY_LINKS, EVENT_LINKS } from '@/components/core/navbar/constants/navLinks';
import { hasDealsAccess } from '@/utils/user/hasDealsAccess';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';

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
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  const directoryLinks = useMemo(
    () => DIRECTORY_LINKS.filter((link) => (link.href === '/deals' ? hasDealsAccess(userInfo) : true)),
    [userInfo]
  );

  return (
    <div
      className={clsx(s.wrapper, {
        [s.hidden]: scrollDirection === 'down',
      })}
      id="mobile-bottom-nav"
    >
      <NavigationMenu.Root style={{ width: '100%' }}>
        <NavigationMenu.List className={s.list}>
          <MobileNavItemWithMenu icon={<DirectoryIcon />} label="Directory" items={directoryLinks} />
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
