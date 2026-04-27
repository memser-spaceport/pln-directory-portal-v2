'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import { getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';
import { RoleRow } from './component/RoleRow';
import clsx from 'clsx';

import { buildFocusChips } from './utils/buildFocusChips';

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

  const chips = buildFocusChips(team.focusAreas, team.subFocusAreas, MAX_FOCUS_CHIPS);

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
          {chips.shown.length > 0 && (
            <div className={s.focusRow}>
              {chips.shown.map((chip) => (
                <span key={`${chip.kind}::${chip.title}`} className={`${s.focusChip} ${s[`focusChip_${chip.kind}`]}`}>
                  {chip.title}
                </span>
              ))}
              {chips.moreCount > 0 && (
                <span className={s.moreChipWrapper}>
                  <span className={clsx(s.focusChip, s.focusChip_sub)}>+{chips.moreCount}</span>
                  <div className={s.moreTooltip}>
                    {chips.hidden.map((chip) => (
                      <span
                        key={`${chip.kind}::${chip.title}`}
                        className={clsx(s.focusChip, s[`focusChip_${chip.kind}`])}
                      >
                        {chip.title}
                      </span>
                    ))}
                  </div>
                </span>
              )}
            </div>
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
