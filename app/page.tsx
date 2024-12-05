import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDiscoverData, getFeaturedData } from '@/services/home.service';
import Error from '@/components/core/error';
import Featured from '@/components/page/home/featured/featured';
import Discover from '@/components/page/home/discover/discover';
import LandingFocusAreas from '@/components/page/home/focus-area/focus-area-section';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/components/page/team-form-info/focus-area/focus-area';
import HuskyDialog from '@/components/page/home/husky-dialog';
import HuskyDiscover from '@/components/page/home/husky-discover';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import ScrollToTop from '@/components/page/home/featured/scroll-to-top';

export default async function Home() {
  const { featuredData, discoverData, isLoggedIn, isError, userInfo, focusAreas } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return <>
    <div className={styles.home}>
      <div className={styles.home__cn}>
        {/* Focus Area section */} 
        <div className={styles.home__cn__focusarea}>
          <LandingFocusAreas focusAreas={focusAreas} userInfo={userInfo}/>
        </div>
        {/* Discover section */}
        <div className={styles.home__cn__discover}>
          <Discover discoverData={discoverData}  userInfo={userInfo} />
        </div>
        {/* Featured section */}
        <div className={styles.home__cn__featured}>
          <Featured featuredData={featuredData} isLoggedIn={isLoggedIn} userInfo={userInfo}/>
        </div>
        <ScrollToTop pageName='Home' userInfo={userInfo}/>
      </div>
    </div>
    <HuskyDialog isLoggedIn={isLoggedIn}/>
    <HuskyDiscover isLoggedIn={isLoggedIn}/>
    </>
}

const getPageData = async () => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  let isError = false;
  let featuredData = [] as any;
  let discoverData = [] as any;
  let teamFocusAreas: IFocusArea[] = [];
  let projectFocusAreas: IFocusArea[]= [];
  try {
    const [
      teamFocusAreaResponse, projectFocusAreaResponse, featuredResponse, discoverResponse] = await Promise.all([
      getFocusAreas('Team', {}),
      getFocusAreas('Project', {}),
      getFeaturedData(),
      getDiscoverData()
    ]);
    if (teamFocusAreaResponse?.error || projectFocusAreaResponse?.error || featuredResponse?.error || discoverResponse?.error) {
      return {
        isError: true,
        userInfo,
        isLoggedIn,
        focusAreas: {
            teamFocusAreas,
            projectFocusAreas
        },
        discoverData,
        featuredData
      };
    }
    teamFocusAreas  = Array.isArray(teamFocusAreaResponse?.data) ?  teamFocusAreaResponse?.data?.filter((data: any) => !data?.parentUid) : [];
    projectFocusAreas = Array.isArray(projectFocusAreaResponse?.data) ? projectFocusAreaResponse?.data?.filter((data: any) => !data?.parentUid) : [];
    featuredData = featuredResponse?.data;
    discoverData = discoverResponse?.data;
    return {
        isError,
        userInfo,
        isLoggedIn,
        focusAreas: {
            teamFocusAreas ,
            projectFocusAreas
        },
        featuredData,
        discoverData
    }
  } catch (error) {
    console.log(error)
    isError = true;
    return {
      isError,
      userInfo,
      isLoggedIn,
      focusAreas: {
          teamFocusAreas ,
          projectFocusAreas
      },
      featuredData,
      discoverData
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