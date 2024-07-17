import styles from './loading.module.css';

const Loading = () => {
  return (
    <section className={styles.settings__wrpr}>
      <div className={styles.settings__breadcrumbs}></div>
      <div className={styles.settings}>
        <div className={styles.settings__aside}>
          <div className={styles.settings__aside__pref}>
            <div className={styles.settings__aside__pref__ttl}></div>
            <div className={styles.settings__aside__pref__cn}></div>
            <div className={styles.settings__aside__pref__cn}></div>
          </div>
          <div className={styles.settings__aside__set}>
            <div className={styles.settings__aside__set__ttl}></div>
            <div className={styles.settings__aside__set__cn}></div>
            <div className={styles.settings__aside__set__cn}></div>
          </div>
        </div>
        <div className={styles.settings__main}>
          <div className={styles.settings__main__hdr}>
            {Array.from({ length: 4 }).map((item: any, index: number) => {
              return (
                <div className={styles.settings__main__hdr__item} key={`loading-${index}`}>
                  <div className={styles.settings__main__hdr__item__ttl}></div>
                </div>
              );
            })}
          </div>
          <div className={styles.settings__main__body}>
            <div className={styles.settings__main__body__profile}>
              <div className={styles.settings__main__body__profile__img}></div>
              <div className={styles.settings__main__body__profile__wrpr}>
                <div className={styles.settings__main__body__profile__txt}></div>
                <div className={styles.settings__main__body__profile__input}></div>
              </div>
            </div>
            <div className={styles.settings__main__body__email}>
              <div className={styles.settings__main__body__email__lbl}></div>
              <div className={styles.settings__main__body__email__input}></div>
            </div>
            <div className={styles.settings__main__body__link}>
              <div className={styles.settings__main__body__link__hdr}></div>
              <div className={styles.settings__main__body__link__types}>
                {Array.from({ length: 4 }).map((item: any, index: number) => {
                  return <div className={styles.settings__main__body__link__type} key={`loading-types-${index}`}></div>;
                })}
              </div>
            </div>
            <div className={styles.settings__main__body__email}>
              <div className={styles.settings__main__body__email__lbl}></div>
              <div className={styles.settings__main__body__email__input}></div>
            </div>
            <div className={styles.settings__main__body__email}>
              <div className={styles.settings__main__body__email__lbl}></div>
              <div className={styles.settings__main__body__email__input}></div>
            </div>
            <div className={styles.settings__main__body__email}>
              <div className={styles.settings__main__body__email__lbl}></div>
              <div className={styles.settings__main__body__email__input}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Loading;