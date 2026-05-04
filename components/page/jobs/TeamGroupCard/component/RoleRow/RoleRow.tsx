'use client';

import { HTMLProps } from 'react';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';

import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { ArrowIcon, ClockIcon } from './components/Icons';

import s from './RoleRow.module.scss';

interface RoleRowProps {
  role: IJobRole;
  onClick: () => void;
}

export function RoleRow(props: RoleRowProps) {
  const { role, onClick } = props;

  const { location, seniority, roleTitle, applyUrl, roleCategory } = role;

  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const locationDisplay = isEmpty(location) ? null : location.join(', ');

  const metaParts = [seniority ? seniorityDisplayLabel(seniority) : null, roleCategory, locationDisplay].filter(
    Boolean,
  );

  const linkProps: HTMLProps<HTMLAnchorElement> = applyUrl
    ? {
        href: applyUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        onClick: onClick,
      }
    : {};

  return (
    <a className={s.root} {...linkProps}>
      <div className={s.body}>
        <div className={s.title}>{roleTitle}</div>

        {!isEmpty(metaParts) && <div className={s.meta}>{metaParts.join(' · ')}</div>}
      </div>

      <div className={s.right}>
        {showNew && <span className={s.newBadge}>● New</span>}
        {relative && (
          <span className={s.relative}>
            <ClockIcon />
            {relative} ago
          </span>
        )}
        <ArrowIcon />
      </div>
    </a>
  );
}
