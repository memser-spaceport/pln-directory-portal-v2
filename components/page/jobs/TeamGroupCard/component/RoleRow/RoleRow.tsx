'use client';

import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';
import s from './RoleRow.module.scss';

interface RoleRowProps {
  role: IJobRole;
  onClick: () => void;
}

export function RoleRow({ role, onClick }: RoleRowProps) {
  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const metaParts = [
    role.seniority ? seniorityDisplayLabel(role.seniority) : null,
    role.roleCategory,
    role.location,
  ].filter(Boolean);

  const inner = (
    <>
      <div className={s.roleBody}>
        <div className={s.roleTitle}>{role.roleTitle}</div>
        {metaParts.length > 0 && <div className={s.roleMeta}>{metaParts.join(' · ')}</div>}
      </div>
      <div className={s.roleRight}>
        {showNew && <span className={s.newBadge}>● New</span>}
        {relative && <span className={s.relative}>{relative}</span>}
      </div>
    </>
  );

  return (
    <li className={s.roleItem}>
      {role.applyUrl ? (
        <a className={s.roleLink} href={role.applyUrl} target="_blank" rel="noopener noreferrer" onClick={onClick}>
          {inner}
        </a>
      ) : (
        <span className={s.roleLink}>{inner}</span>
      )}
    </li>
  );
}
