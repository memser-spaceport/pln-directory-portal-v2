'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Reuse the production news-card styling 1:1.
import n from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import s from './TeamProfile.module.scss';

import { LikeButton, CommentButton, CommentCount, ViewCount } from '../newsfeed-v0/FeedActions';
import { ShareMenu } from '../newsfeed-v0/ShareMenu';
// The feed's own event maps — one copy, so a story's type can't be labelled or
// coloured differently on two surfaces.
import { EVENT_TYPE_LABEL, EVENT_TYPE_DOT_CLASS } from '../newsfeed-v0/eventMeta';

/**
 * Copy-simplified from the homepage NewsCard, carrying the newsfeed's current
 * action row rather than its own: Share · Views · Likes · Comments, the same
 * `FeedActions` components the feed and its top-stories band use, in the same
 * forum order (Views · Likes · Comments, per `page/forum/Posts`). A story's
 * like count has to be the same number wherever the story appears, so the rail
 * reads the feed's components rather than keeping a parallel set — this card
 * previously showed an Upvote pill and a "Discuss" link that the feed had
 * already dropped.
 *
 * Comments open the story in the full feed instead of expanding inline
 * (`opensDetail`): the rail is a ~300px column, and a thread unfolding inside
 * it would push the rest of the news off-screen. Same call the top-stories band
 * makes for the same reason.
 *
 * On top of production: a smaller rail headline, and a summary that clamps to
 * two lines in the rail but renders in full in the "View all" feed
 * (`fullSummary`).
 */

const EVENT_TYPE_LABEL: Record<TeamNewsEventType, string> = {
  FUNDING: 'Funding',
  LAUNCH: 'Launch',
  PARTNERSHIP: 'Partnership',
  ANNOUNCEMENT: 'Announcement',
  MILESTONE: 'Milestone',
  OTHER: 'Other',
  HIRING: 'Hiring',
  DEALS: 'Deals',
};

const EVENT_TYPE_DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: n.dotFunding,
  LAUNCH: n.dotLaunch,
  PARTNERSHIP: n.dotPartnership,
  ANNOUNCEMENT: n.dotAnnouncement,
  MILESTONE: n.dotMilestone,
  OTHER: n.dotOther,
  HIRING: n.dotOther,
  DEALS: n.dotOther,
};

