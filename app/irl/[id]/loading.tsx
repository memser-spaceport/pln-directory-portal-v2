import styles from './loading.module.css';

const Loading = () => {
  return (
    <section className={styles.irlDetail}>
      <div className={styles.irlDetailMn}>
        <div className={styles.irlDetailMn__bc}></div>
        <div className={styles.irlDetailMn__banner}>
          <div className={styles.irlDetailMn__banner__img}></div>
          <div className={styles.irlDetailMn__banner__info}>
            <div className={styles.irlDetailMn__banner__info__hdr}>
              <div className={styles.irlDetailMn__banner__info__hdr__ttl}></div>
              <div className={styles.irlDetailMn__banner__info__hdr__tags}>
                <div className={styles.irlDetailMn__banner__info__hdr__tags__tag}></div>
                <div className={styles.irlDetailMn__banner__info__hdr__tags__tag}></div>
              </div>
            </div>
            <div className={styles.irlDetailMn__banner__info__desc}>
              <div className={styles.irlDetailMn__banner__info__desc__first}></div>
              <div className={styles.irlDetailMn__banner__info__desc__second}></div>
              <div className={styles.irlDetailMn__banner__info__desc__third}></div>
              {/* <div className={styles.irlDetailMn__banner__info__desc__second}></div> */}
            </div>
          </div>
        </div>
        <div className={styles.irlDetailMn__tb}>
          <div className={styles.irlDetailMn__tb__ttl}></div>
          <div className={styles.irlDetailMn__tb__btnWrpr}>
            <div className={styles.irlDetailMn__tb__btn}></div>
          </div>
          <div className={styles.irlDetailMn__tb__search}></div>
        </div>
        <div className={styles.irlDetailMn__table}>
          <div className={styles.irlDetailMn__table__hdr}>
            {Array.from({ length: 4 })?.map((container, index) => (
              <div key={`irl-detail-column-loading-${index}`} className={styles.irlDetailMn__table__hdr__ttlWrpr}>
                <div className={styles.irlDetailMn__table__hdr__ttl}></div>
              </div>
            ))}
          </div>
          <div className={styles.irlDetailMn__table__body}>
            {Array.from({ length: 20 })?.map((container, index) => (
              <div key={`irl-detail-column-loading-${index}`} className={styles.irlDetailMn__table__body__row}>
                <div className={styles.irlDetailMn__table__body__row__first}>
                  <div className={styles.irlDetailMn__table__body__row__first__img}></div>
                  <div className={styles.irlDetailMn__table__body__row__first__txt}></div>
                </div>
                <div className={styles.irlDetailMn__table__body__row__second}>
                  <div className={styles.irlDetailMn__table__body__row__second__img}></div>
                  <div className={styles.irlDetailMn__table__body__row__second__txt}></div>
                </div>
                <div className={styles.irlDetailMn__table__body__row__third}>
                  <div className={styles.irlDetailMn__table__body__row__third__tag}></div>
                  <div className={styles.irlDetailMn__table__body__row__third__tag}></div>
                </div>
                <div className={styles.irlDetailMn__table__body__row__fourth}>
                  <div className={styles.irlDetailMn__table__body__row__fourth__txt}></div>
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
