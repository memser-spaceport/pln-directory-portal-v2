'use client';

import clsx from 'clsx';
import { useState, type ReactNode } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { Button } from '@/components/common/Button';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { LinkedLogoWall } from './LinkedLogoWall';
import { aileron } from '@/components/page/explore-pl-network/aileron';
import explore from '@/components/page/explore-pl-network/ExplorePlNetworkView.module.scss';

import { JobsRail } from '../home-refactor/JobsRail';
import { EventsRail } from '../home-refactor/EventsRail';
import { EntitiesRow, FactsBand, FocusAreas, JoinCard, StoryIntro } from './StoryIntro';
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
import fb from '../follow-shared/FollowButton.module.scss';
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
 * 5. The Join card again after the entities (2026-11-05 review), then the logo
 *    wall, and the page ends. No SPV footer: its investment disclaimer and Demo
 *    Day legal links belong to SPV pages, not the directory's Home.
 *
 * Deals are not here: they exist only for signed-in portfolio founders.
 */
export function SignedOutHome({
  storyFor,
  allHref,
  allCount,
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
  /** Stories on that page, for "See all N updates". */
  allCount?: number;
  likeCount: (uid: string) => number;
  commentCount: (uid: string) => number;
  onOpenStory: (story: ITeamNewsItem) => void;
  onSignUp: () => void;
  onSignIn: () => void;
  /** Any open event in the next 30 days (the ?events= review switch). */
  hasEvents?: boolean;
}) {
  return (
    <div className={clsx(s.storyPage, aileron.variable)}>
      {/* 1. Who PL is, beside the Join card. */}
      <div className={s.storyBand}>
        {/* Phones (2026-11-06): the figures sit inside the hero, before Sign up / Sign in. */}
        <StoryIntro
          onSignUp={onSignUp}
          onSignIn={onSignIn}
          faces={JOIN_FACES}
          facts={<FactsBand portfolioCount={PORTFOLIO_TEAMS.length} className={s.factsInline} />}
        />
      </div>

      {/* 2. The figures as their own white band (tablet and up; phones show them in the hero). */}
      <FactsBand portfolioCount={PORTFOLIO_TEAMS.length} className={s.factsBandWide} />

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
            allCount={allCount}
          />
          <aside className={s.rail}>
            <div className={s.sidebar}>
              <JobsRail
                jobs={rolesBesideEvents(hasEvents)}
                total={TOTAL_OPEN_ROLES}
                note={
                  /* 2026-11-05 review (Anuj): as brand inline text, Sign up looked like "See all N
                     jobs" under it and was easy to miss. Now the hero's glossy primary, full width
                     like the Join card's, with the ask on the label (a trailing sentence wraps
                     under the button at rail width); See all stays the quiet text link. */
                  <div className={s.railSignUp}>
                    <Button size="s" style="fill" variant="primary" className={clsx(s.joinBtn, fb.glossy)} onClick={onSignUp}>
                      Sign up to apply
                    </Button>
                  </div>
                }
              />
              {hasEvents && <EventsRail events={UPCOMING_EVENTS} total={TOTAL_UPCOMING_EVENTS} />}
            </div>
          </aside>
        </div>
      </div>

      {/* 4–5. The portfolio, focus areas and entities, the Join card again, then the logo wall. */}
      <NetworkOverview>
        {/* 2026-11-05 review: the hero asks before anyone has read the page, so the same
            Join card asks again once the story is told (one component, so the two can't drift). */}
        <JoinCard
          id="home-join-end-title"
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          faces={JOIN_FACES}
          className={s.joinCardEnd}
          wide
        />
      </NetworkOverview>

      {/* 6. The directory's own footer (no SPV disclaimer, no Demo Day legal PDFs). */}
      <HomeFooter />
    </div>
  );
}

/**
 * The network overview: the portfolio on the islands map, the focus areas under
 * it, the PL entities, then the investor logo wall, on one full-bleed white band.
 * Signed out it carries the closing Join card (`children`, between the entities
 * and the logos). Signed in (2026-11-06) it sits under the feed's own "Browse by
 * focus area" section, so `focusAreas={false}` leaves the cards out rather than
 * showing them twice.
 */
export function NetworkOverview({
  focusAreas = true,
  className,
  children,
}: {
  focusAreas?: boolean;
  className?: string;
  /** Between the entities and the logo wall (signed out: the closing Join card). */
  children?: ReactNode;
}) {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className={clsx(explore.root, s.whiteBand, aileron.variable, className)}>
      <div className={clsx(explore.content, s.whiteSheet)}>
        <section className={explore.sectionTeams} aria-labelledby="home-portfolio-title">
          <div className={explore.subtitle}>
            <h2 id="home-portfolio-title" className={explore.label}>
              Protocol Labs portfolio
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
          {focusAreas && <FocusAreas teams={PORTFOLIO_TEAMS} />}
        </section>

        <section className={clsx(explore.sectionTeams, s.storySection)} aria-labelledby="home-entities-title">
          <div className={explore.subtitle}>
            <h2 id="home-entities-title" className={explore.label}>
              Protocol Labs entities
            </h2>
          </div>
          <EntitiesRow />
        </section>

        {children}

        {/* Who has backed the network. */}
        <section className={clsx(explore.sectionPartners, s.storyEnd)}>
          <LinkedLogoWall />
        </section>
      </div>
    </div>
  );
}