export function NewsCardView({
  item,
  flat,
  hideTeam,
  fullSummary,
  views = 0,
  likes = 0,
  liked = false,
  comments = 0,
  onToggleLike,
  onOpenComments,
  onShowMore,
}: {
  item: ITeamNewsItem;
  flat?: boolean;
  hideTeam?: boolean;
  /** Rail clamps the summary to 2 lines; the full feed renders it in full. */
  fullSummary?: boolean;
  views?: number;
  likes?: number;
  liked?: boolean;
  comments?: number;
  onToggleLike?: () => void;
  /** Opens the story where its thread lives — the full feed, not this column. */
  onOpenComments?: () => void;
  /** Rail only: "Show more" opens the full feed focused on this item. */
  onShowMore?: () => void;
}) {
  /**
   * Tapping a rail row opens the story in the modal rather than leaving for the
   * source. A profile rail is somewhere you're mid-task — bouncing the whole
   * page out to x.com on a stray tap costs the scroll position and everything
   * you'd read so far, and the tap target here is a whole card. The modal keeps
   * the trip reversible; the source is still one deliberate click away from
   * inside it.
   *
   * Cards in the modal itself (no `onShowMore`) keep the source open — that's
   * the end of the chain, and there's nothing further in-app to show.
   */
  const open = onShowMore ?? (() => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer'));

  // Rail only: trim the teaser to two whole lines and append an inline
  // "… Show more". Measuring against an off-screen gauge lets us cut on a word
  // boundary, so text is never sliced mid-word the way a fixed-width overlay
  // would. Re-runs on resize since the gauge width tracks the card.
  const wrapRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(item.summary ?? '');
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    if (fullSummary || !item.summary) return;
    const wrap = wrapRef.current;
    const gauge = gaugeRef.current;
    if (!wrap || !gauge) return;

    const MAX_HEIGHT = 41; // two 20px lines (+1px tolerance)
    const summary = item.summary;

    const fitsWithSuffix = (text: string) => {
      // Mirror the rendered line exactly so we don't over-reserve: "text… " in
      // the body weight, then "Show more" as an atomic inline-block at weight
      // 500 — matching the real button, which can't break across lines.
      gauge.textContent = `${text}… `;
      const label = document.createElement('span');
      label.textContent = 'Show more';
      label.style.fontWeight = '500';
      label.style.whiteSpace = 'nowrap';
      label.style.display = 'inline-block';
      gauge.appendChild(label);
      return gauge.offsetHeight <= MAX_HEIGHT;
    };

    const compute = () => {
      gauge.style.width = `${wrap.clientWidth}px`;

      gauge.textContent = summary;
      if (gauge.offsetHeight <= MAX_HEIGHT) {
        setDisplay(summary);
        setTruncated(false);
        return;
      }

      // Largest whole-word prefix that still fits beside the "… Show more" label.
      const words = summary.split(' ');
      let lo = 0;
      let hi = words.length;
      let best = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (fitsWithSuffix(words.slice(0, mid).join(' '))) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      setDisplay(
        words
          .slice(0, best)
          .join(' ')
          .replace(/[\s,;:]+$/, ''),
      );
      setTruncated(true);
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [fullSummary, item.summary]);

  return (
    // Flat rows reuse production's .cardFlat (transparent, hairline divider
    // between rows) — the rail is a list, not a stack of cards.
    <div
      // Opens a dialog in the rail, still leaves the page in the modal — the
      // role has to say which, or the announcement promises the wrong thing.
      role={onShowMore ? 'button' : 'link'}
      tabIndex={0}
      data-news-uid={item.uid}
      className={flat ? `${n.cardFlat} ${s.newsRowTight}` : `${n.card} ${n.cardOutline}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        // The card wraps real buttons (like, comments, share) — let them keep
        // their own keys.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        open();
      }}
    >
      {/* On the team's own profile the news is all from this team, so the team
          row is redundant — hide it. The modal / full feed keeps it. */}
      {!hideTeam && (
        <div className={n.head}>
          {item.teamLogoUrl ? (
            <img className={n.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={n.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
          )}
          <span className={n.teamName}>{item.teamName}</span>
        </div>
      )}

      {/* `headlineCompact` is production's own 16px/22 rail treatment — the
          local .newsHeadline carried the same values but lost to .headline
          (equal specificity, NewsCard.module.scss loads later), so the rail was
          rendering the homepage's 18px. */}
      <h3 className={`${n.headline} ${n.headlineCompact} ${s.newsHeadline}`}>{item.title}</h3>
      {item.summary &&
        (fullSummary ? (
          <p className={n.summary}>{item.summary}</p>
        ) : (
          <div ref={wrapRef} className={s.newsSummaryWrap}>
            <p className={s.newsSummary}>
              {display}
              {truncated && onShowMore && (
                <>
                  {'… '}
                  <button
                    type="button"
                    className={s.showMore}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowMore();
                    }}
                  >
                    <span>Show more</span>
                  </button>
                </>
              )}
            </p>
            <div ref={gaugeRef} className={s.summaryMeasure} aria-hidden="true" />
          </div>
        ))}

      <div className={`${n.metaLine} ${s.newsMetaRow}`}>
        <div className={n.meta}>
          <span className={n.eventType}>
            <span className={`${n.eventDot} ${EVENT_TYPE_DOT_CLASS[item.eventType]}`} aria-hidden="true" />
            <span className={`${n.eventLabel} ${n.eventLabelCompact}`}>{EVENT_TYPE_LABEL[item.eventType]}</span>
          </span>
          {item.sourceDomain && (
            <>
              <span className={n.sep} aria-hidden="true" />
              <span className={n.source}>{item.sourceDomain}</span>
            </>
          )}
          <span className={n.sep} aria-hidden="true" />
          <span className={n.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
        <span className={s.newsActions} onClick={(e) => e.stopPropagation()}>
          <ShareMenu variant="card" url={item.sourceUrl ?? undefined} />
          <ViewCount count={views} compact />
          {onToggleLike && <LikeButton count={likes} liked={liked} onToggle={onToggleLike} />}
          {/* In the full feed there's nowhere further to open, so the count goes
              static rather than missing — the same story shouldn't carry a
              different set of numbers depending on where you're reading it. */}
          {onOpenComments ? (
            <CommentButton count={comments} open={false} onToggle={onOpenComments} opensDetail />
          ) : (
            <CommentCount count={comments} />
          )}
        </span>
      </div>
    </div>
  );
}
