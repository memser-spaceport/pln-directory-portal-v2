'use client';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

// Reuse the production news-card type layer 1:1 — headline, summary clamp and the
// whole meta line (event dot + label, separator, source, time) are its classes.
import n from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

import { NewsIcon } from './icons';
import { EVENT_TYPE_LABEL, EVENT_TYPE_DOT_CLASS } from '../newsfeed-v0/eventMeta';
import { feedFocusHref } from './mockTeamNews';
import s from './TeamUpdateStrip.module.scss';

/**
 * `full`   — banded: event type · source · date, the headline, a two-line summary.
 * `line`   — banded: the headline and when it landed, on one row.
 * `inline` — the same row unbanded, to sit beside the team's name.
 */
export type TeamUpdateVariant = 'full' | 'line' | 'inline';

interface TeamUpdateStripProps {
  teamName: string;
  items: ITeamNewsItem[];
  variant?: TeamUpdateVariant;
  /** Opens the story in place. Without it the story falls back to a feed link. */
  onOpenStory?: (item: ITeamNewsItem) => void;
}

/**
 * The team's latest story, told rather than counted.
 *
 * Where `TeamUpdatesLink` says "2 new updates" — enough to know a team is alive,
 * not enough to know why you'd care — this says what happened. On a job board
 * that matters: the news is the reason to read the roles, and "$12M grants round"
 * moves someone to apply where "2 updates" doesn't.
 *
 * TWO TARGETS, because they answer two different questions:
 *  - **the story** opens in place in the banded versions. Someone reading a job
 *    card asked about *this* headline; taking the whole page away to answer that
 *    costs them their place on the board. The modal carries an "Open in newsfeed"
 *    action for anyone who does want to leave — offered, not imposed.
 *  - **"+N more updates"** goes to the feed, scrolled to this team's card. That
 *    one *is* a request to leave, and the feed is where the rest of the news is.
 *
 * `inline` is the exception: it hands the story to the feed too. It stands in the
 * badge's slot on the name row and reads as one more thing in the header rather
 * than a block of its own, so the small deliberate act of opening a modal isn't
 * what a click there feels like — and a headline with no summary beside it has
 * little to show in a modal anyway. Both its targets land in the same place.
 *
 * The story target is a stretched control — it covers the whole band, so the band
 * behaves like one click target while "+N more" stays a real link on top of it.
 * (A link nested inside a button is invalid HTML; siblings with a stretched hit
 * area get the same behaviour without it.)
 *
 * REUSE: no new type. Headline, summary teaser and meta row are the production
 * NewsCard's own classes (the ones the feed's NewsCardView already wears), so a
 * story reads the same here as on the card you land on. Local CSS is only the
 * band, the one-row arrangement and the count.
 *
 * `inline` drops the band because it stands where the badge did — on the team's
 * name row, where a filled stripe would cut the header in half. It carries no
 * description for the same reason: a paragraph doesn't belong on a name row.
 */
export function TeamUpdateStrip({ teamName, items, variant = 'full', onOpenStory }: TeamUpdateStripProps) {
  if (items.length === 0) return null;

  const [latest] = items;
  const moreCount = items.length - 1;

  // The name-row version hands off to the feed like the badge it stands in for;
  // the banded versions open the story where you already are.
  const opensInPlace = !!onOpenStory && variant !== 'inline';
  // Stretched over the band, so a click anywhere on it hits the story.
  const storyTarget = opensInPlace ? (
    <button
      type="button"
      className={s.storyTarget}
      aria-label={`${latest.title} — read this update`}
      onClick={() => onOpenStory(latest)}
    />
  ) : (
    <a className={s.storyTarget} href={feedFocusHref(latest)} aria-label={`${latest.title} — see it on the newsfeed`} />
  );

  const more = moreCount > 0 && (
    <a
      className={s.more}
      href={feedFocusHref(latest)}
      aria-label={`${moreCount} more ${moreCount === 1 ? 'update' : 'updates'} about ${teamName} — see them on the newsfeed`}
    >
      +{moreCount} more {moreCount === 1 ? 'update' : 'updates'}
      <ArrowUpRightIcon className={s.moreArrow} aria-hidden="true" />
    </a>
  );

  if (variant === 'line' || variant === 'inline') {
    return (
      <div className={`${s.strip} ${s.line} ${variant === 'inline' ? s.inline : ''}`}>
        {storyTarget}
        <span className={s.icon}>
          <NewsIcon />
        </span>
        <span className={s.lineTitle}>{latest.title}</span>
        <span className={`${n.meta} ${s.lineMeta}`}>
          {/* Production's own meta separator, doing here what it does between
              every other pair on a NewsCard: the headline and its date are two
              meta parts on one row, and without it they read as one sentence
              ending in a date. CSS shows it for `inline` only — see `.lineSep`;
              in the banded rows the date is pinned right, too far from the
              headline for a dot to be separating anything. */}
          <span className={`${n.sep} ${s.lineSep}`} />
          <span className={n.time}>{formatTimeAgo(latest.eventDate)}</span>
          {more}
        </span>
      </div>
    );
  }

  return (
    <div className={s.strip}>
      {storyTarget}

      {/* No news glyph here, unlike the one-row variants: the event dot and label
          already say what this is, and two marks side by side read as one
          smudge. */}
      <span className={`${n.meta} ${s.metaRow}`}>
        <span className={n.eventType}>
          <span className={`${n.eventDot} ${EVENT_TYPE_DOT_CLASS[latest.eventType]}`} />
          <span className={n.eventLabel}>{EVENT_TYPE_LABEL[latest.eventType]}</span>
        </span>
        {latest.sourceDomain && (
          <>
            <span className={n.sep} />
            <span className={n.source}>{latest.sourceDomain}</span>
          </>
        )}
        <span className={n.sep} />
        <span className={n.time}>{formatTimeAgo(latest.eventDate)}</span>
      </span>

      <span className={`${n.headline} ${n.headlineCompact} ${s.headline}`}>{latest.title}</span>

      {latest.summary && <span className={`${n.summary} ${n.summaryCompact}`}>{latest.summary}</span>}

      {more && <span className={s.moreRow}>{more}</span>}
    </div>
  );
}
