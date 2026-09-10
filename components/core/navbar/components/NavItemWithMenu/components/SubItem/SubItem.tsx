import React from 'react';

import { ISubItem } from '@/components/core/navbar/type';
import { NavLink } from '@/components/core/navbar/components/NavLink';
import { ArrowUpRightIcon } from '@/components/icons';

import s from './SubItem.module.scss';

interface Props extends ISubItem {
  onNavItemClickHandler: (href: string, title: string) => void;
}

export function SubItem(props: Props) {
  const { href, title, icon, description, external, onNavItemClickHandler } = props;

  return (
    <li key={href}>
      <NavLink
        className={s.linkCard}
        href={href}
        onClick={() => onNavItemClickHandler(href, title)}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {icon}
        <div className={s.linkDetails}>
          <h3 className={s.linkTitle}>
            {title}
            {external && <ArrowUpRightIcon className={s.externalIcon} />}
          </h3>
          <p className={s.linkDescription}>{description}</p>
        </div>
      </NavLink>
    </li>
  );
}
