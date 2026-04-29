import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import SettingsMenu from '@/components/page/settings/menu';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { JobAlertsManager } from '@/components/page/job-alerts/JobAlertsManager/JobAlertsManager';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import styles from './page.module.css';

async function JobAlertsSettingsPage({ searchParams }: { searchParams: any }) {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  const params = new URLSearchParams(searchParams as Record<string, string>).toString();

  if (!isLoggedIn) {
    redirect(`/${params ? `?${params}` : '?'}&returnTo=settings-job-alerts#login`);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;

  return (
    <div className={styles.privacy}>
      <div className={styles.privacy__backbtn}>
        <SettingsBackButton title="Job Alert" />
      </div>
      <div className={styles.privacy__main}>
        <aside className={styles.privacy__main__aside}>
          <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="job alert" userInfo={userInfo} />
        </aside>
        <div className={styles.privacy__main__content}>
          <JobAlertsManager />
        </div>
      </div>
    </div>
  );
}

export default JobAlertsSettingsPage;

export const metadata: Metadata = {
  title: 'Job Alert | Protocol Labs Directory',
  description: 'Manage your job alert and weekly email digest.',
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
