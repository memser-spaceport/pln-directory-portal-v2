import clsx from 'clsx';
import Link from 'next/link';
import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { ISubItem } from '@/components/core/navbar/type';

import { Menu } from '@base-ui-components/react/menu';
import { NavigationMenu } from '@base-ui-components/react';

import s from '@/components/core/MobileBottomNav/MobileBottomNav.module.scss';

interface Props {
  icon: ReactNode;
  label: ReactNode;
  items: ISubItem[];
}

export function MobileNavItemWithMenu(props: Props) {
  const { icon, label, items } = props;

  const pathname = usePathname();

  const isActive = items.some((item) => pathname.startsWith(item.href));

  return (
    <NavigationMenu.Item>
      <Menu.Root modal={false}>
        <Menu.Trigger
          className={clsx(s.item, {
            [s.itemActive]: isActive,
          })}
        >
          {icon}
          <span>{label}</span>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={s.positioner} side="top" sideOffset={16} align="center">
            <Menu.Popup className={s.popup}>
              {items.map((item, index) => {
                const { href, title, icon } = item;
                const showSection =
                  item.section != null &&
                  item.section !== '' &&
                  (index === 0 || items[index - 1]?.section !== item.section);
                return (
                  <React.Fragment key={href}>
                    {showSection && <div className={s.menuSectionLabel}>{item.section}</div>}
                    <Link href={href}>
                      <Menu.Item className={clsx(s.menuItem, pathname.startsWith(href) && s.menuItemActive)}>
                        {icon}
                        <span>{title}</span>
                      </Menu.Item>
                    </Link>
                  </React.Fragment>
                );
              })}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </NavigationMenu.Item>
  );
}
