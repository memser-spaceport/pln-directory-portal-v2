'use client';

import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import type { IHomeEvents, IHomeRoles } from '@/types/home.types';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { ExploreLogoWall } from '@/components/page/explore-pl-network/ExploreLogoWall/ExploreLogoWall';
import { aileron } from '@/components/page/explore-pl-network/aileron';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';
import explore from '@/components/page/explore-pl-network/ExplorePlNetworkView.module.scss';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { useNewsDeepLink } from '@/components/page/home/TeamNews/hooks/useNewsDeepLink';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';

import { EntitiesRow } from './EntitiesRow';
import { FactsBand } from './FactsBand';
import { FocusAreaCards } from './FocusAreaCards';
import { HomeFooter } from './HomeFooter';
import { HomeHero } from './HomeHero';
import { HomeRail } from './HomeRail';
import { ThisWeekList } from './ThisWeekList';
import { HOME_NEWS_VIEW_HREF, JOIN_FACES } from './constants';
import { useHomeAuthDoors } from './useHomeAuthDoors';
import s from './HomeV2.module.scss';

/**
 * The signed-out Home (LAB-3072), the prototype's `SignedOutHome` (home-v2, agreed at the 2026-11-02 design standup)
 * on real data:
 *
 * 1. Who PL is beside the Join card: the mission as the H1 and one sentence.
 * 2. The figures band.
 * 3. This week's news beside one sidebar holding open roles and upcoming events. With no events in the next 30 days,
 *    events go and roles take the room.
 * 4. The portfolio map, the focus areas under it, then the PL entities as a row of the same width.
 * 5. The logo wall, then the directory's own footer.
 */
export function SignedOutHome({
  stories,
  deepLinkedItem = null,
  roles,
  events,
  portfolio,
  projectFocusAreaCounts = null,
}: {
  /** This week's three stories (pickThisWeek). */
  stories: ITeamNewsItem[];
  /** A shared `?news=<uid>` story outside the three, so its modal still opens. */
  deepLinkedItem?: ITeamNewsItem | null;
  /** Null when the job board call failed: the section is left out. */
  roles: IHomeRoles | null;
  /** Null when the events call failed: the section is left out. */
  events: IHomeEvents | null;
  /** The merged portfolio (Directory over the fallback file). */
  portfolio: PortfolioTeam[];
  /** Projects per directory focus-area title; null when it failed, so every card keeps its Projects link. */
  projectFocusAreaCounts?: Record<string, number> | null;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const analytics = useHomeAnalytics();
  const { signUp, signIn } = useHomeAuthDoors();

  // The story modal follows ?news=<uid>, as on the previous Home: a shared link opens it, and Sign in from inside it
  // comes back to it.
  const storiesByUid = useMemo(() => {
    const byUid = new Map(stories.map((story) => [story.uid, story]));
    if (deepLinkedItem && !byUid.has(deepLinkedItem.uid)) byUid.set(deepLinkedItem.uid, deepLinkedItem);
    return byUid;
  }, [stories, deepLinkedItem]);
  const isValidUid = useCallback((uid: string) => storiesByUid.has(uid), [storiesByUid]);
  const { activeNewsUid, openNews, closeNews } = useNewsDeepLink({ isValidUid });
  const activeStory = activeNewsUid ? (storiesByUid.get(activeNewsUid) ?? null) : null;

  const { data: commentCounts } = useFeedCommentCounts({ uids: stories.map((story) => story.uid), enabled: true });

  return (
    <div className={clsx(s.storyPage, aileron.variable)}>
      {/* 1. Who PL is, beside the Join card. */}
      <div className={s.storyBand}>
        <HomeHero onSignUp={() => signUp('hero')} onSignIn={() => signIn('hero')} faces={JOIN_FACES} />
      </div>

      {/* 2. The figures as their own white band. */}
      <FactsBand portfolioCount={portfolio.length} />

      {/* 3. This week's news beside roles + events: jobs are the reason a third of signed-out visitors click on. */}
      <div className={s.storyBand}>
        <div className={s.newsEntities}>
          <ThisWeekList
            stories={stories}
            commentCounts={commentCounts}
            onOpen={(story, position) => {
              analytics.onNewsPickClicked({ news_uid: story.uid, position });
              openNews(story.uid);
            }}
            onNeedsAccount={() => signUp('news')}
            allHref={HOME_NEWS_VIEW_HREF}
            onSeeAll={() => analytics.onSeeAllClicked({ section: 'news' })}
          />
          <HomeRail
            roles={roles}
            events={events}
            signedIn={false}
            rolesNote={
              <p className={s.railNote}>
                <button type="button" className={s.inlineLink} onClick={() => signUp('roles')}>
                  Sign up
                </button>{' '}
                to apply with your directory profile.
              </p>
            }
          />
        </div>
      </div>

      {/* From the portfolio down: one full-bleed white band (no grey ground, no sheet). */}
      <div className={clsx(explore.root, s.whiteBand)}>
        <div className={clsx(explore.content, s.whiteSheet)}>
          {/* 4. The portfolio on the islands map, the focus areas under it, then the PL entities. */}
          <section className={explore.sectionTeams} aria-labelledby="home-portfolio-title">
            <div className={explore.subtitle}>
              <h2 id="home-portfolio-title" className={explore.label}>
                The portfolio
              </h2>
              <p className={explore.supportingText}>
                {portfolio.length} teams across four focus areas, with Protocol Labs at the centre.
              </p>
            </div>
            {/* On phones the map is ~3,000px of hexes; Home clamps it so the story keeps moving. */}
            <div className={clsx(s.mapClamp, mapOpen && s.mapClampOpen)}>
              <PortfolioPanel teams={portfolio} />
              {!mapOpen && (
                <button
                  type="button"
                  className={s.mapMore}
                  onClick={() => {
                    setMapOpen(true);
                    analytics.onSeeAllClicked({ section: 'map' });
                  }}
                >
                  Show the whole map
                </button>
              )}
            </div>
            <FocusAreaCards teams={portfolio} projectCounts={projectFocusAreaCounts} />
          </section>

          <section className={clsx(explore.sectionTeams, s.storySection)} aria-labelledby="home-entities-title">
            <div className={explore.subtitle}>
              <h2 id="home-entities-title" className={explore.label}>
                Protocol Labs entities
              </h2>
            </div>
            <EntitiesRow />
          </section>

          {/* 5. Who has backed the network. */}
          <section className={clsx(explore.sectionPartners, s.storyEnd)}>
            <ExploreLogoWall />
          </section>
        </div>
      </div>

      {/* 6. The directory's own footer (no SPV disclaimer, no Demo Day legal PDFs). */}
      <HomeFooter />

      {activeStory && (
        <NewsDetailModal
          item={activeStory}
          onClose={closeNews}
          // Signed out, the modal's Like and Follow send the reader to sign in before either is called.
          onUpvoteToggle={() => signUp('news')}
          source="home"
        />
      )}
    </div>
  );
}
