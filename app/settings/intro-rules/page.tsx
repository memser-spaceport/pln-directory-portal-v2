import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import ManageIntroRules from '@/components/page/settings/manage-intro-rules';
import { getIntroRules, getIntroTags, getIntroTopics } from '@/services/intro-rules.service';
import { getMembersWithRolesForIntroRules } from '@/services/members.service';
import { IntroRuleData } from '@/types/intro-rules';
const getPageData = async (authToken: string) => {
  try {
    const [rulesResponse, topicsResponse, tagsResponse, membersResponse] = await Promise.all([
      getIntroRules(authToken),
      getIntroTopics(authToken),
      getIntroTags(authToken),
      getMembersWithRolesForIntroRules()
    ]);

    if (rulesResponse.isError || !rulesResponse.data) {
      return { isError: true, data: [] };
    }

    return { 
      isError: false, 
      data: { 
        rules: rulesResponse.data, 
        topics: topicsResponse.data, 
        tags: tagsResponse.data,
        members: membersResponse.data 
      } 
    };
  } catch (error) {
    console.error('Error fetching intro rules data:', error);
    return { 
      isError: true, 
      data: { 
        rules: [], 
        topics: [], 
        tags: [],
        members: [] 
      } 
    };
  }
};

export default async function IntroRulesPage() {
  const { userInfo, isLoggedIn, authToken } = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect(PAGE_ROUTES.HOME);
  }

  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');
  
  if (!isAdmin) {
    redirect(PAGE_ROUTES.HOME);
  }

  const { isError, data } = await getPageData(authToken);
  if (isError) {
    return 'Error';
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'Members', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Manage Intro Rules', url: '/settings/intro-rules' }
  ];

  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} LinkComponent={Link} />
          </div>
        </div>
        <div className={styles.ps__backbtn}>
          <SettingsBackButton title="Manage Intro Rules" />
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu 
              isTeamLead={isTeamLead} 
              isAdmin={isAdmin} 
              activeItem="manage intro rules" 
              userInfo={userInfo} 
            />
          </aside>
          <div className={styles.ps__main__content}>
            <ManageIntroRules data={data as IntroRuleData} userInfo={userInfo} />
          </div>
        </div>
      </div>
    </>
  );
}

export const metadata: Metadata = {
  title: 'Manage Intro Rules | Protocol Labs Directory',
  description: 'Manage introduction rules and settings for the Protocol Labs Directory.',
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
