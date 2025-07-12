import Error from '@/components/core/error';
import { AIRTABLE_REGEX, PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { RedirectType, redirect } from 'next/navigation';
import styles from './page.module.scss';
import { BreadCrumb } from '@/components/core/bread-crumb';
import MemberTeams from '@/components/page/member-details/member-teams';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMember, getMemberUidByAirtableId } from '@/services/members.service';
import { getAllTeams } from '@/services/teams.service';
import IrlMemberContribution from '@/components/page/member-details/member-irl-contributions';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import { ContributionsDetails } from '@/components/page/member-details/ContributionsDetails';
import { RepositoriesDetails } from '@/components/page/member-details/RepositoriesDetails';
import { SubscribeToRecommendationsWidget } from '@/components/page/member-info/components/SubscribeToRecommendationsWidget';
import { UpcomingEventsWidget } from '@/components/page/member-info/components/UpcomingEventsWidget';
import { OneClickVerification } from '@/components/page/member-details/OneClickVerification';
import { getAccessLevel } from '@/utils/auth.utils';

const MemberDetails = async ({ params }: { params: any }) => {
  const memberId = params?.id;
  const { member, teams, redirectMemberId, isError, isLoggedIn, userInfo } = await getpageData(memberId);

  if (redirectMemberId) {
    redirect(`${PAGE_ROUTES.MEMBERS}/${redirectMemberId}`, RedirectType.replace);
  }

  if (isError || !member) {
    return <Error />;
  }

  const isOwner = userInfo?.uid === member?.id;

  return (
    <div className={styles?.memberDetail}>
      <div className={styles?.memberDetail__breadcrumb}>
        <BreadCrumb backLink="/members" directoryName="Members" pageName={member?.name ?? ''} />
      </div>
      <div className={styles?.memberDetail__container}>
        <OneClickVerification userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

        <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

        <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

        <ExperienceDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

        {isLoggedIn && (getAccessLevel(userInfo, isLoggedIn) === 'advanced' || isOwner) && (
          <div className={styles?.memberDetail__container__teams}>
            <MemberTeams member={member} isLoggedIn={isLoggedIn} teams={teams ?? []} userInfo={userInfo} />
          </div>
        )}

        <ContributionsDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

        {member.eventGuests.length > 0 && (
          <div className={styles?.memberDetail__irlContribution}>
            <IrlMemberContribution member={member} userInfo={userInfo} />
          </div>
        )}

        <RepositoriesDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </div>
      <SubscribeToRecommendationsWidget userInfo={userInfo} />
      <UpcomingEventsWidget userInfo={userInfo} />
    </div>
  );
};

export default MemberDetails;

const getpageData = async (memberId: string) => {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();
  const parsedUserInfo = userInfo;
  let member: any;
  let teams: any[];
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

    const [memberResponse, memberTeamsResponse] = await Promise.all([
      getMember(memberId, { with: 'image,skills,location,teamMemberRoles.team' }, isLoggedIn, parsedUserInfo, true, true),
      getAllTeams(
        '',
        {
          'teamMemberRoles.member.uid': memberId,
          select: 'uid,name,logo.url,industryTags.title,teamMemberRoles.role,teamMemberRoles.mainTeam',
          pagination: false,
        },
        0,
        0,
      ),
    ]);
    member = memberResponse?.data?.formattedData;
    teams = memberTeamsResponse?.data?.formattedData;

    const officeHoursFlag = !!member['officeHours'];

    if (!isLoggedIn && member['officeHours']) {
      delete member['officeHours'];
    }

    if (memberResponse?.error || member.accessLevel === 'Rejected') {
      isError = true;
      return { isError, isLoggedIn };
    }
    return { member, teams, isLoggedIn, userInfo, officeHoursFlag };
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
