'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';

import type { ITag, ITeam } from '@/types/teams.types';

import { Tag } from '@/components/ui/Tag';
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
import local from './TeamProfile.module.scss';

export type DemoDayParticipation = { title: string; slug: string };

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
  demoDayParticipation,
  demoDayPlacement = 'name-emblem-series',
}: Props) {
  const isMobile = useIsMobile();
  const teamName = team?.name ?? '';
  // Compact code for the name-emblem, e.g. "Demo Day F25" → "DDF25".
  const demoDayShort = demoDayParticipation ? `DD${demoDayParticipation.title.replace(/^Demo Day\s*/i, '')}` : '';
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
            <div className={s.nameAndActions}>
              <Tooltip asChild trigger={<h1 className={s.teamName}>{teamName}</h1>} content={teamName} />
              {demoDayParticipation && isNameEmblem && (
                <EmblemBadge
                  participation={demoDayParticipation}
                  short={demoDayShort}
                  className={emblemClass}
                  mode={emblemMode}
                />
              )}
            </div>
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
const RocketGlyph = () => (
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
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
