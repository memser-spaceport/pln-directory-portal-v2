import SettingsMenu from '@/components/page/settings/menu';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { EmailPreferencesForm } from '@/components/page/email-preferences/components/EmailPreferencesForm';

async function RecommendationsPage({ searchParams }: { searchParams: any }) {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  const params = new URLSearchParams(searchParams as Record<string, string>).toString();

  if (!isLoggedIn) {
    redirect(`/${params ? `?${params}` : '?'}&returnTo=settings-email#login`);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Members', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Email Preferences', url: '/settings/email' },
  ];

  return (
    <>
      <div className={styles.privacy}>
        <div className={styles.privacy__breadcrumbs}>
          <div className={styles.privacy__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} LinkComponent={Link} />
          </div>
        </div>
        <div className={styles.privacy__backbtn}>
          <SettingsBackButton title="Email Preferences" />
        </div>
        <div className={styles.privacy__main}>
          <aside className={styles.privacy__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="email preferences" userInfo={userInfo} />
          </aside>
          <div className={styles.privacy__main__content}>
            <EmailPreferencesForm uid={userInfo.uid} userInfo={userInfo} />
          </div>
        </div>
      </div>
    </>
  );
}

export default RecommendationsPage;

export const metadata: Metadata = {
  title: 'Settings | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
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
