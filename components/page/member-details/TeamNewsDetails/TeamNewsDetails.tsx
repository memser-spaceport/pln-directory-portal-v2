'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { TeamNewsFeedLink } from '@/components/page/team-details/TeamNews/TeamNewsFeedLink';
import { TeamNewsModal } from '@/components/page/team-details/TeamNews/TeamNewsModal';
import {
  mergeUpvoteOverlay,
  type TeamNewsUpvoteOverlay,
} from '@/components/page/team-details/TeamNews/teamNewsUpvoteOverlay';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import type { IMember } from '@/types/members.types';
import type { ITeamNewsItem } from '@/types/team-news.types';
import type { IUserInfo } from '@/types/shared.types';

import { TeamNewsRow } from './components/TeamNewsRow';
import { useMemberTeamNewsCard } from './hooks/useMemberTeamNewsCard';

import s from './TeamNewsDetails.module.scss';

interface TeamNewsDetailsProps {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
}

/**
 * One state for what's open over the profile, so the archive and a card-opened
 * story can't both be up. TeamNewsModal renders its Modal WITHOUT
 * `inertBackground`, so with two independent states a keyboard reader could tab
 * into the rows behind the open archive and stack a second overlay on it — two
 * close buttons and an Escape that means two things. Same shape as the team
 * rail's (TeamNewsRail.tsx), with two deliberate differences:
 *
 * - `detail` holds the ITEM, not its uid. The rail re-resolves its uid out of
 *   never-refetched SSR data; here a refetch that pushes the story out of the
 *   top 3 would make the lookup return undefined and unmount the modal mid-read.
 * - `archive` carries no `focusUid`. That's the rail's "Show more" reveal
 *   target, and TeamNewsRow has no "Show more" — it's a plain title row.
 */
type MemberNewsModalState = { kind: 'none' } | { kind: 'archive' } | { kind: 'detail'; item: ITeamNewsItem };

/**
 * The 3 latest stories from the member's PRIMARY team, opened in place.
 *
 * Primary team only — not every team the member is on. A profile answers who
 * someone is; this answers what the thing they're principally part of has been
 * doing, and pooling several teams turns that into a feed.
 *
 * Mounted ONCE per page: in the right rail at >=960px, in the main column below
 * that. Two mounts would put two nodes carrying the same data-story-uid on the
 * page, and NewsDetailModal's focus restore resolves that attribute by
 * querySelector — it would hand focus to the hidden copy.
 *
 * "View all news" opens the team's full archive over the profile — the same
 * TeamNewsModal the team page opens. Its rows stamp data-story-uid too, so the
 * same uid is briefly on the page twice; MemberNewsModalState is what keeps that
 * harmless, by making "archive open" and "story open" mutually exclusive.
 */
