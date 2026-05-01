'use client';

import Image from 'next/image';
import { useState } from 'react';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import { getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';
import { TagsList } from '@/components/common/profile/TagsList';

import { useGetFocusTags } from './hooks/useGetFocusTags';

import { RoleRow } from './component/RoleRow';

import s from './TeamGroupCard.module.scss';

const INITIAL_ROLES_SHOWN = 3;
const MAX_FOCUS_CHIPS = 4;

interface TeamGroupCardProps {
  group: IJobTeamGroup;
  onRoleClick: (role: IJobRole, indexInGroup: number) => void;
}

export function TeamGroupCard({ group, onRoleClick }: TeamGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { team, roles, totalRoles } = group;

  const visibleRoles = expanded ? roles : roles.slice(0, INITIAL_ROLES_SHOWN);
  const hiddenCount = roles.length - visibleRoles.length;
  const newCount = roles.filter((r) => isNew(getJobDate(r))).length;

  const focusTags = useGetFocusTags(team);

  return (
    <article className={s.card}>
      <header className={s.header}>
        <div className={s.avatar}>
          {team.logoUrl ? (
            <Image src={team.logoUrl} alt={team.name} width={56} height={56} className={s.avatarImage} />
          ) : (
            <span className={s.avatarInitials}>{teamInitials(team.name)}</span>
          )}
        </div>

        <div className={s.headerMain}>
          <h3 className={s.teamName}>{team.name}</h3>
          {!isEmpty(focusTags) && (
            <TagsList tags={focusTags} tagsToShow={MAX_FOCUS_CHIPS} classes={{ root: s.focusRow, tag: s.focusTag }} />
          )}
        </div>

        <div className={s.countBlock}>
          <div className={s.countNumber}>{totalRoles}</div>
          <div className={s.countLabel}>{totalRoles === 1 ? 'open role' : 'open roles'}</div>
          {newCount > 0 && <div className={s.newCount}>+{newCount} new</div>}
        </div>
      </header>

      <ul className={s.roleList}>
        {visibleRoles.map((role, idx) => (
          <RoleRow
            key={role.uid}
            role={role}
            onClick={() => {
              onRoleClick(role, idx);
            }}
          />
        ))}
      </ul>

      {hiddenCount > 0 && !expanded && (
        <button type="button" className={s.expander} onClick={() => setExpanded(true)}>
          View all {roles.length} roles at {team.name} →
        </button>
      )}
      {expanded && roles.length > INITIAL_ROLES_SHOWN && (
        <button type="button" className={s.expander} onClick={() => setExpanded(false)}>
          Show less
        </button>
      )}
    </article>
  );
}
