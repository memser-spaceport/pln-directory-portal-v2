import styles from './loading.module.css';
const Loading = () => {
  return (
    <div className={styles?.teamDetail}>
      <div className={styles?.teamDetail__breadCrumb}></div>
      <div className={styles?.teamDetail__container}>
        {/* Details */}
        <div className={styles?.teamDetail__Container__details}>
          <div className={styles?.teamDetail__container__details__profilecontainer}>
            <div className={styles?.teamDetail__container__details__profilecontainer__profile}>
              <div className={styles?.teamDetail__container__details__profilecontainer__profile__image}></div>
              <div className={styles?.teamDetail__container__details__profilecontainer__profile__nameAndTag}>
                <div className={styles?.teamDetail__container__details__profilecontainer__profile__nameAndTag__name}></div>
                <div className={styles.teamDetail__container__details__profilecontainer__profile__nameAndTag__tags}>
                  {Array.from({ length: 3 })?.map((teamTag, index) => (
                    <div key={`${teamTag} + ${index}`} className={styles.teamDetail__container__details__profilecontainer__profile__nameAndTag__tags__tag}>
                      {' '}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* About */}
          <div className={styles?.teamDetail__Container__details__about}>
            <div className={styles?.teamDetail__Container__details__about__title}></div>
            <div className={styles?.teamDetail__Container__details__about__content}>
              <div className={styles?.detail__container__details__about__contentOne}></div>
              <div className={styles?.detail__container__details__about__contentTwo}></div>
              <div className={styles?.detail__container__details__about__contentThree}></div>
              <div className={styles?.detail__container__details__about__contentFour}></div>
            </div>
          </div>
          <div className={styles.teamDetail__Container__bl}></div>
          {/* Technologies */}
          <div className={styles.teamDetail__Container__details__technologies}>
            <div className={styles.teamDetail__Container__details__technologies__title}></div>
            <div className={styles.teamDetail__Container__details__technologies__teamDetail__Container__details__technologiesc}>
              {Array.from({ length: 3 })?.map((teamTechnology, index) => (
                <div key={`${teamTechnology} + ${index}`} className={styles.teamDetail__Container__details__technologies__teamDetail__Container__details__technologiesc__technology}>
                  {' '}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* contact */}
        <div className={styles?.teamDetail__container__contact}>
          <div className={styles?.teamDetail__container__contact__title}></div>
          <div className={styles?.teamDetail__container__contact__wrapper}>
            <div className={styles?.teamDetail__container__contact__allContacts}>
              {Array.from({ length: 3 })?.map((teamContacts, index) => (
                <div key={`${teamContacts} + ${index}`} className={styles.teamDetail__container__contact__allContacts__contact}>
                  {' '}
                </div>
              ))}
            </div>
            <div className={styles?.teamDetail__container__contacts__ohours}>
              <div className={styles?.teamDetail__container__contacts__ohours__left}>
                <div className={styles?.teamDetail__container__contacts__ohour__left__cldr}>
                </div>
                <div className={styles?.teamDetail__container__contacts__ohours__left__title}>

                </div>
              </div>
              <div className={styles?.teamDetail__container__contacts__ohour__right}>
                <div className={styles?.teamDetail__container__contacts__ohour__right__scmeeting}></div>
              </div>
            </div>
          </div>
        </div>
        {/* Funding */}
        <div className={styles?.teamDetail__container__funding}>
          <div className={styles?.teamDetail__container__funding__title}></div>
          <div className={styles?.teamDetail__container__fundingc}>
            <div className={styles?.teamDetail__container__fundingc__left}>
              <div className={styles?.teamDetail__container__fundingc__left__fundingSeries}></div>
            </div>

            <div className={styles?.teamDetail__container__fundingc__right}>
              <div className={styles?.teamDetail__container__fundingc__right__tags}>
                {Array.from({ length: 3 })?.map((series, index) => (
                  <div key={`${series} + ${index}`} className={styles.teamDetail__container__fundingc__right__tags__tag}>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Member */}
        {/* Projects */}
      </div>
    </div>
  );
};

export default Loading;
