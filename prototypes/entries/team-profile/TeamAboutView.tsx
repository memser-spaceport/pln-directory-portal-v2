'use client';

import type { ITeam } from '@/types/teams.types';

import { ExpandableDescription } from '@/components/common/ExpandableDescription';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

// Reuse the production TeamDetails about-text styling.
import s from '@/components/page/team-details/TeamDetails/TeamDetails.module.scss';
import local from './TeamProfile.module.scss';

interface Props {
  team: ITeam;
}

/**
 * About as its own titled section (matches Fund Details / Membership Source).
 * Previously the description lived inside the header details card; here it's a
 * standalone `DetailsSection` with its own "About" header.
 */
export function TeamAboutView({ team }: Props) {
  const about = team?.longDescription ?? '';
  const hasAbout = !!about && about.trim() !== '<p><br></p>';

  if (!hasAbout) return null;

  return (
    <DetailsSection>
      <DetailsSectionHeader title="About" />
      <DetailsSectionGreyContentContainer>
        <ExpandableDescription className={local.aboutDesc}>
          <div className={s.aboutContent} dangerouslySetInnerHTML={{ __html: about }} />
        </ExpandableDescription>
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
