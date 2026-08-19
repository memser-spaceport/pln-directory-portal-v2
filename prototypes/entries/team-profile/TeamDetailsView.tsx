'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useMemo, type ReactNode } from 'react';

import type { ITag, ITeam } from '@/types/teams.types';

import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/common/Badge/Badge';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { Divider } from '@/components/common/profile/Divider';
import { ExpandableDescription } from '@/components/common/ExpandableDescription';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useIsMobile } from '@/hooks/useIsMobile';

// Reuse the production TeamDetails styling 1:1.
import s from '@/components/page/team-details/TeamDetails/TeamDetails.module.scss';
// Reuse the Demo Day past-teams card's "series" tag style (the "Pre-seed" pill).
import tc from '@/components/common/LogosGrid/components/TeamCard/TeamCard.module.scss';
// The facts line (founded / size / location) is the member profile header's
// `roleAndLocation` row, reused wholesale — same 16px-gapped flex row, same
// hairline divider, same location pin + label. Person pages and team pages
// answer "the quick facts under the name" the same way as a result.
import mh from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import local from './TeamProfile.module.scss';
import type { TeamFacts, TeamStatus } from './mocks';

export type DemoDayParticipation = { title: string; slug: string; date?: string };

/** Where / how the Demo Day participation indicator renders (see the placements prototype).
 *  'none' → rendered elsewhere on the page (e.g. the Events block). */
export type DemoDayPlacement =
  | 'name-emblem'
  | 'name-emblem-outlined'
  | 'name-emblem-calendar'
  | 'name-emblem-series'
  | 'own-row-small'
  | 'tags-chip'
  | 'none';

interface Props {
  team: ITeam;
  /** Follow cluster rendered top-right of the team name row. */
  headerAction?: ReactNode;
  /** Slot rendered on its own row just above the About section. */
  beforeAbout?: ReactNode;
  /** Hide the stage / fund / industry badges row (test the no-badges team). */
  hideBadges?: boolean;
  /** Founding year, headcount and place — the facts line under the team name.
   *  Every field is independently optional; the line only renders if one lands. */
  facts?: TeamFacts;
  /** Operating status. Only 'inactive' draws anything — see the badge below. */
  status?: TeamStatus;
  /** When set, shows a "participated in Demo Day" indicator. */
  demoDayParticipation?: DemoDayParticipation | null;
  /** Which in-header placement/style to use. Default: the series-tag pill by the name. */
  demoDayPlacement?: DemoDayPlacement;
}

/**
 * COPY-SIMPLIFY of production `TeamDetails`.
 * Production version reads `useCurrentUserStore` (Zustand), `useTeamAnalytics`,
 * `useRouter` + a server `deleteTeam` action, and renders edit/delete affordances.
 * Those are all edit-mode / privileged branches — omitted here. We render the
 * plain logged-in/approved read view with mock data, importing the production
 * `.module.scss` and all leaf presentational components.
 */
