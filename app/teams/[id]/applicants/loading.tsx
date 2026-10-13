import { ScrollPageToTop } from '@/components/page/team-details/TeamApplicants/ScrollPageToTop';

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
      {/* The skeleton is the first thing on screen, and it inherits the scroll
          position of the page you left — so without this it paints mid-page and
          the real content jumps to the top underneath you a moment later. */}
      <ScrollPageToTop />
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
