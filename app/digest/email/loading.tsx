import s from '@/components/page/digest/email/DigestEmailSettings.module.scss';

/** Its own loading state: without it, /digest's story skeleton would show for this small page. */
export default function DigestEmailLoading() {
  return (
    <div className={s.page} aria-busy="true" aria-label="Loading your digest email settings">
      <div className={s.card}>
        <div className={s.skeletonLine} style={{ width: '55%', height: 28 }} />
        <div className={s.skeletonLine} style={{ width: '85%' }} />
        <div className={s.skeletonLine} style={{ width: '100%', height: 72 }} />
      </div>
    </div>
  );
}
