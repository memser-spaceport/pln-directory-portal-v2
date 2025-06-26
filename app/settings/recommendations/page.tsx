import SettingsMenu from '@/components/page/settings/menu';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getMemberNotificationSettings, getMemberPreferences } from '@/services/preferences.service';
import styles from './page.module.css';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getMember } from '@/services/members.service';
import { RecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm';
import { getSelectedFrequency } from '@/components/page/recommendations/components/RecommendationsSettingsForm/helpers';

const getPageData = async (userInfo: any, authToken: string, isLoggedIn: boolean) => {
  const [memberResponse, preferences, notificationSettings] = await Promise.all([
    getMember(userInfo?.uid, {}, isLoggedIn, userInfo),
    getMemberPreferences(userInfo.uid, authToken),
    getMemberNotificationSettings(userInfo?.uid, authToken),
  ]);

  let _notificationSettings;
  let recommendationsEnabled;

  if (notificationSettings && 'isError' in notificationSettings) {
    _notificationSettings = null;
    recommendationsEnabled = false;
  } else {
    _notificationSettings = {
      enabled: notificationSettings.subscribed,
      frequency: getSelectedFrequency(notificationSettings.emailFrequency),
      industryTags: notificationSettings.industryTagList.map((tag) => {
        return { value: tag, label: tag };
      }),
      roles: notificationSettings.roleList.map((role) => {
        return { value: role, label: role };
      }),
      fundingStage: notificationSettings.fundingStageList.map((stage) => {
        return { value: stage, label: stage };
      }),
      teamTechnology: notificationSettings.technologyList.map((item) => {
        return { value: item, label: item };
      }),
      keywords: notificationSettings.keywordList,
    };
    recommendationsEnabled = notificationSettings.recommendationsEnabled;
  }

  return { memberDetails: memberResponse, preferences, notificationSettings: _notificationSettings, recommendationsEnabled };
};

async function RecommendationsPage({ searchParams }: { searchParams: any }) {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  const params = new URLSearchParams(searchParams as Record<string, string>).toString();

  if (!isLoggedIn) {
    redirect(`/${params ? `?${params}` : '?'}&returnTo=settings-recommendations#login`);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const { memberDetails, preferences, notificationSettings, recommendationsEnabled } = await getPageData(userInfo, authToken, isLoggedIn);

  if (!recommendationsEnabled) {
    redirect(PAGE_ROUTES.HOME);
  }

  if (preferences.memberPreferences) {
    preferences.memberPreferences.newsLetter = memberDetails?.data?.formattedData?.isSubscribedToNewsletter;
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Members', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Recommendations', url: '/settings/recommendations' },
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
          <SettingsBackButton title="Member Privacy" />
        </div>
        <div className={styles.privacy__main}>
          <aside className={styles.privacy__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="recommendations" userInfo={userInfo} />
          </aside>
          <div className={styles.privacy__main__content}>
            <RecommendationsSettingsForm uid={userInfo.uid} userInfo={userInfo} initialData={notificationSettings} />
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
