'use client';

import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from '@/components/page/forum/Post/Post.module.scss';

const PostPageLoader = () => {
  return (
    <div className={s.root}>
      <Skeleton height={20} width={90} />

      <div className={s.content}>
        <Skeleton height={16} width={45} />
      </div>

      <div className={s.title}>
        <Skeleton height={20} width="100%" />
        <Skeleton height={20} width="70%" />
        <Skeleton height={20} width="40%" />
      </div>

      <div className={s.sub}>
        <Skeleton height={16} width={65} />
        <Skeleton height={16} width={65} />
        <Skeleton height={16} width={85} />
      </div>

      <div className={s.footer}>
        <Skeleton height={40} width={40} circle />
        <div className={s.col}>
          <div className={s.inline}>
            <Skeleton height={16} width={85} />
            <Skeleton height={16} width={35} />
          </div>
          <Skeleton height={16} width={65} />
        </div>
      </div>

      <div className={s.postContent}>
        <div style={{ display: 'block', width: '100%' }}></div>
        <Skeleton height={16} count={12} width="100%" inline={false} />
      </div>

      <div className={s.divider} />
    </div>
  );
};

export default PostPageLoader;
