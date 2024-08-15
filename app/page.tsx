import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getFeaturedData } from '@/services/home.service';
import Error from '@/components/core/error';
import Featured from '@/components/page/home/featured/featured';

export default async function Home() {
  const { featuredData, isLoggedIn, isError } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.home}>
      <div className={styles.home__cn}>
        {/* Featured section */}
        <div className={styles.home__cn__featured}>
          <Featured featuredData={featuredData} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </div>
  );
}

const getPageData = async () => {
  const { isLoggedIn } = getCookiesFromHeaders();
  let isError = false;
  let featuredData = [] as any;

  try {
    const featuredResponse = await getFeaturedData();

    if (featuredResponse?.error) {
      isError = true;
      return { isError, isLoggedIn, featuredData };
    }
    featuredData = featuredResponse?.data;
    return { featuredData, isLoggedIn, isError };
  } catch {
    isError = true;
    return { isError, isLoggedIn, featuredData };
  }
};
