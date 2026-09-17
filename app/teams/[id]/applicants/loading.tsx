import styles from './loading.module.css';

/**
 * Its own skeleton, because without one this route inherits
 * `app/teams/[id]/loading.tsx` — the team profile's skeleton, which paints a
 * logo, a description block and a members grid, none of which this page has.
 * A skeleton that promises the wrong page is worse than a blank one.
 */
const Loading = () => {
  return (
    <div className={styles.root}>
      <div className={styles.back} />
      <div className={styles.title} />
      <div className={styles.roleBar} />
      <div className={styles.split}>
        <div className={styles.listCol}>
          {Array.from({ length: 4 })?.map((_, index) => <div key={index} className={styles.row} />)}
        </div>
        <div className={styles.paneCol} />
      </div>
    </div>
  );
};

export default Loading;
