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

import { EventsContributionsView, type DemoDayContribVariant } from './EventsContributionsView';
import { MOCK_EVENT_GROUPS, MOCK_DEMO_DAY_CONTRIB } from './mocks';
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
    caption: 'Folded into the team’s "Events" block as one more event. Three treatments below — and a mixed vs. Demo-Day-only case.',
  },
];

// Sub-switcher options for placement 7 (Demo Day inside the Contributions block).
const CONTRIB_VARIANTS: { key: DemoDayContribVariant; label: string; caption: string }[] = [
  {
    key: 'native',
    label: 'Normal event (Recommended)',
    caption:
      'Ships on the team page. Demo Day reads as a normal event: a "Participant" role row (neutral rocket glyph) beside one plain Demo Day chip — identical border, fill and weight to the Host / Sponsor chips. Its only distinction is honest: it links to the Demo Day, signalled by a quiet hover, not colour.',
  },
  {
    key: 'feature',
    label: 'Feature row (louder)',
    caption:
      'Alternate. A highlighted full-width row pinned to the top of the card: rocket tile, "Demo Day F25", a "Participant · Fall 2025 cohort" line, and a trailing arrow. A gradient wash + spine make it lead the block — rejected for the team page because it reads as special rather than as an event.',
  },
  {
    key: 'banner',
    label: 'Banner above (louder)',
    caption:
      'Alternate. A distinct gradient strip ABOVE the events table — a program milestone adjacent to the IRL events, not folded into them. Also the cleanest empty-case surface (a team whose only contribution is Demo Day).',
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
  // Sub-switcher state for the Contributions-block placement (tab 7).
  const [contribVariant, setContribVariant] = useState<DemoDayContribVariant>('native');
  const [onlyDemoDay, setOnlyDemoDay] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={s.page} />;
  }

  const headerPlacement: DemoDayPlacement = HEADER_PLACEMENTS.includes(active as DemoDayPlacement)
    ? (active as DemoDayPlacement)
    : 'none';
  const isEvents = active === 'events';
  const activeCaption = isEvents
    ? CONTRIB_VARIANTS.find((v) => v.key === contribVariant)?.caption ?? ''
    : TABS.find((t) => t.key === active)?.caption ?? '';

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
        {/* Sub-switcher: the 3 Demo Day treatments inside the Contributions block,
            plus a mixed vs. Demo-Day-only case toggle. */}
        {isEvents && (
          <div className={s.subControls}>
            <div className={s.subSwitch} role="tablist" aria-label="Demo Day contribution treatment">
              {CONTRIB_VARIANTS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={contribVariant === v.key}
                  className={`${s.subTab} ${contribVariant === v.key ? s.subTabActive : ''}`}
                  onClick={() => setContribVariant(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`${s.caseToggle} ${onlyDemoDay ? s.caseToggleActive : ''}`}
              aria-pressed={onlyDemoDay}
              onClick={() => setOnlyDemoDay((p) => !p)}
            >
              {onlyDemoDay ? 'Only Demo Day' : 'Mixed contributions'}
            </button>
          </div>
        )}

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

          {/* Placement 7 — the Contributions block carries Demo Day when selected,
              in the chosen treatment. "Only Demo Day" drops Host/Sponsor to show
              the empty case (a team whose sole contribution is Demo Day). */}
          <EventsContributionsView
            groups={isEvents && onlyDemoDay ? [] : MOCK_EVENT_GROUPS}
            demoDay={isEvents ? MOCK_DEMO_DAY_CONTRIB : null}
            variant={contribVariant}
          />

          <TeamMembersView team={team} members={MOCK_MEMBERS} />
        </div>
      </div>
    </div>
  );
}
