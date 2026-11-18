import s from './DigestPage.module.scss';

/** Shown while the digest loads. */
export function DigestSkeleton() {
  return (
    <div className={`${s.page} ${s.pageWeb}`} aria-busy="true" aria-label="Loading your digest">
      <div className={s.email}>
        <div className={s.header}>
          <span className={s.skeleton} style={{ width: 240, height: 16 }} />
          <span className={s.skeleton} style={{ width: 200, height: 32 }} />
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
