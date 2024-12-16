import styles from './page.module.css'
import SettingsMenu from '@/components/page/settings/menu'
import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import SettingsMobileHandler from '@/components/page/settings/settings-mobile-handler';
import { Metadata } from 'next';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';

export default function Settings() {
  const {isLoggedIn, userInfo} = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect(PAGE_ROUTES.HOME);
  }

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
            <SettingsMenu isAdmin={isAdmin} isTeamLead={isTeamLead} userInfo={userInfo} />
            <SettingsMobileHandler/>
        </div>
    </div>
  </>
}

export const metadata: Metadata = {
  title: 'Settings | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
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