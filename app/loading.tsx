import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.home}>
      <div className={styles.home__cn}>
        {/* Discover section */}
        <div className={styles.home__cn__discover}>
          <div className={styles.discover}>
            <div className={styles.featured__hdr}>
              <div className={styles.featured__ttl}></div>
              <div className={styles.featured__hdr__desc}></div>
            </div>
            <div className={styles.discoverList__mob}>
              {Array.from({ length: 3 })?.map((_, index) => (
                <div key={index} className={styles.discoverList__card__mob}>
                  <div className={styles.discover__card__ques_line1}></div>
                  <div className={styles.discover__card__ques_line2}></div>
                </div>
              ))}
            </div>
            <div className={styles.discoverList__desc}>
              {Array.from({ length: 6 })?.map((_, index) => (
                <div key={index} className={styles.discoverList__card__desc}>
                  <div className={styles.discover__card__ques_line1}></div>
                  <div className={styles.discover__card__ques_line2}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
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