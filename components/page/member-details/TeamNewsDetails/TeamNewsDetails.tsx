'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { TeamNewsFeedLink } from '@/components/page/team-details/TeamNews/TeamNewsFeedLink';
import {
  mergeUpvoteOverlay,
  type TeamNewsUpvoteOverlay,
} from '@/components/page/team-details/TeamNews/teamNewsUpvoteOverlay';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
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
 */
export function TeamNewsDetails({ member, isLoggedIn, userInfo }: TeamNewsDetailsProps) {
  const { onTeamNewsCardClicked, onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed } = useTeamNewsAnalytics();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();

  // The story the reader opened, held as the ITEM rather than its uid. Resolving
  // it out of the list each render (as the team rail does) is safe only for the
  // rail's never-refetched SSR data: here a refetch that pushes the story out of
  // the top 3 would make the lookup return undefined and unmount the modal
  // mid-read.
  const [openStory, setOpenStory] = useState<ITeamNewsItem | null>(null);

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

  const handleUpvoteToggle = useCallback(
    (item: ITeamNewsItem, position: number) => {
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
            onTeamNewsUpvoteFailed(item, position, nextUpvoted, 'member-profile');
          },
          onSuccess: (status) => {
            if (status) {
              setUpvoteOverlay((prev) => {
                const next = new Map(prev);
                next.set(item.uid, { viewerHasUpvoted: status.viewerHasUpvoted, upvoteCount: status.upvoteCount });
                return next;
              });
            }
            onTeamNewsUpvoteToggled(item, position, nextUpvoted, 'member-profile');
          },
        },
      );
    },
    [onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed, upvoteMutate],
  );

  const handleOpen = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'member-profile');
      setOpenStory(item);
    },
    [onTeamNewsCardClicked],
  );

  if (!visible) {
    return null;
  }

  // Overlay applied on top of the held item, so a vote cast in the modal shows
  // immediately and the story survives any refetch beneath it.
  const detailItem = openStory ? mergeUpvoteOverlay([openStory], upvoteOverlay)[0] : null;

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

      {teamUid && (
        <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source="member-profile" className={s.footer} />
      )}

      {detailItem && (
        <NewsDetailModal
          item={detailItem}
          onClose={() => setOpenStory(null)}
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
