import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { SettingsMenu } from '@/components/page/settings/SettingsMenu';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { GeneralPreferences } from '@/components/page/settings/GeneralPreferences';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import styles from './page.module.css';

async function GeneralPreferencesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [{ isLoggedIn, userInfo }, resolvedSearchParams] = await Promise.all([getCookiesFromHeaders(), searchParams]);
  const params = new URLSearchParams(resolvedSearchParams).toString();

  if (!isLoggedIn) {
    redirect(`/${params ? `?${params}` : '?'}&returnTo=settings-general#login`);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;

  return (
    <div className={styles.privacy}>
      <div className={styles.privacy__backbtn}>
        <SettingsBackButton title="General Preferences" />
      </div>
      <div className={styles.privacy__main}>
        <aside className={styles.privacy__main__aside}>
          <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} userInfo={userInfo} />
        </aside>
        <div className={styles.privacy__main__content}>
          <GeneralPreferences uid={userInfo.uid} />
        </div>
      </div>
    </div>
  );
}

export default GeneralPreferencesPage;

export const metadata: Metadata = {
  title: 'General Preferences | Protocol Labs Directory',
  description: 'Manage your general LabOS preferences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
