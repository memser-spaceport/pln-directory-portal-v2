import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from './DealsSkeletonLoader.module.scss';

const CARDS = Array.from({ length: 6 });

export function DealsSkeletonLoader() {
  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <div className={s.titleRow}>
          <Skeleton width={140} height={42} borderRadius={8} />
          <div className={s.actions}>
            <Skeleton width={120} height={40} borderRadius={8} />
            <Skeleton width={100} height={40} borderRadius={8} />
          </div>
        </div>
        <Skeleton width={320} height={20} borderRadius={4} />
      </div>
      <div className={s.list}>
        {CARDS.map((_, i) => (
          <div key={i} className={s.card}>
            <Skeleton width={64} height={64} borderRadius={12} />
            <div className={s.details}>
              <Skeleton width="40%" height={24} borderRadius={4} />
              <Skeleton width="80%" height={16} borderRadius={4} />
              <div className={s.tags}>
                <Skeleton width={80} height={24} borderRadius={9999} />
                <Skeleton width={100} height={24} borderRadius={9999} />
              </div>
              <Skeleton width={160} height={14} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
