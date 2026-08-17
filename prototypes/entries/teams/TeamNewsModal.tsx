'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { Modal } from '@/components/common/Modal';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

import { NewsCardView } from '../team-profile/NewsCardView';
import { FeedDetailBody, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { EVENT_TYPE_LABEL, EVENT_TYPE_HEX } from '../newsfeed-v0/eventMeta';
import detailCss from '../newsfeed-v0/FeedDetailModal.module.scss';
import local from './TeamsPrototype.module.scss';

/**
 * One team's news, listed without leaving the grid — what the `count` chip opens.
 *
 * The `new` badge beside it goes to the feed instead; keeping the two apart is
 * the point of having both. This one answers "what has this team been doing"
 * without spending the reader's place in a directory they were scanning.
 *
 * DRILLS, never stacks: clicking a story swaps this same box to it with Back on
 * the left and Close still on the right. A story modal opened on top would give
 * the reader two close buttons and an Escape key that means two things — the
 * same call the team profile's archive makes, and the one Mixpanel's Event
 * History and Threads' post activity both make.
 *
 * REUSE: rows are the team profile's `NewsCardView`, the story is the feed's own
 * `FeedDetailBody` — so a story reads identically here, on the profile rail and
 * in the feed.
 */
export function TeamNewsModal({
  teamName,
  teamLogo,
  items,
  onClose,
}: {
  teamName: string;
  /** The card's own resolved mark — real logo or generated monogram. */
  teamLogo?: string;
  items: ITeamNewsItem[];
  onClose: () => void;
}) {
  const [story, setStory] = useState<FeedDetail | null>(null);

  const open = (item: ITeamNewsItem) =>
    setStory({
      id: item.uid,
      kind: 'news',
      title: item.title,
      name: item.teamName,
      logoUrl: item.teamLogoUrl,
      kicker: EVENT_TYPE_LABEL[item.eventType],
      kickerColor: EVENT_TYPE_HEX[item.eventType],
      summary: item.summary,
      time: item.eventDate,
      readUrl: item.sourceUrl ?? undefined,
    });

  return (
    <Modal isOpen onClose={onClose} className={local.newsModal} lockScroll inertBackground>
      {story ? (
        <FeedDetailBody
          detail={story}
          onClose={onClose}
          onBack={() => setStory(null)}
          className={detailCss.embedded}
          citationStyle="off"
          // No comment thread on this surface: it's reached from a directory
          // scan, not from somewhere anyone is mid-conversation.
          showComments={false}
          likeCount={0}
          liked={false}
          onToggleLike={() => {}}
        />
      ) : (
        <>
          <div className={local.newsModalHeader}>
            {/* Logo + name, the same identity pairing the drilled story view
                leads with — so Back doesn't swap one kind of header for another,
                it just changes what's under it. */}
            <span className={local.newsModalIdentity}>
              {teamLogo && <img className={local.newsModalLogo} src={teamLogo} alt="" />}
              <span className={local.newsModalTitle}>
                {teamName} news ({items.length})
              </span>
            </span>
            <button type="button" className={local.newsModalClose} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className={local.newsModalBody}>
            {items.map((item) => (
              <NewsCardView
                key={item.uid}
                item={item}
                hideTeam
                fullSummary
                // Without these NewsCardView opens the source in a new tab, which
                // would eject the reader from the surface built for reading.
                onShowMore={() => open(item)}
                onOpenComments={() => open(item)}
              />
            ))}
          </div>

          {/* The way out. This modal deliberately keeps the reader on the grid,
              which answers "what has this team been doing" but closes off "and
              what else happened" — so the feed stays one click away rather than
              behind a close-and-start-again.
              "All" is doing work here rather than padding: the reader is inside
              one team's list, so the word is what marks the widening to
              everything. "Network" isn't — the ↗ already says "elsewhere", so
              the label stays "All updates". Same string on team and member profile,
              which sit beside team-scoped lists for the same reason — a
              cross-surface exit that reads differently per page is how
              vocabulary drifts. */}
          <div className={local.newsModalFooter}>
            <Link href="/prototypes/newsfeed" prefetch={false} className={local.newsModalFeedLink}>
              All updates
              <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
