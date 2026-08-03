'use client';

import clsx from 'clsx';
import { useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { Button } from '@/components/common/Button';

// Production news-card styling, reused 1:1 for the rail modules.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

import { FollowButton } from '@/components/ui/FollowButton';
import { CURATED_SUGGESTED_TEAMS, COVERAGE } from './mocks';
import { UPVOTES } from '../newsfeed-v0/mocks';

interface CuratedRailProps {
  followedTeams: Set<string>;
  onToggleFollow: (teamUid: string, teamName: string) => void;
  allItems: ITeamNewsItem[];
  /** Jump to the digest view — the rail is where someone decides they'd rather get this by email. */
  onPreviewDigest: () => void;
}

/**
 * Right rail. Same three modules as newsfeed-v0, with two changes.
 *
 * 1. Every follow suggestion states a *reason*, not a tagline. Production's
 *    `ISuggestedTeam` has carried a `reason` field all along — newsfeed-v0's mock
 *    dropped it. A tagline tells you what a team is, which you can get from its
 *    profile; a reason tells you why it's in front of you, which is the only
 *    thing that earns a follow from a rail.
 * 2. A coverage line, so the feed's blind spot is visible and reportable rather
 *    than silent.
 */
export function CuratedRail({ followedTeams, onToggleFollow, allItems, onPreviewDigest }: CuratedRailProps) {
  const popular = [...allItems].sort((a, b) => (UPVOTES[b.uid] ?? 0) - (UPVOTES[a.uid] ?? 0)).slice(0, 3);
  const [subscribed, setSubscribed] = useState(false);

  return (
    <>
      <div className={clsx(s.card, v0.railCard, v0.followRailCard)}>
        <h3 className={v0.railTitle}>Teams to follow</h3>
        {CURATED_SUGGESTED_TEAMS.map((team) => (
          <div key={team.uid} className={v0.railRow}>
            {team.logo ? (
              <img className={s.logo} src={team.logo} alt="" loading="lazy" />
            ) : (
              <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
            )}
            <span className={v0.railInfo}>
              <span className={v0.railNameRow}>
                <span className={v0.railName}>{team.name}</span>
                <FollowButton
                  following={followedTeams.has(team.uid)}
                  onClick={() => onToggleFollow(team.uid, team.name)}
                  name={team.name}
                  size="default"
                  className={v0.railFollowBtn}
                />
              </span>
              {/* The change: why *you*, not what they are. */}
              <span className={local.railWhy} title={team.reason}>
                {team.reason}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className={clsx(s.card, v0.railCard)}>
        <h3 className={v0.railTitle}>Popular this week</h3>
        {popular.map((item) => (
          <div
            key={item.uid}
            role="link"
            tabIndex={0}
            className={v0.railStory}
            onClick={() => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <span className={v0.railStoryTitle}>{item.title}</span>
            <span className={v0.railReason}>
              ↑ {UPVOTES[item.uid] ?? 0} · {item.teamName}
            </span>
          </div>
        ))}
      </div>

      {/* Coverage, stated. A gap nobody can see is a gap nobody fixes. */}
      <div className={clsx(s.card, v0.railCard, local.coverageCard)}>
        <h3 className={v0.railTitle}>Coverage</h3>
        <p className={local.coverageText}>
          Tracking <strong>{COVERAGE.teamsTracked} teams</strong> across the network.
        </p>
        <p className={local.coverageText}>
          {COVERAGE.untaggedThisWeek} stories this week carry no focus area — they reach the feed, but no focus filter.
        </p>
        <a className={local.coverageLink} href="#missing-team">
          Missing a team? Tell us →
        </a>
      </div>

      <div className={v0.digestPromo}>
        <div className={v0.digestPromoText}>
          <h3 className={v0.digestPromoTitle}>Weekly digest</h3>
          <p className={v0.digestPromoBody}>
            The top story, the raises, and who started hiring — in your inbox every Monday.
          </p>
        </div>
        <Button
          style={subscribed ? 'border' : 'fill'}
          variant={subscribed ? 'neutral' : 'primary'}
          className={v0.digestPromoBtn}
          onClick={() => setSubscribed((v) => !v)}
        >
          {subscribed ? 'Subscribed ✓' : 'Subscribe'}
        </Button>
        <button type="button" className={local.previewLink} onClick={onPreviewDigest}>
          Preview this week&apos;s email →
        </button>
      </div>
    </>
  );
}
