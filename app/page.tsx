import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDiscoverData, getFeaturedData } from '@/services/home.service';
import Error from '@/components/core/error';
import Featured from '@/components/page/home/featured/featured';
import Discover from '@/components/page/home/discover/discover';

export default async function Home() {
  const { featuredData, discoverData, isLoggedIn, isError, userInfo } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.home}>
      <div className={styles.home__cn}>
        {/* Discover section */}
        <div className={styles.home__cn__discover}>
          <Discover discoverData={discoverData} />
        </div>
        {/* Featured section */}
        <div className={styles.home__cn__featured}>
          <Featured featuredData={featuredData} isLoggedIn={isLoggedIn} userInfo={userInfo} />
        </div>
      </div>
    </div>
  );
}

const getPageData = async () => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  let isError = false;
  let featuredData = [] as any;
  let discoverData = [] as any;

  try {
    const [featuredResponse, discoverResponse] = await Promise.all([getFeaturedData(), getDiscoverData()]);

    if (featuredResponse?.error || discoverResponse?.error) {
      isError = true;
      return { isError, isLoggedIn, featuredData, discoverData };
    }
    featuredData = featuredResponse?.data;
    discoverData = discoverResponse?.data;

    return { featuredData, discoverData, isLoggedIn, isError, userInfo };
  } catch {
    isError = true;
    return { isError, isLoggedIn, featuredData, discoverData, userInfo };
  }
};
