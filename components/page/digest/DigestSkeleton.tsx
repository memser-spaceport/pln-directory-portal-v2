import s from './DigestPage.module.scss';

/** Shown while the digest loads. */
export function DigestSkeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-label="Loading your digest">
      <div className={s.email}>
        <div className={s.header}>
          <span className={s.skeleton} style={{ width: 200, height: 24 }} />
          <span className={s.skeleton} style={{ width: 160, height: 16 }} />
        </div>
        <div className={s.spacer} />
        <div className={s.cards}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={s.skeletonCard}>
              <span className={s.skeleton} style={{ width: '70%', height: 20 }} />
              <span className={s.skeleton} style={{ width: '100%', height: 14 }} />
              <span className={s.skeleton} style={{ width: '90%', height: 14 }} />
              <span className={s.skeleton} style={{ width: '40%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
