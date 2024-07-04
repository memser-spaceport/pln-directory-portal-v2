import SettingsMenu from '@/components/page/settings/menu';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getMemberPreferences } from '@/services/preferences.service';
import styles from './page.module.css';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MemberPrivacyForm from '@/components/page/settings/member-privacy-form';

const getPageData = async (userInfo: any, authToken: string) => {
  return await getMemberPreferences(userInfo.uid, authToken);
};

async function PrivacyPage() {
  const cookieStore = cookies();
  const rawAuthToken: any = cookieStore.get('authToken');
  const rawUserInfo: any = cookieStore.get('userInfo');
  if (!rawAuthToken || !rawUserInfo) {
    redirect('/teams');
  }
  const preferences = await getPageData(JSON.parse(rawUserInfo.value), JSON.parse(rawAuthToken.value));
  const memberPreferences = preferences.memberPreferences;

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Settings', url: '/settings' },
    { text: 'Privacy', url: '/settings/privacy' },
  ];

  return (
    <>
      <div className={styles.privacy}>
        <div className={styles.privacy__breadcrumbs}>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className={styles.privacy__main}>
          <aside className={styles.privacy__main__aside}>
            <SettingsMenu activeItem="privacy" />
          </aside>
          <div className={styles.privacy__main__content}>
            <MemberPrivacyForm />
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPage;
