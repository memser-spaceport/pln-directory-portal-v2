import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import ManageMembersSettings from '@/components/page/settings/manage-members';
import Link from 'next/link';
import { getMemberInfo, getMembersInfoForDp } from '@/services/members.service';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';


const getPageData = async (selectedMemberId: string) => {
  const dpResult = await getMembersInfoForDp();
  let selectedMember;
  if(dpResult.error) {
    return {isError: true}
  }

  const members = dpResult.data ?? [];
  const memberResult = await getMemberInfo(selectedMemberId ?? members[0].id);
  if(memberResult.isError) {
    return {
      isError: true
    }
  }
  selectedMember = memberResult.data;
  console.log(selectedMember)
  return {
    members,
    selectedMember
  }
}

export default async function ManageMembers(props: any) {
  const selectedMemberId = props?.searchParams?.id;
  const {userInfo, isLoggedIn} = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect('/teams');
  }
  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');
  
  if(!isAdmin) {
    redirect('/teams');
  }
  const { members, isError, selectedMember } = await getPageData(selectedMemberId);

  if(isError) {
    return 'Error'
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Members', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Manage Members', url: '/settings/members' },
  ]
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
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="manage members" />
          </aside>
          <div className={styles.ps__main__content}>
            <ManageMembersSettings selectedMember={selectedMember} members={members ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}
