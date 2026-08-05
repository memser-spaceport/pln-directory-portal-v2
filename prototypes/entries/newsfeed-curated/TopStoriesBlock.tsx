'use client';

import clsx from 'clsx';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Production news-card shell, reused 1:1 for the secondary rows' logo + headline.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { FollowButton } from '../follow-shared/FollowButton';
import { TopStoryCard } from './TopStoryCard';
import type { TopStory } from './mocks';

const KICKER_COLOR_CLASS: Record<ITeamNewsItem['eventType'], string> = {
  FUNDING: 'kFunding',
  LAUNCH: 'kLaunch',
  PARTNERSHIP: 'kPartnership',
  ANNOUNCEMENT: 'kAnnouncement',
  MILESTONE: 'kMilestone',
  OTHER: 'kAnnouncement',
};

interface TopStoriesBlockProps {
  lead: ITeamNewsItem;
  /** The other two picks. Rendered as rows, not cards. */
  also: ITeamNewsItem[];
  top: TopStory;
  attribution: string;
  followedTeams: Set<string>;
  onToggleFollow: (teamUid: string, teamName: string) => void;
  likeCount: (uid: string) => number;
  isLiked: (uid: string) => boolean;
  onToggleLike: (uid: string) => void;
  onOpenStory: (story: ITeamNewsItem) => void;
}

/**
 * The week's editorial block: one lead plus two secondary rows.
 *
 * Asymmetric on purpose. Three equal heroes would cost three written why-lines
 * every week — which is exactly what makes the human-curated start unsustainable,
 * and the human-curated start is how the ranking criteria get proven before a
 * model inherits them. So the lead keeps the reasoning and the attribution, and
 * the other two are rows: chip, headline, team. Same shape Apple News, Ghost and
 * NAVER all land on.
 *
 * One band, not three cards — otherwise the two rows read as feed items that
 * happen to sit high, rather than as part of the pick.
 */
export function TopStoriesBlock({
  lead,
  also,
  top,
  attribution,
  followedTeams,
  onToggleFollow,
  likeCount,
  isLiked,
  onToggleLike,
  onOpenStory,
}: TopStoriesBlockProps) {
  return (
    <section className={local.topBlock} aria-label="Top stories this week">
      <TopStoryCard
        story={lead}
        top={top}
        attribution={attribution}
        following={followedTeams.has(lead.teamUid)}
        onToggleFollow={() => onToggleFollow(lead.teamUid, lead.teamName)}
        likeCount={likeCount(lead.uid)}
        liked={isLiked(lead.uid)}
        onToggleLike={() => onToggleLike(lead.uid)}
        onOpen={() => onOpenStory(lead)}
      />

      {also.length > 0 && (
        <ul className={local.alsoList}>
          {also.map((item) => (
            /* Same head row as every other news card — logo, team name, Follow.
               The row can't stay a <button> now that it contains one: production
               hit this exactly in `ReferRoleRow` ("the whole row is no longer a
               single <a> — can't nest a button in an anchor"). So the headline is
               the click target, the way `TopStoryCard` and `V0FeedCard` split it. */
            <li key={item.uid} className={local.alsoRow}>
              <div className={s.head}>
                {item.teamLogoUrl ? (
                  <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
                ) : (
                  <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
                )}
                <a
                  href={`/teams/${item.teamUid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(s.teamName, v0.teamNameTight)}
                >
                  {item.teamName}
                </a>
                <span className={v0.headFollow}>
                  <FollowButton
                    following={followedTeams.has(item.teamUid)}
                    onClick={() => onToggleFollow(item.teamUid, item.teamName)}
                    name={item.teamName}
                    size="xs"
                    tertiary
                  />
                </span>
              </div>

              <button type="button" className={local.alsoTitleBtn} onClick={() => onOpenStory(item)}>
                <span className={local.alsoTitle}>{item.title}</span>
              </button>

              {/* These are top stories too — a headline alone makes them read as an
                  afterthought. Clamped to two lines so three summaries don't push
                  the stream under the fold. */}
              {item.summary && <p className={local.alsoSummary}>{item.summary}</p>}

              {/* Team name lives in the head row now, so it isn't repeated here. */}
              <span className={local.alsoMeta}>
                <span className={clsx(v0.metaEvent, v0[KICKER_COLOR_CLASS[item.eventType]])}>
                  {EVENT_TYPE_LABEL[item.eventType]}
                </span>
                {' · '}
                {formatTimeAgo(item.eventDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
