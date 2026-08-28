'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
// The rail's own card chrome, so this sits beside BookWithOther as a peer.
import book from '@/components/page/member-details/BookWithOther/BookWithOther.module.scss';

import { getTeamNews, newsHref } from '../news-shared/mockTeamNews';
import { NewsIcon } from '../news-shared/icons';
// The feed's own engagement seeds and meta-row chrome (which are the forum's,
// copied 1:1) — so a story's counts read the same here as on the card you land
// on, and can't drift from it.
import { BASE_LIKES, seedCommentCount } from '../newsfeed-v0/mocks';
import { LikeIcon, CommentIcon } from '../newsfeed-v0/ForumIcons';
import fa from '../newsfeed-v0/FeedActions.module.scss';
import s from './MemberProfile.module.scss';

/** Enough to show the teams are alive without turning the rail into a feed. */
const MAX_ROWS = 4;

interface Props {
  teams: Array<{ id: string; name?: string | null }>;
}

/**
 * "Updates from the team" — what the teams this person is on have been doing.
 *
 * A profile answers who someone is and how to reach them; this answers the
 * question that follows for anyone deciding whether to. It reads from the same
 * teams the Teams section lists, so the two always agree.
 *
 * One row per team, newest first: sorting by date alone lets the busiest team
 * take the whole card, which answers "what did Lattice do?" when the question is
 * "what are they part of?".
 */
export function MemberTeamUpdates({ teams }: Props) {
  const items = useMemo(
    () =>
      teams
        .flatMap((t) => getTeamNews(t.id, t.name ?? ''))
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [teams],
  );

  /**
   * Every team gets its newest story first, then the remaining slots are filled
   * by date. Diversity-first stops one busy team taking the card; the backfill
   * stops it going half-empty for a member on two teams, where "one per team"
   * would show a single row under a header reading (3).
   */
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const firstPerTeam = items.filter((i) => !seen.has(i.teamUid) && seen.add(i.teamUid));
    const rest = items.filter((i) => !firstPerTeam.includes(i));
    return [...firstPerTeam, ...rest].slice(0, MAX_ROWS);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className={`${book.root} ${s.updatesCard}`}>
      <div className={`${book.header} ${s.updatesHeader}`}>
        <span className={s.updatesIcon}>
          <NewsIcon />
        </span>
        Updates from the team ({items.length})
      </div>

      <ul className={s.updatesList}>
        {rows.map((item) => (
          <li key={item.uid}>
            <Link href={newsHref(item)} className={s.updateRow}>
              <span className={s.updateTeam}>{item.teamName}</span>
              <span className={s.updateTitle}>{item.title}</span>
              {/* Engagement sits beside the date rather than in its own row: it's
                  the same question ("how live is this?") answered two ways, and
                  the card has three stories to fit. Read-only — the row is a
                  link, and liking belongs where the story is, in the feed. */}
              <span className={s.updateMeta}>
                <span className={s.updateTime}>{formatTimeAgo(item.eventDate)}</span>
                <span className={s.updateEngagement}>
                  <span className={fa.subItem}>
                    <LikeIcon /> {BASE_LIKES[item.uid] ?? 0}
                  </span>
                  <span className={fa.subItem}>
                    <CommentIcon /> {seedCommentCount(item.uid)}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/prototypes/newsfeed" className={book.button}>
        All network updates
      </Link>
    </div>
  );
}
