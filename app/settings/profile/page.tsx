import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import MemberSettings from '@/components/page/settings/member-settings';
import Link from 'next/link';

export default function ProfileSettings() {
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
            <SettingsMenu activeItem="profile" />
          </aside>
          <div className={styles.ps__main__content}>
            <MemberSettings />
          </div>
        </div>
      </div>
    </>
  );
}
