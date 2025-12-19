import React, { ReactNode } from 'react';
import { NavigationMenu } from '@base-ui-components/react';

import { ISubItem } from '@/components/core/navbar/type';

import { ChevronDownIcon } from '@/components/core/navbar/components/icons';

import { SubItem } from './components/SubItem';

import s from '@/components/core/navbar/NavBar.module.scss';

interface Props {
  icon: ReactNode;
  label: ReactNode;
  items: ISubItem[];
  onNavItemClickHandler: (href: string, title: string) => void;
}

export function NavItemWithMenu(props: Props) {
  const { icon, label, items, onNavItemClickHandler } = props;

  return (
    <NavigationMenu.Item className={s.menuItem}>
      <NavigationMenu.Trigger className={s.Trigger}>
        {icon} {label}
        <NavigationMenu.Icon className={s.Icon}>
          <ChevronDownIcon />
        </NavigationMenu.Icon>
      </NavigationMenu.Trigger>
      <NavigationMenu.Content className={s.Content}>
        <ul className={s.GridLinkList}>
          {items.map((item) => (
            <SubItem key={item.href} {...item} onNavItemClickHandler={onNavItemClickHandler} />
          ))}
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}
