import styles from './loading.module.css';
const Loading = () => {
  return (
    <div className={styles?.mbrLoading}>
      <div className={styles?.mbrLoading__breadcrumb}></div>
      <div className={styles?.mbrLoading__container}>
        <div className={styles?.mbrLoading__container__header}>
          <div className={styles?.mbrLoading__container__header__profile}>
            <div className={styles?.mbrLoading__container__header__profile__logo}></div>
          </div>
          <div className={styles?.mbrLoading__container__header__details}>
            <div className={styles?.mbrLoading__container__header__details__specifis__nameAndRole}>
              <div className={styles?.mbrLoading__container__header__detais__specifis__name}></div>
              <div className={styles?.mbrLoading__container__header__details__specifis__nameAndRole__roles}>
                {Array.from({ length: 3 }).map((header, index) => (
                  <div key={`member-loading-${index}`} className={styles?.mbrLoading__container__header__details__specifis__nameAndRole__roles__role}></div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles?.mbrLoading__container__header__tags}>
            {Array?.from({ length: 4 })?.map((tags, index) => (
              <div key={`member-tags-loading-${index}`} className={styles?.mbrLoading__container__header__tags__tag}></div>
            ))}
          </div>
        </div>

        <div className={styles?.mbrLoading__container__contact}>
          <div className={styles?.mbrLoading__container__contact__title}></div>
          <div className={styles?.mbrLoading__container__contacts}>
            <div className={styles?.mbrLoading__container__contact__contacts__socialscnt}>
              {Array.from({ length: 6 })?.map((socialLinks, index) => (
                <div key={`member-laoding-socialLinks-${index}`} className={styles?.mbrLoading__container__contact__container__socialcnt__social}>
                </div>
              ))}
            </div>
            <div className={styles?.mbrLoading__container__contacts__ohours}>
              <div className={styles?.mbrLoading__container__contacts__ohours__left}>
                <div className={styles?.mbrLoading__container__contacts__ohour__left__cldr}></div>
                <div className={styles?.mbrLoading__container__contacts__ohours__left__title}></div>
              </div>
              <div className={styles?.mbrLoading__container__contacts__ohour__right}>
                <div className={styles?.mbrLoading__container__contacts__ohour__right__learnMore}></div>
                <div className={styles?.mbrLoading__container__contacts__ohour__right__scmeeting}></div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles?.mbrLoading__container__teams}>
          <div className={styles?.mbrLoading__container__teams__title}>
            <div className={styles?.mbrLoading__container__teams__container}>
              {Array.from({ length: 4 })?.map((team, index) => (
                <div key={`member-loading-teams-${index}`} className={styles?.mbrLoading__container__teams__team}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
