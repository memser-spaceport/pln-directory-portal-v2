'use client';

import Image from 'next/image';
import Link from 'next/link';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import { PAGE_ROUTES } from '@/utils/constants';
import { getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';
import { TagsList } from '@/components/common/profile/TagsList';

import { TeamNewsCountChip } from '@/components/page/team-news/TeamNewsCountChip';

import { useGetFocusTags } from './hooks/useGetFocusTags';

import { ReferRoleRow } from './component/ReferRoleRow';

import s from './TeamGroupCard.module.scss';
import { useCurrentUserStore } from '@/services/auth/store';

const INITIAL_ROLES_SHOWN = 3;
const MAX_FOCUS_CHIPS = 100;

interface TeamGroupCardProps {
  group: IJobTeamGroup;
  onRoleClick: (role: IJobRole, indexInGroup: number) => void;
  /** Open this team's news over the board, from its "N new posts" chip. */
  onOpenTeamNews?: (teamUid: string, teamName: string) => void;
}

export function TeamGroupCard({ group, onRoleClick, onOpenTeamNews }: TeamGroupCardProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const { team, roles, totalRoles } = group;

  const visibleRoles = expanded ? roles : roles.slice(0, INITIAL_ROLES_SHOWN);
  const newCount = roles.filter((r) => isNew(getJobDate(r))).length;

  const focusTags = useGetFocusTags(team);
  const currentUser = useCurrentUserStore((state) => state.currentUser);

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
          {/* The news chip rides the name row, where the prototype put it. It
              counts POSTS while the green badge in .countBlock counts new ROLES
              — two "new"s on one card, told apart by their nouns and by being
              visually unlike (grey chip with a blue dot vs a green pill). */}
          <div className={s.nameRow}>
            <h3 className={s.teamName}>
              <Link
                prefetch={false}
                href={`${PAGE_ROUTES.TEAMS}/${team.uid}?backTo=${encodeURIComponent(PAGE_ROUTES.JOBS)}`}
              >
                {team.name}
              </Link>
            </h3>
            {onOpenTeamNews && (
              <TeamNewsCountChip teamUid={team.uid} teamName={team.name} source="job-board" onOpen={onOpenTeamNews} />
            )}
          </div>
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
          <ReferRoleRow
            currentUser={currentUser}
            teamId={team.uid}
            teamName={team.name}
            key={role.uid}
            role={role}
            source="job-board"
            onClick={() => {
              onRoleClick(role, idx);
            }}
          />
        ))}
      </ul>

      {roles.length > INITIAL_ROLES_SHOWN && (
        <button type="button" className={s.expander} onClick={toggleExpanded}>
          {expanded ? 'Show less' : `View all ${roles.length} roles at ${team.name}`}
        </button>
      )}
    </article>
  );
}
