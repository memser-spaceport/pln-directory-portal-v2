'use client';

import Image from 'next/image';
import { useMemo, type ReactNode } from 'react';

import type { ITag, ITeam } from '@/types/teams.types';

import { Tag } from '@/components/ui/Tag';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { Divider } from '@/components/common/profile/Divider';
import { ExpandableDescription } from '@/components/common/ExpandableDescription';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

// Reuse the production TeamDetails styling 1:1.
import s from '@/components/page/team-details/TeamDetails/TeamDetails.module.scss';
import local from './TeamProfile.module.scss';

interface Props {
  team: ITeam;
  /** Follow cluster rendered top-right of the team name row. */
  headerAction?: ReactNode;
  /** Slot rendered on its own row just above the About section. */
  beforeAbout?: ReactNode;
  /** Hide the stage / fund / industry badges row (test the no-badges team). */
  hideBadges?: boolean;
}

/**
 * COPY-SIMPLIFY of production `TeamDetails`.
 * Production version reads `useCurrentUserStore` (Zustand), `useTeamAnalytics`,
 * `useRouter` + a server `deleteTeam` action, and renders edit/delete affordances.
 * Those are all edit-mode / privileged branches — omitted here. We render the
 * plain logged-in/approved read view with mock data, importing the production
 * `.module.scss` and all leaf presentational components.
 */
export function TeamDetailsView({ team, headerAction, beforeAbout, hideBadges }: Props) {
  const teamName = team?.name ?? '';
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
                  {!!tags?.length && <TagsList tags={tags} />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Follow cluster aligned with the whole header block (logo + name + tags). */}
        {headerAction && <div className={local.headerActionSlot}>{headerAction}</div>}
      </div>

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
