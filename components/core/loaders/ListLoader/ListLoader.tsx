import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from './ListLoader.module.scss';

export const ListLoader = () => {
  return (
    <>
      <ListItem />
    </>
  );
};

const ListItem = () => (
  <div className={s.root}>
    <div className={s.mobile}>
      <div className={s.header}>
        <Skeleton circle className={s.avatar} />
        <Skeleton width={80} height={16} className={s.title} />
      </div>
      <div className={s.body}>
        <Skeleton height={12} width={150} className={s.desc} />
        <Skeleton height={12} width={150} className={s.desc} />
      </div>
      <div className={s.tags}>
        <Skeleton width={90} height={30} className={s.tag} />
        <Skeleton width={40} height={30} className={s.tag} />
      </div>
    </div>
    <div className={s.desktop}>
      <Skeleton circle className={s.avatar} />
      <div className={s.body}>
        <Skeleton width={80} height={16} className={s.title} />
        <Skeleton height={12} width={140} className={s.desc} />
      </div>
      <div className={s.tags}>
        <Skeleton width={90} height={30} className={s.tag} />
        <Skeleton width={40} height={30} className={s.tag} />
      </div>
    </div>
  </div>
);