export function TeamNewsDetails({ member, isLoggedIn, userInfo }: TeamNewsDetailsProps) {
  const { onTeamNewsCardClicked, onTeamNewsViewAllClicked, onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed } =
    useTeamNewsAnalytics();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();
  const isMobile = useIsMobile();

  // What's open over the profile — at most one thing. See MemberNewsModalState.
  const [modalState, setModalState] = useState<MemberNewsModalState>({ kind: 'none' });

  // NewsDetailModal is fully controlled and useTeamNewsUpvoteToggle writes
  // nothing to the cache, so without this map Like fires its request and the
  // button never moves — and the next click re-reads the stale item and POSTs
  // again instead of DELETEing. Ported from TeamNewsRail.
  const [upvoteOverlay, setUpvoteOverlay] = useState<TeamNewsUpvoteOverlay>(() => new Map());

  const {
    visible,
    teamUid,
    teamName,
    items: rawItems,
    total,
  } = useMemberTeamNewsCard({
    member,
    isLoggedIn,
    userInfo,
  });

  const items = useMemo(() => mergeUpvoteOverlay(rawItems, upvoteOverlay), [rawItems, upvoteOverlay]);

  // Counts for the rows on screen. The shared entry is filled incrementally, so
  // asking here for three uids costs one request and leaves /home free to ask
  // for its own.
  const uids = useMemo(() => items.map((item) => item.uid), [items]);
  useFeedCommentCounts({ uids, enabled: visible });

  // `source` is a parameter rather than a constant because the archive shares
  // this handler — that's what keeps a vote cast inside it on the same overlay
  // as the card behind it — but its clicks are not the card's clicks.
  const handleUpvoteToggle = useCallback(
    (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource = 'member-profile') => {
      const wasUpvoted = Boolean(item.viewerHasUpvoted);
      const nextUpvoted = !wasUpvoted;
      const prevCount = item.upvoteCount ?? 0;
      const nextCount = wasUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1;

      setUpvoteOverlay((prev) => {
        const next = new Map(prev);
        next.set(item.uid, { viewerHasUpvoted: nextUpvoted, upvoteCount: nextCount });
        return next;
      });

      upvoteMutate(
        { uid: item.uid, isUpvoted: nextUpvoted },
        {
          onError: () => {
            setUpvoteOverlay((prev) => {
              const next = new Map(prev);
              next.set(item.uid, { viewerHasUpvoted: wasUpvoted, upvoteCount: prevCount });
              return next;
            });
            // Wiring only the success event would make this surface's failure
            // rate read a flat 0% while the success event covers it.
            onTeamNewsUpvoteFailed(item, position, nextUpvoted, source);
          },
          onSuccess: (status) => {
            if (status) {
              setUpvoteOverlay((prev) => {
                const next = new Map(prev);
                next.set(item.uid, { viewerHasUpvoted: status.viewerHasUpvoted, upvoteCount: status.upvoteCount });
                return next;
              });
            }
            onTeamNewsUpvoteToggled(item, position, nextUpvoted, source);
          },
        },
      );
    },
    [onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed, upvoteMutate],
  );

  const handleOpen = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'member-profile');
      setModalState({ kind: 'detail', item });
    },
    [onTeamNewsCardClicked],
  );

  if (!visible) {
    return null;
  }

  // Overlay applied on top of the held item, so a vote cast in the modal shows
  // immediately and the story survives any refetch beneath it.
  const detailItem = modalState.kind === 'detail' ? mergeUpvoteOverlay([modalState.item], upvoteOverlay)[0] : null;

  // The card lists three; the header counts the whole archive. The button is the
  // way to the difference, so with nothing hidden there is nothing to open —
  // and "All network updates" takes the footer row alone, as on the team page.
  const hasMore = total > TEAM_NEWS_PREVIEW_LIMIT;

  return (
    // data-news-feed-root is restoreFocusToRow's fallback when the originating
    // row is gone at close time. Without it focus would drop to <body> and throw
    // a keyboard reader to the top of the document — the attribute means "the
    // surface that opened this", not only the feed.
    <div className={s.card} data-news-feed-root>
      <h2 className={s.header}>
        <span className={s.icon} aria-hidden="true">
          <NewsIcon />
        </span>
        Updates from the team ({total})
      </h2>

      <ul className={s.list}>
        {items.map((item, index) => (
          <li key={item.uid}>
            <TeamNewsRow item={item} onOpen={(clicked) => handleOpen(clicked, index)} />
          </li>
        ))}
      </ul>

      {/* The card's two exits, paired on one row exactly as the team rail pairs
          them: "View all news" stays inside this team, "All network updates"
          widens to the whole feed. */}
      {teamUid && (
        <div className={s.footer}>
          {hasMore && (
            <button
              type="button"
              className={s.viewAll}
              onClick={() => {
                onTeamNewsViewAllClicked(teamUid, teamName, total, 'member-profile-modal');
                setModalState({ kind: 'archive' });
              }}
            >
              View all news ({total})
            </button>
          )}
          {/* Stays 'member-profile': this is the CARD's exit. The archive
              renders its own copy of this link with its own source. */}
          <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source="member-profile" className={s.viewFeed} />
        </div>
      )}

      {teamUid && (
        <TeamNewsModal
          isOpen={modalState.kind === 'archive'}
          // The rail's "Show more" reveal target. This card's rows don't clamp a
          // teaser, so there is never a row to land on — the archive opens at
          // the top.
          focusUid={null}
          onClose={() => setModalState({ kind: 'none' })}
          teamUid={teamUid}
          teamName={teamName}
          // Passed rather than latched: the card already has the figure from the
          // same endpoint and team with no filter, so the header is right on the
          // first paint instead of after a round trip.
          total={total}
          fullscreen={isMobile}
          source="member-profile-modal"
          upvoteOverlay={upvoteOverlay}
          onUpvoteToggle={handleUpvoteToggle}
        />
      )}

      {detailItem && (
        <NewsDetailModal
          item={detailItem}
          onClose={() => setModalState({ kind: 'none' })}
          onUpvoteToggle={(item) =>
            handleUpvoteToggle(
              item,
              items.findIndex((row) => row.uid === item.uid),
            )
          }
          source="member-profile"
        />
      )}
    </div>
  );
}

/**
 * Newspaper glyph for the team-updates badge — transcribed verbatim from the
 * prototype (prototypes/entries/news-shared/icons.tsx `NewsIcon`). Stroke-based
 * 16px box on `currentColor`, matching the production jobs icons' convention.
 */
function NewsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M2 4.25A1.25 1.25 0 0 1 3.25 3h7.5A1.25 1.25 0 0 1 12 4.25v7.5A1.25 1.25 0 0 0 13.25 13H3.25A1.25 1.25 0 0 1 2 11.75v-7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.5h1.75A.25.25 0 0 1 14 6.75v5a1.25 1.25 0 0 1-2.5 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.25 5.75h5.5M4.25 8h5.5M4.25 10.25h3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
