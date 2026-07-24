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
import { isAdminUser } from '@/utils/user/isAdminUser';
import { Welcome } from '@/components/page/home/Welcome';
import { QuickActions } from '@/components/page/home/QuickActions';
import { TeamNews, AutoMarkNewsNotification } from '@/components/page/home/TeamNews';
import { getTeamNewsGroupedByFocusArea, getTeamNewsPopular } from '@/services/team-news/team-news.service';
import type { ITeamNewsGroup, ITeamNewsPopularItem } from '@/types/team-news.types';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';

export default async function Home() {
  const { isLoggedIn, isError, userInfo, focusAreas, teamNewsGroups, popularItems, initialDigestSettings } =
    await getPageData();

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
          {isLoggedIn && <QuickActions />}
          <div className={styles.home__cn__teamnews}>
            <TeamNews
              groups={teamNewsGroups}
              popularItems={popularItems}
              initialDigestSettings={initialDigestSettings}
            />
          </div>
          <div className={styles.home__cn__focusarea}>
            <FocusAreaSection focusAreas={focusAreas} userInfo={userInfo} />
          </div>
          <ScrollToTop pageName="Home" userInfo={userInfo} />
        </div>
      </div>
      <HuskyDialog isLoggedIn={isLoggedIn} />
      <HuskyDiscover isLoggedIn={isLoggedIn} />
      <AutoMarkNewsNotification />
    </>
  );
}

const getPageData = async () => {
  const { isLoggedIn, userInfo, authToken } = await getCookiesFromHeaders();
  let isError = false;
  let featuredData = [] as any;
  let discoverData = [] as any;
  let teamFocusAreas: IFocusArea[] = [];
  let projectFocusAreas: IFocusArea[] = [];
  let teamNewsGroups: ITeamNewsGroup[] = [];
  let popularItems: ITeamNewsPopularItem[] = [];
  let initialDigestSettings: ForumDigestSettings | null = null;

  // Seeded server-side (like Settings > Email does) so NewsRail's digest card
  // shows the correct subscribed/not-subscribed state on first paint, instead
  // of flashing "not subscribed" while the client-side query resolves.
  const digestSettingsPromise: Promise<ForumDigestSettings | null> =
    isLoggedIn && userInfo?.uid
      ? fetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${userInfo.uid}/forum`, {
          headers: { contentType: 'application/json', Authorization: `Bearer ${authToken}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

  try {
    const [
      teamFocusAreaResponse,
      projectFocusAreaResponse,
      featuredResponse,
      discoverResponse,
      teamNewsResponse,
      popularResponse,
      digestSettingsResponse,
    ] = await Promise.all([
      getFocusAreas('Team', {}),
      getFocusAreas('Project', {}),
      getFeaturedData(authToken, isLoggedIn, isAdminUser(userInfo)),
      getDiscoverData(),
      getTeamNewsGroupedByFocusArea({}, authToken),
      getTeamNewsPopular(undefined, authToken),
      digestSettingsPromise,
    ]);

    teamNewsGroups = teamNewsResponse?.groups ?? [];
    popularItems = popularResponse?.items ?? [];
    initialDigestSettings = digestSettingsResponse;
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
        popularItems,
        initialDigestSettings,
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
      popularItems,
      initialDigestSettings,
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
      popularItems,
      initialDigestSettings,
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
