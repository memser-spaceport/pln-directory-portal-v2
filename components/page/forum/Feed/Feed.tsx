'use client';

import React, { useCallback, useEffect } from 'react';
import { CategoriesTabs } from '@/components/page/forum/CategoriesTabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Posts } from '@/components/page/forum/Posts';

import s from './Feed.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { ForumHeader } from '@/components/page/forum/ForumHeader';

export const Feed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid') as string;

  const onValueChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set('cid', value); // or use `params.delete(key)` to remove
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!cid) {
      onValueChange('1');
    }
  }, [cid, onValueChange]);

  return (
    <div className={s.root}>
      <ForumHeader />
      <CategoriesTabs onValueChange={onValueChange} value={cid} />
      <Posts />
      <CreatePost
        renderChildren={(toggle) => {
          return (
            <button className={s.triggerButton} onClick={toggle}>
              Create post <PlusIcon />
            </button>
          );
        }}
      />
    </div>
  );
};

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.0312 10C18.0312 10.2238 17.9424 10.4384 17.7841 10.5966C17.6259 10.7549 17.4113 10.8438 17.1875 10.8438H11.8438V16.1875C11.8438 16.4113 11.7549 16.6259 11.5966 16.7841C11.4384 16.9424 11.2238 17.0312 11 17.0312C10.7762 17.0312 10.5616 16.9424 10.4034 16.7841C10.2451 16.6259 10.1562 16.4113 10.1562 16.1875V10.8438H4.8125C4.58872 10.8438 4.37411 10.7549 4.21588 10.5966C4.05764 10.4384 3.96875 10.2238 3.96875 10C3.96875 9.77622 4.05764 9.56161 4.21588 9.40338C4.37411 9.24514 4.58872 9.15625 4.8125 9.15625H10.1562V3.8125C10.1562 3.58872 10.2451 3.37411 10.4034 3.21588C10.5616 3.05764 10.7762 2.96875 11 2.96875C11.2238 2.96875 11.4384 3.05764 11.5966 3.21588C11.7549 3.37411 11.8438 3.58872 11.8438 3.8125V9.15625H17.1875C17.4113 9.15625 17.6259 9.24514 17.7841 9.40338C17.9424 9.56161 18.0312 9.77622 18.0312 10Z"
      fill="white"
    />
  </svg>
);
