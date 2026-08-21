'use client';

import type { SVGProps } from 'react';
import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Production news-card shell (card chrome, logo sizes), reused 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { SourceList } from '../newsfeed-v0/SourceList';
import { ShareMenu } from '../newsfeed-v0/ShareMenu';
import { LikeButton, ViewCount, CommentButton } from '../newsfeed-v0/FeedActions';
import { viewsFor } from '../newsfeed-v0/mocks';
import { FollowButton } from '../follow-shared/FollowButton';
import type { TopStory } from './mocks';

const KICKER_COLOR_CLASS: Record<ITeamNewsItem['eventType'], string> = {
  FUNDING: 'kFunding',
  LAUNCH: 'kLaunch',
  PARTNERSHIP: 'kPartnership',
  ANNOUNCEMENT: 'kAnnouncement',
  MILESTONE: 'kMilestone',
  OTHER: 'kAnnouncement',
  HIRING: 'kAnnouncement',
  DEALS: 'kAnnouncement',
};

const WEEK_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

/**
 * Filled pin. `@/components/icons/PushPinIcon` is the hairline outline at 24px —
 * at eyebrow size its 1px contour dissolves into the uppercase letterforms next
 * to it. This is the same diagonal pin production already ships filled at 12px
 * (`public/icons/pin-black.svg`), transcribed verbatim so the geometry stays
 * production's; only the hardcoded `#64748B` becomes `currentColor` so it
 * inherits the brand blue from `.topBadge`.
 */
function PinFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.07526 0.140046L8.13792 0.19538L11.8046 3.86205C11.917 3.97503 11.9852 4.12453 11.9968 4.28347C12.0085 4.4424 11.9628 4.60025 11.8681 4.72841C11.7734 4.85657 11.6359 4.94657 11.4805 4.98209C11.3252 5.01761 11.1623 4.99631 11.0213 4.92205L8.90659 7.03605L7.95726 9.56738C7.93225 9.63417 7.89669 9.69652 7.85192 9.75205L7.80526 9.80538L6.80526 10.8054C6.69038 10.9201 6.5376 10.9889 6.37558 10.999C6.21357 11.009 6.05345 10.9596 5.92526 10.86L5.86192 10.8047L3.99992 8.94338L1.47126 11.4714C1.35128 11.5909 1.1903 11.6604 1.021 11.6655C0.851701 11.6707 0.686781 11.6112 0.559737 11.4992C0.432694 11.3872 0.353053 11.231 0.33699 11.0624C0.320928 10.8938 0.369648 10.7254 0.473256 10.5914L0.52859 10.5287L3.05659 8.00005L1.19526 6.13805C1.08047 6.02325 1.01152 5.87052 1.00133 5.7085C0.991143 5.54648 1.04042 5.38632 1.13992 5.25805L1.19526 5.19538L2.19526 4.19538C2.24556 4.1449 2.30363 4.10281 2.36726 4.07071L2.43259 4.04271L4.96326 3.09271L7.07726 0.97938C7.00517 0.844601 6.98158 0.689144 7.01045 0.539049C7.03932 0.388954 7.11888 0.253336 7.23582 0.154911C7.35276 0.0564862 7.49997 0.00123267 7.65279 -0.00159482C7.80561 -0.00442232 7.95476 0.0460147 8.07526 0.140046Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface TopStoryCardProps {
  story: ITeamNewsItem;
  top: TopStory;
  following: boolean;
  onToggleFollow: () => void;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  commentCount: number;
  onOpen: () => void;

  /** Hidden on the "today" spine, where this story never reaches the feed. */
  className?: string;
}

/**
 * The week's single editorial pick, above the feed.
 *
 * Three things make it work, and it is worth nothing without any of them:
 * it is network-wide rather than personalized (a personalized hero is just a
 * better sort — nobody can talk about it); it states *why* it won, because an
 * unexplained pick reads as arbitrary and costs trust in everything below it;
 * and it is visibly a different object from a feed card, not a larger one.
 */
