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
import { OpenRoleRow } from './OpenRoleRow';
import { openRoleFor, type OpenInterest } from './openRoles';
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
import { BASE_LIKES, PL_TEAM_UID } from '../newsfeed-v0/mocks';
import fa from '../newsfeed-v0/FeedActions.module.scss';

import type { ListingMeta, ListingStatus } from './listings';

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
  /**
   * The team's open role, once the reader has answered it. Absent means the
   * offer still stands; the row reads the record itself.
   */
  openInterest?: OpenInterest;
  /** Opens the open role's interest form — the board owns it, one dialog over
   *  the whole list, the same way it owns the apply drawer. Omitted on a surface
   *  that has no such dialog, and then the row is not drawn at all. */
  onOpenRoleInterest?: (teamUid: string) => void;
  /**
   * Present when the viewer owns this team: the card is then the team's own
   * list, in every state. The count block still counts what is *up* and says
   * how many are waiting, and each row gets its ⋯ menu — see the row.
   */
  manage?: {
    metaFor: (roleUid: string) => ListingMeta | undefined;
    onSetStatus: (roleUid: string, status: ListingStatus) => void;
    onDelete: (roleUid: string) => void;
    /** This is the viewer's *own* team (a lead), not one they manage by role
     *  (an admin). Tints the card — see `.ownedCard`. */
    yours?: boolean;
  };
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
  openInterest,
  onOpenRoleInterest,
  manage,
}: JobTeamGroupCardProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const { team, roles, totalRoles } = group;

  /* The group's own order, untouched. Roles inside a card were briefly reordered
     to float matches to the top; with matching gone there is nothing to rank
     them by, and a team's list of openings has no second opinion to offer. */
  const visibleRoles = expanded ? roles : roles.slice(0, INITIAL_ROLES_SHOWN);
  /* Managed: "+N new" is an applicant's signal and this reader posted them. The
     slot reports the review queue instead — the one number on this card that
     changes when a submission goes in, and the one a collapsed card (three of
     four rows shown) would otherwise hide below the expander. */
  const newCount = manage ? 0 : roles.filter((r) => isNew(getJobDate(r))).length;
  const inReviewCount = manage ? roles.filter((r) => manage.metaFor(r.uid)?.status === 'in-review').length : 0;

  /* Protocol Labs is the network's own org, and the board already pins its card
     to the top — the gradient outline is what says so on the card itself, rather
     than leaving the first position to be read as "newest". The same mark the
     newsfeed gives PL's card, keyed off the same uid, so one org reads as one org
     across the product. */
  const isProtocolLabs = team.uid === PL_TEAM_UID;

  const focusTags = useGetFocusTags(team);
  const news = getTeamNews(team.uid, team.name);
  /* Two of the six teams have one — a row on every card would read as board
     furniture rather than as something a team chose. See `MOCK_OPEN_ROLES`. */
  const openRole = openRoleFor(team.uid);

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
    <article
      className={`${s.card} ${js.card}${isProtocolLabs ? ` ${js.plCard}` : ''}${manage?.yours ? ` ${js.ownedCard}` : ''}`}
    >
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
          {inReviewCount > 0 && (
            <div className={`${s.newCount} ${js.reviewCount}`}>
              {inReviewCount} in review
            </div>
          )}
        </div>
      </header>

      <ul className={s.roleList}>
        {visibleRoles.map((role) => {
          const meta = manage?.metaFor(role.uid);
          return (
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
                manage={
                  manage && meta
                    ? {
                        meta,
                        onSetStatus: (status) => manage.onSetStatus(role.uid, status),
                        onDelete: () => manage.onDelete(role.uid),
                      }
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      {roles.length > INITIAL_ROLES_SHOWN && (
        <button type="button" className={s.expander} onClick={toggleExpanded}>
          {expanded ? 'Show less' : `View all ${roles.length} roles at ${team.name}`}
        </button>
      )}

      {/* The team's standing invitation, for the reader that all the rows above
          just failed. It goes after the expander for the same reason the news
          strip does — the expander belongs to the role list and has to stay
          attached to it — and it is not one of the roles the expander counts:
          "View all 4 roles at libp2p" would be wrong the moment a fifth,
          role-less row joined the list it names.

          Not drawn for the team that owns the card. `manage` means the viewer
          posted these listings, and "I'm interested" on your own team's open
          door is a control with nothing behind it. What an owner should see in
          this slot — who has answered it — is the applicants list, which lives
          on the team profile; see the note in `openRoles.ts`. */}
      {openRole && !manage && onOpenRoleInterest && (
        <OpenRoleRow
          openRole={openRole}
          teamName={team.name}
          interest={openInterest}
          onExpressInterest={() => onOpenRoleInterest(team.uid)}
          attached
        />
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
