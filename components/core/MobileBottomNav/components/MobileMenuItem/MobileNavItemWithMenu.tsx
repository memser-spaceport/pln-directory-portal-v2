import clsx from 'clsx';
import Link from 'next/link';
import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { Menu } from '@base-ui-components/react/menu';

import s from '@/components/core/MobileBottomNav/MobileBottomNav.module.scss';

interface Props {
  href: string;
  title: string;
  icon: ReactNode;
}

export function MobileNavItemWithMenu(props: Props) {
  const { href, title, icon } = props;

  const pathname = usePathname();

  return (
    <Link key={href} href={href}>
      <Menu.Item
        className={clsx(s.menuItem, pathname.startsWith(href) && s.menuItemActive)}
      >
        {icon}
        <span>{title}</span>
      </Menu.Item>
    </Link>
  )
}
