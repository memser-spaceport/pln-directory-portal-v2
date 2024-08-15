import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.home}>
      <div className={styles.home__cn}>
        {/* Featured section */}
        <div className={styles.home__cn__featured}>
          <div className={styles.featured}>
            <div className={styles.featured__hdr}>
              <div className={styles.featured__ttl}></div>
              <div className={styles.featured__hdr__desc}></div>
            </div>
            <div className={styles.featuredList}>
              {Array.from({ length: 10 })?.map((_, index) => (
                <div key={`featured-loading-${index}`} className={styles.featuredList__card}>
                  <div className={styles.featuredList__card__profilec}></div>
                  <div className={styles.featuredList__card__details}>
                    <h2 className={styles.featuredList__card__detail__name}> </h2>
                    <div className={styles.featuredList__card__details__desc}>
                      <div className={styles.featuredList__card__details__desc__firstLine}> </div>
                      <div className={styles.featuredList__card__details__desc__secondLine}> </div>
                      <div className={styles.featuredList__card__details__desc__thirdLine}> </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
