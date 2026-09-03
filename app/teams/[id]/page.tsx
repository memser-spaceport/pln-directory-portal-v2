import Error from '@/components/core/error';
import { TeamContactInfo } from '@/components/page/team-details/TeamContactInfo';
import { TeamProjects } from '@/components/page/team-details/TeamProjects';
import { AiGeneratedTeamProfileBanner } from '@/components/page/team-details/AiGeneratedTeamProfileBanner';
import { TeamDetails } from '@/components/page/team-details/TeamDetails';
import { TeamMembers } from '@/components/page/team-details/TeamMembers';
import { getMembers } from '@/services/members.service';
import { getAllTeams, getTeam, getTeamUIDByAirtableId } from '@/services/teams.service';
import { IMember } from '@/types/members.types';
import { IFormatedTeamProject, ITeam, ITeamDetailParams } from '@/types/teams.types';
import { hasProjectEditAccess, sortMemberByRole } from '@/utils/common.utils';
import { AIRTABLE_REGEX, PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata, ResolvingMetadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';
import styles from './page.module.css';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/types/shared.types';
import SelectedFocusAreas from '@/components/core/selected-focus-area';
import TeamIrlContributions from '@/components/page/team-details/team-irl-contributions';
import { BackButton } from '@/components/ui/BackButton';
import React from 'react';
import { TeamInvestorDetails } from '@/components/page/team-details/TeamInvestorDetails';
import { TeamMembershipSource, TeamCommunitiesSection } from '@/components/page/team-details/TeamsTagsListSection';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { TeamFocusAreas } from '@/components/page/team-details/TeamFocusAreas';
import { TeamNewsRail } from '@/components/page/team-details/TeamNews';
import { fetchTeamNewsByTeam } from '@/services/team-news/team-news.service';
import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import { hasTeamNewsItems } from '@/services/team-news/team-news.utils';
import { canPostTeamNews } from '@/components/page/team-details/TeamNews/canPostTeamNews';
import type { ITeamNewsByTeamResponse } from '@/types/team-news.types';
import { getTeamFollowers } from '@/services/follow/follow.service';
import type { ITeamFollowersResponse } from '@/types/follow.types';
import { TeamOpenRolesSection } from '@/components/page/team-details/TeamOpenRoles';
import { selectTeamOpenRoles } from '@/components/page/team-details/TeamOpenRoles/selectTeamOpenRoles';
import { getJobsList } from '@/app/actions/jobs.actions';
import type { IJobTeamGroup } from '@/types/jobs.types';
import layoutStyles from './TeamProfileLayout.module.scss';

async function Page(props: { params: Promise<ITeamDetailParams>; searchParams: Promise<{ backTo?: string }> }) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const teamId: string = params?.id;
  const backTo = searchParams?.backTo || '/teams';
  const {
    team,
    members,
    focusAreas,
    isLoggedIn,
    userInfo,
    teamProjectList,
    hasProjectsEditAccess = false,
    redirectTeamUid,
    isError,
    isNotFound,
    hasEditAsksAccess,
    teamNews,
    followers,
    openRoles,
  } = await getPageData(teamId);

  if (redirectTeamUid) {
    redirect(`/teams/${redirectTeamUid}`, RedirectType.replace);
  }

  if (isNotFound || isError) {
    return <Error />;
  }

  function hasInvestorData() {
    return (
      team.investorProfile?.investmentFocus?.length ||
      team.investorProfile?.investInStartupStages?.length ||
      team.investorProfile?.investInFundTypes?.length ||
      team.investorProfile?.typicalCheckSize
    );
  }

  const showAiGeneratedTeamProfileBanner =
    !!userInfo?.leadingTeams?.includes(team.id) &&
    !!team?.dataEnrichment?.isAIGenerated &&
    team?.dataEnrichment?.status !== 'Reviewed';

  const isCurrentUserTeamMember = isLoggedIn && members?.some((m) => m.id === userInfo?.uid);

  const showNewsRail = hasTeamNewsItems(teamNews) || canPostTeamNews(team, userInfo, isCurrentUserTeamMember);
  const canPost =
    canPostTeamNews(team, userInfo, isCurrentUserTeamMember) && team.status !== 'INACTIVE';

  const teamDetailContent = (
    <>
      <BackButton to={backTo} />
      <div className={styles?.teamDetail__container}>
        {/* Details */}
        <div className={styles?.teamDetail__Container__details}>
          {showAiGeneratedTeamProfileBanner && <AiGeneratedTeamProfileBanner team={team} />}
          <TeamDetails team={team} initialFollowers={followers} isCurrentUserTeamMember={isCurrentUserTeamMember} />
        </div>

        {isLoggedIn && team?.isFund && <TeamInvestorDetails team={team} isLoggedIn={isLoggedIn} />}

        {/* contact */}
        <div className={styles?.teamDetail__container__contact}>
          <TeamContactInfo team={team} />
        </div>

        <TeamMembershipSource team={team} />
        <TeamCommunitiesSection team={team} />

        {/* Irl Contribuions */}
        {(team.eventGuests?.length > 0 || team.associations?.length > 0) && (
          <div className={styles?.teamDetail__irlContributions}>
            <TeamIrlContributions team={team} members={members} teamId={teamId} />
          </div>
        )}
        {/* Member */}
        <div className={styles?.teamDetail__container__member}>
          <TeamMembers team={team} members={members} />
        </div>

        {/* Who the team is looking for, next to who's already there. Absent, not empty,
            when the team isn't hiring — but the host mounts either way, because the
            apply drawer it owns must outlive the list. See `TeamOpenRolesSection`. */}
        {/* `!!` like the jobs page does: `isLoggedIn` comes from a parsed header
            and is `any`, so logged out it is an empty string rather than false. */}
        <TeamOpenRolesSection group={openRoles ?? null} isLoggedIn={!!isLoggedIn} userInfo={userInfo} />

        <TeamFocusAreas team={team} focusAreas={focusAreas || []} teamFocusAreas={team?.teamFocusAreas || []} />

        <TeamProjects
          isLoggedIn={isLoggedIn}
          projects={teamProjectList}
          team={team}
          hasProjectsEditAccess={hasProjectsEditAccess}
        />
      </div>
    </>
  );

  if (showNewsRail) {
    const railData: ITeamNewsByTeamResponse = teamNews ?? {
      teamUid: teamId,
      teamName: team.name ?? 'This team',
      page: 1,
      limit: TEAM_NEWS_PREVIEW_LIMIT,
      total: 0,
      items: [],
    };

    return (
      <div className={layoutStyles.layout}>
        <div className={`${styles?.teamDetail} ${layoutStyles.mainCol}`}>{teamDetailContent}</div>
        <TeamNewsRail
          teamUid={teamId}
          teamName={team.name ?? railData.teamName}
          initialData={railData}
          canPost={canPost}
          memberUid={userInfo?.uid}
        />
      </div>
    );
  }

  return <div className={styles?.teamDetail}>{teamDetailContent}</div>;
}

