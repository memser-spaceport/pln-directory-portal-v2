import styles from "./loading.module.css";

const Loading = () => {
  return (
    <section className={styles.team}>
      {/* Side-nav */}
      <aside className={styles.team__left}>
        {/* Web Filter */}
        <div className={styles.team__left__filter}>
          {/* Header */}
          <div className={styles.team__left__filter__header}>
            <div className={styles.team__left__filter__header__title}></div>
            <div className={styles.team__left__filter__head__clearAll}></div>
          </div>
          <div className={styles.team__left__filter__bl}></div>
          <div className={styles.team__left__filter__body}>
            {/* Includes */}
            <div className={styles.team__left__filter__includepln}>
              <div className={styles.team__left__filter__includepln__content}></div>
              <div className={styles.team__left__filter__includepln__switch}></div>
            </div>
            <div className={styles.team__left__filter__bl}></div>

            {Array.from({ length: 4 })?.map((container, index) => (
              <div key={`${container} + ${index}`} className={`${styles.team__left__filter__body__tagContainer}`}>
                <div className={styles.team__left__filter__body__tagContainer__title}> </div>
                <div className={styles.team__left__filter__body__tagContainer__tags}>
                  {Array.from({ length: 3 })?.map((firstSet, index) => (
                    <div key={`${firstSet} ${index}`} className={styles.team__left__filter__body__tagContainer__tags__tag}> </div>
                  ))}
                  {Array.from({ length: 3 })?.map((secondSet, index) => (
                    <div key={`${secondSet} + ${index}`}className={styles.team__left__filter__body__tagContainer__tags__tag1}> </div>
                  ))}
                  {Array.from({ length: 3 })?.map((thirdSet, index) => (
                    <div key={`${thirdSet} + ${index}`} className={styles.team__left__filter__body__tagContainer__tags__tag2}> </div>
                  ))}
                </div>
                {index < 3 && <div className={styles.team__left__filter__bl}></div>}
              </div>
            ))}
          </div>
        </div>
      </aside>
      {/*  */}
      <div className={styles.team__right}>
        <div className={styles.team__rightcontainer}>
        {/* Toolbar */}
        <div className={styles.team__right__toolbar}>
          <div className={styles.team__right__toolbar__right}>
            <div className={styles.team__right__toolbar__right__title}></div>
            <div className={styles.team__right__toolbar__right__filterbtn}></div>
            <div className={styles.team__right__toolbar__right__search}></div>
          </div>
          <div className={styles.team__right__toolbar__left}>
            <div className={styles.team__right__toolbar__left__sort}></div>
            <div className={styles.team__right__toolbar__left__view}></div>
          </div>
        </div>
        {/* Teams */}
        <div className={styles.team__right__teamslist}>
          {Array.from({ length: 20 })?.map((team, index) => (
            <div key={`${team} + ${index}`} className={styles.team__right__teamslist__team}>
              <div className={styles.team__right__teamlist__team__profilec}>
                <div className={styles.team__right__teamlist__team__profilec__profile}> </div>
                </div>
                <div className={styles.team__right__teamlist__team__details}>
                  <h2 className={styles.team__right__teamlist__team__detail__name}>  </h2>
                  <div className={styles.team__right__teamlist__team__details__desc}>
                    <div className={styles.team__right__teamlist__team__details__desc__firstLine}> </div>
                    <div className={styles.team__right__teamlist__team__details__desc__secondLine}>  </div>
                    <div className={styles.team__right__teamlist__team__details__desc__thirdLine}> </div>
                    </div>
                    <div className={styles.team__left__filter__bl}></div>

                    <div className={styles.team__right__teamlist__team__tags}> 
                    {Array.from({ length: 3 })?.map((teamTag, index) => (
                      <div key={`${teamTag} + ${index}`} className={styles.team__right__teamlist__team__tag}>  </div>
                    ))}

                    </div>
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
