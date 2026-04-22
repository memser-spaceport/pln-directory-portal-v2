'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import { formatRelativeDays, isNew, seniorityDisplayLabel, teamInitials } from '@/utils/jobs.utils';
import s from './TeamGroupCard.module.scss';

const INITIAL_ROLES_SHOWN = 3;
const MAX_FOCUS_CHIPS = 4;

interface TeamGroupCardProps {
  group: IJobTeamGroup;
  onRoleClick: (role: IJobRole, indexInGroup: number) => void;
}

export default function TeamGroupCard({ group, onRoleClick }: TeamGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { team, roles, totalRoles } = group;

  const visibleRoles = expanded ? roles : roles.slice(0, INITIAL_ROLES_SHOWN);
  const hiddenCount = roles.length - visibleRoles.length;
  const newCount = roles.filter((r) => isNew(r.lastUpdated)).length;

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
              {chips.moreCount > 0 && <span className={s.focusMore}>+{chips.moreCount}</span>}
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

type FocusChip = { kind: 'focus' | 'sub'; title: string };

function buildFocusChips(
  focusAreas: string[],
  subFocusAreas: string[],
  max: number,
): { shown: FocusChip[]; moreCount: number } {
  const dedupedSub = subFocusAreas.filter((t) => !focusAreas.includes(t));
  const all: FocusChip[] = [
    ...focusAreas.map((title): FocusChip => ({ kind: 'focus', title })),
    ...dedupedSub.map((title): FocusChip => ({ kind: 'sub', title })),
  ];
  const shown = all.slice(0, max);
  const moreCount = Math.max(0, all.length - shown.length);
  return { shown, moreCount };
}

function RoleRow({ role, onClick }: { role: IJobRole; onClick: () => void }) {
  const relative = formatRelativeDays(role.lastUpdated);
  const showNew = isNew(role.lastUpdated);
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
