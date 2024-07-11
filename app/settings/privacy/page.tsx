import SettingsMenu from '@/components/page/settings/menu';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getMemberPreferences } from '@/services/preferences.service';
import styles from './page.module.css';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MemberPrivacyForm from '@/components/page/settings/member-privacy-form';
import Link from 'next/link';

const getPageData = async (userInfo: any, authToken: string) => {
  return await getMemberPreferences(userInfo.uid, authToken);
};

async function PrivacyPage() {
  const cookieStore = cookies();
  const rawAuthToken: any = cookieStore.get('authToken')?.value;
  const rawUserInfo: any = cookieStore.get('userInfo')?.value;
  if (!rawAuthToken || !rawUserInfo) {
    redirect('/teams');
  }

  const userInfo = JSON.parse(rawUserInfo);
  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const preferences = await getPageData(userInfo, JSON.parse(rawAuthToken));
  const memberPreferences = preferences.memberPreferences;
  console.log(preferences);

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Settings', url: '/settings' },
    { text: 'Privacy', url: '/settings/privacy' },
  ];

  return (
    <>
      <div className={styles.privacy}>
        <div className={styles.privacy__breadcrumbs}>
          <div className={styles.privacy__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <Link className={styles.privacy__breadcrumbs__mobile} href="/settings">
            <img width="16" height="16" src="/icons/arrow-left-blue.svg" />
            <p>Settings</p>
          </Link>
        </div>
        <div className={styles.privacy__main}>
          <aside className={styles.privacy__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="privacy" />
          </aside>
          <div className={styles.privacy__main__content}>
            <MemberPrivacyForm uid={userInfo.uid} preferences={preferences} />
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPage;
