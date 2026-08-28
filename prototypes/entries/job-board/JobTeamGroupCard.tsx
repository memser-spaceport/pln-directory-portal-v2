'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { PAGE_ROUTES } from '@/utils/constants';

import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';
import { TagsList } from '@/components/common/profile/TagsList';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { useGetFocusTags } from '@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags';

// Reuse the production TeamGroupCard styling 1:1, with local mobile overrides.
import s from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import js from './JobTeamGroupCard.module.scss';

import { JobReferRoleRow } from './JobReferRoleRow';
import { TeamUpdateStrip, type TeamUpdateVariant } from '../news-shared/TeamUpdateStrip';
import { TeamNewsCountChip } from '../news-shared/TeamNewsCountChip';
// The list the chip opens — the teams grid's modal, not a job-board retelling.
import { TeamNewsModal } from '../news-shared/TeamNewsModal';
import { getTeamNews, feedFocusHref } from '../news-shared/mockTeamNews';
// The feed's own story modal and engagement seeds, so an update opened from the
// job board is the same object as one opened from the feed — same body, sources,
// share and metrics — rather than a job-board retelling of it.
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { EVENT_TYPE_LABEL, EVENT_TYPE_HEX } from '../newsfeed-v0/eventMeta';
import { BASE_LIKES } from '../newsfeed-v0/mocks';
import fa from '../newsfeed-v0/FeedActions.module.scss';

const INITIAL_ROLES_SHOWN = 3;
const MAX_FOCUS_CHIPS = 100;

/** The default count badge, plus the three strip versions offered against it. */
export type JobCardNewsVariant = TeamUpdateVariant | 'count';

interface JobTeamGroupCardProps {
  group: IJobTeamGroup;
  /**
   * Prototype-only: which version of the team's news the card shows. `count` is
   * the default — the "N new posts" badge on the name row; `inline` puts a
   * headline in that same slot instead; the other two put it below the roles.
   */
  newsVariant?: JobCardNewsVariant;
  /** Handed to the row: whether pressing **Refer** may open the referral modal.
   *  The button itself is shown to everyone — this gates the modal, not the
   *  offer. */
  canOpenReferral?: boolean;
  /** Handed to the row: where Refer goes without an account — the board's
   *  sign-up door. */
  onReferSignUp?: () => void;
  /** Handed straight to the row: opening a role starts the apply flow, which
   *  the board owns — one drawer over the whole list rather than one per card.
   *  (`onApply` used to sit beside this, from when a row could apply directly.
   *  The row has no such button any more; the flow footer has it.) */
  onViewJob?: (role: IJobRole) => void;
  /** Uids of roles already applied to. */
  appliedRoleUids?: Set<string>;
  /** Role uid → when the application went, so an applied row can report its own
   *  date instead of the posting age. Same map the board keys applications by. */
  appliedAtByRole?: Map<string, string>;
}

/**
 * COPY-SIMPLIFY of production `TeamGroupCard`: same markup + styling and the real
 * useGetFocusTags / TagsList, but renders the prototype-local JobReferRoleRow (which
 * adds the per-job "Refer" button + referral modal) instead of the production RoleRow.
 */
