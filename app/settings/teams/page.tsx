import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import ManageTeamsSettings from '@/components/page/settings/manage-teams';
import Link from 'next/link';
import { getTeamInfo, getTeamsInfoForDp } from '@/services/teams.service';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
// import { getMemberRolesForTeam } from '@/services/members.service';   //Team lead config code 
// import { sortMemberByRole } from '@/utils/common.utils';              //Team lead config code

const getPageData = async (selectedTeamId: string, leadingTeams: any[], isTeamLead: boolean) => {
  const dpResult = await getTeamsInfoForDp();
  let selectedTeam;
  // let membersDetail;    //Team lead config code
  if (dpResult.error) {
    return { isError: true };
  }

  let teams = dpResult.data ?? [];
  if (isTeamLead) {
    teams = [...structuredClone(teams)].filter((v) => leadingTeams.includes(v.id));
  }
  const teamResult = await getTeamInfo(selectedTeamId ?? teams[0].id);
      // const [teamResult, teamMembersResponse] = await Promise.all([   //Team lead config code - start
      //   getTeamInfo(selectedTeamId ?? teams[0].id),
      //   getMemberRolesForTeam(
      //     {
      //       'teamMemberRoles.team.uid': selectedTeamId ?? teams[0].id,
      //       select: 'uid,name,image.url,teamMemberRoles.team.uid,teamMemberRoles.team.name,teamMemberRoles.role,teamMemberRoles.teamLead,teamMemberRoles.mainTeam',
      //       pagination: false,
      //     },
      //     selectedTeamId ?? teams[0].id,
      //   )
      // ]);     //Team lead config code - end  
  
  // if (teamResult.isError || teamMembersResponse.error) { //Team lead config code
    if (teamResult.isError) {
    return {
      isError: true,
    };
  }
  selectedTeam = teamResult.data;
  // membersDetail = teamMembersResponse?.data?.formattedData?.sort(sortMemberByRole);  //Team lead config code

  return {
    teams,
    selectedTeam,
    // membersDetail,     //Team lead config code
  };
};

export default async function ManageTeams(props: any) {
  const selectedTeamId = props?.searchParams?.id;
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn) {
     redirect(PAGE_ROUTES.HOME);
  }

  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');
  if (!isAdmin && !isTeamLead) {
     redirect(PAGE_ROUTES.HOME);
  }
  if (selectedTeamId && isTeamLead && !leadingTeams.includes(selectedTeamId)) {
     redirect(PAGE_ROUTES.HOME);
  }

  // const { teams, isError, selectedTeam, membersDetail } = await getPageData(selectedTeamId, leadingTeams, isTeamLead);   //Team lead config code
  const { teams, isError, selectedTeam } = await getPageData(selectedTeamId, leadingTeams, isTeamLead);
  if (isError) {
    return 'Error';
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Members', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Manage Teams', url: '/settings/teams' },
  ];
  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} LinkComponent={Link} />
          </div>
        </div>
        <div className={styles.ps__backbtn}>
          <SettingsBackButton title="Manage Teams" />
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="manage teams" userInfo={userInfo} />
          </aside>
          <div className={styles.ps__main__content}>
            {/* <ManageTeamsSettings selectedTeam={selectedTeam} membersDetail={membersDetail} teams={teams} userInfo={userInfo} /> //Team lead config code */}
            <ManageTeamsSettings selectedTeam={selectedTeam} teams={teams} userInfo={userInfo} />
          </div>
        </div>
      </div>
    </>
  );
}

export const metadata: Metadata = {
  title: 'Settings | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
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