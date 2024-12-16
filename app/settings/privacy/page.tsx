import SettingsMenu from '@/components/page/settings/menu';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getMemberPreferences } from '@/services/preferences.service';
import styles from './page.module.css';
import { redirect } from 'next/navigation';
import MemberPrivacyForm from '@/components/page/settings/member-privacy-form';
import Link from 'next/link';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getMember } from '@/services/members.service';

const getPageData = async (userInfo: any, authToken: string, isLoggedIn: boolean) => {
  const [memberResponse, preferences] = await Promise.all([getMember(userInfo?.uid, {}, isLoggedIn, userInfo), getMemberPreferences(userInfo.uid, authToken)]);

  return { memberDetails: memberResponse, preferences };
};

async function PrivacyPage() {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect(PAGE_ROUTES.HOME);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const {memberDetails, preferences } = await getPageData(userInfo, authToken, isLoggedIn);
  if( preferences.memberPreferences) {
    preferences.memberPreferences.newsLetter = memberDetails?.data?.formattedData?.isSubscribedToNewsletter;
  }
  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'People', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Privacy', url: '/settings/privacy' },
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
          <SettingsBackButton title="People Privacy" />
        </div>
        <div className={styles.privacy__main}>
          <aside className={styles.privacy__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="privacy" userInfo={userInfo} />
          </aside>
          <div className={styles.privacy__main__content}>
            <MemberPrivacyForm uid={userInfo.uid} preferences={preferences} userInfo={userInfo} />
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPage;

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
