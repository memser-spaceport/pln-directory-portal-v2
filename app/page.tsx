import styles from './page.module.css';
import FeaturedWrapper from '@/components/page/home/featured/featured-section-wrapper';
import FeaturedSection from '@/components/page/home/featured/featured-section';

export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.home__cn}>
        <FeaturedWrapper>
          <FeaturedSection/>
        </FeaturedWrapper>
      </div>
    </div>
  );
}
