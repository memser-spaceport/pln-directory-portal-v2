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
import { PAGE_ROUTES } from '@/utils/constants';
import { getApplicationBaseUrl, listingPageMetadata } from '@/utils/seo';
import ScrollToTop from '@/components/page/home/featured/scroll-to-top';
import { getFeaturedData } from '@/services/featured.service';
import { getTeamList } from '@/app/actions/teams.actions';
import { formatFeaturedData } from '@/utils/home.utils';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { Welcome } from '@/components/page/home/Welcome';
import { HomeIntro, HomeAbout } from '@/components/page/home/HomeIntro';
import { buildHomeJsonLd } from '@/utils/home-json-ld';
import { serializeJsonLd } from '@/utils/json-ld';
import { DigestEmailHomeLinkCapture } from '@/components/page/home/DigestEmailHomeLinkCapture';
import { QuickActions } from '@/components/page/home/QuickActions';
import { TeamNews, AutoMarkNewsNotification, MarkHomeVisited } from '@/components/page/home/TeamNews';
import { resolveForYouMatch, type ForYouMatch } from '@/components/page/home/TeamNews/utils/resolveForYouMatch';
import {
  getTeamNewsGroupedByFocusArea,
  getTeamNewsItemByUid,
  getTeamNewsPopular,
} from '@/services/team-news/team-news.service';
import { getNewsPreviewSnippet } from '@/services/team-news/newsPreviewSnippet';
import type { ITeamNewsGroup, ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { MyAccessResponse } from '@/services/access-control/access-control.service';
import {
  resolveQuickActionsState,
  codesFromCookiePolicies,
  codesFromCookiePermissions,
} from '@/components/page/home/QuickActions/utils/resolveQuickActionsState';
import { SHOW_HOME_V2 } from '@/utils/home-v2';
import { NewsPage, SignedInHome, SignedOutHome } from '@/components/page/home/HomeV2';
import { pickThisWeek } from '@/components/page/home/HomeV2/utils/pickThisWeek';
import { flattenNewestRoles, HOME_ROLES_MAX } from '@/components/page/home/HomeV2/utils/flattenNewestRoles';
import {
  HOME_EVENTS_DAYS,
  HOME_EVENTS_LIMIT,
  selectUpcomingEvents,
} from '@/components/page/home/HomeV2/utils/upcomingEvents';
import { getJobsList } from '@/app/actions/jobs.actions';
import { getUpcomingEvents } from '@/services/events/events.service';
import { getPortfolioTeams } from '@/services/explore-pl-network/portfolio.service';
import { getProjectFocusAreaCounts } from '@/services/focus-areas/project-focus-area-counts.service';
import { getTeamFocusAreaCounts } from '@/services/focus-areas/team-focus-area-counts.service';
import { FOCUS_AREA_DIRECTORY_TITLE } from '@/components/page/home/HomeV2/utils/focusAreaCards';
import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import type { IHomeEvents, IHomeRoles } from '@/types/home.types';

type HomeProps = {
  searchParams: Promise<{ news?: string; view?: string }>;
};

/** `?view=news`: the new Home's news page (LAB-3126). Ignored while the flag is off. */
const NEWS_VIEW = 'news';
/** The focus-area cards' directory titles, whose team totals the cards show (LAB-3162). */
const FOCUS_AREA_TITLES = Object.values(FOCUS_AREA_DIRECTORY_TITLE);

export default async function Home(props: HomeProps) {
  const { news, view } = await props.searchParams;

  // The new Home (LAB-3070): signed out, the story page (LAB-3072); signed in, the member page (LAB-3125); either way,
  // `?view=news` is the news page (LAB-3126).
  if (SHOW_HOME_V2) {
    const { isLoggedIn } = await getCookiesFromHeaders();
    if (view === NEWS_VIEW) return renderNewsPage(Boolean(isLoggedIn), news);
    return isLoggedIn ? renderSignedInHome(news) : renderSignedOutHome(news);
  }

  const {
    isLoggedIn,
    isError,
    userInfo,
    focusAreas,
    teamNewsGroups,
    teamNewsAllTabExtraItems,
    teamNewsForYouMatch,
    popularItems,
    initialDigestSettings,
    quickActionsState,
    quickActionsOhResolved,
    teamsCount,
    deepLinkedNewsItem,
  } = await getPageData(news);

  if (isError) {
    return <Error />;
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD from serializeJsonLd, which escapes it for a script tag
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildHomeJsonLd()) }}
      />
      <div className={styles.home}>
        <div className={styles.home__cn}>
          <HomeIntro />
          {!isLoggedIn && (
            <div className={styles.home__cn__welcome}>
              <Welcome teamCount={teamsCount} />
            </div>
          )}
          {isLoggedIn && <QuickActions initial={quickActionsState} ohResolved={quickActionsOhResolved} />}
          <div className={styles.home__cn__teamnews}>
            <DigestEmailHomeLinkCapture />
            <TeamNews
              groups={teamNewsGroups}
              allTabExtraItems={teamNewsAllTabExtraItems}
              forYouTeamUids={teamNewsForYouMatch.teamUids}
              forYouTags={teamNewsForYouMatch.tags}
              popularItems={popularItems}
              initialDigestSettings={initialDigestSettings}
              deepLinkedItem={deepLinkedNewsItem}
            />
          </div>
          <div className={styles.home__cn__focusarea}>
            <FocusAreaSection focusAreas={focusAreas} userInfo={userInfo} />
          </div>
          {!isLoggedIn && <HomeAbout />}
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

