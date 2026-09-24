'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';
import { PAGE_ROUTES } from '@/utils/constants';
import { getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';
import { TagsList } from '@/components/common/profile/TagsList';

import { TeamNewsCountChip } from '@/components/page/team-news/TeamNewsCountChip';

import { useGetFocusTags } from './hooks/useGetFocusTags';

import { ReferRoleRow, type RowApplyProps, type RowSaveProps } from './component/ReferRoleRow';
import { OpenRoleRow } from './component/OpenRoleRow';
import { isProtocolLabsTeam } from '@/services/jobs/protocol-labs-team';

import s from './TeamGroupCard.module.scss';
import { useCurrentUserStore } from '@/services/auth/store';

const INITIAL_ROLES_SHOWN = 3;
const MAX_FOCUS_CHIPS = 100;

interface TeamGroupCardProps {
  group: IJobTeamGroup;
  /** This group's index in the board list — passed back through `onRoleClick` so
   *  the host can keep ONE stable callback instead of a closure per card (the
   *  card is memoized; per-card closures would defeat it). */
  groupIndex?: number;
  onRoleClick: (role: IJobRole, indexInGroup: number, group: IJobTeamGroup, groupIndex: number) => void;
  /** Open this team's news over the board, from its "N new posts" chip. */
  onOpenTeamNews?: (teamUid: string, teamName: string) => void;
  /** In-app apply wiring, threaded to rows. Presence is the gate — see RowApplyProps. */
  apply?: RowApplyProps;
  /**
   * Bookmarking, threaded to rows. Presence is the gate, as with `apply`.
   *
   * Which rows offer it is decided here rather than by the host, as with
   * `openRole`: it turns on a fact about the team, and a member does not
   * bookmark their own team's postings.
   */
  save?: RowSaveProps & {
    /** Every team the member belongs to, as a member or a lead. */
    memberTeamUids: Set<string>;
  };
  /**
   * The open-role signal — "I want to work here, and none of these fit".
   *
   * Presence is the gate, as with `apply`: a host that omits it gets the card it
   * always had. Which *teams* offer it is decided here rather than by the host,
   * because it is a fact about the team and the card is what holds one — Phase 1
   * is Protocol Labs only (LAB-2439), so one `isProtocolLabsTeam` test keeps
   * every host consistent instead of each remembering the rule.
   */
  openRole?: {
    onExpressInterest: (team: IJobTeam) => void;
    /** The team whose press is in flight, if any. */
    pendingTeamUid?: string | null;
  };
}

function TeamGroupCardImpl({
  group,
  groupIndex = 0,
  onRoleClick,
  onOpenTeamNews,
  apply,
  save,
  openRole,
}: TeamGroupCardProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const { team, roles, totalRoles } = group;

  const visibleRoles = expanded ? roles : roles.slice(0, INITIAL_ROLES_SHOWN);
  const newCount = roles.filter((r) => isNew(getJobDate(r))).length;

  const focusTags = useGetFocusTags(team);
  /* Protocol Labs is both the team whose card wears the brand hairline and the
     only team offering the open-role signal in Phase 1 — one test, read twice,
     so the two can never disagree about which card is PL's. */
  const isProtocolLabs = isProtocolLabsTeam(team);
  const showOpenRole = Boolean(openRole) && isProtocolLabs;
  const currentUser = useCurrentUserStore((state) => state.currentUser);
  const rowSave =
    save && !save.memberTeamUids.has(team.uid) ? { memberUid: save.memberUid, savedScope: save.savedScope } : undefined;

  return (
    <article className={clsx(s.card, isProtocolLabs && s.plCard)}>
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
            team={team}
            key={role.uid}
            role={role}
            source="job-board"
            apply={apply}
            save={rowSave}
            onClick={() => {
              onRoleClick(role, idx, group, groupIndex);
            }}
          />
        ))}
      </ul>

      {/* Under the postings, inside the card, and outside the <ul>: it is not a
          role, so it is not a list item. Drawn after the visible roles rather
          than after the expander, because it answers the list — "none of these"
          reads as a reply to what was just shown, not as a footer under a
          control. */}
      {showOpenRole && (
        <OpenRoleRow
          teamName={team.name}
          isInterested={Boolean(team.viewerIsInterestedInTeam)}
          isPending={openRole!.pendingTeamUid === team.uid}
          onExpressInterest={() => openRole!.onExpressInterest(team)}
        />
      )}

      {roles.length > INITIAL_ROLES_SHOWN && (
        <button type="button" className={s.expander} onClick={toggleExpanded}>
          {expanded ? 'Show less' : `View all ${roles.length} roles at ${team.name}`}
        </button>
      )}
    </article>
  );
}

/**
 * Memoized: the board host re-renders on every apply-flow transition (modal
 * open/close, submit), and without this every scrolled-in card reconciles on
 * each of them. Applied-state changes bypass this via each row's own per-row
 * query subscription, so memoization never holds a row stale.
 */
export const TeamGroupCard = memo(TeamGroupCardImpl);