export function JobTeamGroupCard({
  group,
  newsVariant = 'full',
  canOpenReferral = true,
  onReferSignUp,
  onViewJob,
  appliedRoleUids,
  appliedAtByRole,
}: JobTeamGroupCardProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const { team, roles, totalRoles } = group;

  /* The group's own order, untouched. Roles inside a card were briefly reordered
     to float matches to the top; with matching gone there is nothing to rank
     them by, and a team's list of openings has no second opinion to offer. */
  const visibleRoles = expanded ? roles : roles.slice(0, INITIAL_ROLES_SHOWN);
  const newCount = roles.filter((r) => isNew(getJobDate(r))).length;

  const focusTags = useGetFocusTags(team);
  const news = getTeamNews(team.uid, team.name);

  /**
   * A story the feed has already carried past opens here instead of sending
   * someone to a feed that no longer shows it. `TeamUpdateStrip` decides which
   * stories those are; this just holds the one it hands over.
   */
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  /** The chip's list of this team's news, opened over the board. */
  const [newsOpen, setNewsOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [feedHref, setFeedHref] = useState('/prototypes/newsfeed');
  const openStory = (item: ITeamNewsItem) => {
    setLiked(false);
    setFeedHref(feedFocusHref(item));
    setDetail({
      id: item.uid,
      kind: 'news',
      title: item.title,
      name: item.teamName,
      // Fall back to the card's own mark: a news item only carries a logo when
      // the feed resolved one, and the story shouldn't drop to a letter tile
      // under the card that just showed the team's face.
      logoUrl: item.teamLogoUrl ?? team.logoUrl,
      kicker: EVENT_TYPE_LABEL[item.eventType],
      kickerColor: EVENT_TYPE_HEX[item.eventType],
      summary: item.summary,
      time: item.eventDate,
      readUrl: item.sourceUrl ?? undefined,
    });
  };

  /* The count badge takes the name row, same slot the inline story does — the two
     are alternatives for the same place, which is what makes them comparable.

     "N new posts", not "N new updates": it counts the feed's own unit — and on a
     board of job posts, "updates" beside a team could be read as its openings.
     Always "new", never a bare count, because on this board the badge is the
     team's only news signal: "2 posts" beside a team name reads as an archive
     size, and the thing being offered is that there is something here you
     haven't read.

     The teams grid's chip verbatim — `TeamNewsCountChip`, grey Badge shell and
     production's unread dot — and its behaviour too: it opens the team's news
     over the board rather than sending anyone to the feed. Someone weighing a
     role hasn't asked to leave the board to find out what a team has been up to,
     and the modal's footer holds the way on for whoever has. */
  const newsStrip =
    newsVariant === 'count' ? (
      news.length > 0 && (
        <TeamNewsCountChip teamName={team.name} items={news} noun="post" onOpen={() => setNewsOpen(true)} />
      )
    ) : (
      <TeamUpdateStrip teamName={team.name} items={news} variant={newsVariant} onOpenStory={openStory} />
    );

  const newsOnNameRow = newsVariant === 'inline' || newsVariant === 'count';

  return (
    <article className={`${s.card} ${js.card}`}>
      <header className={s.header}>
        <div className={`${s.avatar} ${js.avatar}`}>
          {team.logoUrl ? (
            <Image src={team.logoUrl} alt={team.name} width={56} height={56} className={s.avatarImage} />
          ) : (
            <span className={`${s.avatarInitials} ${js.avatarInitials}`}>{teamInitials(team.name)}</span>
          )}
        </div>

        <div className={s.headerMain}>
          {/* The story belongs to the team, so it sits with the team's name; it
              wraps under the name when there's no room for both. */}
          <div className={`${js.nameRow} ${newsVariant === 'count' ? js.nameRowChip : ''}`}>
            <h3 className={s.teamName}>
              <Link
                prefetch={false}
                href={`${PAGE_ROUTES.TEAMS}/${team.uid}?backTo=${encodeURIComponent(PAGE_ROUTES.JOBS)}`}
              >
                {team.name}
              </Link>
            </h3>
            {newsOnNameRow && newsStrip}
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
        {visibleRoles.map((role) => (
          <li key={role.uid}>
            <JobReferRoleRow
              role={role}
              teamName={team.name}
              team={team}
              source="job-board"
              canOpenReferral={canOpenReferral}
              onReferSignUp={onReferSignUp}
              onViewJob={onViewJob}
              applied={appliedRoleUids?.has(role.uid) ?? false}
              appliedAt={appliedAtByRole?.get(role.uid)}
              teamId={team.uid}
            />
          </li>
        ))}
      </ul>

      {roles.length > INITIAL_ROLES_SHOWN && (
        <button type="button" className={s.expander} onClick={toggleExpanded}>
          {expanded ? 'Show less' : `View all ${roles.length} roles at ${team.name}`}
        </button>
      )}

      {/* After the expander, not before it: the expander belongs to the role
          list and has to stay attached to it. */}
      {!newsOnNameRow && newsStrip}

      {/* The chip's list. Its own footer links on to the feed, and it drills into
          a story in place rather than stacking a second overlay — so this and the
          story modal below are never open at once. */}
      {newsOpen && (
        <TeamNewsModal
          teamName={team.name}
          teamLogo={team.logoUrl ?? undefined}
          items={news}
          onClose={() => setNewsOpen(false)}
        />
      )}

      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={(BASE_LIKES[detail?.id ?? ''] ?? 0) + (liked ? 1 : 0)}
        liked={liked}
        onToggleLike={() => setLiked((v) => !v)}
        citationStyle="off"
        /* The way out, offered rather than imposed: the story opened here so the
           board didn't move under someone reading one headline, and this is for
           whoever does want the rest of the news. Lands on the team's card in the
           feed, same as "+N more updates". */
        footerAction={
          /* The footer's Share trigger is `fa.subItem` + `fa.button`; this sits
             beside it as a peer, so it wears the same. No new CSS. */
          <a className={`${fa.subItem} ${fa.button} ${js.feedLink}`} href={feedHref}>
            <ArrowUpRightIcon aria-hidden="true" />
            Open in newsfeed
          </a>
        }
      />
    </article>
  );
}