/** The signed-out story page: the mission is its only `<h1>`, so neither HomeIntro nor HomeAbout renders here. */
async function renderSignedOutHome(news?: string) {
  const data = await getSignedOutPageData(news);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD from serializeJsonLd, which escapes it for a script tag
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildHomeJsonLd()) }}
      />
      <DigestEmailHomeLinkCapture />
      <SignedOutHome {...data} />
      <HuskyDialog isLoggedIn={false} />
      <HuskyDiscover isLoggedIn={false} />
      <MarkHomeVisited />
    </>
  );
}

/**
 * The signed-in member page: Network Updates beside the rail, then the focus areas. No Quick Actions. The `<h1>` is
 * HomeIntro's visually hidden one, as on the previous Home: this page draws no title of its own.
 */
async function renderSignedInHome(news?: string) {
  const { userInfo, ...data } = await getSignedInPageData(news);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD from serializeJsonLd, which escapes it for a script tag
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildHomeJsonLd()) }}
      />
      <HomeIntro />
      <DigestEmailHomeLinkCapture />
      <SignedInHome {...data} />
      <ScrollToTop pageName="Home" userInfo={userInfo} />
      <HuskyDialog isLoggedIn />
      <HuskyDiscover isLoggedIn />
      <AutoMarkNewsNotification />
      <MarkHomeVisited />
    </>
  );
}

/**
 * The news page, signed in or out: the network's news only, in a grid. Its `<h1>` is "Network news", so HomeIntro's
 * hidden one is left out. No Home JSON-LD: this is a view of /home, not the home page itself.
 */
async function renderNewsPage(isLoggedIn: boolean, news?: string) {
  const { feed, unavailable } = await getNewsPageData(news);

  return (
    <>
      <NewsPage feed={feed} signedIn={isLoggedIn} unavailable={unavailable} />
      {isLoggedIn && <AutoMarkNewsNotification />}
      <MarkHomeVisited />
    </>
  );
}

const settled = <T,>(result: PromiseSettledResult<T>): T | null =>
  result.status === 'fulfilled' ? result.value : null;

async function getNewestRoles(): Promise<IHomeRoles | null> {
  // The board's public list, called as `/api/jobs/list` calls it; no token, as it is the same list for everyone.
  const result = await getJobsList('sort=newest');
  if ('isError' in result) return null;
  return { roles: flattenNewestRoles(result.data.groups ?? [], HOME_ROLES_MAX), total: result.data.totalRoles ?? 0 };
}

async function getRailEvents(): Promise<IHomeEvents> {
  const { events, total } = await getUpcomingEvents({ days: HOME_EVENTS_DAYS, limit: HOME_EVENTS_LIMIT });
  return { events: selectUpcomingEvents(events, Date.now()), total };
}

/**
 * The signed-out story page's data, and only what it shows (no featured, discover or focus-area calls), in parallel.
 * Each source fails on its own: no news leaves This week empty, a failed roles or events call leaves that section out,
 * and a failed portfolio call draws the map from the fallback file. Nothing here sends the page to `<Error/>`.
 */
