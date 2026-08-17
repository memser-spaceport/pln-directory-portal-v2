'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { Modal } from '@/components/common/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

import { NewsCardView } from '../team-profile/NewsCardView';
import { FeedDetailBody, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import type { FeedComment } from '../newsfeed-v0/mocks';
import { EVENT_TYPE_LABEL, EVENT_TYPE_HEX } from '../newsfeed-v0/eventMeta';
import detailCss from '../newsfeed-v0/FeedDetailModal.module.scss';
import local from './TeamNewsModal.module.scss';

/**
 * One team's news, listed without leaving the page — what the "N new posts" chip
 * opens, on the teams grid and the job board alike.
 *
 * It lives beside the chip in `news-shared` because the two are one object: the
 * chip states an amount, this is the amount. A mark that looks identical on two
 * surfaces has to answer a click identically on both, and the way to guarantee
 * that is to have one component to answer it.
 *
 * The blue `new` badge and "+N more updates" leave for the feed instead; keeping
 * those apart from this is deliberate. This one answers "what has this team been
 * doing" without spending the reader's place on the page they were scanning —
 * which on a job board is a list of roles they may be halfway through judging.
 *
 * DRILLS, never stacks: clicking a story swaps this same box to it with Back on
 * the left and Close still on the right. A story modal opened on top would give
 * the reader two close buttons and an Escape key that means two things — the
 * same call the team profile's archive makes, and the one Mixpanel's Event
 * History and Threads' post activity both make.
 *
 * The team profile's "View all news" opens this too — it used to hand-roll its
 * own box, which drifted from this one in width, header and footer even though
 * both list the same thing. Everything the archive needs on top of a chip's
 * short list — a search field, the like/comment state the profile keeps in sync
 * with its rail — arrives as OPTIONAL props. Omit them (the grid and the job
 * board do) and this renders exactly as it always has.
 *
 * REUSE: rows are the team profile's `NewsCardView`, the story is the feed's own
 * `FeedDetailBody` — so a story reads identically here, on the profile rail and
 * in the feed.
 */
export function TeamNewsModal({
  teamName,
  teamLogo,
  items,
  count = items.length,
  onClose,
  query,
  onQueryChange,
  searchPlaceholder = 'Search news by keyword or type',
  viewsFor,
  likesFor,
  commentsFor,
  isLiked,
  onToggleLike,
  threadFor,
  onAddComment,
  isCommentLiked,
  onToggleCommentLike,
}: {
  teamName: string;
  /** The card's own resolved mark — real logo or generated monogram. */
  teamLogo?: string;
  items: ITeamNewsItem[];
  /**
   * What the header counts, when that isn't the number of rows below it. Only
   * the searchable archive needs it: the title names the whole archive, so it
   * has to hold still while the list narrows — a number counting down as you
   * type is the search reporting itself twice, and the second report is in the
   * one line that's supposed to say where you are.
   */
  count?: number;
  onClose: () => void;
  /**
   * Search band — rendered only when the caller supplies both halves, and the
   * caller filters `items` itself. A list of a handful of stories doesn't need
   * finding; a team's whole archive does.
   */
  query?: string;
  onQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  /**
   * Engagement. Rows show the metrics only when the accessors are here, because
   * the numbers have to come from wherever they're kept in sync — on the profile
   * that's state shared with the rail, so the same story can't read 4 likes in
   * one place and 5 in another. Without them `NewsCardView` falls back to its
   * own zeroes and drops the like button.
   */
  viewsFor?: (uid: string) => number;
  likesFor?: (uid: string) => number;
  commentsFor?: (uid: string) => number;
  isLiked?: (uid: string) => boolean;
  onToggleLike?: (uid: string) => void;
  /** The drilled story's thread. `onAddComment` is what turns comments on. */
  threadFor?: (uid: string) => FeedComment[];
  onAddComment?: (uid: string, text: string, parentUid?: string) => void;
  isCommentLiked?: (commentUid: string) => boolean;
  onToggleCommentLike?: (commentUid: string) => void;
}) {
  const [story, setStory] = useState<FeedDetail | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * The team's mark, from whichever source actually has one.
   *
   * The caller's is preferred — it's the face the surface you clicked was
   * wearing. But callers don't always have one (the job board's team fixtures
   * carry no logo and its card draws initials instead), while the stories
   * themselves often do, because the feed resolved it when it ingested them.
   * Taking the first that exists means the header and the story you drill into
   * can't show two different marks for one team, whichever end knows it.
   */
  const mark = teamLogo ?? items.find((item) => item.teamLogoUrl)?.teamLogoUrl ?? null;
  /** The story just left, so Back knows which row to return the reader to. */
  const lastStoryUid = useRef<string | null>(null);

  /**
   * Back lands you where you were, not at the top of a list you'd scrolled
   * halfway down: scroll the row you left into view and flash it once.
   */
  useEffect(() => {
    if (story) {
      lastStoryUid.current = story.id;
      return;
    }
    const uid = lastStoryUid.current;
    if (!uid) return;
    lastStoryUid.current = null;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-news-uid="${uid}"]`);
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'center' });
      el.classList.add(local.newsHighlight);
    });
    const timer = setTimeout(() => el.classList.remove(local.newsHighlight), 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [story]);

  const open = (item: ITeamNewsItem) =>
    setStory({
      id: item.uid,
      kind: 'news',
      title: item.title,
      name: item.teamName,
      // The story wears the mark the list header was wearing. A news item only
      // carries a team logo when the feed happened to resolve one; without this
      // fallback the header swaps a real logo for a letter tile the moment you
      // drill in, which reads as arriving somewhere else rather than opening
      // what you clicked.
      logoUrl: item.teamLogoUrl ?? mark,
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
          // No comment thread when the caller doesn't keep one: reached from a
          // directory scan, this is not somewhere anyone is mid-conversation.
          // The profile's archive does keep one — it shares the rail's threads —
          // so there it opens with the thread the rail was counting.
          showComments={Boolean(onAddComment)}
          likeCount={likesFor?.(story.id) ?? 0}
          liked={isLiked?.(story.id) ?? false}
          onToggleLike={() => onToggleLike?.(story.id)}
          comments={threadFor?.(story.id)}
          onAddComment={onAddComment && ((text, parentUid) => onAddComment(story.id, text, parentUid))}
          isCommentLiked={isCommentLiked}
          onToggleCommentLike={onToggleCommentLike}
        />
      ) : (
        <>
          <div className={local.newsModalHeader}>
            {/* Logo + name, the same identity pairing the drilled story view
                leads with — so Back doesn't swap one kind of header for another,
                it just changes what's under it. */}
            <span className={local.newsModalIdentity}>
              {/* Never an empty slot: a team without a resolved logo gets the
                  initials tile, the same one `FeedDetailBody` draws — so the
                  header keeps its shape when you drill in, and a logo-less team
                  isn't the one whose news arrives unsigned. */}
              {mark ? (
                <img className={local.newsModalLogo} src={mark} alt="" />
              ) : (
                <span className={local.newsModalLogoFallback}>{getTeamLogoFallback(teamName)}</span>
              )}
              <span className={local.newsModalTitle}>
                {teamName} news ({count})
              </span>
            </span>
            <button type="button" className={local.newsModalClose} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          {onQueryChange && (
            <div className={local.newsModalSearchWrap}>
              <SearchInput value={query ?? ''} onChange={onQueryChange} placeholder={searchPlaceholder} />
            </div>
          )}

          <div className={local.newsModalBody} ref={listRef}>
            {items.length > 0 ? (
              items.map((item) => (
                <NewsCardView
                  key={item.uid}
                  item={item}
                  hideTeam
                  fullSummary
                  views={viewsFor?.(item.uid)}
                  likes={likesFor?.(item.uid)}
                  liked={isLiked?.(item.uid)}
                  comments={commentsFor?.(item.uid)}
                  onToggleLike={onToggleLike && (() => onToggleLike(item.uid))}
                  // Without these NewsCardView opens the source in a new tab, which
                  // would eject the reader from the surface built for reading.
                  onShowMore={() => open(item)}
                  onOpenComments={() => open(item)}
                />
              ))
            ) : (
              // Only reachable behind the search band — the chip hides itself at
              // zero, so an empty list here always means "nothing matched".
              <div className={local.newsModalEmpty}>No news matches “{query}”.</div>
            )}
          </div>

          {/* The way out. This modal deliberately keeps the reader on the grid,
              which answers "what has this team been doing" but closes off "and
              what else happened" — so the feed stays one click away rather than
              behind a close-and-start-again.
              Both words are doing work rather than padding. The reader is inside
              one team's list, so "all" marks the widening; "network" names what
              it widens to — the destination page's own H2 — because the ↗ only
              says "elsewhere", not which elsewhere, and the widening from one
              team to the network is exactly the thing the reader can't infer
              from an arrow. Same string on team and member profile, which sit
              beside team-scoped lists for the same reason — a cross-surface exit
              that reads differently per page is how vocabulary drifts. */}
          <div className={local.newsModalFooter}>
            <Link href="/prototypes/newsfeed" prefetch={false} className={local.newsModalFeedLink}>
              All network updates
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