export function TopStoryCard({
  story,
  top,
  following,
  onToggleFollow,
  likeCount,
  liked,
  onToggleLike,
  commentCount,
  onOpen,
  className,
}: TopStoryCardProps) {
  const weekOf = new Date(top.weekOf).toLocaleDateString('en-US', WEEK_FORMAT);

  return (
    <section className={clsx(s.card, local.topCard, className)} aria-label="Top story of the week">
      <div className={local.topEyebrow}>
        {/* Was a filled blue pill, which read as an active filter — it sat ~50px
            under a row of category pills, one of which is also a filled blue pill.
            Now an uppercase brand eyebrow with a pin: same kicker convention this
            entry already uses for `.emailKicker` and `.masthead`, and a shape no
            filter in this app has. Pin rather than sparkles — the pick is human,
            and sparkles would claim it was AI. */}
        <span className={local.topBadge}>
          <PinFilledIcon className={local.topBadgeIcon} aria-hidden />
          Top stories
        </span>
        <span className={local.topWeek}>Week of {weekOf}</span>
      </div>

      <div
        role="link"
        tabIndex={0}
        className={local.topBody}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div className={local.topTeamRow}>
          {story.teamLogoUrl ? (
            <img className={s.logo} src={story.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={s.logoFallback}>{getTeamLogoFallback(story.teamName)}</div>
          )}
          <a
            href={`/teams/${story.teamUid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(s.teamName, v0.teamNameTight)}
            onClick={(e) => e.stopPropagation()}
          >
            {story.teamName}
          </a>
          <span className={v0.headFollow} onClick={(e) => e.stopPropagation()}>
            <FollowButton following={following} onClick={onToggleFollow} name={story.teamName} size="xs" tertiary />
          </span>
        </div>

        <h2 className={local.topTitle}>{story.title}</h2>
        {/* `top.longSummary` used to render here instead, for the one-pick shape
            of the block. That shape is gone (see `TopStoriesBlock`), so this is a
            teaser and nothing in the prototype reads the long body today — the
            mock keeps it for the Monday email, which is the surface a written
            body has the room for. */}
        {story.summary && <p className={local.topSummary}>{story.summary}</p>}

        {/* The "Why this made the top" reasoning block and the "Also considered"
            disclosure both used to sit here; the runners-up are visible rows under
            this card in `TopStoriesBlock` now. The eyebrow's attribution line
            ("Picked by the network team") is gone too — the pin and "Top stories"
            already say this is a pick, and a byline for it was more chrome than the
            band could carry. `CURATION_ATTRIBUTION` and `TopStory.why` stay in the
            mock because the email digest still states both. */}

        <div className={clsx(v0.footer, local.topFooter)}>
          <span className={v0.source}>
            <span className={clsx(v0.metaEvent, v0[KICKER_COLOR_CLASS[story.eventType]])}>
              {EVENT_TYPE_LABEL[story.eventType]}
            </span>
            {' · '}
            <SourceList fallbackDomain={story.sourceDomain} />
            {' · '}
            {formatTimeAgo(story.eventDate)}
          </span>
          <span className={v0.footerActions} onClick={(e) => e.stopPropagation()}>
            <ShareMenu variant="card" url={story.sourceUrl ?? undefined} />
            {/* The hero is a news card too — without this it would be the one story
                in the column showing likes but no reads. */}
            <ViewCount count={viewsFor(story.uid)} compact />
            <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
            {/* Same Views · Likes · Comments row every other card in the column
                carries. The thread itself opens in the detail modal rather than
                inline: `.topBlock` clips to its rounded corners, and an expanding
                thread inside the band would push the two runners-up down a screen. */}
            <CommentButton count={commentCount} open={false} onToggle={onOpen} opensDetail />
          </span>
        </div>
      </div>
    </section>
  );
}