const getSignedOutPageData = async (deepLinkedNewsUid?: string) => {
  const [
    newsResult,
    rolesResult,
    eventsResult,
    portfolioResult,
    deepLinkedResult,
    projectCountsResult,
    teamCountsResult,
  ] = await Promise.allSettled([
    getTeamNewsGroupedByFocusArea({}),
    getNewestRoles(),
    getRailEvents(),
    getPortfolioTeams(),
    deepLinkedNewsUid ? getTeamNewsItemByUid(deepLinkedNewsUid) : Promise.resolve(null),
    getProjectFocusAreaCounts(),
    getTeamFocusAreaCounts(FOCUS_AREA_TITLES),
  ]);

  const newsResponse = settled(newsResult);
  const newsItems = newsResponse
    ? [...(newsResponse.groups ?? []).flatMap((group) => group.items), ...(newsResponse.allTabExtraItems ?? [])]
    : [];

  return {
    stories: pickThisWeek(newsItems),
    // As the news page counts its stories (unique uids across the groups and the All tab's extras).
    newsCount: new Set(newsItems.map((item) => item.uid)).size,
    deepLinkedItem: settled(deepLinkedResult),
    roles: settled(rolesResult),
    events: settled(eventsResult),
    portfolio: mergePortfolio(PORTFOLIO_FALLBACK, settled(portfolioResult) ?? []),
    projectFocusAreaCounts: settled(projectCountsResult),
    teamFocusAreaCounts: settled(teamCountsResult),
  };
};

/**
 * The signed-in member page's data, in parallel: the feed's own server fetches as on the previous Home (the grouped
 * news, For You's match, Popular this week, the deep-linked story, the digest settings), plus the rail's roles and
 * events and the portfolio for the focus areas, as signed out. No Quick Actions, so no `/me/access` call, and no
 * featured, discover or focus-area calls. Each source fails on its own: no news leaves the stream empty, a failed
 * roles or events call leaves that section out, and a failed portfolio call uses the fallback file.
 */
