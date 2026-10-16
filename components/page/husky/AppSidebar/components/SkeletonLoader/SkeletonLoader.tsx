import s from './SkeletonLoader.module.scss';

export const SkeletonLoader = () => (
  <>
    {[68, 54, 28, 64, 52].map((width) => (
      <div key={width} className={s.row}>
        <div className={s.skeleton} style={{ width: `${width}%` }} />
      </div>
    ))}
  </>
);
