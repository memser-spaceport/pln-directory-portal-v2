import map from 'lodash/map';
import get from 'lodash/get';
import React, { Fragment } from 'react';

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

import { KEY_TO_HANDLER } from './constants';

import s from './TeamContactInfoView.module.scss';

interface Props {
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
  toggleIsEditMode: () => void;
}

export function TeamContactInfoView(props: Props) {
  const { team, userInfo, toggleIsEditMode } = props;
  const { contactMethod } = team ?? {};

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

        {map(KEY_TO_HANDLER, (handler, key) => {
          const value = get(team, key);

          return (
            <Fragment key={key}>
              <TeamProfileSocialLink
                callback={callback}
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
    </>
  );
}
