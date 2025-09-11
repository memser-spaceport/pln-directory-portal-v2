'use client';

import Error from '@/components/core/error';
import { ADMIN_ROLE } from '@/utils/constants';
import styles from './page.module.scss';
import { getMember } from '@/services/members.service';
import IrlMemberContribution from '@/components/page/member-details/member-irl-contributions';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { BioDetails } from '@/components/page/member-details/BioDetails';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import { ContributionsDetails } from '@/components/page/member-details/ContributionsDetails';
import { RepositoriesDetails } from '@/components/page/member-details/RepositoriesDetails';
import { SubscribeToRecommendationsWidget } from '@/components/page/member-info/components/SubscribeToRecommendationsWidget';
import { UpcomingEventsWidget } from '@/components/page/member-info/components/UpcomingEventsWidget';
import { OneClickVerification } from '@/components/page/member-details/OneClickVerification';
import { TeamsDetails } from '@/components/page/member-details/TeamsDetails';
import { OfficeHoursDetails } from '@/components/page/member-details/OfficeHoursDetails';
import { InvestorProfileDetails } from '@/components/page/member-details/InvestorProfileDetails';
import { BackButton } from '@/components/ui/BackButton';
import React, { useEffect } from 'react';
import { BookWithOther } from '@/components/page/member-details/BookWithOther';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import qs from 'qs';
import { getAccessLevel } from '@/utils/auth.utils';
import clsx from 'clsx';
import { isMemberAvailableToConnect } from '@/utils/member.utils';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';

import MemberPageLoader from './loading';
import Head from 'next/head';
import { MembersQueryKeys } from '@/services/members/constants';

const MemberDetails = ({ params }: { params: any }) => {
  const memberId = params?.id;
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const isAdmin = userInfo && userInfo.roles?.includes(ADMIN_ROLE);
  const isOwner = userInfo && userInfo.uid === memberId;
  const isLoggedIn = !!userInfo;
  const {
    data: member,
    isError,
    isLoading,
  } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, memberId, isLoggedIn, userInfo.uid],
    queryFn: () => getMember(memberId, { with: 'image,skills,location,teamMemberRoles.team' }, isLoggedIn, userInfo, !isAdmin && !isOwner, true),
    enabled: !!memberId,
    select: (data) => data?.data?.formattedData,
  });
  const { data: availableToConnectCount } = useQuery({
    queryKey: ['memberList'],
    queryFn: () => getMemberListForQuery(qs.stringify({ hasOfficeHours: true }), 1, 1, userInfo?.token),
    enabled: !!userInfo?.token,
    select: (data) => data?.total,
  });
  const isAvailableToConnect = isMemberAvailableToConnect(member);
  const accessLevel = getAccessLevel(userInfo, isLoggedIn);

  // Scroll to top when member data is loaded or member ID changes
  useEffect(() => {
    if (member && !isLoading) {
      document.body.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
  }, [member, memberId, isLoading]);

  if (isError) {
    return <Error />;
  }

  if (isLoading) {
    return <MemberPageLoader />;
  }

  if (!member) {
    return null;
  }

  function renderPageContent() {
    if (!member) {
      return null;
    }

    switch (member.accessLevel) {
      case 'L5': {
        return (
          <>
            <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <InvestorProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <BioDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <TeamsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
            <ExperienceDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
          </>
        );
      }
      default: {
        return (
          <>
            <OneClickVerification userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            {member.accessLevel === 'L6' && <InvestorProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />}
            <OfficeHoursDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <BioDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <TeamsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
            <ExperienceDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <ContributionsDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            {member.eventGuests.length > 0 && (
              <div className={styles?.memberDetail__irlContribution}>
                <IrlMemberContribution member={member} userInfo={userInfo} />
              </div>
            )}
            <RepositoriesDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
          </>
        );
      }
    }
  }

  return (
    <>
      <Head>
        <title>{`${member?.name} | Protocol Labs Directory`}</title>
      </Head>
      <div className={styles?.memberDetail}>
        <div
          className={clsx(styles.container, {
            [styles.singleColumn]: isAvailableToConnect || !isLoggedIn,
          })}
        >
          <div className={styles.content}>
            <BackButton to={`/members`} />
            <div
              className={clsx(styles?.memberDetail__container, {
                [styles.centered]: isAvailableToConnect,
              })}
            >
              {renderPageContent()}
            </div>
          </div>
          {!isAvailableToConnect && isLoggedIn && accessLevel === 'advanced' && (
            <div className={styles.desktopOnly}>
              <div style={{ visibility: 'hidden' }}>
                <BackButton to={`/members`} />
              </div>
              <BookWithOther count={availableToConnectCount} member={member} />
            </div>
          )}
        </div>

        {userInfo.uid === member.id && (
          <>
            <SubscribeToRecommendationsWidget userInfo={userInfo} />
            <UpcomingEventsWidget userInfo={userInfo} />
          </>
        )}
      </div>
    </>
  );
};

export default MemberDetails;
