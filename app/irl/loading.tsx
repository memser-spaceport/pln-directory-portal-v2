import styles from './loading.module.css';

const Loading = () => {
  return (
    <section className={styles.irl}>
      <div className={styles.irl__main}>
        <div className={styles.irl__banner}></div>
        <div className={styles.irl__events}>
          <div className={styles.irl__events__hdr}></div>
          <div className={styles.irl__events__list}>
            {Array.from({ length: 12 })?.map((container, index) => (
              <div key={`irl-loading-${index}`} className={styles.irl__events__list__card}>
                <div className={styles.irl__events__list__card__hdr}></div>
                <div className={styles.irl__events__list__card__body}>
                  <div className={styles.irl__events__list__card__body__ttl}></div>
                  <div className={styles.irl__events__list__card__body__desc}>
                    <p className={styles.irl__events__list__card__body__desc__first}></p>
                    <p className={styles.irl__events__list__card__body__desc__second}></p>
                  </div>
                  <div className={styles.irl__events__list__card__body__location}></div>
                  <div></div>
                </div>
                <div className={styles.irl__events__list__card__ftr}>
                  <div className={styles.irl__events__list__card__ftr__tag}></div>
                  <div className={styles.irl__events__list__card__ftr__tag}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Loading;
