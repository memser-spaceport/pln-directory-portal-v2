import s from './page.module.scss';

export default function Loading() {
  return (
    <div className={s.root}>
      <div className={s.headerContainer}>
        <div className={s.backButtonSkeleton} />
      </div>
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.mainContent}>
            <div className={s.header}>
              <div className={s.headerContent}>
                <div className={`${s.avatar} ${s.skeleton}`} />
                <div className={s.dealDetails}>
                  <div className={s.skeletonBlock} style={{ width: '200px', height: '42px' }} />
                  <div className={s.skeletonBlock} style={{ width: '300px', height: '22px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div
                      className={s.skeletonBlock}
                      style={{ width: '140px', height: '24px', borderRadius: '9999px' }}
                    />
                    <div
                      className={s.skeletonBlock}
                      style={{ width: '100px', height: '24px', borderRadius: '9999px' }}
                    />
                  </div>
                  <div className={s.skeletonBlock} style={{ width: '180px', height: '18px' }} />
                </div>
              </div>
            </div>
            <div className={s.content}>
              <div className={s.aboutSection}>
                <div className={s.skeletonBlock} style={{ width: '200px', height: '34px' }} />
                <div className={s.skeletonBlock} style={{ width: '100%', height: '24px' }} />
                <div className={s.skeletonBlock} style={{ width: '90%', height: '24px' }} />
              </div>
              <div className={s.skeletonBlock} style={{ width: '100%', height: '224px', borderRadius: '12px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
