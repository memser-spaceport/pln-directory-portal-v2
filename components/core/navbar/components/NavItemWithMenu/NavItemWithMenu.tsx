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

  // Group items by section when sections exist
  const hasSections = items.some((item) => item.section != null && item.section !== '');

  let content: ReactNode;

  if (hasSections) {
    // Build ordered column groups, preserving insertion order
    const groupOrder: string[] = [];
    const groupMap = new Map<string, ISubItem[]>();

    items.forEach((item) => {
      const key = item.section ?? '__none__';
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
        groupOrder.push(key);
      }
      groupMap.get(key)!.push(item);
    });

    const columns = groupOrder.map((key) => ({
      label: key === '__none__' ? null : key,
      items: groupMap.get(key)!,
    }));

    content = (
      <div className={s.GridLinkListMultiCol}>
        {columns.map((col, colIdx) => (
          <React.Fragment key={col.label ?? '__none__'}>
            {colIdx > 0 && <div className={s.GridLinkListVertDivider} />}
            <ul className={s.GridLinkListCol}>
              {col.label && (
                <li className={s.submenuSection} role="presentation">
                  <span className={s.submenuSectionLabel}>{col.label}</span>
                </li>
              )}
              {col.items.map((item) => (
                <SubItem key={item.href} {...item} onNavItemClickHandler={onNavItemClickHandler} />
              ))}
            </ul>
          </React.Fragment>
        ))}
      </div>
    );
  } else {
    content = (
      <ul className={s.GridLinkList}>
        {items.map((item) => (
          <SubItem key={item.href} {...item} onNavItemClickHandler={onNavItemClickHandler} />
        ))}
      </ul>
    );
  }

  return (
    <NavigationMenu.Item className={s.menuItem}>
      <NavigationMenu.Trigger className={s.Trigger}>
        {icon} {label}
        <NavigationMenu.Icon className={s.Icon}>
          <ChevronDownIcon />
        </NavigationMenu.Icon>
      </NavigationMenu.Trigger>
      <NavigationMenu.Content className={s.Content}>
        {content}
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}
