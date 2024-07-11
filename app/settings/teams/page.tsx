import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import MemberSettings from '@/components/page/settings/member-settings';
import ManageTeamsSettings from '@/components/page/settings/manage-teams';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTeamInfo, getTeamsInfoForDp } from '@/services/teams.service';
import { redirect } from 'next/navigation';


const getPageData = async (selectedTeamId: string, leadingTeams: any[], isTeamLead: boolean) => {
  const dpResult = await getTeamsInfoForDp();
  let selectedTeam;
  if(dpResult.error) {
    return {isError: true}
  }

  let teams = dpResult.data ?? [];
  if(isTeamLead) {
    console.log(teams[0], leadingTeams)
    teams = [...structuredClone(teams)].filter(v => leadingTeams.includes(v.id))
  }
  const teamResult = await getTeamInfo(selectedTeamId ?? teams[0].id);
  if(teamResult.isError) {
    return {
      isError: true
    }
  }
  selectedTeam = teamResult.data;
 

  console.log(selectedTeam)
  return {
    teams,
    selectedTeam
  }
}


export default async function ManageTeams(props: any) {
  const selectedTeamId = props?.searchParams?.id
  const cookieStore = cookies();
  const rawAuthToken: any = cookieStore.get('authToken')?.value;
  const rawUserInfo: any = cookieStore.get('userInfo')?.value;
  if (!rawAuthToken || !rawUserInfo) {
    redirect('/teams');
  }
  
  const userInfo = JSON.parse(rawUserInfo);
  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');
  if(!isAdmin && !isTeamLead) {
    redirect('/teams')
  }
  if(selectedTeamId && isTeamLead && !leadingTeams.includes(selectedTeamId)) {
    redirect('/teams')
  }
  
  const { teams, isError, selectedTeam } = await getPageData(selectedTeamId, leadingTeams, isTeamLead)
  if(isError) {
    return 'Error'
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Settings', url: '/settings' },
    { text: 'Profile', url: '/settings/profile' },
  ];
  return (
    <>
      <div className={styles.ps}>
      <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <Link className={styles.ps__breadcrumbs__mobile} href="/settings">
            <img width="16" height="16" src="/icons/arrow-left-blue.svg" />
            <p>Settings</p>
          </Link>
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="manage teams" />
          </aside>
          <div className={styles.ps__main__content}>
            <ManageTeamsSettings selectedTeam={selectedTeam} teams={teams} />
          </div>
        </div>
      </div>
    </>
  );
}
