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
import { getTeamList } from '@/app/actions/teams.actions';
import { formatFeaturedData } from '@/utils/home.utils';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { Welcome } from '@/components/page/home/Welcome';
import { QuickActions } from '@/components/page/home/QuickActions';
import { TeamNews, AutoMarkNewsNotification, MarkHomeVisited } from '@/components/page/home/TeamNews';
import { getTeamNewsGroupedByFocusArea, getTeamNewsPopular } from '@/services/team-news/team-news.service';
import type { ITeamNewsGroup, ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { MyAccessResponse } from '@/services/access-control/access-control.service';
import {
  resolveQuickActionsState,
  codesFromCookiePolicies,
  codesFromCookiePermissions,
} from '@/components/page/home/QuickActions/utils/resolveQuickActionsState';

export default async function Home() {
  const {
    isLoggedIn,
    isError,
    userInfo,
    focusAreas,
    teamNewsGroups,
    teamNewsAllTabExtraItems,
    teamNewsForYouTeamUids,
    popularItems,
    initialDigestSettings,
    quickActionsState,
    quickActionsOhResolved,
    teamsCount,
  } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <>
      <div className={styles.home}>
        <div className={styles.home__cn}>
          {!isLoggedIn && (
            <div className={styles.home__cn__welcome}>
              <Welcome teamCount={teamsCount} />
            </div>
          )}
          {isLoggedIn && <QuickActions initial={quickActionsState} ohResolved={quickActionsOhResolved} />}
          <div className={styles.home__cn__teamnews}>
            <TeamNews
              groups={teamNewsGroups}
              allTabExtraItems={teamNewsAllTabExtraItems}
              forYouTeamUids={teamNewsForYouTeamUids}
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
      <MarkHomeVisited />
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
  let teamNewsAllTabExtraItems: ITeamNewsItem[] = [];
  let teamNewsForYouTeamUids: string[] = [];
  let popularItems: ITeamNewsPopularItem[] = [];
  let initialDigestSettings: ForumDigestSettings | null = null;

  let teamsCount = 0;

  // Quick Actions is resolved server-side so its card set is final on first
  // paint — deriving it client-side made the band render 2 cards, collapse to
  // nothing, then settle on 2-4 as the user store and /me/access arrived.
  // The cookie alone already fixes the group and Deals card; /me/access below
  // upgrades it with the Office Hours permissions, which the cookie does not
  // carry reliably (it skips the backend's alias expansion).
  let quickActionsState = isLoggedIn
    ? resolveQuickActionsState(codesFromCookiePolicies(userInfo?.rbac), codesFromCookiePermissions(userInfo?.rbac))
    : null;
  let quickActionsOhResolved = false;

  // Passed to QuickActions as a prop, never seeded into the React Query cache:
  // QueryProvider's client is a module-scope singleton shared across SSR
  // requests, so writing per-user access into it would leak between users.
  const myAccessPromise: Promise<MyAccessResponse | null> =
    isLoggedIn && authToken
      ? fetch(`${process.env.DIRECTORY_API_URL}/v2/access-control-v2/me/access`, {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

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

  const teamsCountPromise = isLoggedIn ? Promise.resolve(null) : getTeamList('', 1, 1).catch(() => null);

  try {
    const [
      teamFocusAreaResponse,
      projectFocusAreaResponse,
      featuredResponse,
      discoverResponse,
      teamNewsResponse,
      popularResponse,
      digestSettingsResponse,
      myAccessResponse,
      teamsCountResponse,
    ] = await Promise.all([
      getFocusAreas('Team', {}),
      getFocusAreas('Project', {}),
      getFeaturedData(authToken, isLoggedIn, isAdminUser(userInfo)),
      getDiscoverData(),
      getTeamNewsGroupedByFocusArea({}, authToken),
      getTeamNewsPopular(undefined, authToken),
      digestSettingsPromise,
      myAccessPromise,
      teamsCountPromise,
    ]);

    teamNewsGroups = teamNewsResponse?.groups ?? [];
    teamNewsAllTabExtraItems = teamNewsResponse?.allTabExtraItems ?? [];
    teamNewsForYouTeamUids = teamNewsResponse?.forYouTeamUids ?? [];
    popularItems = popularResponse?.items ?? [];
    initialDigestSettings = digestSettingsResponse;
    teamsCount = teamsCountResponse?.totalItems ?? 0;

    if (isLoggedIn && myAccessResponse) {
      quickActionsState = resolveQuickActionsState(
        myAccessResponse.policies.map((policy) => policy.code),
        // Union, not replacement: the two permission sets diverge both ways —
        // /me/access expands legacy aliases but drops role-derived permissions,
        // while the cookie carries role-derived ones unexpanded. Merging can
        // only add cards, so nobody loses one they can see today.
        [...myAccessResponse.effectivePermissions, ...codesFromCookiePermissions(userInfo?.rbac)],
      );
      quickActionsOhResolved = true;
    }
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
        teamNewsAllTabExtraItems,
        teamNewsForYouTeamUids,
        popularItems,
        initialDigestSettings,
        quickActionsState,
        quickActionsOhResolved,
        teamsCount,
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
      teamNewsAllTabExtraItems,
      teamNewsForYouTeamUids,
      popularItems,
      initialDigestSettings,
      quickActionsState,
      quickActionsOhResolved,
      teamsCount,
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
      teamNewsAllTabExtraItems,
      teamNewsForYouTeamUids,
      popularItems,
      initialDigestSettings,
      quickActionsState,
      quickActionsOhResolved,
      teamsCount,
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
