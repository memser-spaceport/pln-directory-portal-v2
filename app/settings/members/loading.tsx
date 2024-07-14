import styles from './loading.module.css';
function MemberLoadingPage() {
  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}></div>
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}></aside>
          <div className={styles.ps__main__content}></div>
        </div>
      </div>
    </>
  );
}

export default MemberLoadingPage;
