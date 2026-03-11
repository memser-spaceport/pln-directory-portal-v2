import React from 'react';

import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import { ContactMethod } from './components/ContactMethod';
import { Divider } from '@/components/common/profile/Divider';
import { EditButton } from '@/components/common/profile/EditButton';
import { TeamProfileSocialLink } from './components/TeamProfileSocialLink';
import { DetailsSectionHeader, DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';

import s from './TeamContactInfoView.module.scss';

interface Props {
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
  toggleIsEditMode: () => void;
}

export function TeamContactInfoView(props: Props) {
  const { team, userInfo, toggleIsEditMode } = props;
  const { blog, website, twitter, contactMethod, linkedinHandle, telegramHandler } = team ?? {};

  const analytics = useTeamAnalytics();

  const callback = (type: string, url: string) => {
    analytics.onTeamDetailContactClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo), type, url);
  };

  const isTlOrAdmin = isTeamLeaderOrAdmin(userInfo, team?.id);

  return (
    <>
      <DetailsSectionHeader title="Contact Details">
        {isTlOrAdmin && <EditButton onClick={toggleIsEditMode} />}
      </DetailsSectionHeader>
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
        {telegramHandler && (
          <>
            <TeamProfileSocialLink
              callback={callback}
              profile={getProfileFromURL(telegramHandler, 'telegram')}
              handle={telegramHandler}
              type="telegram"
              logo={getContactLogoByProvider('telegram')}
              height={24}
              width={24}
            />
            <Divider />
          </>
        )}
        {blog && (
          <>
            <TeamProfileSocialLink
              callback={callback}
              profile={getProfileFromURL(blog, 'website')}
              handle={blog}
              type="website"
              logo={getContactLogoByProvider('website')}
              height={24}
              width={24}
            />
            <Divider />
          </>
        )}
      </DetailsSectionGreyContentContainer>
    </>
  );
}
