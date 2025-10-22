import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from './ContentPanelSkeletonLoader.module.css';
import { INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';

const CARDS = Array.from({ length: INITIAL_ITEMS_PER_PAGE });

export const ContentPanelSkeletonLoader = () => {
  return (
    <div className={s.content}>
      <div className={s.header}>
        <div className={s.left}>
          <Skeleton count={1} height={40} width={100} />
          <Skeleton count={1} height={40} width={200} />
        </div>
        <div className={s.right}>
          <Skeleton count={1} height={40} width={160} />
          <Skeleton count={1} height={40} width={80} />
        </div>
      </div>
      <div className={s.grid}>
        {CARDS.map((_, index: number) => (
          <Skeleton key={index} count={1} width="100%" />
        ))}
      </div>
    </div>
  );
};
