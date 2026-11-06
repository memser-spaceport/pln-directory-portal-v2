'use client';

import clsx from 'clsx';
import { useRef } from 'react';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import type { IHomeEvents, IHomeRoles } from '@/types/home.types';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';
import { useHomeFeed, type HomeFeedProps } from '@/components/page/home/TeamNews/hooks/useHomeFeed';
import { SHOW_POPULAR_THIS_WEEK } from '@/components/page/home/TeamNews/constants';
import { PopularThisWeekCard } from '@/components/page/home/TeamNews/components/NewsRail/components/PopularThisWeekCard';
import home from '@/app/home/page.module.css';

import { DealsSection } from './DealsSection';
import { FocusAreaCards } from './FocusAreaCards';
import { HomeRail } from './HomeRail';
import { NetworkUpdates } from './NetworkUpdates';
import { TeamsToFollowSection } from './TeamsToFollowSection';
import { useHomeDeals } from './useHomeDeals';
import s from './HomeV2.module.scss';

/**
 * The signed-in Home (LAB-3125), the prototype's member page (homepage-redesign-v0, `?state=signed-in`, agreed at
 * the 2026-11-02 design standup) on the production feed:
 *
 * 1. Network Updates: one stream of news and forum posts, beside one rail of open roles, upcoming events, Teams to
 *    follow, deals (with deals access only) and Popular this week. On phones the rail stacks after the stream.
 * 2. The focus areas, as on the signed-out page.
 *
 * No Quick Actions, no focus-area tabs and no Top stories band.
 */
export function SignedInHome({
  feed: feedProps,
  roles,
  events,
  portfolio,
  projectFocusAreaCounts = null,
  teamFocusAreaCounts = null,
}: {
  /** The production feed's data, as the previous Home's `TeamNews` takes it. */
  feed: HomeFeedProps;
  /** Null when the job board call failed: the section is left out. */
  roles: IHomeRoles | null;
  /** Null when the events call failed: the section is left out. */
  events: IHomeEvents | null;
  /** The merged portfolio, for the focus-area cards. */
  portfolio: PortfolioTeam[];
  /** Projects per directory focus-area title; null when it failed, so every card keeps its Projects link. */
  projectFocusAreaCounts?: Record<string, number> | null;
  /** Teams per directory focus-area title (the Teams links' totals); null when it failed, so the cards show no count. */
  teamFocusAreaCounts?: Record<string, number> | null;
}) {
  const analytics = useHomeAnalytics();
  const feed = useHomeFeed(feedProps, {
    layout: 'stream',
    onTagScopeChange: (tags, action) => analytics.onFeedTagScopeChanged({ tags, action }),
  });
  const deals = useHomeDeals();
  // The rail beside the stream: the stream's cut lands where it ends.
  const railRef = useRef<HTMLElement>(null);

  return (
    <div className={home.home}>
      <div className={clsx(home.home__cn, s.memberPage)}>
        <div className={s.newsRow}>
          <NetworkUpdates feed={feed} fillTo={railRef} forYouTags={feedProps.forYouTags} />

          {/* One full sidebar: every rail module is a section of a single card, divided by hairlines. */}
          <HomeRail railRef={railRef} roles={roles} events={events} signedIn>
            <TeamsToFollowSection
              suggestions={feed.suggestedTeams}
              followedTeamUids={feed.followedTeamUids}
              onFollowToggle={feed.handleFollowToggle}
            />
            {/* Only with deals access; without it there is no locked teaser. */}
            {deals && <DealsSection deals={deals.deals} total={deals.total} />}
            {SHOW_POPULAR_THIS_WEEK && (
              <PopularThisWeekCard items={feed.railPopularItems} onPopularItemClick={feed.handlePopularItemClick} />
            )}
          </HomeRail>
        </div>

        {/* The focus areas, as signed out: they replace the previous Home's focus-area section. */}
        <section className={s.reposSection} aria-labelledby="home-focus-title">
          <h2 id="home-focus-title" className={s.rowTitle}>
            Browse by focus area
          </h2>
          <FocusAreaCards teams={portfolio} projectCounts={projectFocusAreaCounts} teamCounts={teamFocusAreaCounts} />
        </section>
      </div>
    </div>
  );
}
