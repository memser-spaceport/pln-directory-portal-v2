import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

import s from './loading.module.css';

const CONTRIBUTORS = Array.from({ length: 70 });

const Loading = () => {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <div>
          <Skeleton count={1} height={30} width={160} />
          <Skeleton count={1} width={140} />
        </div>
        <Skeleton count={1} height={50} width={120} />
      </div>
      <div className={s.grid}>
        {CONTRIBUTORS.map((_, index: number) => <Skeleton key={index} count={1} width={36} height={36} circle />)}
      </div>
      <div className={s.content}>
        <Skeleton count={1} height={290} width="100%" />
      </div>
    </div>
  );
};

export default Loading;