import Error from '@/components/core/error';
import ContactInfo from '@/components/page/team-details/contact-info';
import Funding from '@/components/page/team-details/funding';
import TeamDetails from '@/components/page/team-details/team-details';
import { getMembers } from '@/services/members.service';
import { getAllTeams, getTeam, getTeamUIDByAirtableId } from '@/services/teams.service';
import { IMember } from '@/types/members.types';
import { ITeam, ITeamDetailParams } from '@/types/teams.types';
import { ADMIN_ROLE, AIRTABLE_REGEX, PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata, ResolvingMetadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';
import styles from './page.module.scss';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/types/shared.types';
import SelectedFocusAreas from '@/components/core/selected-focus-area';
import { BackButton } from '@/components/ui/BackButton';
import React from 'react';
import { PitchDeckDetails } from '@/components/page/team-details/PitchDeckDetails';
import { VideoPitchDetails } from '@/components/page/team-details/VideoPitchDetails';

async function Page({ params }: { params: ITeamDetailParams }) {
  const teamId: string = params?.id;
  const {
    team,
    members,
    focusAreas,
    isLoggedIn,
    userInfo,
    redirectTeamUid,
    isError,
    isNotFound,
    isLoggedInMemberPartOfTeam,
  } = await getPageData(teamId);

  if (redirectTeamUid) {
    redirect(`/teams/${redirectTeamUid}/fundraising`, RedirectType.replace);
  }

  if (isNotFound || isError) {
    return <Error />;
  }

  return (
    <>
      <div className={styles?.fundraisingDetail}>
        <BackButton to={`/teams/${teamId}`} />
        <div className={styles?.fundraisingDetail__container}>
          {/* Header */}
          <div className={styles?.fundraisingDetail__container__header}>
            <TeamDetails team={team} userInfo={userInfo} />
          </div>

          {/* Pitch Deck */}
          <div className={styles?.fundraisingDetail__container__pitchDeck}>
            <PitchDeckDetails team={team} isLoggedIn={isLoggedIn} userInfo={userInfo} />
          </div>

          {/* Video Pitch */}
          <div className={styles?.fundraisingDetail__container__videoPitch}>
            <VideoPitchDetails team={team} isLoggedIn={isLoggedIn} userInfo={userInfo} />
          </div>

          {/* Funding Information */}
          {team?.fundingStage || team?.membershipSources?.length ? (
            <div className={styles?.fundraisingDetail__container__funding}>
              <Funding team={team} />
            </div>
          ) : null}

          {/* Focus Areas */}
          {team.teamFocusAreas && team?.teamFocusAreas?.length > 0 && focusAreas && focusAreas?.length > 0 && (
            <div className={styles?.fundraisingDetail__container__focusarea}>
              <SelectedFocusAreas focusAreas={focusAreas} selectedFocusAreas={team.teamFocusAreas} />
            </div>
          )}

          {/* Contact Information */}
          <div className={styles?.fundraisingDetail__container__contact}>
            <ContactInfo team={team} userInfo={userInfo} />
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
    asks: [],
  };
  let members: IMember[] = [];
  let focusAreas: IFocusArea[] = [];
  let isError = false;
  let isNotFound = false;
  let memberTeams: never[] = [];

  try {
    if (AIRTABLE_REGEX.test(teamId)) {
      const teamUidResponse = await getTeamUIDByAirtableId(teamId);
      if (teamUidResponse?.error || teamUidResponse?.length === 0) {
        isError = true;
        return { isError, team, userInfo };
      }
      const redirectTeamUid = teamUidResponse[0]?.uid;
      return { redirectTeamUid, team, members, userInfo };
    }

    const [teamResponse, teamMembersResponse, focusAreaResponse] = await Promise.all([
      getTeam(teamId, {
        with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member,asks',
      }),
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
    ]);

    let isLoggedInMemberPartOfTeam = false;
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
      isLoggedInMemberPartOfTeam = memberTeams.filter((team: any) => team.id === teamId).length > 0;
    }

    if (teamResponse?.error || teamMembersResponse?.error || focusAreaResponse?.error) {
      isError = true;
      return { isError, team, userInfo };
    }

    team = teamResponse?.data?.formatedData;
    members = teamMembersResponse?.data?.formattedData;
    focusAreas = focusAreaResponse.data;
    focusAreas = focusAreas.filter((data: IFocusArea) => !data.parentUid);

    return { team, members, focusAreas, isLoggedIn, userInfo, isLoggedInMemberPartOfTeam };
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

export async function generateMetadata(
  { params, searchParams }: IGenerateMetadata,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const teamId = params.id;
  const teamResponse = await getTeam(teamId, {
    with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member',
  });
  if (teamResponse?.error) {
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
  const team = teamResponse?.data?.formatedData;
  const previousImages = (await parent).openGraph?.images || [];
  const logo = team?.logo || SOCIAL_IMAGE_URL;
  return {
    title: `${team?.name} - Fundraising | Protocol Labs Directory`,
    openGraph: {
      type: 'website',
      url: `${process.env.APPLICATION_BASE_URL}${PAGE_ROUTES.TEAMS}/${teamId}/fundraising`,
      images: [logo, ...previousImages],
    },
  };
}
