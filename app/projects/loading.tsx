import styles from './loading.module.css';

const Loading = () => {
  return (
    <section className={styles.project}>
      {/* Side-nav */}
      <aside className={styles.project__left}>
        {/* Web Filter */}
        <div className={styles.project__left__filter}>
          {/* Header */}
          <div className={styles.project__left__filter__header}>
            <div className={styles.project__left__filter__header__title}></div>
            <div className={styles.project__left__filter__head__clearAll}></div>
          </div>
          <div className={styles.project__left__filter__bl}></div>
          <div className={styles.project__left__filter__body}>
            {/* Includes */}
            <div className={styles.project__left__filter__includepln}>
              <div className={styles.project__left__filter__includepln__content}></div>
              <div className={styles.project__left__filter__includepln__switch}></div>
            </div>
            <div className={styles.project__left__filter__bl}></div>

            {Array.from({ length: 4 })?.map((container, index) => (
              <div key={`${container} + ${index}`} className={`${styles.project__left__filter__body__tagContainer}`}>
                <div className={styles.project__left__filter__body__tagContainer__title}> </div>
                <div className={styles.project__left__filter__body__tagContainer__tags}>
                  {Array.from({ length: 3 })?.map((firstSet, index) => (
                    <div key={`${firstSet} ${index}`} className={styles.project__left__filter__body__tagContainer__tags__tag}>
                      {' '}
                    </div>
                  ))}
                  {Array.from({ length: 3 })?.map((secondSet, index) => (
                    <div key={`${secondSet} + ${index}`} className={styles.project__left__filter__body__tagContainer__tags__tag1}>
                      {' '}
                    </div>
                  ))}
                  {Array.from({ length: 3 })?.map((thirdSet, index) => (
                    <div key={`${thirdSet} + ${index}`} className={styles.project__left__filter__body__tagContainer__tags__tag2}>
                      {' '}
                    </div>
                  ))}
                </div>
                {index < 3 && <div className={styles.project__left__filter__bl}></div>}
              </div>
            ))}
          </div>
        </div>
      </aside>
      {/*  */}
      <div className={styles.project__right}>
        <div className={styles.project__rightcontainer}>
          {/* Toolbar */}
          <div className={styles.project__right__toolbar}>
            <div className={styles.project__right__toolbar__right}>
              <div className={styles.project__right__toolbar__right__title}></div>
              <div className={styles.project__right__toolbar__right__filterbtn}></div>
              <div className={styles.project__right__toolbar__right__search}></div>
            </div>
            <div className={styles.project__right__toolbar__left}>
              <div className={styles.project__right__toolbar__left__sort}></div>
              <div className={styles.project__right__toolbar__left__view}></div>
            </div>
          </div>
          {/* projects */}
          <div className={styles.project__right__projectslist}>
            {Array.from({ length: 50 })?.map((project, index) => (
              <div key={`${project} + ${index}`} className={styles.project__right__projectslist__project}>
                <div className={styles.project__right__projectlist__project__profilec}>
                  <div className={styles.project__right__projectlist__project__profilec__profile}> </div>
                </div>
                <div className={styles.project__right__projectlist__project__details}>
                  <h2 className={styles.project__right__projectlist__project__detail__name}> </h2>
                  <div className={styles.project__right__projectlist__project__details__desc}>
                    <div className={styles.project__right__projectlist__project__details__desc__firstLine}> </div>
                    <div className={styles.project__right__projectlist__project__details__desc__secondLine}> </div>
                    <div className={styles.project__right__projectlist__project__details__desc__thirdLine}> </div>
                  </div>
                  <div className={styles.project__left__filter__bl}></div>

                  <div className={styles.project__right__projectlist__project__tags}>
                    {Array.from({ length: 3 })?.map((projectTag, index) => (
                      <div key={`${projectTag} + ${index}`} className={styles.project__right__projectlist__project__tag}></div>
                    ))}
                  </div>
                  <div className={styles.project__right__projectlist__project__tags__mob}>
                    {Array.from({ length: 2 })?.map((projectTag, index) => (
                      <div key={`${projectTag} + ${index}`} className={styles.project__right__projectlist__project__tag}></div>
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
