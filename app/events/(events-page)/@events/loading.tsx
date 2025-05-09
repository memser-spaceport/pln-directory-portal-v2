import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

import s from './loading.module.css';

const CARDS = Array.from({ length: 6 });

const Loading = () => {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <Skeleton count={1} height={40} width={160} />
      </div>
      <div className={s.grid}>
        {CARDS.map((_, index: number) => <Skeleton key={index} count={1} width="100%" />)}
      </div>
    </div>
  );
};

export default Loading;