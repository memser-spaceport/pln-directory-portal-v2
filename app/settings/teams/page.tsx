import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import MemberSettings from '@/components/page/settings/member-settings';
import ManageTeamsSettings from '@/components/page/settings/manage-teams';

export default function ManageMembers() {
  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Settings', url: '/settings' },
    { text: 'Profile', url: '/settings/profile' },
  ];
  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu activeItem="manage teams" />
          </aside>
          <div className={styles.ps__main__content}>
            <ManageTeamsSettings />
          </div>
        </div>
      </div>
    </>
  );
}
