'use client';

import map from 'lodash/map';
import get from 'lodash/get';
import { Fragment } from 'react';

import type { ITeam } from '@/types/teams.types';

import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getProfileFromURL } from '@/utils/common.utils';

import { Divider } from '@/components/common/profile/Divider';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

// Import the production leaf presentational pieces directly (both clean).
import { ContactMethod } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView/components/ContactMethod';
import { TeamProfileSocialLink } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView/components/TeamProfileSocialLink';
import { KEY_TO_HANDLER } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView/constants';

import s from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView/TeamContactInfoView.module.scss';

interface Props {
  team: ITeam;
}

/**
 * COPY-SIMPLIFY of production `TeamContactInfo` + `TeamContactInfoView`.
 * Production wrapper reads `useCurrentUserStore` and the view fires
 * `useTeamAnalytics` on click. We drop the store + analytics and the edit
 * affordance, importing the clean leaf social-link components and production scss.
 */
export function TeamContactView({ team }: Props) {
  const { contactMethod } = team ?? {};
  const noop = () => {};

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Contact Details" />
      <DetailsSectionGreyContentContainer className={s.contacts}>
        {contactMethod && (
          <>
            <ContactMethod callback={noop} contactMethod={contactMethod} />
            <Divider />
          </>
        )}

        {map(KEY_TO_HANDLER, (handler, key) => {
          const value = get(team, key);

          return (
            <Fragment key={key}>
              <TeamProfileSocialLink
                callback={noop}
                profile={value ? getProfileFromURL(value, handler) : ''}
                handle={value}
                type={handler}
                logo={getContactLogoByProvider(handler)}
                height={24}
                width={24}
              />
              <Divider />
            </Fragment>
          );
        })}
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