export default Page;

async function getPageData(teamId: string) {
  let teamNews: ITeamNewsByTeamResponse | null = null;
  const { userInfo, authToken, isLoggedIn } = await getCookiesFromHeaders();

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
    asks: [],
  };
  let members: IMember[] = [];
  let focusAreas: IFocusArea[] = [];
  let hasProjectsEditAccess = false;
  let teamProjectList: IFormatedTeamProject[] = [];
  let isError = false;
  let isNotFound = false;
  let memberTeams: never[] = [];
  let hasEditAsksAccess: boolean = false;
  let followers: ITeamFollowersResponse | null = null;
  let openRoles: IJobTeamGroup | null = null;

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

    const [teamResponse, teamMembersResponse, focusAreaResponse, teamNewsResponse, followersResponse, jobsResponse] =
      await Promise.all([
        getTeam(
          teamId,
          {
            with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member,asks',
          },
          authToken,
        ),
        getMembers(
          {
            'teamMemberRoles.team.uid': teamId,
            isVerified: 'all',
            select:
              'uid,name,isVerified,image.url,officeHours,ohStatus,skills.title,teamMemberRoles.team.uid,projectContributions,teamMemberRoles.team.name,teamMemberRoles.role,teamMemberRoles.teamLead,teamMemberRoles.mainTeam',
            pagination: false,
          },
          teamId,
          0,
          0,
          isLoggedIn,
        ),
        getFocusAreas('Team', {}),
        fetchTeamNewsByTeam(teamId, { page: 1, limit: TEAM_NEWS_PREVIEW_LIMIT }, authToken),
        isLoggedIn ? getTeamFollowers(teamId, { authToken }) : Promise.resolve(null),
        // `limit` pages teams, not roles, so one group carries all of this team's
        // postings. `getJobsList` resolves an error object rather than throwing, which
        // matters here: the catch below turns any throw into a 404 for the whole
        // profile, and a jobs-API blip must not take the team page down with it.
        getJobsList(`teamUid=${encodeURIComponent(teamId)}&limit=1`),
      ]);
    teamNews = teamNewsResponse;
    followers = followersResponse;
    openRoles = selectTeamOpenRoles(jobsResponse, teamId);

    if (isLoggedIn) {
      const allTeams = await getAllTeams(
        authToken,
        {
          'teamMemberRoles.member.uid': userInfo.uid,
          select: 'uid,name,logo.url,industryTags.title,teamMemberRoles.role,teamMemberRoles.mainTeam,officeHours',
          pagination: false,
        },
        0,
        0,
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
    if (!isLoggedIn && team['officeHours']) {
      delete team['officeHours'];
    }

    members = teamMembersResponse?.data?.formattedData?.sort(sortMemberByRole);
    hasEditAsksAccess =
      members.some((member: any) => member.id === userInfo.uid) ||
      (Array.isArray(userInfo?.roles) ? isAdminUser(userInfo) : false);
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
    teamProjectList = teamProjectList
      ?.filter((project) => !project.isDeleted)
      .map((project: any) => {
        return {
          ...project,
          hasEditAccess: hasProjectEditAccess(userInfo, project, isLoggedIn, memberTeams),
        };
      });
    if (isAdminUser(userInfo) && authToken) {
      hasProjectsEditAccess = true;
    }
    if (hasProjectsEditAccess) {
      team.logoUid = team.logoUid;
    }
    return {
      team,
      members,
      focusAreas,
      isLoggedIn,
      userInfo,
      teamProjectList,
      hasProjectsEditAccess,
      hasEditAsksAccess,
      teamNews,
      followers,
      openRoles,
    };
  } catch (error: any) {
    console.error(error);
    isNotFound = true;
    return { isNotFound, team, isLoggedIn };
  }
}

type IGenerateMetadata = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: IGenerateMetadata, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  const teamId = params.id;
  const teamResonse = await getTeam(teamId, {
    with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member',
  });
  if (teamResonse?.error) {
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
