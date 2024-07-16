import { cookies } from 'next/headers';
import styles from './page.module.css'
import SettingsMenu from '@/components/page/settings/menu'
import { redirect } from 'next/navigation';
export default function Settings() {
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
  const isAdmin = roles.includes('DIRECTORYADMIN')
  return <>
    <div className={styles.settings}>
        <div className={styles.settings__title}>
            <h2 className={styles.settings__title__text}>Account Settings</h2>
        </div>
        <div>
            <SettingsMenu isAdmin={isAdmin} isTeamLead={isTeamLead} />
        </div>
    </div>
  </>
}
