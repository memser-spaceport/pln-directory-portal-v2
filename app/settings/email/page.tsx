import SettingsMenu from '@/components/page/settings/menu';
import styles from './page.module.css';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { EmailPreferencesForm } from '@/components/page/email-preferences/components/EmailPreferencesForm';

async function RecommendationsPage({ searchParams }: { searchParams: any }) {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  const params = new URLSearchParams(searchParams as Record<string, string>).toString();

  if (!isLoggedIn) {
    redirect(`/${params ? `?${params}` : '?'}&returnTo=settings-email#login`);
  }

  const [settingResponse, investorSettingsResponse] = await Promise.all([
    fetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${userInfo.uid}/forum`, {
      headers: {
        contentType: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${userInfo.uid}/investor`, {
      headers: {
        contentType: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }),
  ]);

  if (!settingResponse.ok) {
    return null;
  }

  const settings = await settingResponse.json();
  const investorSettings = await investorSettingsResponse.json();
  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;

  return (
    <>
      <div className={styles.privacy}>
        <div className={styles.privacy__backbtn}>
          <SettingsBackButton title="Email Preferences" />
        </div>
        <div className={styles.privacy__main}>
          <aside className={styles.privacy__main__aside}>
            <SettingsMenu
              isTeamLead={isTeamLead}
              isAdmin={isAdmin}
              activeItem="email preferences"
              userInfo={userInfo}
            />
          </aside>
          <div className={styles.privacy__main__content}>
            <EmailPreferencesForm
              uid={userInfo.uid}
              userInfo={userInfo}
              initialData={{
                settings,
                investorSettings,
              }}
            />
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
