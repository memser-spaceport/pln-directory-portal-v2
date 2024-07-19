import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import MemberSettings from '@/components/page/settings/member-settings';
import ManageTeamsSettings from '@/components/page/settings/manage-teams';
import Link from 'next/link';
import { getTeamInfo, getTeamsInfoForDp } from '@/services/teams.service';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

const getPageData = async (selectedTeamId: string, leadingTeams: any[], isTeamLead: boolean) => {
  const dpResult = await getTeamsInfoForDp();
  let selectedTeam;
  if (dpResult.error) {
    return { isError: true };
  }

  let teams = dpResult.data ?? [];
  if (isTeamLead) {
    teams = [...structuredClone(teams)].filter((v) => leadingTeams.includes(v.id));
  }
  const teamResult = await getTeamInfo(selectedTeamId ?? teams[0].id);
  if (teamResult.isError) {
    return {
      isError: true,
    };
  }
  selectedTeam = teamResult.data;

  return {
    teams,
    selectedTeam,
  };
};

export default async function ManageTeams(props: any) {
  const selectedTeamId = props?.searchParams?.id;
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect('/teams');
  }

  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');
  if (!isAdmin && !isTeamLead) {
    redirect('/teams');
  }
  if (selectedTeamId && isTeamLead && !leadingTeams.includes(selectedTeamId)) {
    redirect('/teams');
  }

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
            <ManageTeamsSettings selectedTeam={selectedTeam} teams={teams} userInfo={userInfo} />
          </div>
        </div>
      </div>
    </>
  );
}
