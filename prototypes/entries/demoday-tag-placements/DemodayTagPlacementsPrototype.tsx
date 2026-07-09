'use client';

import { useEffect, useState } from 'react';

import type { ITeam } from '@/types/teams.types';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { TagsList } from '@/components/common/profile/TagsList';

// Reuse the production team-detail page shell + the team-profile prototype's views.
import shell from '@/app/teams/[id]/page.module.css';
import { TeamDetailsView, type DemoDayPlacement } from '../team-profile/TeamDetailsView';
import { TeamContactView } from '../team-profile/TeamContactView';
import { TeamMembersView } from '../team-profile/TeamMembersView';
import { MOCK_TEAM, MOCK_MEMBERS, MOCK_TEAM_DEMO_DAY } from '../team-profile/mocks';

import { EventsContributionsView } from './EventsContributionsView';
import { MOCK_EVENT_GROUPS } from './mocks';
import s from './DemodayTagPlacements.module.scss';

const team = MOCK_TEAM as unknown as ITeam;

type PlacementKey =
  | 'name-emblem'
  | 'name-emblem-outlined'
  | 'name-emblem-calendar'
  | 'name-emblem-series'
  | 'own-row-small'
  | 'tags-chip'
  | 'events';

const TABS: { key: PlacementKey; label: string; caption: string }[] = [
  {
    key: 'name-emblem',
    label: '1 · Next to name (filled)',
    caption: 'Compact gradient code badge ("DDF25") beside the team name, filled with white text. Meaning via tooltip; full title on mobile.',
  },
  {
    key: 'name-emblem-outlined',
    label: '2 · Next to name (outlined)',
    caption: 'Same code badge beside the team name, but a gradient outline with gradient text instead of a filled pill — quieter.',
  },
  {
    key: 'name-emblem-calendar',
    label: '3 · Next to name (calendar)',
    caption: 'A gradient emblem beside the name with a calendar icon instead of the "DD" code — Demo Day reads as an event.',
  },
  {
    key: 'name-emblem-series',
    label: '4 · Next to name (series tag)',
    caption: 'Styled exactly like the "Pre-seed" series tag on the Demo Day past-teams card: a bordered gray pill, "Demo Day F25".',
  },
  {
    key: 'own-row-small',
    label: '5 · Separate row',
    caption: 'The compact code badge on its own row below the header — separated from the descriptive tag row, but still small.',
  },
  {
    key: 'tags-chip',
    label: '6 · In tags row',
    caption: 'A linked chip inline with Stage / industry tags, sized to match them. Compact, but it is the only clickable item in a descriptive row.',
  },
  {
    key: 'events',
    label: '7 · Events block',
    caption: 'Listed inside the "Contributions" (Events) block as a Demo Day row — treats it as an event the team took part in.',
  },
];

// Every placement except the Events block renders inside the header component.
const HEADER_PLACEMENTS: DemoDayPlacement[] = [
  'name-emblem',
  'name-emblem-outlined',
  'name-emblem-calendar',
  'name-emblem-series',
  'own-row-small',
  'tags-chip',
];

export default function DemodayTagPlacementsPrototype() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<PlacementKey>('name-emblem');
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={s.page} />;
  }

  const headerPlacement: DemoDayPlacement = HEADER_PLACEMENTS.includes(active as DemoDayPlacement)
    ? (active as DemoDayPlacement)
    : 'none';
  const activeCaption = TABS.find((t) => t.key === active)?.caption ?? '';

  return (
    <div className={s.page}>
      <div className={s.controls}>
        <div className={s.tabBar} role="tablist" aria-label="Demo Day tag placement">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active === t.key}
              className={`${s.tab} ${active === t.key ? s.tabActive : ''}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className={s.caption}>{activeCaption}</p>
      </div>

      <div className={`${shell.teamDetail} ${s.card}`}>
        <div className={shell.teamDetail__container}>
          <TeamDetailsView team={team} demoDayParticipation={MOCK_TEAM_DEMO_DAY} demoDayPlacement={headerPlacement} />

          <TeamContactView team={team} />

          <DetailsSection>
            <DetailsSectionHeader title="Membership Source" />
            <DetailsSectionGreyContentContainer>
              {team?.membershipSources?.length ? (
                <TagsList tags={team.membershipSources} tagsToShow={5} />
              ) : (
                <NoDataBlock>No membership source added.</NoDataBlock>
              )}
            </DetailsSectionGreyContentContainer>
          </DetailsSection>

          <DetailsSection>
            <DetailsSectionHeader title="Community Affiliations" />
            <DetailsSectionGreyContentContainer>
              {team?.communityAffiliations?.length ? (
                <TagsList tags={team.communityAffiliations} tagsToShow={5} />
              ) : (
                <NoDataBlock>No community affiliations.</NoDataBlock>
              )}
            </DetailsSectionGreyContentContainer>
          </DetailsSection>

          {/* Option 4 — the Events block carries the Demo Day row when selected. */}
          <EventsContributionsView groups={MOCK_EVENT_GROUPS} demoDay={active === 'events' ? MOCK_TEAM_DEMO_DAY : null} />

          <TeamMembersView team={team} members={MOCK_MEMBERS} />
        </div>
      </div>
    </div>
  );
}
