import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from './CardsLoader.module.scss';

export const CardsLoader = () => {
  return (
    <>
      <Card />
      <Card />
      <Card />
      <Card />
    </>
  );
};

const Card = () => (
  <div className={s.card}>
    <div className={s.header}>
      <Skeleton circle className={s.avatar} />
    </div>
    <div className={s.body}>
      <Skeleton width={80} height={16} className={s.title} />
      <Skeleton height={12} count={2} className={s.desc} />
    </div>
    <div className={s.tags}>
      <Skeleton width={90} height={30} className={s.tag} />
      <Skeleton width={40} height={30} className={s.tag} />
    </div>
  </div>
);
