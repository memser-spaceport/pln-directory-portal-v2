'use client';

import React from 'react';
import Image from 'next/image';
import { ITag } from '@/types/teams.types';
import TeamsTagsList from '@/components/page/teams/teams-tags-list';

import type { MockTeamCard } from './mocks';
import { TeamUpdatesLink } from '../news-shared/TeamUpdatesLink';
import { TeamUpdateStrip } from '../news-shared/TeamUpdateStrip';
import { getTeamNews } from '../news-shared/mockTeamNews';
import { placeholderLogo } from './placeholderLogo';
// Reuse the production card styling so the prototype tracks production 1:1.
import s from '@/components/page/teams/TeamList/components/TeamGridView/TeamGridView.module.scss';
import local from './TeamsPrototype.module.scss';

/**
 * What the card says about the team's news: count it ("3 new") or tell it (the
 * latest headline). Two live options — recency and off were tried and cut.
 */
export type TeamUpdatesMode = 'new' | 'headline';

interface Props {
  team: MockTeamCard;
  updates?: TeamUpdatesMode;
}

/**
 * COPY-SIMPLIFY of production `TeamGridView`.
 * Production version pulls in `useTeamAnalytics` (Zustand + posthog) and
 * `useCarousel` (embla). The carousel branch only renders when `team.asks`
 * exist (always empty here) so it's dropped; analytics is stripped. The static
 * presentational markup + production `.module.scss` are kept verbatim.
 *
 * The card carries no Follow control — browsing is for reading, and following
 * happens on the team profile. The corner it used to occupy now holds the
 * updates badge, the one thing on the card worth reacting to.
 */
export function TeamCardView({ team, updates = 'new' }: Props) {
  // A monogram beats the shared default-profile glyph: twelve identical grey
  // avatars make the grid one repeating shape, and the logo slot is the first
  // thing the eye lands on — it should tell the cards apart, not blur them.
  const profile = team?.logo ?? placeholderLogo(team?.name);
  const news = getTeamNews(team.id, team.name ?? '');
  // 'headline' tells the story instead of counting it, so it needs a full-width
  // row rather than the corner — a headline can't live in a 12px pill.
  const isHeadline = updates === 'headline';
  const hasTags = (team?.industryTags ?? []).length > 0;
  const badge = (
    // No ↗ here, unlike every other surface that carries this badge. One arrow
    // marks an exit; twelve down a grid is wallpaper, and the card is already a
    // link — the whole thing goes somewhere when you click it.
    <TeamUpdatesLink teamName={team.name ?? 'team'} items={news} size="small" label="new" arrow={false} nested />
  );

  return (
    <div className={`${s.grid} ${local.teamCard}`}>
      {/* Desktop: top-right corner — the slot the Follow control used to hold.
          Outside .detailsContainer because the card root is the positioning
          context. */}
      {news.length > 0 && !isHeadline && <span className={local.cornerUpdates}>{badge}</span>}

      <div className={s.profileContainer}>
        <Image
          alt="profile"
          height={72}
          width={72}
          layout="intrinsic"
          loading="eager"
          priority={true}
          src={profile}
          className={s.profileImage}
        />
      </div>
      <div className={s.detailsContainer}>
        <div className={s.teamDetail}>
          <h2 className={s.teamName}>{team?.name}</h2>
          <p className={s.teamDesc}>{team?.shortDescription}</p>
        </div>

        <div className={s.tagsDesc}>
          <TeamsTagsList tags={team?.industryTags as ITag[]} noOfTagsToShow={2} />
        </div>
        <div className={s.tagsMob}>
          <TeamsTagsList tags={team?.industryTags as ITag[]} noOfTagsToShow={1} />
        </div>

        {/* Mobile home for the badge: the two-up card is ~170px wide with a
            centred logo, so a corner badge would land on top of it. */}
        {news.length > 0 && !isHeadline && <div className={local.updatesRow}>{badge}</div>}

        {/* Headline experiment: the latest story instead of a tally of them.
            Reuses TeamUpdateStrip's `inline` variant, which was built for exactly
            this slot — production NewsCard type, no band, hands off to the feed
            like the badge it stands in for. Full width at every breakpoint,
            because a headline needs the room the corner doesn't have. */}
        {news.length > 0 && isHeadline && (
          // The card already carries one rule under the logo band (production's
          // .profileContainer border). With tags in between, the headline's own
          // rule reads as a second section break; with no tags the two stack up
          // as rule-text-rule, so the tagless card keeps only the first.
          <div className={`${local.headlineRow} ${hasTags ? '' : local.headlineRowFlush}`}>
            <TeamUpdateStrip teamName={team.name ?? 'team'} items={news} variant="inline" />
          </div>
        )}
      </div>
    </div>
  );
}
