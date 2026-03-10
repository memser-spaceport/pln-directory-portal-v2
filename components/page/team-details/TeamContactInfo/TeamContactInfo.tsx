'use client';
import React from 'react';

import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { ContactMethod } from './components/ContactMethod';
import { TeamProfileSocialLink } from './components/TeamProfileSocialLink';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { Divider } from '@/components/common/profile/Divider';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

import s from './TeamContactInfo.module.scss';

interface Props {
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
}

export const TeamContactInfo = (props: Props) => {
  const { team, userInfo } = props;
  const { website, twitter, contactMethod, linkedinHandle } = team ?? {};

  const analytics = useTeamAnalytics();

  const callback = (type: string, url: string) => {
    analytics.onTeamDetailContactClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo), type, url);
  };

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Contact Details" />
      <DetailsSectionGreyContentContainer className={s.contacts}>
        {contactMethod && (
          <>
            <ContactMethod callback={callback} contactMethod={contactMethod} />
            <Divider />
          </>
        )}
        {website && (
          <>
            <TeamProfileSocialLink
              callback={callback}
              profile={getProfileFromURL(website, 'website')}
              type="website"
              handle={website}
              logo={getContactLogoByProvider('website')}
              height={24}
              width={24}
            />
            <Divider />
          </>
        )}
        {twitter && (
          <>
            <TeamProfileSocialLink
              callback={callback}
              profile={getProfileFromURL(twitter, 'twitter')}
              handle={twitter}
              type="twitter"
              logo={getContactLogoByProvider('twitter')}
              height={24}
              width={24}
            />
            <Divider />
          </>
        )}
        {linkedinHandle && (
          <>
            <TeamProfileSocialLink
              callback={callback}
              profile={getProfileFromURL(linkedinHandle, 'linkedin')}
              handle={linkedinHandle}
              type="linkedin"
              logo={getContactLogoByProvider('linkedin')}
              height={24}
              width={24}
            />
            <Divider />
          </>
        )}
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
};
