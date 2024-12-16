import Error from '@/components/core/error';
import ContactInfo from '@/components/page/team-details/contact-info';
import Funding from '@/components/page/team-details/funding';
import Projects from '@/components/page/team-details/projects';
import TeamDetails from '@/components/page/team-details/team-details';
import TeamMembers from '@/components/page/team-details/team-members';
import { getMembers } from '@/services/members.service';
import { getAllTeams, getTeam, getTeamUIDByAirtableId } from '@/services/teams.service';
import { IMember } from '@/types/members.types';
import { IFormatedTeamProject, ITeam, ITeamDetailParams } from '@/types/teams.types';
import { hasProjectEditAccess, sortMemberByRole } from '@/utils/common.utils';
import { ADMIN_ROLE, AIRTABLE_REGEX, PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata, ResolvingMetadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';
import styles from './page.module.css';
import { BreadCrumb } from '@/components/core/bread-crumb';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/types/shared.types';
import SelectedFocusAreas from '@/components/core/selected-focus-area';
import TeamOfficeHours from '@/components/page/team-details/team-office-hours';
import TeamIrlContributions from '@/components/page/team-details/team-irl-contributions';

async function Page({ params }: { params: ITeamDetailParams }) {
  const teamId: string = params?.id;
  const { team, members, focusAreas, isLoggedIn, userInfo, teamProjectList, hasProjectsEditAccess = false, redirectTeamUid, isError, isNotFound, officeHoursFlag } = await getPageData(teamId);

  if (redirectTeamUid) {
    redirect(`/teams/${redirectTeamUid}`, RedirectType.replace);
  }

  if (isNotFound || isError) {
    return <Error />;
  }

  return (
    <>
      <div className={styles?.teamDetail}>
        <div className={styles?.teamDetail__breadcrumb}>
          <BreadCrumb backLink="/teams" directoryName="Teams" pageName={team?.name ?? ''} />
        </div>
        <div className={styles?.teamDetail__container}>
          {/* Details */}
          <div className={styles?.teamDetail__Container__details}>
            <TeamDetails team={team} userInfo={userInfo} />
          </div>
          {/* contact */}
          <div className={styles?.teamDetail__container__contact}>
            <ContactInfo team={team} userInfo={userInfo} />
            {((!isLoggedIn && officeHoursFlag) || isLoggedIn) && <TeamOfficeHours isLoggedIn={isLoggedIn} team={team} userInfo={userInfo} officeHoursFlag={officeHoursFlag} />}
          </div>
          {/* Funding */}
          {team?.fundingStage || team?.membershipSources?.length ? (
            <div className={styles?.teamDetail__container__funding}>
              <Funding team={team} />
            </div>
          ) : null}
          {/* Focus Area */}
          {team.teamFocusAreas && team?.teamFocusAreas?.length > 0 && focusAreas && focusAreas?.length > 0 && (
            <div className={styles?.teamDetail__container__focusarea}>
              <SelectedFocusAreas focusAreas={focusAreas} selectedFocusAreas={team.teamFocusAreas} />
            </div>
          )}
          {/* Irl Contribuions */}
          {team.eventGuests.length > 0 &&
            <div className={styles?.teamDetail__irlContributions}>
              <TeamIrlContributions team={team} userInfo={userInfo} members={members} teamId={teamId} />
            </div>
          }
          {/* Member */}
          <div className={styles?.teamDetail__container__member}>
            <TeamMembers team={team} userInfo={userInfo} members={members} teamId={teamId} />
          </div>

          {/* Projects */}
          <div className={styles?.teamDetail__container__projects}>
            <Projects isLoggedIn={isLoggedIn} projects={teamProjectList} team={team} userInfo={userInfo} hasProjectsEditAccess={hasProjectsEditAccess} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Page;

async function getPageData(teamId: string) {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();

  let team: ITeam = {
    id: '',
    name: '',
    logo: '',
    logoUid: '',
    shortDescription: '',
    website: '',
    twitter: '',
    contactMethod: '',
    linkedinHandle: '',
    longDescription: null,
    fundingStage: { title: '' },
    membershipSources: [],
    industryTags: [],
    technologies: [],
    role: '',
    maintainingProjects: [],
    contributingProjects: [],
    officeHours: '',
    teamFocusAreas: [],
  };
  let members: IMember[] = [];
  let focusAreas: IFocusArea[] = [];
  let hasProjectsEditAccess = false;
  let teamProjectList: IFormatedTeamProject[] = [];
  let isError = false;
  let isNotFound = false;
  let officeHoursFlag = false;
  let memberTeams: never[] = [];

  try {
    if (AIRTABLE_REGEX.test(teamId)) {
      const teamUidResponse = await getTeamUIDByAirtableId(teamId);
      if (teamUidResponse?.error || teamUidResponse?.length === 0) {
        isError = true;
        return { isError, team, userInfo };
      }
      const redirectTeamUid = teamUidResponse[0]?.uid;
      return { redirectTeamUid, team, members, hasProjectsEditAccess, teamProjectList, userInfo };
    }

    const [teamResponse, teamMembersResponse, focusAreaResponse] = await Promise.all([
      getTeam(teamId, { with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member' }),
      getMembers(
        {
          'teamMemberRoles.team.uid': teamId,
          select: 'uid,name,image.url,skills.title,teamMemberRoles.team.uid,projectContributions,teamMemberRoles.team.name,teamMemberRoles.role,teamMemberRoles.teamLead,teamMemberRoles.mainTeam',
          pagination: false,
        },
        teamId,
        0,
        0,
        isLoggedIn
      ),
      getFocusAreas('Team', {}),
    ]);

    if (isLoggedIn) {
      const allTeams = await getAllTeams(
        authToken,
        {
          'teamMemberRoles.member.uid': userInfo.uid,
          select: 'uid,name,logo.url,industryTags.title,teamMemberRoles.role,teamMemberRoles.mainTeam,officeHours',
          pagination: false,
        },
        0,
        0
      );
      if (!allTeams?.error) {
        memberTeams = allTeams?.data?.formattedData ?? [];
      }
    }

    if (teamResponse?.error || teamMembersResponse?.error || focusAreaResponse?.error) {
      isError = true;
      return { isError, team, userInfo };
    }

    team = teamResponse?.data?.formatedData;
    officeHoursFlag = team['officeHours'] ? true : false;
    if (!isLoggedIn && team['officeHours']) {
      delete team['officeHours'];
    }

    members = teamMembersResponse?.data?.formattedData?.sort(sortMemberByRole);
    focusAreas = focusAreaResponse.data;
    focusAreas = focusAreas.filter((data: IFocusArea) => !data.parentUid);
    const maintainingProjects = team?.maintainingProjects?.map((project: any) => {
      return {
        ...project,
        teamUid: project?.maintainingTeamUid,
        isMaintainingProject: true,
      };
    });

    const contributingProjects = team?.contributingProjects ?? [];
    for (const mem of members) {
      if (mem.id === userInfo?.uid && authToken) {
        hasProjectsEditAccess = true;
        break;
      }
    }
    teamProjectList = [...maintainingProjects, ...contributingProjects];
    teamProjectList = teamProjectList?.map((project: any) => {
      return {
        ...project,
        hasEditAccess: hasProjectEditAccess(userInfo, project, isLoggedIn, memberTeams),
      };
    });
    if (userInfo?.roles && userInfo?.roles?.length && userInfo?.roles?.includes(ADMIN_ROLE) && authToken) {
      hasProjectsEditAccess = true;
    }
    if(hasProjectsEditAccess){
      team.logoUid = team.logoUid;
    }
    return { team, members, focusAreas, isLoggedIn, userInfo, teamProjectList, hasProjectsEditAccess, officeHoursFlag };
  } catch (error: any) {
    console.error(error);
    isNotFound = true;
    return { isNotFound, team, isLoggedIn };
  }
}

type IGenerateMetadata = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};
export async function generateMetadata({ params, searchParams }: IGenerateMetadata, parent: ResolvingMetadata): Promise<Metadata> {
  const teamId = params.id;
  const teamResonse = await getTeam(teamId, { with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member' });
  if (teamResonse?.error) {
    return {
      title: 'Protocol Labs Directory',
      description:
        'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
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
  const team = teamResonse?.data?.formatedData;
  const previousImages = (await parent).openGraph?.images || [];
  const logo = team?.logo || SOCIAL_IMAGE_URL;
  return {
    title: `${team?.name} | Protocol Labs Directory`,
    openGraph: {
      type: 'website',
      url: `${process.env.APPLICATION_BASE_URL}${PAGE_ROUTES.TEAMS}/${teamId}`,
      images: [logo, ...previousImages],
    },
  };
}
