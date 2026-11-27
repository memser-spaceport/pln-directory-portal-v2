import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SettingsMenu } from '@/components/page/settings/SettingsMenu';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { InviteSettings } from '@/components/page/settings/invite/InviteSettings';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

// The settings shell that every settings route uses.
import styles from '../accounts/page.module.css';

/** Settings → Invite (LAB-3398): the signed-in member's personal invite link. */
async function InviteSettingsPage() {
  const { isLoggedIn, userInfo } = await getCookiesFromHeaders();

  // A fixed target: this page reads no query, so it passes none on.
  if (!isLoggedIn) redirect('/home?returnTo=settings-invite#login');

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const isTeamLead = (userInfo.leadingTeams ?? []).length > 0;

  return (
    <div className={styles.privacy}>
      <div className={styles.privacy__backbtn}>
        <SettingsBackButton title="Invite" />
      </div>
      <div className={styles.privacy__main}>
        <aside className={styles.privacy__main__aside}>
          <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} userInfo={userInfo} />
        </aside>
        <div className={styles.privacy__main__content}>
          <InviteSettings userInfo={userInfo} />
        </div>
      </div>
    </div>
  );
}

export default InviteSettingsPage;

export const metadata: Metadata = {
  title: 'Invite | Protocol Labs Directory',
  description: 'Copy your personal link and invite people to LabOS.',
};
