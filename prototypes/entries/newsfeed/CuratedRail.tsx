'use client';

import clsx from 'clsx';
import { useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';

// Production news-card styling, reused 1:1 for the rail modules.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

import { FollowTeamsCard } from './FollowTeamsCard';
import { UPVOTES } from '../newsfeed-v0/mocks';

interface CuratedRailProps {
  followedTeams: Set<string>;
  onToggleFollow: (teamUid: string, teamName: string) => void;
  /**
   * The three most-upvoted stories. Ranked by the page, not here, because the
   * sub-desktop `PopularScroller` shows the same three — one list, two shells.
   */
  popularItems: ITeamNewsItem[];
  /**
   * Visibility class for the Teams-to-follow card. The page passes a
   * hide-below-desktop class while the mobile scroller is rendering, so exactly
   * one copy is on screen; when the block goes, so does the scroller, and this
   * one comes back at every width.
   */
  followCardClassName?: string;
  /**
   * Whether there is an account behind the page. The digest card is the rail's
   * one module that creates something rather than pointing at something, and
   * what it creates is an email — so without an address on file, Subscribe is
   * the offer being taken up rather than a switch that quietly flips.
   *
   * It is *not* hidden while signed out, unlike the inline `SubscribeBanner`.
   * That one is a conditional interruption that fires under a narrowed view, so
   * it would stack a second ask under the banner already making one. This is
   * standing rail content describing something the product does, and a visitor
   * reading "in your inbox every Monday" has been given another honest reason to
   * sign in — removing it would just make the rail shorter for no visible cause.
   */
  signedIn?: boolean;
  /** Sign-in door, run before the subscribe lands. See `signedIn`. */
  onSignIn?: () => void;
}

/**
 * Right rail. Same three modules as newsfeed-v0, with one change.
 *
 * Every follow suggestion states a *reason*, not a tagline. Production's
 * `ISuggestedTeam` has carried a `reason` field all along — newsfeed-v0's mock
 * dropped it. A tagline tells you what a team is, which you can get from its
 * profile; a reason tells you why it's in front of you, which is the only
 * thing that earns a follow from a rail.
 */
export function CuratedRail({
  followedTeams,
  onToggleFollow,
  popularItems,
  followCardClassName,
  signedIn = true,
  onSignIn,
}: CuratedRailProps) {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <>
      {/* First in the rail, so on desktop it sits level with the top of the
          block and everything below follows straight after it. */}
      <FollowTeamsCard followedTeams={followedTeams} onToggleFollow={onToggleFollow} className={followCardClassName} />

      {/* Desktop only: below 960px the rail stacks under the whole feed, so the
          strip spliced into the feed column carries this module instead. */}
      <div className={clsx(s.card, v0.railCard, v0.railHideMobile)}>
        <h3 className={v0.railTitle}>Popular this week</h3>
        {popularItems.map((item) => (
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
          /* Stash-and-replay, the same shape Follow uses on this page: sign in,
             then land the subscribe, so the click the person made is the click
             that happens rather than one they have to make twice. */
          onClick={() => {
            if (!signedIn) {
              onSignIn?.();
              setSubscribed(true);
              return;
            }
            setSubscribed((v) => !v);
          }}
        >
          {subscribed ? 'Subscribed ✓' : 'Subscribe'}
        </Button>
      </div>
    </>
  );
}