const getSignedInPageData = async (deepLinkedNewsUid?: string) => {
  const { userInfo, authToken } = await getCookiesFromHeaders();

  // Seeded server-side, as on the previous Home, so the digest settings are right on first paint.
  const digestSettingsPromise: Promise<ForumDigestSettings | null> = userInfo?.uid
    ? fetch(`${process.env.DIRECTORY_API_URL}/v1/notification/settings/${userInfo.uid}/forum`, {
        headers: { contentType: 'application/json', Authorization: `Bearer ${authToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    : Promise.resolve(null);

  const [
    newsResult,
    popularResult,
    digestResult,
    deepLinkedResult,
    rolesResult,
    eventsResult,
    portfolioResult,
    projectCountsResult,
    teamCountsResult,
  ] = await Promise.allSettled([
    getTeamNewsGroupedByFocusArea({}, authToken),
    getTeamNewsPopular(undefined, authToken),
    digestSettingsPromise,
    deepLinkedNewsUid ? getTeamNewsItemByUid(deepLinkedNewsUid) : Promise.resolve(null),
    getNewestRoles(),
    getRailEvents(),
    getPortfolioTeams(),
    getProjectFocusAreaCounts(),
    getTeamFocusAreaCounts(FOCUS_AREA_TITLES),
  ]);

  const newsResponse = settled(newsResult);
  const forYouMatch = resolveForYouMatch(newsResponse, SHOW_NEWS_PREFERENCES);

  return {
    userInfo,
    feed: {
      groups: newsResponse?.groups ?? [],
      allTabExtraItems: newsResponse?.allTabExtraItems ?? [],
      forYouTeamUids: forYouMatch.teamUids,
      forYouTags: forYouMatch.tags,
      popularItems: settled(popularResult)?.items ?? [],
      initialDigestSettings: settled(digestResult),
      deepLinkedItem: settled(deepLinkedResult),
    },
    roles: settled(rolesResult),
    events: settled(eventsResult),
    portfolio: mergePortfolio(PORTFOLIO_FALLBACK, settled(portfolioResult) ?? []),
    projectFocusAreaCounts: settled(projectCountsResult),
    teamFocusAreaCounts: settled(teamCountsResult),
  };
};

/**
 * The news page's data: the Home feed's 14-day grouped news (the same source the stream reads), For You's match for a
 * member, and a deep-linked story. A failed news call gives an empty page that says news is unavailable, never
 * `<Error/>`.
 */
const getNewsPageData = async (deepLinkedNewsUid?: string) => {
  const { authToken } = await getCookiesFromHeaders();
  const [newsResult, deepLinkedResult] = await Promise.allSettled([
    getTeamNewsGroupedByFocusArea({}, authToken),
    deepLinkedNewsUid ? getTeamNewsItemByUid(deepLinkedNewsUid) : Promise.resolve(null),
  ]);
  const newsResponse = settled(newsResult);
  const forYouMatch = resolveForYouMatch(newsResponse, SHOW_NEWS_PREFERENCES);

  return {
    unavailable: newsResponse === null,
    feed: {
      groups: newsResponse?.groups ?? [],
      allTabExtraItems: newsResponse?.allTabExtraItems ?? [],
      forYouTeamUids: forYouMatch.teamUids,
      forYouTags: forYouMatch.tags,
      deepLinkedItem: settled(deepLinkedResult),
    },
  };
};

const getPageData = async (deepLinkedNewsUid?: string) => {
  const { isLoggedIn, userInfo, authToken } = await getCookiesFromHeaders();
  let isError = false;
  let featuredData = [] as any;
  let discoverData = [] as any;
  let teamFocusAreas: IFocusArea[] = [];
  let projectFocusAreas: IFocusArea[] = [];
  let teamNewsGroups: ITeamNewsGroup[] = [];
  let teamNewsAllTabExtraItems: ITeamNewsItem[] = [];
  let teamNewsForYouMatch: ForYouMatch = { teamUids: [] };
  let popularItems: ITeamNewsPopularItem[] = [];
  let initialDigestSettings: ForumDigestSettings | null = null;
  let deepLinkedNewsItem: ITeamNewsItem | null = null;

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

  // The feed only reaches back TEAM_NEWS_DEFAULT_WINDOW_DAYS and drops teams with
  // no focus area, so a shared ?news= link can name a story `groups` will never
  // contain. Resolved here by uid and handed to TeamNews as a lookup-only
  // fallback, so the modal opens instead of the param being stripped.
  const deepLinkedNewsPromise: Promise<ITeamNewsItem | null> = deepLinkedNewsUid
    ? getTeamNewsItemByUid(deepLinkedNewsUid)
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
      deepLinkedNewsResponse,
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
      deepLinkedNewsPromise,
    ]);

    teamNewsGroups = teamNewsResponse?.groups ?? [];
    teamNewsAllTabExtraItems = teamNewsResponse?.allTabExtraItems ?? [];
    teamNewsForYouMatch = resolveForYouMatch(teamNewsResponse, SHOW_NEWS_PREFERENCES);
    popularItems = popularResponse?.items ?? [];
    initialDigestSettings = digestSettingsResponse;
    teamsCount = teamsCountResponse?.totalItems ?? 0;
    deepLinkedNewsItem = deepLinkedNewsResponse;

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
        teamNewsForYouMatch,
        popularItems,
        initialDigestSettings,
        deepLinkedNewsItem,
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
      teamNewsForYouMatch,
      popularItems,
      initialDigestSettings,
      deepLinkedNewsItem,
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
      teamNewsForYouMatch,
      popularItems,
      initialDigestSettings,
      deepLinkedNewsItem,
      quickActionsState,
      quickActionsOhResolved,
      teamsCount,
    };
  }
};

// Names the searches the site should be found for (LAB-2923): "Protocol Labs" and "innovation network".
const HOME_METADATA: Metadata = listingPageMetadata({
  title: 'Protocol Labs Directory: the innovation network',
  description:
    'The Protocol Labs innovation network: the teams, members, projects, events and open roles driving breakthroughs in computing to push humanity forward.',
  path: PAGE_ROUTES.HOME,
});

/** A news permalink (`/home?news=<uid>`) previews as that article rather than
 *  as the directory, so sharing one reads like sharing an HN item.
 *
 *  An unresolvable uid — malformed, or past the lookup's page bound — falls
 *  back to the site card, which is what every non-news visit to /home gets
 *  anyway. */
export async function generateMetadata(props: HomeProps): Promise<Metadata> {
  const { news, view } = await props.searchParams;

  if (!news) {
    // The news page names itself in the tab; its canonical stays /home, as it is a view of the same feed.
    return SHOW_HOME_V2 && view === NEWS_VIEW
      ? { ...HOME_METADATA, title: 'Network news | Protocol Labs Directory' }
      : HOME_METADATA;
  }

  const item = await getTeamNewsItemByUid(news);

  if (!item) {
    return HOME_METADATA;
  }

  const baseUrl = getApplicationBaseUrl();
  const pageUrl = `${baseUrl}/home?news=${encodeURIComponent(item.uid)}`;
  const imageUrl = `${baseUrl}/api/og/team-news/${encodeURIComponent(item.uid)}`;
  const description = getNewsPreviewSnippet(item);

  return {
    title: `${item.title} | Protocol Labs Directory`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'article',
      url: pageUrl,
      siteName: 'Protocol Labs Directory',
      title: item.title,
      description,
      publishedTime: item.eventDate,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: item.title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description,
      images: [imageUrl],
    },
  };
}
