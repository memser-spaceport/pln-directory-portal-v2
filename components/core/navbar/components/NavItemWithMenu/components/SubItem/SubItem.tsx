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
    <li>
      <NavLink className={s.linkCard} href={href} onClick={() => onNavItemClickHandler(href, title)}>
        {/* Title row: icon + label */}
        <div className={s.linkTitleRow}>
          {icon && <span className={s.linkIcon}>{icon}</span>}
          <h3 className={s.linkTitle}>{title}</h3>
        </div>
        {/* Description indented to align with title (32px = icon 20 + gap 12) */}
        {description && <p className={s.linkDescription}>{description}</p>}
      </NavLink>
    </li>
  );
}
