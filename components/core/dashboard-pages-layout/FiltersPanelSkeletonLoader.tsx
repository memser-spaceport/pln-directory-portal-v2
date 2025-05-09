import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from './FiltersPanelSkeletonLoader.module.css';

export const FiltersPanelSkeletonLoader = () => {
  return (
    <div className={s.root}>
      <div className={s.title}>
        <Skeleton height={20} />
      </div>
      <div className={s.content}>
        <Skeleton count={2} />
        <Skeleton count={2} />
        <Skeleton count={2} />
        <hr />
        <Skeleton count={1} width="50%" />
        <Skeleton count={1} />
        <hr />
        <Skeleton count={1} width="50%" />
        <Skeleton count={1} />
        <Skeleton count={1} />
        <Skeleton count={1} />
        <hr />
        <Skeleton count={1} width="50%" />
        <Skeleton count={1} />
        <hr />
        <div className={s.tags}>
          <Skeleton count={1} height={40} width={60} containerClassName={s.tag} />
          <Skeleton count={1} height={40} width={80} containerClassName={s.tag} />
          <Skeleton count={1} height={40} width={60} containerClassName={s.tag} />
          <Skeleton count={1} height={40} width={90} containerClassName={s.tag} />
          <Skeleton count={1} height={40} width={40} containerClassName={s.tag} />
          <Skeleton count={1} height={40} width={80} containerClassName={s.tag} />
        </div>
      </div>
    </div>
  );
};