export function TeamDetailsView({
  team,
  headerAction,
  beforeAbout,
  hideBadges,
  facts,
  status = 'active',
  demoDayParticipation,
  demoDayPlacement = 'name-emblem-series',
}: Props) {
  const isMobile = useIsMobile();
  const teamName = team?.name ?? '';
  // Compact code for the name-emblem: strip a leading "PL" and the words
  // "Demo Day" wherever they sit, e.g. "PL Demo Day W26.2" → "DDW26.2".
  const demoDayShort = demoDayParticipation
    ? `DD${demoDayParticipation.title
        .replace(/^PL[\s_]*/i, '')
        .replace(/demo\s*day\s*/i, '')
        .trim()}`
    : '';
  const isNameEmblem =
    demoDayPlacement === 'name-emblem' ||
    demoDayPlacement === 'name-emblem-outlined' ||
    demoDayPlacement === 'name-emblem-calendar' ||
    demoDayPlacement === 'name-emblem-series';
  let emblemClass = local.demoDayEmblem;
  let emblemMode: EmblemMode = 'code';
  if (demoDayPlacement === 'name-emblem-outlined') {
    emblemClass = local.demoDayEmblemOutlined;
  } else if (demoDayPlacement === 'name-emblem-calendar') {
    emblemMode = 'icon';
  } else if (demoDayPlacement === 'name-emblem-series') {
    emblemClass = `${tc.stage} ${local.demoDayEmblemSeries}`;
    emblemMode = 'text';
  }
  const defaultAvatarImage = useDefaultAvatar(team?.name ?? '');
  const logo = team?.logo ?? defaultAvatarImage ?? '/icons/team-default-profile.svg';

  const tags = useMemo(() => (team?.industryTags ?? []) as ITag[], [team?.industryTags]);

  // Each fact is skipped when missing rather than rendered as "Unknown": a
  // founding year nobody filled in is not information, and three "Unknown"s
  // under a team name read as a broken profile. If none land, the line goes too.
  const factItems: ReactNode[] = [];
  if (facts?.foundedYear) factItems.push(<span key="founded">Founded {facts.foundedYear}</span>);
  // "people", not "employees" — the network's teams include DAOs, foundations
  // and open-source collectives where nobody is an employee.
  if (facts?.teamSize) factItems.push(<span key="size">{facts.teamSize} people</span>);
  if (facts?.location)
    factItems.push(
      <span key="location" className={mh.location}>
        <LocationGlyph />
        {facts.location}
      </span>,
    );

  const about = team?.longDescription ?? '';
  const hasAbout = !!about && about.trim() !== '<p><br></p>';

  return (
    <DetailsSection classes={{ root: local.mainCardTight }}>
      <div className={`${s.profile} ${local.profileRow}`}>
        <div className={`${s.logoTagsContainer} ${local.logoTagsGrow}`}>
          <Image
            alt="profile"
            loading="eager"
            height={72}
            width={72}
            layout="intrinsic"
            priority={true}
            className={s.teamLogo}
            src={logo}
          />
          <div className={s.nameTagContainer}>
            <div className={`${s.nameAndActions} ${local.nameRowWrap}`}>
              <Tooltip asChild trigger={<h1 className={s.teamName}>{teamName}</h1>} content={teamName} />
              {/* Status renders ONLY when the team is inactive, and it sits by the
                  name rather than in the facts line below — because it isn't a
                  fact of the same kind. Founded / size / location describe a team
                  that exists; "inactive" qualifies whether the rest of the page
                  still holds, so it has to be read before the page is, not
                  fourth in a row after the founding year. And an "Active" badge
                  on every operating team is a word that never varies — it costs
                  a chip's worth of attention to say nothing. Active is the
                  unmarked default; its absence is the signal. */}
              {/* No tooltip on it: `Badge` is a label chip, and the DS's label
                  chips carry no hover state anywhere — hanging one off this pill
                  would make an inert caption behave like a control. The word is
                  the whole message. (It also has to be a direct flex child here:
                  `Tooltip` wraps its trigger in its own mob/web divs, which
                  swallowed the mobile line break below.) */}
              {status === 'inactive' && (
                <span className={local.statusBadge}>
                  <Badge>Inactive</Badge>
                </span>
              )}
              {demoDayParticipation && isNameEmblem && (
                <EmblemBadge
                  participation={demoDayParticipation}
                  short={demoDayShort}
                  className={emblemClass}
                  mode={emblemMode}
                />
              )}
            </div>
            {/* Facts first, classification second: founded / size / location
                describe the company, the row below sorts it into buckets. Both
                rows are peers in production's `.tagsContainer` column (12px
                gap), so this adds a line rather than a new region. */}
            {factItems.length > 0 && (
              <div className={`${mh.roleAndLocation} ${local.factsRow}`}>
                {factItems.map((item, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className={mh.divider} />}
                    {item}
                  </Fragment>
                ))}
              </div>
            )}
            {!hideBadges && (
              <div className={s.tagsContainer}>
                <div className={s.tags2}>
                  {team?.fundingStage?.title && (
                    <>
                      <div className={s.fundingStage}>Stage: {team.fundingStage.title}</div>
                      <Divider />
                    </>
                  )}
                  {team?.isFund && (
                    <>
                      <Tag value="Investment Fund" className={s.iTag} />
                      <Divider />
                    </>
                  )}
                  {demoDayParticipation && demoDayPlacement === 'tags-chip' && (
                    <>
                      <DemoDayLinkBadge participation={demoDayParticipation} className={local.demoDayChip} />
                      <Divider />
                    </>
                  )}
                  {/* Mobile: show fewer industry tags so the whole row (Stage +
                      Fund + tags + the "+n" chip) collapses to ~2 lines. TagsList's
                      "+n" counts all hidden tags and renders last, so it stays in-row. */}
                  {!!tags?.length && <TagsList tags={tags} tagsToShow={isMobile ? 2 : 3} />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Follow cluster aligned with the whole header block (logo + name + tags). */}
        {headerAction && <div className={local.headerActionSlot}>{headerAction}</div>}
      </div>

      {/* Separate-row variant: the small compact code badge on its own row. */}
      {demoDayParticipation && demoDayPlacement === 'own-row-small' && (
        <div className={local.demoDayRow}>
          <EmblemBadge participation={demoDayParticipation} short={demoDayShort} className={local.demoDayEmblem} />
        </div>
      )}

      {/* Inline Follow variant sits on its own row below the header. */}
      {beforeAbout && <div className={local.beforeAboutSlot}>{beforeAbout}</div>}

      {/* About, back inside the header card (matches production's inline markup).
          DetailsSection's own row gap is commented out in production, so this
          needs its own top margin to breathe below the logo/name/tags block. */}
      {hasAbout && (
        <div className={`${s.aboutContainer} ${local.aboutSpacing}`}>
          <div className={s.aboutTitle}>About</div>
          <ExpandableDescription>
            <div className={s.aboutContent} dangerouslySetInnerHTML={{ __html: about }} />
          </ExpandableDescription>
        </div>
      )}
    </DetailsSection>
  );
}

type EmblemMode = 'code' | 'icon' | 'text';

/** The next-to-name / own-row emblem: a compact linked badge with a tooltip.
 *  code → "DDF25" (full title on mobile); icon → calendar; text → full title. */
function EmblemBadge({
  participation,
  short,
  className,
  mode = 'code',
}: {
  participation: DemoDayParticipation;
  short: string;
  className?: string;
  mode?: EmblemMode;
}) {
  return (
    <Tooltip
      asChild
      trigger={
        <Link
          href={`/demoday/${participation.slug}`}
          className={className}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Participated in ${participation.title} — view demo day`}
        >
          {mode === 'icon' && <CalendarGlyph />}
          {mode === 'code' && <span className={local.demoDayEmblemCode}>{short}</span>}
          {mode === 'text' && <span>{participation.title}</span>}
          {/* Compact code/icon variants have no hover on mobile → show the full title. */}
          {mode !== 'text' && <span className={local.demoDayEmblemLabel}>{participation.title}</span>}
        </Link>
      }
      content={`Participated in ${participation.title}`}
    />
  );
}

/** Location pin, transcribed from MemberDetailHeader's own `LocationIcon`
 *  (a module-local const there, so it can't be imported). Only the colour layer
 *  is translated: production hard-codes `fill="#455468"`, this takes
 *  `currentColor` so the token pair can live in CSS. Same rendered colour. */
const LocationGlyph = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={local.factIcon}
    aria-hidden="true"
  >
    <path
      d="M10 4.6875C9.32013 4.6875 8.65552 4.88911 8.09023 5.26682C7.52493 5.64454 7.08434 6.1814 6.82416 6.80953C6.56399 7.43765 6.49591 8.12881 6.62855 8.79562C6.76119 9.46243 7.08858 10.0749 7.56932 10.5557C8.05006 11.0364 8.66257 11.3638 9.32938 11.4964C9.99619 11.6291 10.6874 11.561 11.3155 11.3008C11.9436 11.0407 12.4805 10.6001 12.8582 10.0348C13.2359 9.46948 13.4375 8.80487 13.4375 8.125C13.4365 7.21363 13.074 6.33989 12.4295 5.69546C11.7851 5.05103 10.9114 4.68853 10 4.6875ZM10 9.6875C9.69097 9.6875 9.38887 9.59586 9.13192 9.42417C8.87497 9.25248 8.6747 9.00845 8.55644 8.72294C8.43818 8.43743 8.40723 8.12327 8.46752 7.82017C8.52781 7.51708 8.67663 7.23866 8.89515 7.02014C9.11367 6.80163 9.39208 6.65281 9.69517 6.59252C9.99827 6.53223 10.3124 6.56318 10.5979 6.68144C10.8835 6.7997 11.1275 6.99997 11.2992 7.25692C11.4709 7.51387 11.5625 7.81597 11.5625 8.125C11.5625 8.5394 11.3979 8.93683 11.1049 9.22985C10.8118 9.52288 10.4144 9.6875 10 9.6875ZM10 0.9375C8.09439 0.939568 6.26742 1.69748 4.91995 3.04495C3.57248 4.39242 2.81457 6.21939 2.8125 8.125C2.8125 14.1687 9.19063 18.7031 9.4625 18.893C9.62005 19.0032 9.8077 19.0624 10 19.0624C10.1923 19.0624 10.3799 19.0032 10.5375 18.893C11.7455 18.0027 12.8508 16.9808 13.8328 15.8461C16.0273 13.3258 17.1875 10.6539 17.1875 8.125C17.1854 6.21939 16.4275 4.39242 15.08 3.04495C13.7326 1.69748 11.9056 0.939568 10 0.9375ZM12.4453 14.5867C11.7004 15.4424 10.8822 16.2313 10 16.9445C9.1178 16.2313 8.29958 15.4424 7.55469 14.5867C6.25 13.0758 4.6875 10.7273 4.6875 8.125C4.6875 6.71604 5.24721 5.36478 6.2435 4.36849C7.23978 3.37221 8.59104 2.8125 10 2.8125C11.409 2.8125 12.7602 3.37221 13.7565 4.36849C14.7528 5.36478 15.3125 6.71604 15.3125 8.125C15.3125 10.7273 13.75 13.0758 12.4453 14.5867Z"
      fill="currentColor"
    />
  </svg>
);

/** Calendar glyph for the calendar-icon emblem variant. */
const CalendarGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Linked Demo Day badge used by the tags-chip / events placements. */
export function DemoDayLinkBadge({
  participation,
  className,
  withLabel,
}: {
  participation: DemoDayParticipation;
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <Link
      href={`/demoday/${participation.slug}`}
      className={className}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Participated in ${participation.title} — view demo day`}
    >
      <RocketGlyph />
      <span>{withLabel ? `Participated in ${participation.title}` : participation.title}</span>
    </Link>
  );
}

/** Rocket glyph for the Demo Day emblem (no rocket exists in the icon set). */
export const RocketGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15 9 12a11 11 0 0 1 2.5-6.5C13.4 3.1 16.5 2.9 19.6 3c.36 0 .66.3.66.66.1 3.1-.1 6.2-2.51 8.1A11 11 0 0 1 12 15Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
