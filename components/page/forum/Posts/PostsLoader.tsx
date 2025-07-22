import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from '@/components/page/forum/Posts/Posts.module.scss';

const posts = new Array(3).fill(0);

export const PostsLoader = () => {
  return (
    <div className={s.root}>
      {posts.map((post, i) => (
        <div className={s.listItem} key={i}>
          <div className={s.title}>
            <Skeleton height={20} width="100%" />
            <Skeleton height={20} width="65%" />
          </div>
          <div className={s.desc}>
            <Skeleton height={16} count={2} />
          </div>
          <div className={s.footer}>
            <Skeleton height={24} width={24} circle />
            <div className={s.inline}>
              <div className={s.name}>
                <Skeleton height={16} width={65} />
              </div>
              <div className={s.position}>
                <Skeleton height={16} width={65} />
              </div>
              <div className={s.time}>
                <Skeleton height={16} width={65} />
              </div>
            </div>
          </div>
          <div className={s.sub}>
            <div className={s.subItem}>
              <Skeleton height={16} width={45} />
            </div>
            <div className={s.subItem}>
              <Skeleton height={16} width={65} />
            </div>
            <div className={s.subItem}>
              <Skeleton height={16} width={85} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
