import Error from '@/components/core/error';
import { AIRTABLE_REGEX, PAGE_ROUTES } from '@/utils/constants';
import { RedirectType, redirect } from 'next/navigation';
import styles from './page.module.css';
import { BreadCrumb } from '@/components/core/bread-crumb';
import MemberDetailHeader from '@/components/page/member-details/member-detail-header';
import MemberProfileLoginStrip from '@/components/page/member-details/member-details-login-strip';
import ContactDetails from '@/components/page/member-details/contact-details';
import MemberTeams from '@/components/page/member-details/member-teams';
import MemberRepositories from '@/components/page/member-details/member-repositories';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMember, getMemberUidByAirtableId } from '@/services/members.service';
import { getAllTeams } from '@/services/teams.service';
import MemberProjectContribution from '@/components/page/member-details/member-project-contribution';

const MemberDetails = async ({ params }: { params: any }) => {
  const memberId = params?.id;
  const { member, teams, redirectMemberId, isError, isLoggedIn, userInfo } = await getpageData(memberId);

  if (redirectMemberId) {
    redirect(`${PAGE_ROUTES.MEMBERS}/${redirectMemberId}`, RedirectType.replace);
  }

  if (isError) {
    return <Error />;
  }

  return (
      <div className={styles?.memberDetail}>
        <div className={styles?.memberDetail__breadcrumb}>
          <BreadCrumb backLink="/members" directoryName="Members" pageName={member?.name ?? ''} />
        </div>
        <div className={styles?.memberDetail__container}>
          <div>
            {!isLoggedIn && <MemberProfileLoginStrip member={member} />}
            <div className={`${styles?.memberDetail__container__header} ${isLoggedIn ? styles?.memberDetail__container__header__isLoggedIn : styles?.memberDetail__container__header__loggedOut}`}>
              <MemberDetailHeader member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
            </div>
          </div>
          <div className={styles?.memberDetail__container__contact}>
            <ContactDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
          </div>
          <div className={styles?.memberDetail__container__teams}>
            <MemberTeams member={member} isLoggedIn={isLoggedIn} teams={teams ?? []} userInfo={userInfo} />
          </div>
          {isLoggedIn && (
            <div className={styles?.memberDetail__projectContribution}>
              <MemberProjectContribution member={member} userInfo={userInfo} />
            </div>
          )}
          {isLoggedIn && (
            <div className={styles?.memberDetail__container__repositories}>
              <MemberRepositories member={member} userInfo={userInfo} />
            </div>
          )}
        </div>
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
      getMember(memberId, { with: 'image,skills,location,teamMemberRoles.team' }, isLoggedIn, parsedUserInfo),
      getAllTeams(
        '',
        {
          'teamMemberRoles.member.uid': memberId,
          select: 'uid,name,logo.url,industryTags.title,teamMemberRoles.role,teamMemberRoles.mainTeam',
          pagination: false,
        },
        0,
        0
      ),
    ]);
    member = memberResponse?.data?.formattedData;
    teams = memberTeamsResponse?.data?.formattedData;

    if (memberResponse?.error) {
      isError = true;
      return { isError, isLoggedIn };
    }
    return { member, teams, isLoggedIn, userInfo };
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
  const memberResponse = await getMember(memberId, { with: 'image,skills,location,teamMemberRoles.team' });
  if (memberResponse?.error) {
    return {
      title: 'Protocol Labs Directory',
      description:
        'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
      openGraph: {
        images: [
          {
            url: `https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`,
            width: 1280,
            height: 640,
            alt: 'Protocol Labs Directory',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`],
      },
    };
  }
  const member = memberResponse?.data?.formattedData;
  const previousImages = (await parent).openGraph?.images ?? [];
  return {
    title: member?.name,
    openGraph: {
      type: 'website',
      url: `${process.env.APPLICATION_BASE_URL}${PAGE_ROUTES.TEAMS}/${memberId}`,
      images: [member?.profile, ...previousImages],
    },
  };
}
