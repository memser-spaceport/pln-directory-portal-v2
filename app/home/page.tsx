import React from 'react';
import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDiscoverData } from '@/services/discovery.service';
import Error from '@/components/core/error';
// import Discover from '@/components/page/home/discover/discover';
import { FocusAreaSection } from '@/components/page/home/FocusAreaSection';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/components/page/team-form-info/focus-area/focus-area';
import HuskyDialog from '@/components/page/home/husky-dialog';
import HuskyDiscover from '@/components/page/home/husky-discover';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import ScrollToTop from '@/components/page/home/featured/scroll-to-top';
import { getFeaturedData } from '@/services/featured.service';
import { formatFeaturedData } from '@/utils/home.utils';
import { RecentUpdatesSection } from '@/components/page/home/recent-updates';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { Welcome } from '@/components/page/home/Welcome';
import { TeamNews } from '@/components/page/home/TeamNews';
import { getTeamNewsGroupedByFocusArea } from '@/services/team-news/team-news.service';
import type { ITeamNewsGroup } from '@/types/team-news.types';

const TEAM_NEWS_READ_PERMISSION = 'team.news.read';

export default async function Home() {
  const { isLoggedIn, isError, userInfo, focusAreas, teamNewsGroups, hasTeamNewsAccess } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <>
      <div className={styles.home}>
        <div className={styles.home__cn}>
          {!isLoggedIn && (
            <div className={styles.home__cn__welcome}>
              <Welcome />
            </div>
          )}
          {hasTeamNewsAccess && (
            <div className={styles.home__cn__teamnews}>
              <TeamNews groups={teamNewsGroups} />
            </div>
          )}
          <div className={styles.home__cn__focusarea}>
            <FocusAreaSection focusAreas={focusAreas} userInfo={userInfo} />
          </div>
          <div className={styles.home__cn__recentupdates}>
            <RecentUpdatesSection />
          </div>
          <ScrollToTop pageName="Home" userInfo={userInfo} />
        </div>
      </div>
      <HuskyDialog isLoggedIn={isLoggedIn} />
      <HuskyDiscover isLoggedIn={isLoggedIn} />
    </>
  );
}

const getPageData = async () => {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  let isError = false;
  let featuredData = [] as any;
  let discoverData = [] as any;
  let teamFocusAreas: IFocusArea[] = [];
  let projectFocusAreas: IFocusArea[] = [];
  let teamNewsGroups: ITeamNewsGroup[] = [];
  const hasTeamNewsAccess = Boolean(
    userInfo?.rbac?.effectivePermissions?.some(
      (permission: { code: string }) => permission.code === TEAM_NEWS_READ_PERMISSION,
    ),
  );

  try {
    const [teamFocusAreaResponse, projectFocusAreaResponse, featuredResponse, discoverResponse, teamNewsResponse] =
      await Promise.all([
        getFocusAreas('Team', {}),
        getFocusAreas('Project', {}),
        getFeaturedData(authToken, isLoggedIn, isAdminUser(userInfo)),
        getDiscoverData(),
        hasTeamNewsAccess ? getTeamNewsGroupedByFocusArea() : Promise.resolve(null),
      ]);
    teamNewsGroups = hasTeamNewsAccess ? teamNewsResponse?.groups ?? [] : [];
    if (
      teamFocusAreaResponse?.error ||
      projectFocusAreaResponse?.error ||
      featuredResponse?.error ||
      discoverResponse?.error
    ) {
      return {
        isError: true,
        userInfo,
        isLoggedIn,
        focusAreas: {
          teamFocusAreas,
          projectFocusAreas,
        },
        discoverData,
        featuredData,
        teamNewsGroups,
        hasTeamNewsAccess,
      };
    }
    teamFocusAreas = Array.isArray(teamFocusAreaResponse?.data)
      ? teamFocusAreaResponse?.data?.filter((data: any) => !data?.parentUid)
      : [];
    projectFocusAreas = Array.isArray(projectFocusAreaResponse?.data)
      ? projectFocusAreaResponse?.data?.filter((data: any) => !data?.parentUid)
      : [];
    featuredData = formatFeaturedData(featuredResponse?.data);
    discoverData = discoverResponse?.data;
    return {
      isError,
      userInfo,
      isLoggedIn,
      focusAreas: {
        teamFocusAreas,
        projectFocusAreas,
      },
      featuredData,
      discoverData,
      teamNewsGroups,
      hasTeamNewsAccess,
    };
  } catch (error) {
    console.error(error);
    isError = true;
    return {
      isError,
      userInfo,
      isLoggedIn,
      focusAreas: {
        teamFocusAreas,
        projectFocusAreas,
      },
      featuredData,
      discoverData,
      teamNewsGroups,
      hasTeamNewsAccess,
    };
  }
};

export const metadata: Metadata = {
  title: 'Home | Protocol Labs Directory',
  description: 'The Protocol Labs Directory drives breakthroughs in computing to push humanity forward.',
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
