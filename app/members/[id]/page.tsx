import Error from '@/components/core/error';
import { ADMIN_ROLE, AIRTABLE_REGEX, PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { RedirectType, redirect } from 'next/navigation';
import styles from './page.module.scss';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMember, getMemberUidByAirtableId } from '@/services/members.service';
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
import { BackButton } from '@/components/ui/BackButton';
import React from 'react';
import { BookWithOther } from '@/components/page/member-details/BookWithOther';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import qs from 'qs';
import { getAccessLevel } from '@/utils/auth.utils';
import clsx from 'clsx';
import { isMemberAvailableToConnect } from '@/utils/member.utils';

const MemberDetails = async ({ params }: { params: any }) => {
  const memberId = params?.id;
  const { member, redirectMemberId, isError, isLoggedIn, userInfo, availableToConnectCount } = await getpageData(memberId);
  const isAvailableToConnect = isMemberAvailableToConnect(member);
  const accessLevel = getAccessLevel(userInfo, isLoggedIn);

  if (redirectMemberId) {
    redirect(`${PAGE_ROUTES.MEMBERS}/${redirectMemberId}`, RedirectType.replace);
  }

  if (isError || !member) {
    return <Error />;
  }

  return (
    <div className={styles?.memberDetail}>
      <div
        className={clsx(styles.container, {
          [styles.singleColumn]: isAvailableToConnect,
        })}
      >
        <div className={styles.content}>
          <BackButton to={`/members`} />
          <div
            className={clsx(styles?.memberDetail__container, {
              [styles.centered]: isAvailableToConnect,
            })}
          >
            <OneClickVerification userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

            <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

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

      <SubscribeToRecommendationsWidget userInfo={userInfo} />
      <UpcomingEventsWidget userInfo={userInfo} />
    </div>
  );
};

export default MemberDetails;

const getpageData = async (memberId: string) => {
  const { userInfo, isLoggedIn, authToken } = getCookiesFromHeaders();
  const isAdmin = userInfo && userInfo.roles?.includes(ADMIN_ROLE);
  const isOwner = userInfo && userInfo.uid === memberId;
  const parsedUserInfo = userInfo;
  let member: any;
  let isError: boolean = false;
  try {
    if (AIRTABLE_REGEX.test(memberId)) {
      const memberUidResponse = await getMemberUidByAirtableId(memberId);
      if (memberUidResponse?.length == 0 || memberUidResponse?.error) {
        isError = true;
        return { isError, isLoggedIn };
      }
      const redirectMemberId = memberUidResponse[0]?.uid;
      return { redirectMemberId, teams: [], member: {}, isLoggedIn };
    }

    const query = qs.stringify({
      hasOfficeHours: true,
    });

    const [memberResponse, memberListResponse] = await Promise.all([
      getMember(memberId, { with: 'image,skills,location,teamMemberRoles.team' }, isLoggedIn, parsedUserInfo, !isAdmin && !isOwner, true),
      getMemberListForQuery(query, 1, 1, authToken),
    ]);
    member = memberResponse?.data?.formattedData;

    const officeHoursFlag = !!member['officeHours'];

    if (!isLoggedIn && member['officeHours']) {
      delete member['officeHours'];
    }

    if (memberResponse?.error || member.accessLevel === 'Rejected') {
      isError = true;
      return { isError, isLoggedIn };
    }
    return { member, isLoggedIn, userInfo, officeHoursFlag, availableToConnectCount: memberListResponse.total };
  } catch (error) {
    isError = true;
    return { isError, isLoggedIn };
  }
};

interface IGenerateMetadata {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: IGenerateMetadata, parent: any): Promise<any> {
  const memberId = params?.id;
  const memberResponse = await getMember(memberId, { with: 'image' });
  if (memberResponse?.error) {
    return {
      title: 'Protocol Labs Directory',
      description:
        'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
      openGraph: {
        images: [
          {
            url: SOCIAL_IMAGE_URL,
            width: 1280,
            height: 640,
            alt: 'Protocol Labs Directory',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        images: [SOCIAL_IMAGE_URL],
      },
    };
  }
  const member = memberResponse?.data?.formattedData;
  const previousImages = (await parent).openGraph?.images ?? [];
  return {
    title: `${member?.name} | Protocol Labs Directory`,
    openGraph: {
      type: 'website',
      url: `${process.env.APPLICATION_BASE_URL}/${PAGE_ROUTES.MEMBERS}/${memberId}`,
      images: [member?.profile, ...previousImages],
    },
  };
}
