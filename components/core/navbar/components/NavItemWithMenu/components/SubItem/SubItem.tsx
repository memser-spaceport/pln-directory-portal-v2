import React from 'react';

import { ISubItem } from '@/components/core/navbar/type';
import { NavLink } from '@/components/core/navbar/components/NavLink';

import s from './SubItem.module.scss';

interface Props extends ISubItem {
  onNavItemClickHandler: (href: string, title: string) => void;
}

export function SubItem(props: Props) {
  const { href, title, icon, description, onNavItemClickHandler } = props;

  return (
    <li key={href}>
      <NavLink className={s.linkCard} href={href} onClick={() => onNavItemClickHandler(href, title)}>
        {icon}
        <div className={s.linkDetails}>
          <h3 className={s.linkTitle}>{title}</h3>
          <p className={s.linkDescription}>{description}</p>
        </div>
      </NavLink>
    </li>
  );
}
