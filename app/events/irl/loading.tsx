import styles from './loading.module.css';

export default function Page() {
  return (
    <div className={styles.irlGatherings}>
      {/* Header */}
      <section className={styles.irlGatherings__header}>
        <div className={styles.irlGatherings__header__ttl}></div>
        <div className={styles.irlGatherings__header__desc}>
          <div className={styles.irlGatherings__header__desc__line1}></div>
          <div className={styles.irlGatherings__header__desc__line2}></div>
        </div>
      </section>
      {/* Event locations */}
      <section className={styles.irlGatherings__location}>
        <div className={styles.irlGatherings__location__list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.irlGatherings__location__list__item}>
              <div className={styles.irlGatherings__location__list__item__desc}>
                <div className={styles.irlGatherings__location__list__item__desc__line1}></div>
                <div className={styles.irlGatherings__location__list__item__desc__line2}></div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.irlGatherings__location__list2}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.irlGatherings__location__list__item2}>
              <div className={styles.irlGatherings__location__list__item__desc}>
                <div className={styles.irlGatherings__location__list__item__desc__line1}></div>
                <div className={styles.irlGatherings__location__list__item__desc__line2}></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Events agenda */}
      <section className={styles.irlGatherings__agenda}>
        <div className={styles.irlGatherings__agenda__cn}>
          <div className={styles.irlGatherings__agenda__cn__hdr}>
            <div className={styles.irlGatherings__agenda__cn__hdr__type}></div>
            <div className={styles.irlGatherings__agenda__cn__hdr__dateRange}></div>
          </div>
          <div className={styles.irlGatherings__agenda__cn__table}></div>
        </div>
      </section>
      {/* Events guests */}
      <section className={styles.irlGatherings__guests}>
        <div className={styles.irlGatheings__guests__tb}>
          <div className={styles.irlGatheings__guests__tb__ttl}></div>
          <div className={styles.irlGatheings__guests__tb__btnWrpr}>
            <div className={styles.irlGatheings__guests__tb__btn}></div>
          </div>
          <div className={styles.irlGatheings__guests__tb__search}></div>
        </div>
        <div className={styles.irlGatherings__guests__table}>
          <div className={styles.irlGatherings__guests__table__hdr}>
            {Array.from({ length: 4 })?.map((container, index) => (
              <div key={`irl-detail-column-loading-${index}`} className={styles.irlGatherings__guests__table__hdr__ttlWrpr}>
                <div className={styles.irlGatherings__guests__table__hdr__ttl}></div>
              </div>
            ))}
          </div>
          <div className={styles.irlGatherings__guests__table__body}>
            {Array.from({ length: 20 })?.map((container, index) => (
              <div key={`irl-detail-column-loading-${index}`} className={styles.irlGatherings__guests__table__body__row}>
                <div className={styles.irlGatherings__guests__table__body__row__first}>
                  <div className={styles.irlGatherings__guests__table__body__row__first__img}></div>
                  <div className={styles.irlGatherings__guests__table__body__row__first__txt}></div>
                </div>
                <div className={styles.irlGatherings__guests__table__body__row__second}>
                  <div className={styles.irlGatherings__guests__table__body__row__second__img}></div>
                  <div className={styles.irlGatherings__guests__table__body__row__second__txt}></div>
                </div>
                <div className={styles.irlGatherings__guests__table__body__row__third}>
                  <div className={styles.irlGatherings__guests__table__body__row__third__tag}></div>
                  <div className={styles.irlGatherings__guests__table__body__row__third__tag}></div>
                </div>
                <div className={styles.irlGatherings__guests__table__body__row__fourth}>
                  <div className={styles.irlGatherings__guests__table__body__row__fourth__txt}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
