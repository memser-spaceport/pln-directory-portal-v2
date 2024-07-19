import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import ManageMembersSettings from '@/components/page/settings/manage-members';
import Link from 'next/link';
import { getMemberInfo, getMembersInfoForDp } from '@/services/members.service';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMemberPreferences } from '@/services/preferences.service';

const getPageData = async (selectedMemberId: string, authToken: string) => {
  const dpResult = await getMembersInfoForDp();
  let selectedMember; 
  let preferences: any = {};
  if (dpResult.error) {
    return { isError: true };
  }

  const members = dpResult.data ?? [];
  const [memberResult, preferenceResult] = await Promise.all([getMemberInfo(selectedMemberId ?? members[0].id), getMemberPreferences(selectedMemberId ?? members[0].id, authToken)]);
  if (memberResult.isError || preferenceResult.isError) {
    return {
      isError: true,
    };
  }
  selectedMember = memberResult.data;
  preferences.memberPreferences = preferenceResult.memberPreferences
  preferences.preferenceSettings = preferenceResult.preferenceSettings
  return {
    members,
    selectedMember,
    preferences,
  };
};

export default async function ManageMembers(props: any) {
  const selectedMemberId = props?.searchParams?.id;
  const viewType = props?.searchParams?.viewType ?? 'profile';
  const { userInfo, isLoggedIn, authToken } = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect('/teams');
  }
  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');

  if (!isAdmin) {
    redirect('/teams');
  }
  const { members, isError, selectedMember, preferences } = await getPageData(selectedMemberId, authToken);
  const formattedMembers = [...members].filter(v => v.id !== userInfo.uid)
  if (isError) {
    return 'Error';
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Members', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Manage Members', url: '/settings/members' },
  ];
  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} LinkComponent={Link} />
          </div>
          <div className={styles.ps__backbtn}>
            <SettingsBackButton title="Manage Member" />
          </div>
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="manage members" userInfo={userInfo}/>
          </aside>
          <div className={styles.ps__main__content}>
            <ManageMembersSettings preferences={preferences} viewType={viewType} selectedMember={selectedMember} members={formattedMembers ?? []} userInfo={userInfo}/>
          </div>
        </div>
      </div>
    </>
  );
}
