'use client';

import clsx from 'clsx';
import { useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { ExploreLogoWall } from '@/components/page/explore-pl-network/ExploreLogoWall/ExploreLogoWall';
import { aileron } from '@/components/page/explore-pl-network/aileron';
import explore from '@/components/page/explore-pl-network/ExplorePlNetworkView.module.scss';

import { JobsRail } from '../home-refactor/JobsRail';
import { EventsRail } from '../home-refactor/EventsRail';
import { EntitiesRow, FactsBand, FocusAreas, StoryIntro } from './StoryIntro';
import { NewsPreviewList } from './NewsPreviewList';
import { HomeFooter } from './HomeFooter';
import {
  FOUNDER_FACES,
  NEWS_PREVIEW,
  PORTFOLIO_TEAMS,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
  UPCOMING_EVENTS,
  rolesBesideEvents,
} from './mocks';
import s from './HomeV2Prototype.module.scss';

/** The Join card's facepile: three network founders' own directory photos (live members API, 2026-10-30). */
const JOIN_FACES = FOUNDER_FACES.map((f) => f.image);

/**
 * The signed-out Home agreed at the 2026-11-02 design standup, shared by home-v2
 * and home-v2-b (B re-exports it), so the two can't drift:
 *
 * 1. Who PL is beside the Join card: no overline, a smaller title, the copy cut
 *    to the mission and one sentence.
 * 2. The figures band.
 * 3. This week's news beside one sidebar holding open roles and upcoming events,
 *    the signed-in rail's sections (the meeting's "match the sections"). With no
 *    events in the next 30 days, events go and roles take the room.
 * 4. The portfolio map, the focus areas in Explore's simpler numbered look, then
 *    the PL entities as a row of the same width.
 * 5. The logo wall, and the page ends. No closing Join card (an FAQ may take
 *    that spot later) and no SPV footer: its investment disclaimer and Demo Day
 *    legal links belong to SPV pages, not the directory's Home.
 *
 * Deals are not here: they exist only for signed-in portfolio founders.
 */
export function SignedOutHome({
  storyFor,
  allHref,
  likeCount,
  commentCount,
  onOpenStory,
  onSignUp,
  onSignIn,
  hasEvents = true,
}: {
  /** A week story, re-dated and re-tagged (home-v2's storyFor). */
  storyFor: (uid: string) => ITeamNewsItem;
  /** "See all updates": the ?view=news page. */
  allHref: string;
  likeCount: (uid: string) => number;
  commentCount: (uid: string) => number;
  onOpenStory: (story: ITeamNewsItem) => void;
  onSignUp: () => void;
  onSignIn: () => void;
  /** Any open event in the next 30 days (the ?events= review switch). */
  hasEvents?: boolean;
}) {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className={clsx(s.storyPage, aileron.variable)}>
      {/* 1. Who PL is, beside the Join card. */}
      <div className={s.storyBand}>
        <StoryIntro onSignUp={onSignUp} onSignIn={onSignIn} faces={JOIN_FACES} />
      </div>

      {/* 2. The figures as their own white band. */}
      <FactsBand portfolioCount={PORTFOLIO_TEAMS.length} />

      {/* 3. This week's news beside roles + events: jobs are the reason a third of signed-out visitors click on. */}
      <div className={s.storyBand}>
        <div className={s.newsEntities}>
          <NewsPreviewList
            stories={[NEWS_PREVIEW.lead, ...NEWS_PREVIEW.also].map((i) => storyFor(i.uid))}
            likeCount={likeCount}
            commentCount={commentCount}
            onOpen={onOpenStory}
            onNeedsAccount={onSignUp}
            allHref={allHref}
          />
          <aside className={s.rail}>
            <div className={s.sidebar}>
              <JobsRail
                jobs={rolesBesideEvents(hasEvents)}
                total={TOTAL_OPEN_ROLES}
                note={
                  <p className={s.railNote}>
                    <button type="button" className={s.inlineLink} onClick={onSignUp}>
                      Sign up
                    </button>{' '}
                    to apply with your directory profile.
                  </p>
                }
              />
              {hasEvents && <EventsRail events={UPCOMING_EVENTS} total={TOTAL_UPCOMING_EVENTS} />}
            </div>
          </aside>
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
                {PORTFOLIO_TEAMS.length} teams across four focus areas, with Protocol Labs at the centre.
              </p>
            </div>
            {/* On phones the map is ~3,000px of hexes; Home clamps it so the story keeps moving. */}
            <div className={clsx(s.mapClamp, mapOpen && s.mapClampOpen)}>
              <PortfolioPanel teams={PORTFOLIO_TEAMS} />
              {!mapOpen && (
                <button type="button" className={s.mapMore} onClick={() => setMapOpen(true)}>
                  Show the whole map
                </button>
              )}
            </div>
            <FocusAreas teams={PORTFOLIO_TEAMS} />
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
    </div>
  );
}
