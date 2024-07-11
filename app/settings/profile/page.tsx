import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import MemberSettings from '@/components/page/settings/member-settings';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMemberInfo } from '@/services/members.service';

const getPageData = async (userId: string) => {
  const memberInfo = await getMemberInfo(userId);
  if(memberInfo.isError) {
    return {
      isError: true
    }
  }

  return {
    memberInfo: memberInfo.data
  }
}

export default async function ProfileSettings() {
  const cookieStore = cookies();
  const rawAuthToken: any = cookieStore.get('authToken')?.value;
  const rawUserInfo: any = cookieStore.get('userInfo')?.value;
  if(!rawAuthToken || !rawUserInfo) {
    redirect('/teams')
  }
  const userInfo = JSON.parse(rawUserInfo);
  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const { memberInfo } = await getPageData(userInfo.uid)
  console.log(memberInfo)

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
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="profile" />
          </aside>
          <div className={styles.ps__main__content}>
            <MemberSettings memberInfo={memberInfo} />
          </div>
        </div>
      </div>
    </>
  );
}
